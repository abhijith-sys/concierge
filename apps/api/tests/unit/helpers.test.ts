import { describe, expect, it } from "vitest";
import { boundingBox, haversineKm } from "../../src/shared/domain/business";
import { generateOtpCode, hashOtp } from "../../src/shared/integrations/storage";
import { loadEnv, resetEnvCache } from "../../src/config/env";

describe("geo helpers", () => {
  it("computes haversine distance in km", () => {
    const km = haversineKm(40.7128, -74.006, 40.758, -73.9855);
    expect(km).toBeGreaterThan(4);
    expect(km).toBeLessThan(7);
  });

  it("builds a bounding box around a point", () => {
    const box = boundingBox(40.7, -74, 10);
    expect(box.minLat).toBeLessThan(40.7);
    expect(box.maxLat).toBeGreaterThan(40.7);
    expect(box.minLng).toBeLessThan(-74);
    expect(box.maxLng).toBeGreaterThan(-74);
  });
});

describe("otp helpers", () => {
  it("hashes OTP deterministically with JWT secret", () => {
    resetEnvCache();
    loadEnv();
    const a = hashOtp("123456");
    const b = hashOtp("123456");
    const c = hashOtp("000000");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(generateOtpCode()).toMatch(/^\d{6}$/);
  });
});
