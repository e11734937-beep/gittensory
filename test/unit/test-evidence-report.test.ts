import { describe, expect, it } from "vitest";
import { buildTestEvidenceReport } from "../../src/signals/test-evidence-report";

// Direct unit tests for the pure builder, isolating its contract from the MCP client/server roundtrip
// exercised in mcp-check-test-evidence.test.ts.
describe("buildTestEvidenceReport (#2235)", () => {
  it("reports absent coverage with code changes for a code-only diff", () => {
    const report = buildTestEvidenceReport(["src/foo.ts", "src/bar.ts"]);
    expect(report.coverageBand).toBe("absent");
    expect(report.changedPathCount).toBe(2);
    expect(report.testPathCount).toBe(0);
    expect(report.hasCodeChanges).toBe(true);
    expect(report.hasTestEvidence).toBe(false);
    expect(report.guidance).toMatch(/add at least one test/i);
    expect(report.summary).toContain("absent");
  });

  it("reports absent coverage but no code changes for a docs-only diff", () => {
    const report = buildTestEvidenceReport(["README.md", "docs/guide.md"]);
    expect(report.coverageBand).toBe("absent");
    expect(report.hasCodeChanges).toBe(false);
    expect(report.hasTestEvidence).toBe(false);
  });

  it("reports strong coverage for a balanced code+tests diff", () => {
    const report = buildTestEvidenceReport(["src/foo.ts", "src/foo.test.ts"]);
    expect(report.coverageBand).toBe("strong");
    expect(report.testPathCount).toBe(1);
    expect(report.hasTestEvidence).toBe(true);
    expect(report.guidance).toMatch(/no additional tests/i);
  });

  it("classifies the adequate and weak threshold bands from the changed-path ratio", () => {
    expect(buildTestEvidenceReport(["src/a.ts", "src/b.ts", "src/c.ts", "src/a.test.ts"]).coverageBand).toBe("adequate");
    expect(
      buildTestEvidenceReport([
        "src/a.ts",
        "src/b.ts",
        "src/c.ts",
        "src/d.ts",
        "src/e.ts",
        "src/f.ts",
        "src/g.ts",
        "src/h.ts",
        "src/i.ts",
        "src/a.test.ts",
      ]).coverageBand,
    ).toBe("weak");
  });

  it("folds explicit test paths into the band so band/guidance stay consistent with hasTestEvidence", () => {
    const report = buildTestEvidenceReport(["src/foo.ts"], ["test/foo.test.ts"]);
    expect(report.coverageBand).toBe("strong");
    expect(report.hasCodeChanges).toBe(true);
    expect(report.hasTestEvidence).toBe(true);
    expect(report.changedPathCount).toBe(2);
    expect(report.testPathCount).toBe(1);
  });

  it("dedupes a path listed in both changedPaths and testFiles so the ratio is not skewed", () => {
    const report = buildTestEvidenceReport(["src/a.ts", "src/a.test.ts"], ["src/a.test.ts"]);
    expect(report.changedPathCount).toBe(2);
    expect(report.testPathCount).toBe(1);
    expect(report.coverageBand).toBe("strong");
  });

  it("treats an empty changed set as absent coverage with no evidence", () => {
    const report = buildTestEvidenceReport([]);
    expect(report.coverageBand).toBe("absent");
    expect(report.changedPathCount).toBe(0);
    expect(report.hasCodeChanges).toBe(false);
    expect(report.hasTestEvidence).toBe(false);
  });
});
