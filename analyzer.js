(function (root, factory) {
  const analyzer = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = analyzer;
  } else {
    root.ResumeIQ = analyzer;
  }
})(typeof globalThis === "object" ? globalThis : this, function () {
  const SKILLS = [
    "javascript", "typescript", "python", "java", "c++", "sql", "html", "css",
    "react", "node.js", "angular", "vue", "aws", "azure", "gcp", "docker",
    "kubernetes", "git", "excel", "tableau", "power bi", "machine learning",
    "data analysis", "project management", "agile", "scrum", "communication",
    "leadership", "problem solving", "customer service", "sales", "marketing",
    "financial modeling", "accounting", "research", "writing", "figma",
    "product management", "statistics", "r", "rest api"
  ];
  const STOP_WORDS = new Set([
    "about", "after", "also", "and", "are", "for", "from", "have", "into",
    "its", "our", "the", "their", "this", "those", "with", "you", "your",
    "will", "who", "what", "when", "where", "which", "while", "within",
    "years", "year", "work", "working", "role", "team", "candidate", "must",
    "should", "would", "could", "ability", "experience", "required",
    "preferred", "including", "such", "across", "using", "plus", "ensure",
    "need", "needs"
  ]);
  const SECTION_PATTERNS = {
    contact: /\b(email|e-mail|phone|linkedin|github|@)\b/i,
    experience: /\b(experience|employment|professional history|work history)\b/i,
    education: /\b(education|university|college|degree|bachelor|master|b\.s\.|b\.a\.)\b/i,
    skills: /\b(skills|technical skills|core competencies|competencies)\b/i
  };
  const ACTION_VERBS = /\b(achieved|built|created|delivered|designed|developed|drove|enabled|established|improved|increased|launched|led|managed|optimized|reduced|resolved|spearheaded|streamlined)\b/i;

  function extractKeywords(jobDescription) {
    const text = String(jobDescription || "").toLowerCase();
    const counts = new Map();
    for (const skill of SKILLS) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(^|[^a-z0-9+#])${escaped}(?=$|[^a-z0-9+#])`, "gi");
      if (pattern.test(text)) counts.set(skill, (text.match(pattern) || []).length);
    }

    const words = text.match(/[a-z][a-z+#.-]{2,}/g) || [];
    for (const word of words) {
      const normalized = word.replace(/^[.-]+|[.-]+$/g, "");
      if (normalized.length < 4 || STOP_WORDS.has(normalized) || SKILLS.includes(normalized)) continue;
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([keyword]) => keyword)
      .slice(0, 12);
  }

  function analyzeResume(resumeText, jobDescription) {
    const text = String(resumeText || "").replace(/\s+/g, " ").trim();
    const lowerText = text.toLowerCase();
    const words = text ? text.split(/\s+/).length : 0;
    const jobKeywords = String(jobDescription || "").trim()
      ? extractKeywords(jobDescription)
      : [];
    const detectedSkills = SKILLS.filter((skill) => {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9+#])${escaped}(?=$|[^a-z0-9+#])`, "i").test(lowerText);
    });
    const keywords = jobKeywords.length
      ? jobKeywords
      : detectedSkills.slice(0, 12);
    const missingKeywords = jobKeywords.length
      ? jobKeywords.filter((keyword) => {
          const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return !new RegExp(`(^|[^a-z0-9+#])${escaped}(?=$|[^a-z0-9+#])`, "i").test(lowerText);
        })
      : [];
    const checks = [
      { key: "contact", label: "Contact details", passed: SECTION_PATTERNS.contact.test(text) },
      { key: "experience", label: "Work experience", passed: SECTION_PATTERNS.experience.test(text) },
      { key: "education", label: "Education", passed: SECTION_PATTERNS.education.test(text) },
      { key: "skills", label: "Skills section", passed: SECTION_PATTERNS.skills.test(text) }
    ];
    const wordCountGood = words >= 250 && words <= 900;
    const actionLanguage = ACTION_VERBS.test(text);
    const keywordCoverage = jobKeywords.length
      ? (jobKeywords.length - missingKeywords.length) / jobKeywords.length
      : detectedSkills.length > 0 ? 1 : 0;
    const score = Math.max(0, Math.min(100, Math.round(
      checks.filter((check) => check.passed).length * 12
      + (wordCountGood ? 15 : words > 0 ? 7 : 0)
      + (actionLanguage ? 15 : 0)
      + Math.round(keywordCoverage * 22)
    )));
    const recommendations = [];

    if (!checks[0].passed) recommendations.push("Add a clear email address and phone number near the top of your resume.");
    if (!checks[1].passed) recommendations.push("Add a clearly labeled work experience section with your most relevant roles.");
    if (!checks[2].passed) recommendations.push("Include an education section with your qualification and institution.");
    if (!checks[3].passed) recommendations.push("Add a dedicated skills section using skills relevant to the roles you want.");
    if (!wordCountGood) recommendations.push(words < 250
      ? "Add more detail about your experience and achievements; your resume looks shorter than expected."
      : "Consider tightening your resume so the most relevant information is easy to find.");
    if (!actionLanguage) recommendations.push("Start bullet points with specific action verbs and describe the outcome of your work.");
    if (missingKeywords.length) recommendations.push(`If they accurately reflect your experience, work these job-description keywords into relevant sections: ${missingKeywords.slice(0, 5).join(", ")}.`);
    if (!recommendations.length) recommendations.push("Your resume covers the essentials. Tailor a few achievements to the specific role before applying.");

    return {
      score,
      wordCount: words,
      checks,
      keywords,
      missingKeywords,
      detectedSkills,
      hasJobDescription: jobKeywords.length > 0,
      recommendations,
      scoreTitle: score >= 80 ? "Strong foundation" : score >= 55 ? "Good start" : "Room to grow",
      scoreSummary: score >= 80
        ? "Your resume has many of the elements that help recruiters and ATS tools scan it."
        : "A few focused improvements can make your experience easier to understand."
    };
  }

  return { analyzeResume, extractKeywords };
});
