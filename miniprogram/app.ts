import type { IAppOption } from './types';

App<IAppOption & Record<string, any>>({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'https://your-api-domain.com/api',
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
    }
    const systemInfo = wx.getSystemInfoSync();
    console.log('DemoAR launched', systemInfo.model);
  },

  onShow() {},
  onHide() {},
});
