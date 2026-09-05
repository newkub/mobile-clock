import { describe, expect, it } from "vitest";
import { formatDuration } from "../lib/time";

describe("formatDuration", () => {
  it("formats zero as 00:00", () => {
    expect(formatDuration(0)).toBe("00:00");
  });

  it("formats seconds only", () => {
    expect(formatDuration(45)).toBe("00:45");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(75)).toBe("01:15");
  });

  it("formats hours", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });
});
