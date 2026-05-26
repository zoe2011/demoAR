/**
 * AR 投影器 — 完整的投影管线
 *
 * 路线 GPS 点 → ENU → 相机坐标系 → 屏幕坐标
 *
 * 管线：
 *   GPS (lat,lng) → gpsToENU() → ENU (east,north,up)
 *   ENU → camera pose rotation → 相机坐标 (X,Y,Z)
 *   相机坐标 → CameraIntrinsics.project() → 屏幕 (x,y,depth)
 */
import { gpsToENU } from './geo-utils';
import { CameraIntrinsics } from './camera-intrinsics';
import { PoseEstimator, DevicePose } from './pose-estimator';
import type { Point, ENUPoint, ScreenPoint } from '../types';

export class ARProjector {
  private intrinsics: CameraIntrinsics;
  private poseEstimator: PoseEstimator;
  private refLat = 0;
  private refLng = 0;

  constructor(poseEstimator: PoseEstimator, fovDeg: number = 65) {
    this.poseEstimator = poseEstimator;
    this.intrinsics = new CameraIntrinsics(fovDeg);
  }

  /** 设置 ENU 参考点（每次导航开始时设为用户位置） */
  setReference(lat: number, lng: number) {
    this.refLat = lat;
    this.refLng = lng;
  }

  /**
   * 执行完整投影管线
   *
   * @param routePoints GPS 路线点
   * @param maxDistance 最远投影距离（米），超过此距离的点标记为不可见
   * @returns 屏幕坐标点列表
   */
  projectRoute(
    routePoints: Point[],
    maxDistance: number = 150
  ): ScreenPoint[] {
    const pose = this.poseEstimator.getPose();
    const R = pose.rotation; // 3x3 rotation matrix

    // 步骤 1: GPS → ENU
    const enuPoints: ENUPoint[] = routePoints.map(p =>
      gpsToENU(p.latitude, p.longitude, 0, this.refLat, this.refLng, 0)
    );

    // 步骤 2: 转换用户/相机位置到 ENU
    const camENU = gpsToENU(
      pose.latitude, pose.longitude, pose.altitude,
      this.refLat, this.refLng, 0
    );

    // 步骤 3: ENU → 相机坐标系，然后透视投影
    const results: ScreenPoint[] = enuPoints.map((enu) => {
      // 路线点相对于相机的位置（ENU 下）
      const dx = enu.east - camENU.east;
      const dy = enu.north - camENU.north;
      const dz = enu.up - camENU.up;

      // 路面在相机下方：up 方向约 -1.5m（设备高度）
      // 实际上 GPS 给的是设备位置，路面是 up ≈ -altitude

      // 应用旋转：相机坐标 = R^T * (P - C)
      // 注意：R 是 ENU→相机的旋转，需要转置
      const camX = R[0] * dx + R[1] * dy + R[2] * dz;
      const camY = R[3] * dx + R[4] * dy + R[5] * dz;
      const camZ = R[6] * dx + R[7] * dy + R[8] * dz;

      // 距离（ENU 水平距离）
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 过滤：太远或太近
      if (distance > maxDistance || distance < 0.5) {
        return {
          x: 0, y: 0, distance,
          isVisible: false,
        };
      }

      // 透视投影
      const screen = this.intrinsics.project(camX, camY, camZ);

      if (!screen) {
        return { x: 0, y: 0, distance, isVisible: false };
      }

      // 过滤屏幕外
      const margin = 50;
      const isVisible =
        screen.x > -margin &&
        screen.x < this.intrinsics.width + margin &&
        screen.y > -margin &&
        screen.y < this.intrinsics.height + margin &&
        screen.depth > 0.3; // 至少 30cm 前

      return {
        x: screen.x,
        y: screen.y,
        distance,
        isVisible,
      };
    });

    return results;
  }

  getIntrinsics(): CameraIntrinsics {
    return this.intrinsics;
  }
}
