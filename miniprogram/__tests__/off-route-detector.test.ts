/**
 * off-route-detector 单元测试
 * 
 * 测试偏航检测：点到线段距离 + 连续判定逻辑。
 */
import { OffRouteDetector } from '../utils/off-route-detector';

describe('off-route-detector', () => {
  // 模拟路线：沿 116.4°E 自南向北
  const routePoints = [
    { latitude: 39.90, longitude: 116.40 },
    { latitude: 39.91, longitude: 116.40 },
    { latitude: 39.92, longitude: 116.40 },
    { latitude: 39.93, longitude: 116.40 },
    { latitude: 39.94, longitude: 116.40 },
  ];

  it('should not detect off-route when on the path', () => {
    const det = new OffRouteDetector();
    det.setThreshold(30);

    const onPath = { latitude: 39.915, longitude: 116.4001 };
    // Single check should NOT trigger (needs consecutive)
    expect(det.check(onPath, routePoints)).toBe(false);
  });

  it('should detect off-route after consecutive violations', () => {
    const det = new OffRouteDetector();
    det.setThreshold(30);

    const farAway = { latitude: 39.91, longitude: 116.42 }; // ~1700m east

    // First two checks: accumulate but don't trigger
    expect(det.check(farAway, routePoints)).toBe(false);
    expect(det.check(farAway, routePoints)).toBe(false);
    // Third check: should trigger (default threshold = 3)
    expect(det.check(farAway, routePoints)).toBe(true);
  });

  it('should reset count when back on route', () => {
    const det = new OffRouteDetector();
    det.setThreshold(30);

    const farAway = { latitude: 39.91, longitude: 116.42 };
    const onPath = { latitude: 39.915, longitude: 116.4001 };

    // One off-route
    det.check(farAway, routePoints);
    // Back on path — should reset counter
    det.check(onPath, routePoints);
    det.check(onPath, routePoints);
    // Now off again — should start fresh
    expect(det.check(farAway, routePoints)).toBe(false);
    expect(det.check(farAway, routePoints)).toBe(false);
    expect(det.check(farAway, routePoints)).toBe(true);
  });

  it('should handle small route (2 points)', () => {
    const det = new OffRouteDetector();
    det.setThreshold(30);

    const shortRoute = [
      { latitude: 39.90, longitude: 116.40 },
      { latitude: 39.91, longitude: 116.40 },
    ];

    const onPath = { latitude: 39.905, longitude: 116.4001 };
    expect(det.check(onPath, shortRoute)).toBe(false);
  });

  it('should handle empty route gracefully', () => {
    const det = new OffRouteDetector();
    expect(det.check({ latitude: 39.9, longitude: 116.4 }, [])).toBe(false);
    expect(det.check({ latitude: 39.9, longitude: 116.4 }, [{ latitude: 39.9, longitude: 116.4 }])).toBe(false);
  });

  it('reset should clear counter', () => {
    const det = new OffRouteDetector();
    det.setThreshold(30);

    const farAway = { latitude: 39.91, longitude: 116.42 };
    det.check(farAway, routePoints);
    det.check(farAway, routePoints);
    det.reset();
    // After reset, need 3 fresh violations
    expect(det.check(farAway, routePoints)).toBe(false);
    expect(det.check(farAway, routePoints)).toBe(false);
    expect(det.check(farAway, routePoints)).toBe(true);
  });

  it('enable/disable should work', () => {
    const det = new OffRouteDetector();
    det.setThreshold(1); // Very small threshold

    const farAway = { latitude: 39.91, longitude: 116.42 };
    det.disable();
    // Even with very small threshold, should not detect
    expect(det.check(farAway, routePoints)).toBe(false);
    expect(det.check(farAway, routePoints)).toBe(false);
    expect(det.check(farAway, routePoints)).toBe(false);

    det.enable();
    // Now should detect
    expect(det.check(farAway, routePoints)).toBe(false);
    expect(det.check(farAway, routePoints)).toBe(false);
    expect(det.check(farAway, routePoints)).toBe(true);
  });
});
