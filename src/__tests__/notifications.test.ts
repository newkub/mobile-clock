import { describe, expect, it } from "vitest";
import { scheduleReminder, cancelNotification } from "../lib/notifications";

describe("notifications", () => {
  it("scheduleReminder returns an id", async () => {
    const id = await scheduleReminder({
      id: 1,
      title: "Test",
      body: "body",
      at: new Date(Date.now() + 60000),
    });
    expect(id).toBe(1);
  });

  it("cancelNotification does not throw", async () => {
    await expect(cancelNotification(1)).resolves.toBeUndefined();
  });
});
