/**
 * 首页：地图 + 搜索 + 路线规划
 */
import { getCurrentLocation } from '../../services/location-service';
import { planRoute } from '../../services/navigation-service';
import type { Place, IAppOption } from '../../types';

Page({
  data: {
    latitude: 39.9042,
    longitude: 116.4074,
    scale: 16,
    markers: [] as WechatMiniprogram.MapMarker[],
    polyline: [] as WechatMiniprogram.MapPolyline[],
    hasRoute: false,
    routeInfo: null as { distance: string; duration: string } | null,
    destination: null as Place | null,
  },

  async onLoad() {
    await this._initLocation();
  },

  async _initLocation() {
    try {
      const loc = await getCurrentLocation();
      this.setData({ latitude: loc.latitude, longitude: loc.longitude });
    } catch (_) {
      wx.showToast({ title: '请授权位置权限', icon: 'none' });
    }
  },

  async onPlaceSelect(e: WechatMiniprogram.CustomEvent) {
    const place: Place = e.detail.place;

    wx.showLoading({ title: '规划路线中...' });
    try {
      const route = await planRoute({
        origin: `${this.data.latitude},${this.data.longitude}`,
        destination: `${place.latitude},${place.longitude}`,
      });

      wx.hideLoading();

      // 存入全局，跳转到路线详情页
      const app = getApp<IAppOption & { routeData: any }>();
      app.routeData = {
        distance: route.distance,
        duration: route.duration,
        steps: route.steps,
        originName: '我的位置',
        destinationName: place.name,
        destinationLat: place.latitude,
        destinationLng: place.longitude,
      };
      wx.navigateTo({ url: '/pages/route-detail/route-detail' });
    } catch (_) {
      wx.hideLoading();
      wx.showToast({ title: '路线规划失败', icon: 'none' });
    }
  },

  onMarkerTap(e: WechatMiniprogram.MarkerTap) {
    console.log('marker tap', e.detail.markerId);
  },

  onRegionChange(_e: WechatMiniprogram.RegionChange) {},

  onLocateMe() {
    wx.createMapContext('navMap', this).moveToLocation();
  },

  onStartAR() {
    const dest = this.data.destination;
    if (!dest) {
      wx.showToast({ title: '请先选择目的地', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/ar-nav/ar-nav?lat=${dest.latitude}&lng=${dest.longitude}&name=${encodeURIComponent(dest.name)}`,
    });
  },
});
