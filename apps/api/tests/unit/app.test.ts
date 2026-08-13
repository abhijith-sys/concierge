import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";

describe("app bootstrap", () => {
  it("creates an express app", () => {
    const app = createApp();
    expect(app).toBeTruthy();
  });
});
