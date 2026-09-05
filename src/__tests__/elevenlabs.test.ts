import { describe, expect, it, vi } from "vitest";
import { generateSound } from "../lib/elevenlabs";

describe("elevenlabs", () => {
  it("returns null when api key is empty", async () => {
    expect(await generateSound("hello", "")).toBeNull();
  });

  it("returns null when text is empty", async () => {
    expect(await generateSound("  ", "sk_test")).toBeNull();
  });

  it("returns a blob URL on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(["audio"])),
    }) as any;
    globalThis.URL = { createObjectURL: vi.fn().mockReturnValue("blob:abc") } as any;
    const url = await generateSound("wake up", "sk_test");
    expect(url).toBe("blob:abc");
  });
});
