import type { ApiResponse, IAppOption } from '../types';

const app = getApp<IAppOption>();

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, unknown>;
  header?: Record<string, string>;
}

export function request<T = unknown>(options: RequestOptions): Promise<T> {
  const token = wx.getStorageSync('token');
  const baseUrl = app.globalData.baseUrl;

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header,
      },
      success: (res) => {
        const body = res.data as ApiResponse<T>;
        if (res.statusCode === 200 && body.code === 0) {
          resolve(body.data);
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          reject(new Error('登录已过期'));
        } else {
          reject(new Error(body.msg || '请求失败'));
        }
      },
      fail: (err) => {
        console.error('网络请求失败', err);
        reject(new Error('网络异常，请检查连接'));
      },
    });
  });
}
