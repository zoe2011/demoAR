/**
 * AR 导航页面 — Camera + Canvas 叠加
 *
 * 核心流程:
 *   GPS/传感器 → PoseEstimator → ARProjector → ARRenderer → Canvas 箭头
 */
import { startLocationUpdate, stopLocationUpdate } from '../../services/location-service';
import { ARRenderer } from '../../components/ar-renderer/ar-renderer';
import { PoseEstimator } from '../../utils/pose-estimator';
import { ARProjector } from '../../utils/ar-projector';
import { OffRouteDetector } from '../../utils/off-route-detector';
import { VoiceGuide } from '../../services/voice-guide';
import type { Point, IAppOption } from '../../types';

// 传感器数据接口
interface SensorListener {
  start(): void;
  stop(): void;
}

Page({
  data: {
    destination: { latitude: 0, longitude: 0 } as Point,
    destinationName: '',
    currentDirection: '北',
    remainDistance: 0,
    currentInstruction: '正在初始化 AR...',
    voiceMuted: false,
  },

  // 内部实例
  _renderer: null as ARRenderer | null,
  _poseEstimator: null as PoseEstimator | null,
  _projector: null as ARProjector | null,
  _routePoints: [] as Point[],
  _currentLocation: null as Point | null,
  _sensors: [] as SensorListener[],
  _offRouteDetector: null as OffRouteDetector | null,
  _voiceGuide: null as VoiceGuide | null,
  _arrived: false,

  onLoad(options: Record<string, string>) {
    this.setData({
      destination: {
        latitude: parseFloat(options.lat),
        longitude: parseFloat(options.lng),
      },
      destinationName: decodeURIComponent(options.name || ''),
    });

    // 读取路线数据
    const app = getApp<IAppOption & { routeData?: any }>();
    const routeData = app.routeData;
    if (routeData && routeData.steps) {
      // 展开所有步骤的坐标点
      const points: Point[] = [];
      for (const step of routeData.steps) {
        if (step.points) {
          for (const p of step.points) {
            points.push({ latitude: p.latitude, longitude: p.longitude });
          }
        }
      }
      this._routePoints = points;
    }
  },

  onReady() {
    this._initAR();
    this._startSensors();
    this._startNavigation();
  },

  onUnload() {
    this._renderer?.destroy();
    this._sensors.forEach((s: SensorListener) => { try { s.stop(); } catch (_) {} });
    stopLocationUpdate();
    // 停止陀螺仪和罗盘
    try { wx.stopCompass(); } catch (_) {}
    try { wx.stopAccelerometer(); } catch (_) {}
  },

  /** 初始化 AR 渲染器 */
  _initAR() {
    const query = wx.createSelectorQuery() as unknown as {
      select(s: string): { fields(o: Record<string,boolean>, cb: (r: any[]) => void): void }
    };
    query.select('#arCanvas').fields({ node: true, size: true }, (res: any[]) => {
      if (res && res[0] && res[0].node) {
        this._renderer = new ARRenderer(res[0].node);
        this._renderer.start();
      }
    });

    this._poseEstimator = new PoseEstimator();
    this._projector = new ARProjector(this._poseEstimator, 65);
    this._offRouteDetector = new OffRouteDetector();
    this._voiceGuide = new VoiceGuide();
  },

  /** 启动传感器监听 */
  _startSensors() {
    // 罗盘
    wx.startCompass({
      success: () => {
        wx.onCompassChange((res: { direction: number }) => {
          this._poseEstimator?.updateCompass(res.direction, Date.now());
          this._updateDirectionDisplay(res.direction);
        });
      },
      fail: () => console.warn('罗盘不可用'),
    });

    // 陀螺仪
    try {
      wx.onGyroscopeChange((res: { x: number; y: number; z: number }) => {
        this._poseEstimator?.updateGyro(res.x, res.y, res.z, Date.now());
      });
    } catch (_) {
      console.warn('陀螺仪不可用');
    }

    // 加速度计
    wx.onAccelerometerChange((res: { x: number; y: number; z: number }) => {
      this._poseEstimator?.updateAccel(res.x, res.y, res.z);
    });
  },

  /** 更新方向显示 */
  _updateDirectionDisplay(degrees: number) {
    const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    const idx = Math.round(degrees / 45) % 8;
    this.setData({ currentDirection: dirs[idx] });
  },

  /** 启动持续导航 */
  async _startNavigation() {
    try {
      startLocationUpdate((point) => {
        this._currentLocation = point;

        // 偏航检测
        if (this._offRouteDetector && this._routePoints.length > 1) {
          const offRoute = this._offRouteDetector.check(point, this._routePoints);
          if (offRoute) {
            this._voiceGuide?.announceReroute();
            this.setData({ currentInstruction: '正在重新规划路线...' });
            // TODO: 调用 reroute() 重算路线
            this._offRouteDetector.reset();
            return;
          }
        }

        // 更新位姿估算器
        this._poseEstimator?.updatePosition(point.latitude, point.longitude);

        // 首次定位时设置 ENU 参考点
        if (!this._routePoints.length && this.data.destination) {
          this._routePoints = [point, this.data.destination];
        }

        if (this._routePoints.length > 1) {
          this._projector?.setReference(point.latitude, point.longitude);

          // 执行投影管线
          const screenPoints = this._projector!.projectRoute(this._routePoints);

          // 更新渲染器
          this._renderer?.updateScreenPoints(screenPoints);

          // 计算剩余距离
          this._updateRemainDistance(point);
        }
      });
    } catch (_) {
      this.setData({ currentInstruction: '定位失败，请检查权限' });
    }
  },

  /** 计算剩余距离 */
  _updateRemainDistance(current: Point) {
    if (!this.data.destination.latitude) return;

    // 简化：直线距离
    const R = 6371000;
    const dLat = ((this.data.destination.latitude - current.latitude) * Math.PI) / 180;
    const dLng = ((this.data.destination.longitude - current.longitude) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos((current.latitude * Math.PI) / 180) *
      Math.cos((this.data.destination.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    this.setData({ remainDistance: Math.round(dist) });

    if (dist < 20) {
      this.setData({ currentInstruction: '即将到达目的地' });
    } else {
      this.setData({ currentInstruction: '请沿箭头方向前进' });
    }
  },

  onCameraError(_e: any) {
    wx.showModal({
      title: '摄像头不可用',
      content: '请检查摄像头权限后重试',
      showCancel: false,
    });
  },

  onVoiceToggle(e: WechatMiniprogram.CustomEvent) {
    const muted = e.detail.muted;
    this.setData({ voiceMuted: muted });
    if (muted) {
      this._voiceGuide?.disable();
    } else {
      this._voiceGuide?.enable();
    }
  },

  onExitAR() { wx.navigateBack(); },
  onSwitchToMap() { wx.navigateBack(); },
});
