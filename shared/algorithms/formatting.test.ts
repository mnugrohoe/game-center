// formatting.test.ts
import { describe, it, expect } from "vitest";

import {
  formatTime,
  formatTimeLong,
  formatScore,
  formatLargeNumber,
  formatPercent,
} from "./formatting";

describe("formatTime", () => {
  it("formats seconds as M:SS", () => {
    expect(formatTime(90)).toBe("1:30");
  });

  it("pads single digit seconds", () => {
    expect(formatTime(65)).toBe("1:05");
  });

  it("handles zero seconds", () => {
    expect(formatTime(0)).toBe("0:00");
  });

  it("handles under one minute", () => {
    expect(formatTime(9)).toBe("0:09");
  });

  it("handles exact minutes", () => {
    expect(formatTime(120)).toBe("2:00");
  });
});

describe("formatTimeLong", () => {
  it("formats HH:MM:SS when hours exist", () => {
    expect(formatTimeLong(3661)).toBe("1:01:01");
  });

  it("falls back to M:SS when under one hour", () => {
    expect(formatTimeLong(125)).toBe("2:05");
  });

  it("handles exactly one hour", () => {
    expect(formatTimeLong(3600)).toBe("1:00:00");
  });

  it("handles zero seconds", () => {
    expect(formatTimeLong(0)).toBe("0:00");
  });

  it("pads minutes and seconds correctly", () => {
    expect(formatTimeLong(7325)).toBe("2:02:05");
  });
});

describe("formatScore", () => {
  it("formats score with default decimals", () => {
    expect(formatScore(7.38)).toBe("7.4");
  });

  it("supports custom decimals", () => {
    expect(formatScore(7.381, 2)).toBe("7.38");
  });

  it("rounds correctly", () => {
    expect(formatScore(1.999, 2)).toBe("2.00");
  });

  it("formats integers", () => {
    expect(formatScore(5)).toBe("5.0");
  });
});

describe("formatLargeNumber", () => {
  it("formats thousands with K suffix", () => {
    expect(formatLargeNumber(12_500)).toBe("12.5K");
  });

  it("formats millions with M suffix", () => {
    expect(formatLargeNumber(2_500_000)).toBe("2.5M");
  });

  it("returns small numbers unchanged", () => {
    expect(formatLargeNumber(999)).toBe("999");
  });

  it("handles exactly 1000", () => {
    expect(formatLargeNumber(1_000)).toBe("1.0K");
  });

  it("handles exactly 1 million", () => {
    expect(formatLargeNumber(1_000_000)).toBe("1.0M");
  });

  it("rounds compact values correctly", () => {
    expect(formatLargeNumber(1_550)).toBe("1.6K");
  });
});

describe("formatPercent", () => {
  it("formats ratio as percentage", () => {
    expect(formatPercent(0.756)).toBe("75.6%");
  });

  it("supports custom decimals", () => {
    expect(formatPercent(0.756, 2)).toBe("75.60%");
  });

  it("handles zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("handles one hundred percent", () => {
    expect(formatPercent(1)).toBe("100.0%");
  });

  it("rounds percentages correctly", () => {
    expect(formatPercent(0.12345, 2)).toBe("12.35%");
  });
});
