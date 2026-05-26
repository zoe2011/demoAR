/**
 * 导航服务
 */
import { request } from '../utils/api';
import type { RoutePlanRequest, RoutePlanResponse } from '../types';

/** 路线规划 */
export async function planRoute(
  params: RoutePlanRequest
): Promise<RoutePlanResponse> {
  const res = await request<RoutePlanResponse>({
    url: '/route/plan',
    method: 'POST',
    data: params as unknown as Record<string, unknown>,
  });
  return res;
}

/** 偏航重算 */
export async function reroute(
  origin: string,
  destination: string
): Promise<RoutePlanResponse> {
  return planRoute({ origin, destination, mode: 'walking' });
}
