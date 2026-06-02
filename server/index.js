const express = require("express");// creates backend server
const cors = require("cors");//allow frontend to call backend APIs
const multer = require("multer");//Handle file upload from frontend
const pdfParse = require("pdf-parse");//Reades text from PDF resume
const axios = require("axios");//Call external API JSearch
const { GoogleGenerativeAI } = require("@google/generative-ai");//Connect backend to Gemini
require("dotenv").config();//Load API keys from .env
const mammoth = require("mammoth");//Read text if file is DOCX

const app = express();//Create express app
const upload = multer({ storage: multer.memoryStorage() });//Stores uploaded resume in memory

app.use(cors());//Allow front and backend to communicate.
app.use(express.json());//Let's backend read JSON body from requests

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);//Create Gemini key from API key

app.get("/", (req, res) => {
  res.send("Resume Job Match Agent backend is running");
});// This confirms backend is running good

app.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No resume file uploaded" });//if no file return error

    let resumeText = "";//empty var to store extracted resume

if (req.file.mimetype === "application/pdf") {//check if uploaded file is pdf
  const data = await pdfParse(req.file.buffer);
  resumeText = data.text;//read text from pdf
} else if (//check if file is docx
  req.file.mimetype ===
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
) {
  const data = await mammoth.extractRawText({ buffer: req.file.buffer });
  resumeText = data.value;
} else {//reject unsupported file type
  return res.status(400).json({
    error: "Unsupported file type. Please upload PDF or DOCX.",
  });
}

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });//selects gemini model and json response
//below telling gemini its role
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
`;//sending extracted resume text to Gemini

    const result = await model.generateContent(prompt);//sending prompt to gemini
    const aiText = result.response.text();//gets gemini text response

    let parsedProfile;//creates variable for cleaned profile
    try {
      parsedProfile = JSON.parse(aiText.replace(/```json/g, "").replace(/```/g, "").trim());
      parsedProfile.skills = (parsedProfile.skills || []).map((item) =>
  typeof item === "string" ? item : item.name || JSON.stringify(item)
);//converting json string to JS obj

parsedProfile.certifications = (parsedProfile.certifications || []).map((item) =>
  typeof item === "string"
    ? item
    : item.name
    ? `${item.name}${item.date ? ` (${item.date})` : ""}`
    : JSON.stringify(item)
);//make sure skills are always strings

parsedProfile.targetRoles = (parsedProfile.targetRoles || []).map((item) =>
  typeof item === "string" ? item : item.name || item.title || JSON.stringify(item)
);//make sure target roles are always strings
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
    }//If Gemini JSON fails, return empty safe structure instead of crashing.

    res.json({
      fileName: req.file.originalname,
      textPreview: resumeText.slice(0, 700),
      fullTextLength: resumeText.length,
      profile: parsedProfile,
    });//Sends filename, preview text, text length, and extracted AI profile to frontend.
  } catch (error) {
    console.error("Resume parsing/Gemini error:", error);
    res.status(500).json({ error: "Failed to parse resume or extract profile" });
  }
});

app.post("/match-jobs", async (req, res) => {//create API route for finding matching jobs
  try {
    const { profile, country, city, jobCount } = req.body;//gets profile and search pref from frontend

    if (!profile) {
      return res.status(400).json({ error: "Candidate profile is required" });
    }//stop if profile is missing

    const targetRole =
      profile.targetRoles?.[0] ||
      "Data Engineer";//Uses first target role from resume. If missing, defaults to Data Engineer.

    const searchQuery = `${targetRole} in ${city}`;//create search query like DE in Dallas

    const randomPage = Math.floor(Math.random() * 3) + 1;//randomly pick 1 2 3 so results refresh

const jobResponse = await axios.get("https://jsearch.p.rapidapi.com/search", {//calling jsearch API
  params: {
    query: searchQuery,
    page: String(randomPage),
    num_pages: "2",
    country: "us",
    date_posted: "all",
  },//sending search parameters
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      },//authenticate with rapid API key
    });

    const requestedCount = Math.min(
  Math.max(Number(jobCount) || 5, 5),
  20
);//limit job count betw 5 to 20
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
    }));//Takes jobs from JSearch and formats them.

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });
//below gemini ranks jobs
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
`;//send candidate profile and read jobs to gemini

    const result = await model.generateContent(prompt);
    const aiText = result.response.text();//call gemini

    let parsedJobs;
    try {
      parsedJobs = JSON.parse(aiText.replace(/```json/g, "").replace(/```/g, "").trim());//converts gemini response into js obj
    } catch (jsonError) {
      console.error("Job JSON parse error:", jsonError);
      console.error("Raw Gemini response:", aiText);
      parsedJobs = { jobs: [] };
    }//if jsearch or gemini fail we get clear msg

    parsedJobs.jobs = (parsedJobs.jobs || []).slice(0, requestedCount);
res.json(parsedJobs);
  } catch (error) {
    console.error("Real job matching error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch or rank real jobs" });
  }
});//start server at 5001

app.listen(5001, () => {
  console.log("Server running on http://localhost:5001");
});