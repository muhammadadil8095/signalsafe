import { describe, expect, it } from "vitest";
import { validateLoginInput } from "./auth";

describe("validateLoginInput", () => {
  it("validates empty base URL", () => {
    expect(validateLoginInput("user@campus.edu", "pass1234", "")).toBe(
      "Enter the SignalSafe backend base URL."
    );
  });

  it("validates malformed base URL", () => {
    expect(validateLoginInput("user@campus.edu", "pass1234", "not-a-url")).toBe(
      "Backend URL is not valid."
    );
    expect(validateLoginInput("user@campus.edu", "pass1234", "ftp://example.com")).toBe(
      "Backend URL must start with http:// or https://."
    );
  });

  it("validates invalid email", () => {
    expect(validateLoginInput("notanemail", "pass1234", "http://localhost:8000")).toBe(
      "Enter a valid email address."
    );
  });

  it("validates missing password", () => {
    expect(validateLoginInput("user@campus.edu", "", "http://localhost:8000")).toBe(
      "Enter your password."
    );
  });

  it("passes valid credentials and URL", () => {
    expect(validateLoginInput("student@campus.edu", "securePass123", "http://127.0.0.1:8000")).toBeNull();
  });
});

