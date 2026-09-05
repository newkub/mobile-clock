import { describe, expect, it } from "vitest";
import { isNative, haptic } from "../lib/capacitor";

describe("capacitor", () => {
  it("isNative returns false in jsdom", () => {
    expect(isNative()).toBe(false);
  });

  it("haptic does not throw on web", async () => {
    await expect(haptic("light")).resolves.toBeUndefined();
  });
});
