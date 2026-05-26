/**
 * 腾讯地图服务封装
 */
import { request } from '../utils/api';
import type { Place, PlaceSearchResponse } from '../types';

const API = {
  search: '/places/search',
  nearby: '/places/nearby',
  reverse: '/geocode/reverse',
};

/** 搜索地点 */
export async function searchPlaces(
  keyword: string,
  region?: string
): Promise<Place[]> {
  const res = await request<PlaceSearchResponse>({
    url: API.search,
    data: { keyword, region: region || '全国' },
  });
  return res.places;
}

/** 附近 POI */
export async function searchNearby(
  lat: number,
  lng: number,
  category?: string
): Promise<Place[]> {
  const res = await request<PlaceSearchResponse>({
    url: API.nearby,
    data: { lat, lng, category },
  });
  return res.places;
}

/** 逆地理编码 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  const res = await request<{ address: string }>({
    url: API.reverse,
    data: { lat, lng },
  });
  return res.address;
}
