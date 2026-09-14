```markdown
# AI Scholarship Intelligence Matcher

A Node.js and Express web application powered by Google Gemini that analyzes student profiles and resumes across multiple file formats (PDF, DOCX, TXT, and Images) to deliver verified, customized scholarship recommendations and application strategies.

## Features

- **Multimodal Resume Parsing:** Automatically extracts text from uploaded PDF (`pdf-parse`) and Word (`mammoth`) documents, processes raw text files, or handles image-based CVs natively using Gemini's vision capabilities.
- **AI-Powered Matching:** Leverages the `gemini-3.5-flash-lite` model for fast, context-aware student profile evaluations and real-time grant matching.
- **Dynamic Dashboard:** Renders structured Markdown reports complete with direct application links, match rationales, and deadlines directly in a modern responsive interface.
- **Export Ready:** Clean print-to-PDF styles for saving or printing generated scholarship intelligence reports.

## Tech Stack

- **Backend:** Node.js, Express, Multer (Memory Storage)
- **Document Processing:** `pdf-parse`, `mammoth`
- **AI SDK:** `@google/genai` (Google GenAI SDK)
- **Frontend Rendering:** Vanilla CSS, Google Fonts (Inter), Marked.js

## Prerequisites

- Node.js (v18+ recommended)
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/))

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Petersap4/ai-scholarships-matcher.git](https://github.com/Petersap4/ai-scholarships-matcher.git)
   cd ai-scholarships-matcher

```

2. **Install dependencies:**
```bash
npm install express multer pdf-parse mammoth dotenv @google/genai

```


3. **Configure environment variables:**
Create a `.env` file in the root directory and add your Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3000

```


4. **Run the application:**
```bash
node server.js

```


5. **Access the app:**
Open your browser and navigate to `http://localhost:3000`.

## Usage

1. Fill out your academic details (Major, GPA, Country of Study, Academic Year).
2. Upload your CV/Resume in `.pdf`, `.docx`, `.txt`, or image format.
3. Click **Find Scholarships** to generate a targeted intelligence report for the current academic year.

```

```
