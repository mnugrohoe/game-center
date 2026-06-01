import { describe, expect, it } from "vitest";
import { colorFromIndex, formatTime } from "./tokens";

describe("colorFromIndex", () => {
  it("returns expected values for index 0", () => {
    expect(colorFromIndex(0)).toEqual({
      bg: "0 65% 50%",
      text: "0 0% 100%",
    });
  });

  it("calculates hue using the golden angle", () => {
    const result = colorFromIndex(1);

    expect(result.bg).toBe("137.508 65% 50%");
    expect(result.text).toBe("0 0% 100%");
  });

  it("cycles lightness every 120 indices", () => {
    expect(colorFromIndex(0).bg).toContain("50%");
    expect(colorFromIndex(120).bg).toContain("60%");
    expect(colorFromIndex(240).bg).toContain("70%");
    expect(colorFromIndex(360).bg).toContain("50%");
  });

  it("cycles saturation every 360 indices", () => {
    expect(colorFromIndex(0).bg).toContain("65%");
    expect(colorFromIndex(360).bg).toContain("75%");
    expect(colorFromIndex(720).bg).toContain("85%");
    expect(colorFromIndex(1080).bg).toContain("65%");
  });

  it("uses black text when lightness is greater than 60", () => {
    expect(colorFromIndex(240).text).toBe("0 0% 0%");
  });

  it("uses white text when lightness is 60 or less", () => {
    expect(colorFromIndex(0).text).toBe("0 0% 100%");
    expect(colorFromIndex(120).text).toBe("0 0% 100%");
  });

  it("keeps hue within 0-360 range", () => {
    const hue = Number(colorFromIndex(1000).bg.split(" ")[0]);

    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  });
});

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
