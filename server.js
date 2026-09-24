// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ai-scholarship-matcher.html'));
});

app.post('/match-scholarships', upload.single('resume'), async (req, res) => {
    try {
        const { major, gpa, academicYear, country } = req.body;
        const resumeFile = req.file;

        let resumeText = 'No resume provided.';
        let imagePart = null;

        if (resumeFile) {
            const ext = path.extname(resumeFile.originalname).toLowerCase();
            const fileBuffer = resumeFile.buffer;
            const mimeType = resumeFile.mimetype;

            if (ext === '.pdf') {
                const parsedPdf = await pdfParse(fileBuffer);
                resumeText = parsedPdf.text;
            } else if (ext === '.docx') {
                const parsedDocx = await mammoth.extractRawText({ buffer: fileBuffer });
                resumeText = parsedDocx.value;
            } else if (mimeType && mimeType.startsWith('image/')) {
                // Pass image natively to multimodal gemini-3.5-flash-lite
                imagePart = {
                    inlineData: {
                        data: fileBuffer.toString('base64'),
                        mimeType: mimeType
                    }
                };
                resumeText = "Image-based resume/CV uploaded.";
            } else {
                resumeText = fileBuffer.toString('utf8');
            }
        }

        const prompt = `
        You are an expert academic advisor and scholarship coordinator specializing in regional and international funding. 
        Analyze the following student profile, resume content/image, and target country to find matching scholarship opportunities, government grants, and regional funding sources.

        TEMPORAL CONSTRAINT: It is currently the year 2026. All scholarship cycles, deadlines, and academic years you provide MUST be for the active 2026-2027 academic year rounds.

        Student Profile:
        - Country of Study/Residence: ${country}
        - Major: ${major}
        - GPA: ${gpa} 
        - Academic Year: ${academicYear}
        - Resume/Background Info: ${resumeText}

        Provide 4-5 specific, real-world scholarship programs, national foundations (such as local government or state scholarship boards like IKY if country is Greece), or European/international grants available to students in ${country}. For each scholarship/category, you MUST include:
        1. The official name of the scholarship (explicitly referencing the 2026-2027 cycle).
        2. A direct hyperlink to its official website formatted in Markdown (e.g. [IKY Scholarships](https://www.iky.gr)).
        3. Match score and rationale tying their GPA (${gpa}) and major (${major}) to the award criteria.
        4. Actionable advice on how to strengthen their application.

        MANDATORY : VERIFY THAT ALL THE LINKS PROVIDED ABOVE ACTUALLY LEAD TO THE OFFICIAL HOME PAGES AND NOT TO BROKEN (404) OR OUTDATED PAGES. If a link is broken or outdated, provide an alternative official source.
        !!!!!!AGAIN TEST THE LINKS AND MAKE SURE THOSE LINKS ARE WORKING!!!!!!
        Format the response cleanly using Markdown.
        `;

        const contents = [prompt];
        if (imagePart) {
            contents.push(imagePart);
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: contents,
        });

        const aiText = response.text || "No response generated.";

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Scholarship Matches | Dashboard</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
                <style>
                    :root {
                        --primary: #6366f1;
                        --primary-hover: #4f46e5;
                        --bg-gradient: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
                        --card-bg: #ffffff;
                        --text-main: #0f172a;
                        --text-muted: #475569;
                        --border: #e2e8f0;
                    }

                    body {
                        font-family: 'Inter', sans-serif;
                        background: var(--bg-gradient);
                        color: var(--text-main);
                        min-height: 100vh;
                        margin: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 30px 20px;
                    }

                    .dashboard {
                        width: 100%;
                        max-width: 850px;
                        background: var(--card-bg);
                        padding: 50px;
                        border-radius: 24px;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                        box-sizing: border-box;
                    }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid var(--border);
                        padding-bottom: 25px;
                        margin-bottom: 30px;
                    }

                    .header-title h1 {
                        font-size: 24px;
                        font-weight: 700;
                        color: var(--text-main);
                        margin: 0 0 6px 0;
                    }

                    .header-title p {
                        color: var(--text-muted);
                        font-size: 14px;
                        margin: 0;
                    }

                    .badge {
                        background: #e0e7ff;
                        color: var(--primary);
                        padding: 8px 16px;
                        border-radius: 50px;
                        font-weight: 600;
                        font-size: 13px;
                    }

                    .results-body {
                        font-size: 15px;
                        line-height: 1.8;
                        color: var(--text-main);
                        margin-bottom: 40px;
                    }

                    .results-body h3 {
                        font-size: 18px;
                        color: var(--primary);
                        margin-top: 30px;
                        margin-bottom: 12px;
                        font-weight: 600;
                        border-bottom: 1px dashed var(--border);
                        padding-bottom: 6px;
                    }

                    .results-body h4 {
                        font-size: 16px;
                        color: var(--text-main);
                        margin-top: 24px;
                        margin-bottom: 8px;
                        font-weight: 600;
                    }

                    .results-body p {
                        margin-bottom: 12px;
                        color: var(--text-muted);
                    }

                    .results-body ul {
                        padding-left: 20px;
                        margin-bottom: 20px;
                    }

                    .results-body li {
                        margin-bottom: 8px;
                        color: var(--text-muted);
                    }

                    .results-body strong {
                        color: var(--text-main);
                    }

                    .results-body a {
                        color: var(--primary);
                        text-decoration: none;
                        font-weight: 500;
                    }

                    .results-body a:hover {
                        text-decoration: underline;
                    }

                    .actions {
                        display: flex;
                        gap: 15px;
                    }

                    .btn {
                        flex: 1;
                        text-align: center;
                        background-color: var(--primary);
                        color: white;
                        text-decoration: none;
                        border-radius: 12px;
                        padding: 14px;
                        font-size: 15px;
                        font-weight: 600;
                        box-sizing: border-box;
                        transition: all 0.2s ease;
                        box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
                    }

                    .btn:hover {
                        background-color: var(--primary-hover);
                        transform: translateY(-1px);
                    }

                    .btn-secondary {
                        background-color: #f1f5f9;
                        color: var(--text-main);
                        box-shadow: none;
                    }

                    .btn-secondary:hover {
                        background-color: #e2e8f0;
                    }
                </style>
            </head>
            <body>
                <div class="dashboard">
                    <div class="header">
                        <div class="header-title">
                            <h1>Scholarship Intelligence Report</h1>
                            <p>Targeted funding opportunities for ${country}</p>
                        </div>
                        <div class="badge">${country} Verified</div>
                    </div>

                    <div class="results-body" id="contentArea">Loading results...</div>

                    <div class="actions">
                        <a href="/" class="btn btn-secondary">← Run Another Search</a>
                        <a href="#" class="btn" onclick="window.print(); return false;">Print / Save PDF</a>
                    </div>
                </div>

                <script>
                    try {
                        const rawMarkdown = ${JSON.stringify(aiText)};
                        if (typeof marked !== 'undefined' && marked.parse) {
                            document.getElementById('contentArea').innerHTML = marked.parse(rawMarkdown);
                        } else {
                            document.getElementById('contentArea').innerHTML = rawMarkdown.replace(/\\n/g, '<br>');
                        }
                    } catch (err) {
                        console.error('Rendering error:', err);
                        document.getElementById('contentArea').innerText = ${JSON.stringify(aiText)};
                    }
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while processing your request: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Scholarship app running at http://localhost:${PORT}`);
});