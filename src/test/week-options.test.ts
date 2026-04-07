import { describe, expect, it } from "vitest";
import {
  buildWeekOptions,
  getCurrentISOWeekValue,
  getCurrentISOWeekYear,
  parseWeekSelectionInput,
} from "@/lib/week-options";

describe("week-options helpers", () => {
  const customLabels = { s12: "KV SANTA YAPA" };
  const isoYear = 2026;
  const options = buildWeekOptions(isoYear, customLabels);

  it("builds ISO week options with formatted labels and custom tags", () => {
    expect(options).toHaveLength(53);
    expect(options[11]).toMatchObject({
      value: "s12",
      label: "W12 (17 al 23 de marzo)",
      customLabel: "KV SANTA YAPA",
      monthLabel: "Marzo",
    });
  });

  it("builds the requested business week mapping from tuesday to monday", () => {
    expect(options[14].label).toBe("W15 (7 al 13 de abril)");
    expect(options[15].label).toBe("W16 (14 al 20 de abril)");
    expect(options[16].label).toBe("W17 (21 al 27 de abril)");
  });

  it("formats weeks that span two different months", () => {
    expect(options[17].label).toBe("W18 (28 de abril al 4 de mayo)");
  });

  it("returns the ISO week and ISO year for a date", () => {
    expect(getCurrentISOWeekValue(new Date("2026-03-17T12:00:00Z"))).toBe("s12");
    expect(getCurrentISOWeekYear(new Date("2026-03-17T12:00:00Z"))).toBe(2026);
  });

  it("parses a typed week number into the matching option", () => {
    expect(parseWeekSelectionInput("12", options, isoYear)?.value).toBe("s12");
    expect(parseWeekSelectionInput("w12", options, isoYear)?.value).toBe("s12");
  });

  it("parses a date inside the week into the matching option", () => {
    expect(parseWeekSelectionInput("17/03/2026", options, isoYear)?.value).toBe("s12");
    expect(parseWeekSelectionInput("2026-03-17", options, isoYear)?.value).toBe("s12");
  });

  it("rejects dates outside the configured ISO year", () => {
    expect(parseWeekSelectionInput("28/12/2025", options, isoYear)).toBeUndefined();
  });
});
