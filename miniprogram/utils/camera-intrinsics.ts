/**
 * 相机内参矩阵
 *
 * 将相机坐标系 3D 点投影到屏幕 2D 坐标。
 * 针孔相机模型：x_screen = f_x * X/Z + c_x, y_screen = f_y * Y/Z + c_y
 *
 * 微信小程序无法获取精确的相机内参，因此使用设备 FOV + 分辨率估算。
 */
export class CameraIntrinsics {
  /** 焦距（像素）— f_x, f_y */
  readonly fx: number;
  readonly fy: number;

  /** 主点（像素）— c_x, c_y（通常为屏幕中心） */
  readonly cx: number;
  readonly cy: number;

  /** 屏幕尺寸 */
  readonly width: number;
  readonly height: number;

  /**
   * @param fovDeg 相机水平 FOV（度），典型手机 ~60-70°
   * @param width 屏幕宽（像素）
   * @param height 屏幕高（像素）
   */
  constructor(fovDeg: number = 65, width: number = 375, height: number = 667) {
    const { windowWidth, windowHeight } = wx.getSystemInfoSync();
    this.width = windowWidth || width;
    this.height = windowHeight || height;

    // f_x = (width / 2) / tan(FOV_h / 2)
    const fovRad = (fovDeg * Math.PI) / 180;
    this.fx = (this.width / 2) / Math.tan(fovRad / 2);

    // 假设方形像素：f_y = f_x
    this.fy = this.fx;

    // 主点在屏幕中心
    this.cx = this.width / 2;
    this.cy = this.height / 2;
  }

  /**
   * 透视投影：相机坐标系 → 屏幕坐标
   *
   * @param camX, camY, camZ 相机坐标系 3D 点（Z 为深度，正方向为前方）
   * @returns 屏幕坐标 { x, y, depth } 或 null（在视野后方）
   */
  project(camX: number, camY: number, camZ: number): { x: number; y: number; depth: number } | null {
    // 点在相机后方（Z <= 0），不投影
    if (camZ <= 0.01) return null;

    const invZ = 1 / camZ;
    const x = this.fx * camX * invZ + this.cx;
    const y = this.fy * camY * invZ + this.cy;

    return { x, y, depth: camZ };
  }

  /** 批量投影 */
  projectBatch(points: Array<{ x: number; y: number; z: number }>): Array<{ x: number; y: number; depth: number } | null> {
    return points.map(p => this.project(p.x, p.y, p.z));
  }
}
