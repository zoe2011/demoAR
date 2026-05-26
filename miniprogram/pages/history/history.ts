interface HistoryRecord {
  id: number;
  originName: string;
  destinationName: string;
  distance: string;
  duration: string;
  time: string;
}

Page({
  data: {
    records: [] as HistoryRecord[],
  },

  onShow() {
    // 加载本地存储的历史记录
    const history = wx.getStorageSync('navHistory') || [];
    this.setData({ records: history });
  },
});
