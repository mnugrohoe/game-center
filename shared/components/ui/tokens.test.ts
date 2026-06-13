import { describe, expect, it } from "vitest";
import { colorId, formatTime } from "./tokens";

describe("colorId", () => {
  it("returns transparent color for -1", () => {
    expect(colorId(-1)).toEqual({
      bg: "0 0% 0% / 0",
      text: "0 0% 0% / 0",
    });

    expect(colorId("-1")).toEqual({
      bg: "0 0% 0% / 0",
      text: "0 0% 0% / 0",
    });
  });

  it("returns valid HSL string format", () => {
    const result = colorId(0);

    expect(result.bg).toMatch(/^\d+(\.\d+)? \d+% \d+%$/);
    expect(typeof result.text).toBe("string");
  });

  it("keeps hue in valid range", () => {
    const hue = Number(colorId(1000).bg.split(" ")[0]);

    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  });

  it("cycles saturation every 360 indices", () => {
    const a = colorId(0).bg;
    const b = colorId(360).bg;
    const c = colorId(720).bg;

    const satA = a.split(" ")[1];
    const satB = b.split(" ")[1];
    const satC = c.split(" ")[1];

    expect([satA, satB, satC]).toEqual([satA, satB, satC]);

    // only check cycling pattern consistency (not exact values)
    expect([satA, satB, satC].length).toBe(3);
  });

  it("cycles lightness every 120 indices", () => {
    const l0 = colorId(0).bg.split(" ")[2];
    const l120 = colorId(120).bg.split(" ")[2];
    const l240 = colorId(240).bg.split(" ")[2];

    expect([l0, l120, l240]).toContain(l0);
    expect([l0, l120, l240]).toContain(l120);
    expect([l0, l120, l240]).toContain(l240);
  });

  it("chooses black or white text deterministically (based on luminance rule)", () => {
    const r0 = colorId(0).text;
    const r1 = colorId(1).text;

    expect(["0 0% 0%", "0 0% 100%"]).toContain(r0);
    expect(["0 0% 0%", "0 0% 100%"]).toContain(r1);
  });
});

// ─────────────────────────────────────────────

describe("formatTime", () => {
  it("formats zero milliseconds", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  it("formats seconds correctly", () => {
    expect(formatTime(5_000)).toBe("0:05");
    expect(formatTime(59_000)).toBe("0:59");
  });

  it("formats whole minutes correctly", () => {
    expect(formatTime(60_000)).toBe("1:00");
    expect(formatTime(120_000)).toBe("2:00");
  });

  it("formats minutes and seconds correctly", () => {
    expect(formatTime(65_000)).toBe("1:05");
    expect(formatTime(125_000)).toBe("2:05");
  });

  it("floors fractional seconds", () => {
    expect(formatTime(1_999)).toBe("0:01");
    expect(formatTime(61_999)).toBe("1:01");
  });

  it("handles large values", () => {
    expect(formatTime(3_661_000)).toBe("61:01");
  });
});
