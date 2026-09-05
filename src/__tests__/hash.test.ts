import { describe, expect, it } from "vitest";
import { hashId } from "../lib/hash";

describe("hashId", () => {
  it("returns a positive number for non-empty strings", () => {
    expect(hashId("alarm-1")).toBeGreaterThan(0);
  });

  it("returns stable ids for the same input", () => {
    expect(hashId("reminder-2")).toBe(hashId("reminder-2"));
  });

  it("returns different ids for different inputs", () => {
    expect(hashId("a")).not.toBe(hashId("b"));
  });
});
