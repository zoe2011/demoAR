/**
 * geo-utils 单元测试
 * 
 * 测试 GPS↔ENU 坐标转换、Haversine 距离、距离/时间格式化。
 */
import {
  gpsToECEF,
  ecefToENU,
  gpsToENU,
  haversineDistance,
  formatDistance,
  formatDuration,
} from '../utils/geo-utils';

describe('geo-utils', () => {
  // ==================== Haversine 距离 ====================
  describe('haversineDistance', () => {
    it('should return ~0 for same point', () => {
      const d = haversineDistance(
        { latitude: 39.9042, longitude: 116.4074 },
        { latitude: 39.9042, longitude: 116.4074 }
      );
      expect(d).toBeLessThan(1);
    });

    it('should compute distance between Beijing and Shanghai (~1060km)', () => {
      // 北京天安门
      const bj = { latitude: 39.9042, longitude: 116.3974 };
      // 上海外滩
      const sh = { latitude: 31.2304, longitude: 121.4737 };

      const d = haversineDistance(bj, sh);
      // ~1068 km
      expect(d).toBeGreaterThan(1000000);
      expect(d).toBeLessThan(1100000);
    });

    it('should compute short distance accurately (~111m per degree)', () => {
      // 经度方向 0.001° ≈ 111m
      const p1 = { latitude: 39.9, longitude: 116.4 };
      const p2 = { latitude: 39.9, longitude: 116.401 };

      const d = haversineDistance(p1, p2);
      const expected = 111; // 0.001° at equator ≈ 111m
      expect(d).toBeGreaterThan(80);
      expect(d).toBeLessThan(140);
    });
  });

  // ==================== GPS → ECEF → ENU ====================
  describe('coordinate transformation', () => {
    // 天安门参考点
    const refLat = 39.9042;
    const refLng = 116.3974;

    it('ECEF: reference point should have positive z in northern hemisphere', () => {
      const ecef = gpsToECEF(refLat, refLng, 0);
      expect(ecef.z).toBeGreaterThan(0); // 北半球 z > 0
      expect(ecef.x).toBeLessThan(0);    // 东经 x < 0
      // 地球半径约 6,371,000m — ECEF 模长应接近
      const mag = Math.sqrt(ecef.x ** 2 + ecef.y ** 2 + ecef.z ** 2);
      expect(mag).toBeGreaterThan(6000000);
      expect(mag).toBeLessThan(6400000);
    });

    it('ENU: reference point to itself should give zero', () => {
      const refECEF = gpsToECEF(refLat, refLng, 0);
      const enu = ecefToENU(refECEF, refLat, refLng, 0);
      expect(Math.abs(enu.east)).toBeLessThan(0.01);
      expect(Math.abs(enu.north)).toBeLessThan(0.01);
      expect(Math.abs(enu.up)).toBeLessThan(0.01);
    });

    it('ENU: point 0.01° north should have positive north, small east', () => {
      const enu = gpsToENU(39.9142, refLng, 0, refLat, refLng, 0);
      // 0.01° north ≈ 1110m
      expect(enu.north).toBeGreaterThan(1000);
      expect(enu.north).toBeLessThan(1200);
      expect(Math.abs(enu.east)).toBeLessThan(5);
    });

    it('ENU: point 0.01° east should have positive east', () => {
      const enu = gpsToENU(refLat, 116.4074, 0, refLat, refLng, 0);
      // 0.01° east at 39.9° latitude ≈ 1110 × cos(40°) ≈ 850m
      expect(enu.east).toBeGreaterThan(800);
      expect(enu.east).toBeLessThan(900);
      expect(Math.abs(enu.north)).toBeLessThan(5);
    });

    it('ENU: combined north-east displacement', () => {
      const enu = gpsToENU(39.9142, 116.4074, 0, refLat, refLng, 0);
      expect(enu.north).toBeGreaterThan(1000);
      expect(enu.east).toBeGreaterThan(800);
    });

    it('ENU: altitude should be reflected in up component', () => {
      const enu = gpsToENU(refLat, refLng, 50, refLat, refLng, 0);
      expect(enu.up).toBeGreaterThan(40);
      expect(enu.up).toBeLessThan(60);
      expect(Math.abs(enu.north)).toBeLessThan(1);
      expect(Math.abs(enu.east)).toBeLessThan(1);
    });
  });

  // ==================== 格式化 ====================
  describe('formatDistance', () => {
    it('should format meters', () => {
      expect(formatDistance(500)).toBe('500米');
      expect(formatDistance(999)).toBe('999米');
    });

    it('should format kilometers', () => {
      expect(formatDistance(1000)).toBe('1.0公里');
      expect(formatDistance(2345)).toBe('2.3公里');
    });

    it('should handle zero', () => {
      expect(formatDistance(0)).toBe('0米');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(30)).toBe('30秒');
      expect(formatDuration(59)).toBe('59秒');
    });

    it('should format minutes', () => {
      expect(formatDuration(60)).toBe('1分钟');
      expect(formatDuration(3599)).toBe('59分钟');
    });

    it('should format hours', () => {
      expect(formatDuration(3600)).toBe('1小时');
      expect(formatDuration(3660)).toBe('1小时1分钟');
      expect(formatDuration(7200)).toBe('2小时');
    });
  });
});
