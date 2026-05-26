Page({
  data: {
    avatarUrl: '',
    nickname: '',
  },

  onShow() {
    const token = wx.getStorageSync('token');
    if (token) {
      const user = wx.getStorageSync('userInfo') || {};
      this.setData({
        nickname: user.nickname || '用户',
        avatarUrl: user.avatarUrl || '',
      });
    }
  },

  onLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送 code 到后端换取 token（Phase 4）
          // 这里先模拟登录
          wx.setStorageSync('token', 'mock-token');
          this.setData({ nickname: '微信用户' });
          wx.showToast({ title: '登录成功', icon: 'success' });
        }
      },
    });
  },

  onNavToHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  onNavToFavorites() {
    wx.showToast({ title: '收藏功能开发中', icon: 'none' });
  },

  onAbout() {
    wx.showModal({
      title: 'DemoAR',
      content: '实景导航小程序 v0.1.0\n基于微信生态开发\n走在路上，箭头就在你眼前',
      showCancel: false,
    });
  },
});
