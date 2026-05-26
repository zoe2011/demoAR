/**
 * sensor-filter 单元测试
 * 
 * 测试低通滤波器、互补滤波器、卡尔曼滤波器。
 */
import { LowPassFilter, ComplementaryFilter, KalmanFilter } from '../utils/sensor-filter';

describe('sensor-filter', () => {
  // ==================== LowPassFilter ====================
  describe('LowPassFilter', () => {
    it('should return first value immediately', () => {
      const f = new LowPassFilter(0.1);
      expect(f.filter(100)).toBe(100);
    });

    it('should smooth converging values (alpha=0.5)', () => {
      const f = new LowPassFilter(0.5);
      f.filter(100);
      // new = 0.5*200 + 0.5*100 = 150
      expect(f.filter(200)).toBeCloseTo(150, 1);
    });

    it('should converge toward steady value', () => {
      const f = new LowPassFilter(0.3);
      f.filter(100);
      const v1 = f.filter(100);
      const v2 = f.filter(100);
      const v3 = f.filter(100);
      // Each step: new = 0.3*100 + 0.7*prev
      expect(v1).toBeCloseTo(100, 0);
      expect(v2).toBeCloseTo(100, 0);
      // Should converge close to 100
      expect(Math.abs(v3 - 100)).toBeLessThan(10);
    });

    it('should handle noisy input (alpha=0.1, strong filter)', () => {
      const f = new LowPassFilter(0.1);
      f.filter(0);
      // Inject noise around 50
      for (let i = 0; i < 30; i++) {
        f.filter(50 + Math.sin(i * 0.5) * 5); // signal ±5 around 50
      }
      // Should have converged near 50 (the signal, not 0)
      const final = f.filter(50);
      expect(Math.abs(final - 50)).toBeLessThan(3);
    });

    it('reset should clear internal state', () => {
      const f = new LowPassFilter(0.5);
      f.filter(100);
      f.reset();
      expect(f.filter(200)).toBe(200); // First value after reset
    });
  });

  // ==================== ComplementaryFilter ====================
  describe('ComplementaryFilter', () => {
    it('should initialize with compass angle', () => {
      const f = new ComplementaryFilter(0.98);
      const angle = f.update(0, Math.PI / 2, 0.1); // 90° from compass
      // With alpha=0.98 and no gyro, should be close to compass
      expect(angle).toBeCloseTo(Math.PI / 2 * 0.02, 2);
    });

    it('should weight gyro more heavily (alpha=0.98)', () => {
      const f = new ComplementaryFilter(0.98);
      // Start at 0
      f.reset(0);
      // Gyro measures 1 rad/s for 0.1s → 0.1 rad from gyro
      // Compass says 0.5 rad
      // angle = 0.98 * (0 + 0.1) + 0.02 * 0.5 = 0.098 + 0.01 = 0.108
      const angle = f.update(1.0, 0.5, 0.1);
      expect(angle).toBeCloseTo(0.108, 2);
    });

    it('should track gyro integration over multiple steps', () => {
      const f = new ComplementaryFilter(0.98);
      f.reset(0);
      // 10 steps at 0.1 rad/s for 0.1s each = ~0.1 rad total
      for (let i = 0; i < 10; i++) {
        f.update(0.1, 0, 0.1);
      }
      const angle = f.getAngle();
      // Should be close to 0.1 rad (gyro integral) since compass says 0
      expect(Math.abs(angle - 0.1)).toBeLessThan(0.02);
    });

    it('should getAngle return current angle', () => {
      const f = new ComplementaryFilter(0.98);
      f.update(0.5, 1.0, 0.2);
      expect(typeof f.getAngle()).toBe('number');
    });
  });

  // ==================== KalmanFilter ====================
  describe('KalmanFilter', () => {
    it('should apply Kalman update on first measurement', () => {
      // KF with q=0.01, r=0.1, x0=0, p0=1
      // First measurement z=42:
      //   Predict: p = 1 + 0.01 = 1.01
      //   K = 1.01 / (1.01 + 0.1) ≈ 0.91
      //   x = 0 + 0.91 * (42-0) ≈ 38.2
      const f = new KalmanFilter(0.01, 0.1, 0);
      const x1 = f.filter(42);
      expect(x1).toBeGreaterThan(30);
      expect(x1).toBeLessThan(42);
    });

    it('should converge toward steady measurements', () => {
      const f = new KalmanFilter(0.01, 0.1, 0);
      // Feed steady 100
      for (let i = 0; i < 20; i++) {
        f.filter(100);
      }
      const estimate = f.filter(100);
      expect(Math.abs(estimate - 100)).toBeLessThan(1);
    });

    it('should respond to measurement changes', () => {
      const f = new KalmanFilter(0.01, 0.1, 0);
      // Steady at 0
      for (let i = 0; i < 10; i++) f.filter(0);
      // Jump to 100
      const after = f.filter(100);
      // Should move toward 100 but not immediately
      expect(after).toBeGreaterThan(10);
      expect(after).toBeLessThan(100);
    });

    it('reset should restore initial state', () => {
      const f = new KalmanFilter(0.01, 0.1, 10);
      for (let i = 0; i < 5; i++) f.filter(50);
      f.reset(10);
      expect(f.filter(10)).toBeCloseTo(10, 1);
    });
  });
});
