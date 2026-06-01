const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
function shuffleArray(array) {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

app.get("/", (req, res) => {
  res.send("Resume Job Match Agent backend is running");
});

app.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No resume file uploaded" });

    const data = await pdfParse(req.file.buffer);
    const resumeText = data.text;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
You are an expert resume parser and career advisor.

Return ONLY valid JSON.

JSON format:
{
  "name": "",
  "email": "",
  "skills": [],
  "experience": [],
  "education": [],
  "certifications": [],
  "targetRoles": []
}

Rules:
- targetRoles must include top 5 job titles this candidate is most qualified for.
- Do not invent fake information.

Resume:
${resumeText}
`;

    const result = await model.generateContent(prompt);
    const aiText = result.response.text();

    let parsedProfile;
    try {
      parsedProfile = JSON.parse(aiText.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch {
      parsedProfile = {
        name: "",
        email: "",
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        targetRoles: [],
      };
    }

    res.json({
      fileName: req.file.originalname,
      textPreview: resumeText.slice(0, 700),
      fullTextLength: resumeText.length,
      profile: parsedProfile,
    });
  } catch (error) {
    console.error("Resume parsing/Gemini error:", error);
    res.status(500).json({ error: "Failed to parse resume or extract profile" });
  }
});

app.post("/match-jobs", async (req, res) => {
  try {
    const { profile, country, city, jobCount } = req.body;

    if (!profile) {
      return res.status(400).json({ error: "Candidate profile is required" });
    }

    const targetRole =
      profile.targetRoles?.[0] ||
      "Data Engineer";

    const searchQuery = `${targetRole} in ${city}`;

    const randomPage = Math.floor(Math.random() * 3) + 1;

const jobResponse = await axios.get("https://jsearch.p.rapidapi.com/search", {
  params: {
    query: searchQuery,
    page: String(randomPage),
    num_pages: "2",
    country: "us",
    date_posted: "all",
  },
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      },
    });

    const requestedCount = Math.min(
  Math.max(Number(jobCount) || 5, 5),
  20
);
const realJobs = (jobResponse.data.data || []).slice(0, requestedCount).map((job) => ({
      title: job.job_title || "",
      company: job.employer_name || "",
      location: job.job_city
        ? `${job.job_city}, ${job.job_state || country}`
        : job.job_country || country,
      description: job.job_description || "",
      applyLink:
        job.job_apply_link ||
        job.job_google_link ||
        job.employer_website ||
        "",
    }));

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
You are an AI job matching assistant.

Rank the real job postings below for the candidate.

Return ONLY valid JSON.

JSON format:
{
  "jobs": [
    {
      "title": "",
      "company": "",
      "location": "",
      "matchScore": 0,
      "skillsMatched": [],
      "whyMatch": "",
      "applyLink": "",
      "coverLetter": ""
    }
  ]
}

Rules:
- Use ONLY the real jobs provided below.
- Do not invent companies, roles, or apply links.
- Return the top ${jobCount} jobs.
- matchScore should be between 70 and 98.
- coverLetter should be 2 to 3 polished paragraphs.
- Keep coverLetter professional and human-sounding.

Candidate Profile:
${JSON.stringify(profile)}

Real Jobs:
${JSON.stringify(realJobs)}
`;

    const result = await model.generateContent(prompt);
    const aiText = result.response.text();

    let parsedJobs;
    try {
      parsedJobs = JSON.parse(aiText.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch (jsonError) {
      console.error("Job JSON parse error:", jsonError);
      console.error("Raw Gemini response:", aiText);
      parsedJobs = { jobs: [] };
    }

    parsedJobs.jobs = (parsedJobs.jobs || []).slice(0, requestedCount);
res.json(parsedJobs);
  } catch (error) {
    console.error("Real job matching error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch or rank real jobs" });
  }
});

app.listen(5001, () => {
  console.log("Server running on http://localhost:5001");
});