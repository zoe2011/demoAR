/**
 * AR 渲染器 — 在 Canvas 上绘制路面箭头
 *
 * 每帧渲染流程：
 *   1. 清空画布
 *   2. 获取当前投影后的屏幕点
 *   3. 沿路线绘制方向箭头（近大远小，透视缩放）
 *   4. 绘制距离标签
 */
import type { ScreenPoint } from '../../types';

// Canvas 2D 上下文类型
interface DrawCtx {
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  scale(x: number, y: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  stroke(): void;
  fill(): void;
  setFillStyle(style: string): void;
  setStrokeStyle(style: string): void;
  setLineWidth(w: number): void;
  setFont(font: string): void;
  setTextAlign(align: string): void;
  setTextBaseline(align: string): void;
  setGlobalAlpha(a: number): void;
  fillText(text: string, x: number, y: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  arc(x: number, y: number, r: number, s: number, e: number, ccw?: boolean): void;
  fillRect(x: number, y: number, w: number, h: number): void;
}

/** 渲染配置 */
interface RenderConfig {
  arrowColor: string;
  arrowColorNext: string;
  labelColor: string;
  labelBgColor: string;
  gridColor: string;
  minArrowSize: number;
  maxArrowSize: number;
  arrowSpacingMeters: number;  // 每隔多少米画一个箭头
}

const DEFAULT_CONFIG: RenderConfig = {
  arrowColor: 'rgba(0, 212, 170, 0.85)',
  arrowColorNext: 'rgba(255, 165, 2, 0.9)',
  labelColor: '#ffffff',
  labelBgColor: 'rgba(0, 0, 0, 0.55)',
  gridColor: 'rgba(0, 212, 170, 0.08)',
  minArrowSize: 12,
  maxArrowSize: 60,
  arrowSpacingMeters: 8,
};

export class ARRenderer {
  private canvas: WechatMiniprogram.Canvas;
  private ctx: DrawCtx;
  private config: RenderConfig;
  private screenPoints: ScreenPoint[] = [];
  private isActive = false;
  private animId = 0;
  private width = 0;
  private height = 0;

  constructor(canvas: WechatMiniprogram.Canvas, config?: Partial<RenderConfig>) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as unknown as DrawCtx;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initCanvas();
  }

  private initCanvas() {
    const sys = wx.getSystemInfoSync();
    this.width = sys.windowWidth;
    this.height = sys.windowHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  /** 更新投影后的屏幕点 */
  updateScreenPoints(points: ScreenPoint[]) {
    this.screenPoints = points;
  }

  /** 启动渲染循环（30fps） */
  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.loop();
  }

  /** 停止渲染 */
  stop() {
    this.isActive = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }

  destroy() {
    this.stop();
  }

  private loop = () => {
    if (!this.isActive) return;
    this.render();
    this.animId = requestAnimationFrame(this.loop);
  };

  private render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.screenPoints.length < 2) return;

    // 过滤可见点
    const visible = this.screenPoints.filter(p => p.isVisible);
    if (visible.length < 2) return;

    // 绘制路面参考网格（帮助用户感知深度）
    this.drawGroundGrid(ctx, visible[0]?.distance || 20);

    // 每隔一定距离画一个箭头
    const spacing = this.config.arrowSpacingMeters;
    for (let i = 0; i < visible.length - 1; i++) {
      const curr = visible[i];
      const next = visible[i + 1];

      // 计算该段的方向角度
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const segAngle = Math.atan2(dy, dx);

      // 检测是否到达路口（方向变化 > 30°）
      const prevAngle = i > 0
        ? Math.atan2(curr.y - visible[i - 1].y, curr.x - visible[i - 1].x)
        : segAngle;
      const angleDiff = Math.abs(segAngle - prevAngle);
      const isTurn = angleDiff > (30 * Math.PI / 180);

      // 箭头大小：基于距离做透视缩放
      const dist = curr.distance;
      const size = this.interpolateArrowSize(dist);

      // 绘制箭头
      if (isTurn || dist % spacing < 2) {
        this.drawArrow(ctx, curr.x, curr.y, segAngle, size,
          dist < 30 ? this.config.arrowColorNext : this.config.arrowColor);
      }

      // 每 3 个间距画一个距离标签
      if (i % 3 === 0 && dist < 100) {
        this.drawDistanceLabel(ctx, curr.x, curr.y, dist, size);
      }
    }

    // 终点标记
    const last = visible[visible.length - 1];
    if (last.isVisible && last.distance < 30) {
      this.drawEndMarker(ctx, last.x, last.y, Math.min(last.distance / 5, 30));
    }
  }

  /** 路面参考网格 */
  private drawGroundGrid(ctx: DrawCtx, _maxDist: number) {
    // 简化的水平参考线
    ctx.setStrokeStyle(this.config.gridColor);
    ctx.setLineWidth(1);
    const step = this.height / 6;
    for (let y = this.height * 0.3; y < this.height * 0.9; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  /** 绘制导航箭头 */
  private drawArrow(
    ctx: DrawCtx,
    x: number,
    y: number,
    angle: number,
    size: number,
    color: string
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const hs = size * 0.6;  // 半宽
    const len = size;

    // 箭头形状：三角形 + 杆
    ctx.setFillStyle(color);
    ctx.beginPath();
    // 箭头尖端
    ctx.moveTo(len, 0);
    // 箭头尾部
    ctx.lineTo(-len * 0.4, -hs);
    ctx.lineTo(-len * 0.2, 0);
    ctx.lineTo(-len * 0.4, hs);
    ctx.closePath();
    ctx.fill();

    // 描边增强对比度
    ctx.setStrokeStyle('rgba(0,0,0,0.3)');
    ctx.setLineWidth(1.5);
    ctx.stroke();

    ctx.restore();
  }

  /** 距离标签 */
  private drawDistanceLabel(
    ctx: DrawCtx,
    x: number,
    y: number,
    distance: number,
    _arrowSize: number
  ) {
    const text = distance < 1000
      ? `${Math.round(distance)}m`
      : `${(distance / 1000).toFixed(1)}km`;

    const fontSize = Math.max(11, Math.min(18, 18 - distance / 15));
    ctx.setFont(`${fontSize}px sans-serif`);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('top');

    // 背景
    const metrics = { width: text.length * fontSize * 0.6, height: fontSize + 4 };
    const bx = x;
    const by = y - fontSize - 10;

    ctx.setFillStyle(this.config.labelBgColor);
    ctx.fillRect(bx - metrics.width / 2 - 4, by - 2, metrics.width + 8, metrics.height + 4);

    ctx.setFillStyle(this.config.labelColor);
    ctx.fillText(text, bx, by);

    // 连接到箭头的短线
    ctx.setStrokeStyle('rgba(255,255,255,0.3)');
    ctx.setLineWidth(0.5);
    ctx.beginPath();
    ctx.moveTo(bx, by + metrics.height + 4);
    ctx.lineTo(x, y - 4);
    ctx.stroke();
  }

  /** 终点标记 */
  private drawEndMarker(ctx: DrawCtx, x: number, y: number, size: number) {
    ctx.save();
    ctx.translate(x, y);

    // 圆形旗帜底
    ctx.setFillStyle('rgba(255, 71, 87, 0.8)');
    ctx.beginPath();
    ctx.arc(0, -size, size, 0, Math.PI * 2);
    ctx.fill();

    // 旗杆
    ctx.setStrokeStyle('rgba(255,255,255,0.8)');
    ctx.setLineWidth(2);
    ctx.beginPath();
    ctx.moveTo(0, -size * 2);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // 文字
    ctx.setFont(`${Math.round(size * 0.7)}px sans-serif`);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');
    ctx.setFillStyle('#ffffff');
    ctx.fillText('🏁', 0, -size);

    ctx.restore();
  }

  /** 基于距离计算箭头大小（近大远小） */
  private interpolateArrowSize(distance: number): number {
    const { minArrowSize, maxArrowSize } = this.config;
    if (distance <= 5) return maxArrowSize;
    if (distance >= 150) return minArrowSize;

    // 对数衰减：远处衰减慢，近处变化快
    const t = Math.log(distance / 5) / Math.log(150 / 5);
    return maxArrowSize + (minArrowSize - maxArrowSize) * t;
  }
}
