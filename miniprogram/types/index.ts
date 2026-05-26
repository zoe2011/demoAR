/** 全局类型定义 — 统一导入点 */

// ============ 基础地理类型 ============

export interface Point {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category?: string;
}

// ============ 路线类型 ============

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  points: Point[];
  action: 'straight' | 'turn_left' | 'turn_right' | 'u_turn' | 'arrive';
}

export interface RouteInfo {
  distance: string;
  duration: string;
  steps: RouteStep[];
  points: Point[];
}

export type NavigationState =
  | 'idle'
  | 'planning'
  | 'navigating'
  | 'ar_navigating'
  | 'rerouting'
  | 'arrived';

// ============ 传感器与 AR 类型 ============

export interface SensorData {
  timestamp: number;
  accelerometer: { x: number; y: number; z: number };
  compass: number;
  gyroscope: { x: number; y: number; z: number };
}

export interface ENUPoint {
  east: number;
  north: number;
  up: number;
}

export interface CameraExtrinsics {
  position: Point;
  rotation: {
    pitch: number;
    yaw: number;
    roll: number;
  };
}

export interface ScreenPoint {
  x: number;
  y: number;
  distance: number;
  isVisible: boolean;
}

// ============ API 类型 ============

export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

export interface RoutePlanRequest {
  origin: string;
  destination: string;
  mode?: 'walking' | 'bicycling';
}

export interface RoutePlanResponse {
  distance: number;
  duration: number;
  points: Point[];
  steps: RouteStep[];
}

export interface PlaceSearchResponse {
  places: Place[];
  total: number;
}

export interface LoginResponse {
  token: string;
  userInfo: {
    openid: string;
    nickname?: string;
    avatarUrl?: string;
  };
}

// ============ App 全局 ============

export interface IAppOption {
  globalData: {
    userInfo: {
      openid?: string;
      nickname?: string;
      avatarUrl?: string;
    } | null;
    token: string | null;
    baseUrl: string;
  };
}
