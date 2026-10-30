import { describe, expect, it } from "vitest";
import { isExpiredStatus, isUnavailable, ApiError } from "./api";

describe("api helper functions", () => {
  it("detects expired status", () => {
    expect(isExpiredStatus(401)).toBe(true);
    expect(isExpiredStatus(403)).toBe(false);
    expect(isExpiredStatus(500)).toBe(false);
    expect(isExpiredStatus(null)).toBe(false);
  });

  it("detects backend unavailable errors", () => {
    const networkErr = new ApiError("Network error", null, "network");
    const timeoutErr = new ApiError("Timeout", null, "timeout");
    const httpErr = new ApiError("Not found", 404, "http");
    const normalErr = new Error("Generic error");

    expect(isUnavailable(networkErr)).toBe(true);
    expect(isUnavailable(timeoutErr)).toBe(true);
    expect(isUnavailable(httpErr)).toBe(false);
    expect(isUnavailable(normalErr)).toBe(false);
  });
});

