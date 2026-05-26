/**
 * 偏航检测器
 *
 * 检测用户是否偏离了规划路线。
 *
 * 算法：
 *  1. 将路径视为一系列线段
 *  2. 计算用户当前位置到最近线段的距离
 *  3. 如果距离超过阈值（步行 ~30m），判定偏航
 *  4. 连续 3 次判定偏航才触发重算（防抖动）
 *
 * 参考：点到线段的最短距离
 */
import { haversineDistance } from './geo-utils';
import type { Point } from '../types';

/** 点到线段的最短距离（米） */
function pointToSegmentDist(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    // 线段退化为点
    const d = Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
    return d * 111320; // 简化：1° ≈ 111.32 km
  }

  // 投影参数 t = ((P-A)·(B-A)) / |B-A|²
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * dx;
  const projY = ay + t * dy;
  const distDeg = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);

  return distDeg * 111320;
}

export class OffRouteDetector {
  private threshold = 25; // 偏航阈值（米）
  private consecutiveThreshold = 3; // 连续判定次数
  private offRouteCount = 0;
  private enabled = true;

  /**
   * 检查是否偏航
   * @param current 用户当前位置
   * @param routePoints 路线坐标点列表
   * @returns true = 偏航，需要重算路线
   */
  check(current: Point, routePoints: Point[]): boolean {
    if (!this.enabled || routePoints.length < 2) return false;

    // 找到最近的线段
    let minDist = Infinity;
    for (let i = 0; i < routePoints.length - 1; i++) {
      const dist = pointToSegmentDist(
        current.longitude, current.latitude,
        routePoints[i].longitude, routePoints[i].latitude,
        routePoints[i + 1].longitude, routePoints[i + 1].latitude
      );
      if (dist < minDist) minDist = dist;
    }

    if (minDist > this.threshold) {
      this.offRouteCount++;
      if (this.offRouteCount >= this.consecutiveThreshold) {
        this.offRouteCount = 0;
        return true;
      }
    } else {
      this.offRouteCount = Math.max(0, this.offRouteCount - 1);
    }

    return false;
  }

  /** 重置计数器（重新规划后调用） */
  reset() {
    this.offRouteCount = 0;
  }

  setThreshold(meters: number) { this.threshold = meters; }
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
}
