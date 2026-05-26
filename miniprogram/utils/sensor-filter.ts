/**
 * 传感器滤波工具
 * 
 * 低通滤波 + 互补滤波，融合加速度计/陀螺仪/罗盘。
 * Phase 2 核心算法。
 */

/** 低通滤波（平滑加速度数据） */
export class LowPassFilter {
  private alpha: number;  // 平滑系数 (0~1)，越小越平滑
  private lastValue: number | null = null;

  constructor(alpha: number = 0.1) {
    this.alpha = alpha;
  }

  filter(value: number): number {
    if (this.lastValue === null) {
      this.lastValue = value;
      return value;
    }
    this.lastValue = this.alpha * value + (1 - this.alpha) * this.lastValue;
    return this.lastValue;
  }

  reset() {
    this.lastValue = null;
  }
}

/** 互补滤波（陀螺仪短期 + 罗盘长期修正） */
export class ComplementaryFilter {
  private alpha: number;  // 陀螺仪权重 (0~1)，通常 0.98
  private angle: number = 0;

  constructor(alpha: number = 0.98) {
    this.alpha = alpha;
  }

  /**
   * 更新角度
   * @param gyroRate 陀螺仪角速度 (rad/s)
   * @param compassAngle 罗盘方位角 (rad)
   * @param dt 时间间隔 (秒)
   */
  update(gyroRate: number, compassAngle: number, dt: number): number {
    const gyroAngle = this.angle + gyroRate * dt;
    this.angle = this.alpha * gyroAngle + (1 - this.alpha) * compassAngle;
    return this.angle;
  }

  getAngle(): number {
    return this.angle;
  }

  reset(angle: number = 0) {
    this.angle = angle;
  }
}

/** 简单的卡尔曼滤波器（1D，用于罗盘方向平滑） */
export class KalmanFilter {
  private q: number;  // 过程噪声
  private r: number;  // 测量噪声
  private x: number;  // 状态估计
  private p: number;  // 误差协方差
  private k: number;  // 卡尔曼增益

  constructor(q: number = 0.01, r: number = 0.1, initial: number = 0) {
    this.q = q;
    this.r = r;
    this.x = initial;
    this.p = 1;
    this.k = 0;
  }

  filter(measurement: number): number {
    // 预测
    this.p = this.p + this.q;

    // 更新
    this.k = this.p / (this.p + this.r);
    this.x = this.x + this.k * (measurement - this.x);
    this.p = (1 - this.k) * this.p;

    return this.x;
  }

  reset(value: number = 0) {
    this.x = value;
    this.p = 1;
  }
}
