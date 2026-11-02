# ResumeIQ

ResumeIQ is a responsive, client-side resume analyzer. It extracts selectable text from PDF resumes, checks for key sections and common skills, offers a practical score and improvement tips, and can compare resume keywords with a pasted job description. Resume files are processed in the browser and are not sent to an application server.

## Run locally

Serve this folder over HTTP (for example, run `python -m http.server 8000` and visit `http://localhost:8000`) in a modern browser. PDF text extraction uses PDF.js from cdnjs, so an internet connection is needed to load the PDF reader. Scanned/image-only PDFs are not supported.

## Tests

Run the analyzer tests with `node --test tests/analyzer.test.js`.
