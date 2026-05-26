/**
 * 地理坐标工具
 */
import type { Point, ENUPoint } from '../types';

const EARTH_RADIUS = 6378137;
const EARTH_FLATTENING = 1 / 298.257223563;

/** GPS → ECEF */
export function gpsToECEF(
  lat: number,
  lng: number,
  alt: number = 0
): { x: number; y: number; z: number } {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinLng = Math.sin(lngRad);
  const cosLng = Math.cos(lngRad);

  const e2 = 2 * EARTH_FLATTENING - EARTH_FLATTENING * EARTH_FLATTENING;
  const N = EARTH_RADIUS / Math.sqrt(1 - e2 * sinLat * sinLat);

  return {
    x: (N + alt) * cosLat * cosLng,
    y: (N + alt) * cosLat * sinLng,
    z: ((1 - e2) * N + alt) * sinLat,
  };
}

/** ECEF → ENU */
export function ecefToENU(
  pECEF: { x: number; y: number; z: number },
  refLat: number,
  refLng: number,
  refAlt: number = 0
): ENUPoint {
  const refECEF = gpsToECEF(refLat, refLng, refAlt);
  const dx = pECEF.x - refECEF.x;
  const dy = pECEF.y - refECEF.y;
  const dz = pECEF.z - refECEF.z;

  const latRad = (refLat * Math.PI) / 180;
  const lngRad = (refLng * Math.PI) / 180;
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinLng = Math.sin(lngRad);
  const cosLng = Math.cos(lngRad);

  return {
    east: -sinLng * dx + cosLng * dy,
    north: -sinLat * cosLng * dx - sinLat * sinLng * dy + cosLat * dz,
    up: cosLat * cosLng * dx + cosLat * sinLng * dy + sinLat * dz,
  };
}

/** GPS → ENU 快捷方法 */
export function gpsToENU(
  lat: number, lng: number, alt: number,
  refLat: number, refLng: number, refAlt: number = 0
): ENUPoint {
  const ecef = gpsToECEF(lat, lng, alt);
  return ecefToENU(ecef, refLat, refLng, refAlt);
}

/** Haversine 距离 */
export function haversineDistance(p1: Point, p2: Point): number {
  const R = EARTH_RADIUS;
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLng = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.latitude * Math.PI) / 180) *
    Math.cos((p2.latitude * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 格式化距离 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}米`;
  return `${(meters / 1000).toFixed(1)}公里`;
}

/** 格式化时长 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}秒`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}分钟`;
  return `${Math.floor(mins / 60)}小时${mins % 60 > 0 ? (mins % 60) + '分钟' : ''}`;
}
