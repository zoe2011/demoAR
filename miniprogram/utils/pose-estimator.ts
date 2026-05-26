/**
 * 位姿估算器 — 传感器融合
 *
 * 输入：GPS + 加速度计 + 陀螺仪 + 罗盘
 * 输出：相机外参（位置 + 旋转矩阵）
 *
 * 融合策略：
 *  - 陀螺仪 → 短期姿态（高频，会漂移）
 *  - 罗盘 → 长期方向修正（低频，有磁场干扰）
 *  - 加速度计 → 重力方向 → pitch/roll
 *  - 互补滤波：angle = 0.98*(gyro积分) + 0.02*(compass)
 */
import { ComplementaryFilter, LowPassFilter } from './sensor-filter';

export interface DevicePose {
  /** GPS 位置（度） */
  latitude: number;
  longitude: number;

  /** 设备高度（米），粗略估计 */
  altitude: number;

  /** 旋转矩阵的行主序 3x3（相机坐标系在世界 ENU 中的朝向） */
  rotation: Float64Array;

  /** 设备时间戳 */
  timestamp: number;
}

/**
 * 从欧拉角构建旋转矩阵（ZYX 顺序：yaw → pitch → roll）
 * 世界坐标系：ENU（东-北-天）
 * 设备初始朝向：屏幕朝上，摄像头朝北（yaw=0, pitch=0, roll=0）
 */
function eulerToRotationMatrix(yaw: number, pitch: number, roll: number): Float64Array {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);

  // R = Rz(yaw) * Ry(pitch) * Rx(roll)
  const m = new Float64Array(9);

  // Row 0
  m[0] = cy * cp;
  m[1] = cy * sp * sr - sy * cr;
  m[2] = cy * sp * cr + sy * sr;

  // Row 1
  m[3] = sy * cp;
  m[4] = sy * sp * sr + cy * cr;
  m[5] = sy * sp * cr - cy * sr;

  // Row 2
  m[6] = -sp;
  m[7] = cp * sr;
  m[8] = cp * cr;

  return m;
}

export class PoseEstimator {
  // 滤波器
  private yawFilter = new ComplementaryFilter(0.98);
  private pitchFilter = new LowPassFilter(0.15);
  private rollFilter = new LowPassFilter(0.15);

  // 当前姿态
  private yaw = 0;     // 偏航角（弧度），0 = 北
  private pitch = 0;   // 俯仰角
  private roll = 0;    // 滚转角

  // 位置
  private latitude = 0;
  private longitude = 0;

  // 设备高度假设（手持约 1.5m，减去设备到地面的距离，实际路面在下方）
  private deviceHeight = 1.4;

  // 上次更新时间
  private lastTimestamp = 0;

  // 罗盘基准（部分安卓设备罗盘初始值为随机值，需校准）
  private compassCalibrated = false;
  private compassBase = 0;

  /**
   * 更新 GPS 位置
   */
  updatePosition(lat: number, lng: number, alt?: number) {
    this.latitude = lat;
    this.longitude = lng;
    if (alt !== undefined) this.deviceHeight = alt;
  }

  /**
   * 更新罗盘读数
   * @param direction 0-360 度，0 = 北
   */
  updateCompass(direction: number, timestamp: number) {
    // 微信罗盘返回的是设备指向（屏幕顶部朝向），
    // 对于竖屏手持，这就是摄像头朝向
    let yawRad = (direction * Math.PI) / 180;

    // 校准：部分 Android 设备初始读数不是 0=北
    if (!this.compassCalibrated) {
      this.compassBase = yawRad;
      this.compassCalibrated = true;
      this.yaw = yawRad;
      this.yawFilter.reset(yawRad);
    }

    const dt = this.getDeltaTime(timestamp);
    if (dt <= 0 || dt > 1) return; // 忽略间隔异常的数据

    // 互补滤波：gyro 已在 updateGyro 中更新了内部角度
    this.yaw = this.yawFilter.update(0, yawRad, dt);
  }

  /**
   * 更新陀螺仪（角速度）
   * @param gx, gy, gz 角速度（rad/s），绕设备 x/y/z 轴
   */
  updateGyro(gx: number, _gy: number, gz: number, timestamp: number) {
    const dt = this.getDeltaTime(timestamp);
    if (dt <= 0 || dt > 1) return;

    // 陀螺仪 z 轴（垂直于屏幕）旋转 = yaw 变化
    // 这里做简化处理：假设设备基本竖直，z 轴旋转 ≈ yaw 变化
    this.yaw = this.yawFilter.update(gz, this.yaw, dt);
  }

  /**
   * 更新加速度计 — 估计 pitch 和 roll（重力方向）
   * @param ax, ay, az 加速度（m/s²），含重力分量
   */
  updateAccel(ax: number, ay: number, az: number) {
    // 从重力向量计算 pitch 和 roll
    // 假设设备基本静止，加速度 ≈ 重力
    const norm = Math.sqrt(ax * ax + ay * ay + az * az);
    if (norm < 0.1) return; // 噪声太大

    const ax_n = ax / norm;
    const ay_n = ay / norm;
    const az_n = az / norm;

    // pitch（绕 x 轴）：atan2(-ax, sqrt(ay² + az²))
    const pitchVal = Math.atan2(-ax_n, Math.sqrt(ay_n * ay_n + az_n * az_n));
    // roll（绕 y 轴）：atan2(ay, az)
    const rollVal = Math.atan2(ay_n, az_n);

    this.pitch = this.pitchFilter.filter(pitchVal);
    this.roll = this.rollFilter.filter(rollVal);
  }

  /**
   * 获取当前设备位姿（相机外参）
   *
   * 返回的 rotation 矩阵将 ENU 坐标变换到相机坐标系：
   * 相机坐标 = R * (ENU - position)
   */
  getPose(): DevicePose {
    // 相机在 ENU 中的位置：GPS + 设备高度
    // 路面在设备下方约 1.5m，所以相机高度 ≈ deviceHeight

    // 构建旋转矩阵
    const rotation = eulerToRotationMatrix(this.yaw, this.pitch, this.roll);

    return {
      latitude: this.latitude,
      longitude: this.longitude,
      altitude: this.deviceHeight,
      rotation,
      timestamp: this.lastTimestamp,
    };
  }

  private getDeltaTime(timestamp: number): number {
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
      return 0;
    }
    const dt = (timestamp - this.lastTimestamp) / 1000; // ms → s
    this.lastTimestamp = timestamp;
    return dt;
  }
}
