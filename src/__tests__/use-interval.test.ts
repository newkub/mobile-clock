import { describe, expect, it, vi } from "vitest";
import { createRoot } from "solid-js";
import { useInterval } from "../hooks/use-interval";

describe("useInterval", () => {
  it("does not set up an interval when delay is null", () => {
    const callback = vi.fn();
    createRoot(() => {
      useInterval(callback, () => null);
    });
    expect(callback).not.toHaveBeenCalled();
  });
});
