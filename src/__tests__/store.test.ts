import { describe, expect, it, beforeEach } from "vitest";
import { appStore, addAlarm, toggleAlarm, removeAlarm, resetStore } from "../store/app";

beforeEach(() => {
  resetStore();
});

describe("app store", () => {
  it("starts with an empty alarm list", () => {
    expect(appStore.alarms).toEqual([]);
  });

  it("can add an alarm", () => {
    addAlarm({
      id: "test-alarm",
      hour: 7,
      minute: 0,
      repeat: ["MO"],
      enabled: true,
      label: "Test",
      sound: "beep",
    });
    expect(appStore.alarms).toHaveLength(1);
  });

  it("can toggle an alarm", () => {
    addAlarm({
      id: "test-alarm",
      hour: 7,
      minute: 0,
      repeat: ["MO"],
      enabled: true,
      label: "Test",
      sound: "beep",
    });
    toggleAlarm("test-alarm");
    expect(appStore.alarms[0].enabled).toBe(false);
  });

  it("can remove an alarm", () => {
    addAlarm({
      id: "test-alarm",
      hour: 7,
      minute: 0,
      repeat: ["MO"],
      enabled: true,
      label: "Test",
      sound: "beep",
    });
    removeAlarm("test-alarm");
    expect(appStore.alarms).toHaveLength(0);
  });
});
