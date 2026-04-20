import { describe, expect, it } from "vitest";
import { analyzeMailingHtml } from "./analyzeMailingHtml";

describe("analyzeMailingHtml", () => {
  it("no genera warnings severos para un html email-safe básico", () => {
    const report = analyzeMailingHtml(`
      <body>
        <div style="display:none; max-height:0; overflow:hidden;">Preheader</div>
        <table role="presentation"><tr><td><a href="https://example.com">CTA</a></td></tr></table>
      </body>
    `);

    expect(report.issues.filter((issue) => issue.severity === "warning")).toHaveLength(0);
    expect(report.score).toBeGreaterThanOrEqual(90);
  });

  it("detecta urls relativas y layouts poco compatibles", () => {
    const report = analyzeMailingHtml(`
      <style>.x { display:flex; }</style>
      <div class="x"><img src="/hero.jpg" /><a href="promo">Go</a></div>
    `);

    expect(report.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining(["style-tag", "advanced-layout", "relative-url", "class-attr", "presentation-role", "preheader"]),
    );
    expect(report.score).toBeLessThan(70);
  });
});