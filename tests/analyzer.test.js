const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzeResume, extractKeywords } = require("../analyzer.js");

test("scores resume sections, length, action language, and role keywords", () => {
  const text = [
    "Contact jane@example.com, 555-123-4567",
    "Professional Experience: Developed JavaScript and React applications.",
    "Education: Bachelor of Science",
    "Skills: JavaScript, React, SQL",
    ...Array(45).fill("Led a project and improved delivery through clear communication.")
  ].join(" ");
  const result = analyzeResume(text, "We need JavaScript, React, SQL and AWS experience.");

  assert.equal(result.checks.every((check) => check.passed), true);
  assert.equal(result.wordCount >= 250, true);
  assert.deepEqual(result.missingKeywords, ["aws"]);
  assert.equal(result.score >= 80, true);
  assert.equal(result.hasJobDescription, true);
});

test("provides useful feedback for a short resume missing core sections", () => {
  const result = analyzeResume("A short profile with some experience.", "");

  assert.equal(result.score < 55, true);
  assert.equal(result.checks.some((check) => !check.passed), true);
  assert.equal(result.recommendations.length > 1, true);
  assert.equal(result.hasJobDescription, false);
});

test("extracts recurring job keywords without common filler words", () => {
  const keywords = extractKeywords("The role requires Python and SQL. Python experience is preferred and communication is important.");

  assert.equal(keywords.includes("python"), true);
  assert.equal(keywords.includes("sql"), true);
  assert.equal(keywords.includes("communication"), true);
  assert.equal(keywords.includes("requires"), true);
  assert.equal(keywords.includes("the"), false);
});
