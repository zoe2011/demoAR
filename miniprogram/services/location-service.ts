/**
 * 定位服务
 */
import type { Point } from '../types';

export function getCurrentLocation(): Promise<Point> {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude,
        });
      },
      fail: (err) => {
        console.error('获取位置失败', err);
        reject(err);
      },
    });
  });
}

export function startLocationUpdate(
  callback: (point: Point) => void
): void {
  wx.startLocationUpdate({
    success: () => {
      wx.onLocationChange((res) => {
        callback({
          latitude: res.latitude,
          longitude: res.longitude,
        });
      });
    },
    fail: (err) => {
      console.error('开启持续定位失败', err);
    },
  });
}

export function stopLocationUpdate(): void {
  wx.stopLocationUpdate();
}
