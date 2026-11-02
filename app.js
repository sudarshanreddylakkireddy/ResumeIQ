(() => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const fileInput = document.getElementById("resume-file");
  const dropzone = document.getElementById("dropzone");
  const filePrompt = document.getElementById("file-prompt");
  const fileHint = document.getElementById("file-hint");
  const analyzeButton = document.getElementById("analyze-button");
  const statusMessage = document.getElementById("status-message");
  const jobDescription = document.getElementById("job-description");
  const results = document.getElementById("results");
  let selectedFile = null;

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  function setStatus(message, isError) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("error", Boolean(isError));
  }

  function selectFile(file) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      selectedFile = null;
      analyzeButton.disabled = true;
      setStatus("Please choose a PDF file.", true);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      selectedFile = null;
      analyzeButton.disabled = true;
      setStatus("That file is over 10 MB. Please choose a smaller PDF.", true);
      return;
    }
    selectedFile = file;
    filePrompt.textContent = file.name;
    fileHint.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to analyze`;
    analyzeButton.disabled = false;
    setStatus("", false);
  }

  async function readPdf(file) {
    if (!window.pdfjsLib) {
      throw new Error("The PDF reader could not load. Check your internet connection and try again.");
    }
    const document = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(" "));
    }
    return pages.join("\n");
  }

  function addListItem(list, text, className) {
    const item = document.createElement("li");
    if (className) item.className = className;
    item.textContent = text;
    list.append(item);
  }

  function showResults(analysis) {
    document.getElementById("score-value").textContent = analysis.score;
    document.getElementById("score-title").textContent = analysis.scoreTitle;
    document.getElementById("score-summary").textContent = analysis.scoreSummary;
    const scoreRing = document.getElementById("score-ring");
    scoreRing.style.setProperty("--score", `${analysis.score * 3.6}deg`);
    scoreRing.setAttribute("aria-label", `Resume score: ${analysis.score} out of 100`);

    const checksList = document.getElementById("checks-list");
    checksList.replaceChildren();
    for (const check of analysis.checks) {
      const item = document.createElement("li");
      const icon = document.createElement("span");
      icon.className = check.passed ? "check-icon passed" : "check-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = check.passed ? "✓" : "–";
      const label = document.createElement("span");
      label.textContent = check.label;
      item.append(icon, label);
      checksList.append(item);
    }

    document.getElementById("keywords-heading").textContent = analysis.hasJobDescription
      ? "Job-match keywords"
      : "Skills found";
    document.getElementById("keywords-subtitle").textContent = analysis.hasJobDescription
      ? `${analysis.missingKeywords.length} of ${analysis.keywords.length} highlighted keywords could not be found in your resume.`
      : "Skills identified in the resume text.";
    const keywordList = document.getElementById("keyword-list");
    keywordList.replaceChildren();
    if (!analysis.keywords.length) {
      const empty = document.createElement("span");
      empty.className = "empty-keywords";
      empty.textContent = analysis.hasJobDescription
        ? "No recurring role-specific keywords found. Try adding more of the job description."
        : "No common skills detected. A dedicated skills section can make these easier to spot.";
      keywordList.append(empty);
    } else {
      for (const keyword of analysis.keywords) {
        const chip = document.createElement("span");
        const missing = analysis.missingKeywords.includes(keyword);
        chip.className = `keyword-chip${missing ? " missing" : ""}`;
        chip.textContent = keyword;
        keywordList.append(chip);
      }
    }

    const recommendations = document.getElementById("recommendations-list");
    recommendations.replaceChildren();
    analysis.recommendations.forEach((tip) => addListItem(recommendations, tip));
    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  fileInput.addEventListener("change", () => selectFile(fileInput.files[0]));
  dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });
  for (const eventName of ["dragenter", "dragover"]) {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("dragging");
    });
  }
  for (const eventName of ["dragleave", "drop"]) {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragging");
    });
  }
  dropzone.addEventListener("drop", (event) => selectFile(event.dataTransfer.files[0]));

  analyzeButton.addEventListener("click", async () => {
    if (!selectedFile) return;
    analyzeButton.disabled = true;
    analyzeButton.classList.add("loading");
    analyzeButton.querySelector("span").textContent = "Reading your resume...";
    setStatus("Extracting text from your PDF. This may take a moment.", false);
    try {
      const text = await readPdf(selectedFile);
      if (!text.trim()) {
        throw new Error("We couldn't find selectable text in this PDF. Try exporting a text-based PDF instead of a scanned image.");
      }
      showResults(window.ResumeIQ.analyzeResume(text, jobDescription.value));
      setStatus("", false);
    } catch (error) {
      setStatus(error.message || "We couldn't read that PDF. Please try another file.", true);
    } finally {
      analyzeButton.disabled = false;
      analyzeButton.classList.remove("loading");
      analyzeButton.querySelector("span").textContent = "Analyze my resume";
    }
  });

  document.getElementById("reset-button").addEventListener("click", () => {
    selectedFile = null;
    fileInput.value = "";
    filePrompt.textContent = "Drop your resume here, or browse files";
    fileHint.textContent = "PDF format · Up to 10 MB";
    jobDescription.value = "";
    results.hidden = true;
    analyzeButton.disabled = true;
    setStatus("", false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
