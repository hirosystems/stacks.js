import { assertIsTruthy } from '../src/utils';

describe('assertIsTruthy', () => {
  it('should allow true', () => {
    expect(() => assertIsTruthy(true)).not.toThrow();
  });
  it('should throw on false', () => {
    expect(() => assertIsTruthy(false)).toThrow();
  });
  it('should throw on null/undefined', () => {
    expect(() => assertIsTruthy(null)).toThrow();
    expect(() => assertIsTruthy(undefined)).toThrow();
  });
  it('should allow empty objects', () => {
    expect(() => assertIsTruthy({})).not.toThrow();
  });
});
