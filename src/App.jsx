import { useState,useEffect } from "react";
import {
  Upload,
  MapPin,
  Briefcase,
  Sparkles,
  FileText,
  ArrowRight,
  ShieldCheck,
  Search,
  WandSparkles,
  CheckCircle2,
  Globe2,
  Loader2,
  ExternalLink,
  Mail,
} from "lucide-react";
import "./index.css";

export default function App() {
  const [resume, setResume] = useState(null);
  const [resumePreview, setResumePreview] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [profile, setProfile] = useState(null);

  const [country, setCountry] = useState("United States");
  const [city, setCity] = useState("Dallas");
  const [jobCount, setJobCount] = useState("5");
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [jobError, setJobError] = useState("");
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    if (showResults || selectedCoverLetter) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showResults, selectedCoverLetter]);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];

    setResume(file);
    setResumePreview("");
    setUploadError("");
    setProfile(null);
    setMatchedJobs([]);
    setShowResults(false);
    setJobError("");

    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch("http://localhost:5001/upload-resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResumePreview(data.textPreview);
      setProfile(data.profile);
    } catch (error) {
      setUploadError(error.message);
    }
  };

  const handleFindJobs = async () => {
    if (!profile) {
      setJobError("Please upload and parse your resume first.");
      return;
    }

    setLoading(true);
    setShowResults(false);
    setMatchedJobs([]);
    setJobError("");

    try {
      const response = await fetch("http://localhost:5001/match-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
          country,
          city,
          jobCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate matching jobs");
      }

      setMatchedJobs(data.jobs || []);
      setShowResults(true);
    } catch (error) {
      setJobError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-slate-50" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles size={23} />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">HireMatch AI</p>
            <p className="text-xs text-slate-900/45">Resume-to-Job Agent</p>
          </div>
        </div>

      
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-10 grid lg:grid-cols-2 gap-12 items-start">
        <section className="pt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-600 mb-6">
            <ShieldCheck size={16} />
            AI-powered job search agent for modern applicants
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            Upload your resume.
            <span className="block text-blue-600">
  Get matched jobs.
</span>
          </h1>

          <p className="mt-6 text-lg text-slate-900/65 max-w-xl leading-8">
            Choose your target city and country, select how many jobs you want,
            and let the agent return matching roles, apply links, and tailored
            cover letters.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleFindJobs}
              className="group rounded-2xl bg-blue-600 text-white px-6 py-4 font-semibold shadow-xl shadow-blue-500/30 hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              Start Matching
              <ArrowRight className="group-hover:translate-x-1 transition" size={18} />
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
            {[
              ["Resume Parsing", "Extract skills"],
              ["Job Ranking", "Score matches"],
              ["Cover Letters", "Auto-generate"],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white/5 p-4 backdrop-blur">
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-slate-900/50 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/70">
        <div className="rounded-[1.5rem] bg-white border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/15 flex items-center justify-center">
                <FileText className="text-blue-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Job Search Setup</h2>
                <p className="text-slate-900/50 text-sm">
                  Upload resume and choose preferences
                </p>
              </div>
            </div>

            <label className="block">
              <div className="border-2 border-dashed border-blue-400/30 rounded-3xl p-8 text-center hover:bg-blue-500/10 transition cursor-pointer group">
                <Upload className="mx-auto text-blue-300 mb-4 group-hover:scale-110 transition" size={42} />
                <p className="font-semibold">
                  {resume ? resume.name : "Upload Resume"}
                </p>
                <p className="text-sm text-slate-900/45 mt-2">
                  PDF or DOCX up to 5MB
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                />
              </div>
            </label>

            {resumePreview && (
              <div className="mt-4 rounded-2xl border border-green-400/20 bg-green-500/10 p-4">
                <p className="text-sm font-semibold text-green-300">
                  Resume parsed successfully
                </p>
                <p className="mt-2 text-xs text-slate-900/55 line-clamp-4">
                  {resumePreview}
                </p>
              </div>
            )}

            {profile && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 max-h-[350px] overflow-y-auto">
              <p className="text-sm font-semibold text-blue-700">
                  AI Extracted Profile
                </p>

                <div className="mt-3 space-y-3 text-sm text-slate-900/70">
                  <p>
                    <span className="text-slate-900 font-semibold">Name:</span>{" "}
                    {profile.name || "Not found"}
                  </p>

                  <p>
                    <span className="text-slate-900 font-semibold">Email:</span>{" "}
                    {profile.email || "Not found"}
                  </p>

                  <div>
                    <p className="text-slate-900 font-semibold mb-1">Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {(profile.skills || []).map((skill) => (
                        <span key={skill} className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-900 font-semibold mb-1">Target Roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {(profile.targetRoles || []).map((role) => (
                        <span key={role} className="rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-medium">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-900 font-semibold mb-1">Certifications:</p>
                    <div className="flex flex-wrap gap-2">
                      {(profile.certifications || []).map((cert) => (
                        <span key={cert} className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                <p className="text-sm font-semibold text-red-300">
                  {uploadError}
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div>
              <label className="text-sm font-medium text-slate-700">Country</label>
                <div className="mt-2 flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-300 px-4 py-3">
                  <Globe2 size={18} className="text-blue-300" />
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="bg-transparent outline-none w-full placeholder:text-slate-900/35"
                  />
                </div>
              </div>

              <div>
              <label className="text-sm font-medium text-slate-700">City</label>
                <div className="mt-2 flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-300 px-4 py-3">
                  <MapPin size={18} className="text-purple-300" />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-transparent outline-none w-full placeholder:text-slate-900/35"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
            <label className="text-sm font-medium text-slate-700">Number of jobs</label>
              <div className="mt-2 flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-300 px-4 py-3">
                <Briefcase size={18} className="text-green-300" />
                <select
  value={jobCount}
  onChange={(e) => setJobCount(e.target.value)}
  className="bg-transparent outline-none w-full text-slate-900"
>
  <option className="text-black" value="5">Top 5 jobs</option>
  <option className="text-black" value="10">Top 10 jobs</option>
</select>
              </div>
            </div>

            <button
              onClick={handleFindJobs}
              className="mt-8 w-full rounded-2xl bg-blue-600 text-white py-4 font-bold shadow-xl shadow-purple-500/20 hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Finding matches...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Find Matching Jobs
                </>
              )}
            </button>
          </div>

          {jobError && (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
              <p className="text-sm font-semibold text-red-300">{jobError}</p>
            </div>
          )}

{showResults && (
  <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm px-6 py-10 overflow-x-auto overflow-y-hidden">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-white">
            AI Recommended Job Targets
          </p>
          <p className="text-sm text-white/70">
            Scroll left and right to review matched jobs.
          </p>
        </div>

        <button
          onClick={() => setShowResults(false)}
          className="rounded-xl bg-white/10 px-4 py-2 text-white hover:bg-white/20"
        >
          Back to Search
        </button>
      </div>

      <div className="flex gap-5 overflow-x-scroll overflow-y-hidden pb-6 max-w-full overscroll-contain">
        {matchedJobs.map((job, index) => (
          <div
            key={`${job.title}-${index}`}
            className="shrink-0 w-[390px] max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <p className="font-semibold">{job.title}</p>
                </div>

                <p className="text-sm text-slate-500 mt-1">
                  {job.company} • {job.location}
                </p>

                <p className="text-xs text-slate-600 mt-3">
                  {job.whyMatch}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {(job.skillsMatched || []).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <span className="rounded-full bg-green-100 text-green-800 font-bold px-3 py-1 text-sm">
                {job.matchScore}%
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={job.applyLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-slate-100 text-slate-700 px-4 py-2 text-sm hover:bg-slate-200 transition"
              >
                <ExternalLink size={14} />
                Apply
              </a>

              <button
                onClick={() => setSelectedCoverLetter(job)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-500 transition"
              >
                <Mail size={14} />
                Cover Letter
              </button>
            </div>

            {(job.coverLetter || job.coverLetterSummary) && (
              <p className="mt-3 text-xs text-slate-600 line-clamp-6">
                {job.coverLetter || job.coverLetterSummary}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
)}
             
          {!loading && !showResults && !jobError && (
            <div className="mt-6 rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4 flex items-center gap-3">
              <WandSparkles className="text-purple-300" />
              <p className="text-sm text-slate-900/70">
                Upload your resume, then click Find Matching Jobs to generate AI-ranked job recommendations.
              </p>
            </div>
          )}
        </section>
        </main>

{selectedCoverLetter && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
    <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            Tailored Cover Letter
          </h2>

          <p className="text-slate-900/50 mt-1">
            {selectedCoverLetter.title} • {selectedCoverLetter.company}
          </p>
        </div>

        <button
          onClick={() => setSelectedCoverLetter(null)}
          className="rounded-xl border border-slate-200 px-3 py-1 hover:bg-white/10"
        >
          ✕
        </button>
      </div>

      <div className="mt-6 rounded-2xl bg-white/5 border border-slate-200 p-5">
        <p className="text-slate-900/80 leading-7">
        {selectedCoverLetter.coverLetter || selectedCoverLetter.coverLetterSummary}
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              selectedCoverLetter.coverLetter ||
              selectedCoverLetter.coverLetterSummary ||
              ""
            );
          
            setCopyMessage("Cover letter copied!");
          
            setTimeout(() => {
              setCopyMessage("");
            }, 2000);
          }}
          className="rounded-xl bg-blue-500 px-4 py-2 font-semibold hover:bg-blue-400"
        >
          Copy Cover Letter
        </button>

        <a
          href={selectedCoverLetter.applyLink}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-purple-500 px-4 py-2 font-semibold hover:bg-purple-400"
        >
          Apply Now
        </a>
      </div>
      {copyMessage && (
  <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300">
    {copyMessage}
  </div>
)}
    </div>
  </div>
)}

</div>
);
}