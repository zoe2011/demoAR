import type { RouteStep, IAppOption } from '../../types';
import { formatDistance, formatDuration } from '../../utils/geo-utils';

const STEP_ICONS: Record<string, string> = {
  straight: '⬆️',
  turn_left: '⬅️',
  turn_right: '➡️',
  u_turn: '↩️',
  arrive: '🏁',
};

interface StepDisplay {
  icon: string;
  instruction: string;
  distanceText: string;
}

Page({
  data: {
    distance: '--',
    duration: '--',
    originName: '',
    destinationName: '',
    destinationLat: 0,
    destinationLng: 0,
    steps: [] as StepDisplay[],
  },

  onLoad() {
    const app = getApp<IAppOption & { routeData?: any }>();
    const data = app.routeData;
    if (data) {
      this.setData({
        distance: formatDistance(data.distance || 0),
        duration: formatDuration(data.duration || 0),
        originName: data.originName || '我的位置',
        destinationName: data.destinationName || '目的地',
        destinationLat: data.destinationLat || 0,
        destinationLng: data.destinationLng || 0,
        steps: (data.steps || []).map((step: RouteStep) => ({
          icon: STEP_ICONS[step.action] || '➡️',
          instruction: step.instruction,
          distanceText: formatDistance(step.distance),
        })),
      });
    }
  },

  onBackToMap() {
    wx.navigateBack();
  },

  onStartAR() {
    const { destinationLat, destinationLng, destinationName } = this.data;
    if (!destinationLat || !destinationLng) {
      wx.showToast({ title: '目的地信息缺失', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/ar-nav/ar-nav?lat=${destinationLat}&lng=${destinationLng}&name=${encodeURIComponent(destinationName)}`,
    });
  },
});
