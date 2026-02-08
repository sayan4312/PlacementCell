import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import {
    FileText,
    Briefcase,
    Sparkles,
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp,
    Lightbulb,
    Target,
    Zap,
    Upload,
    File,
    X
} from 'lucide-react';
import apiClient from '../../../services/apiClient';


GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface SkillsMatch {
    technical: number;
    experience: number;
    education: number;
    softSkills: number;
}

interface ATSAnalysis {
    atsScore: number;
    summary: string;
    matchedKeywords: string[];
    missingKeywords: string[];
    strengths: string[];
    improvements: string[];
    skillsMatch: SkillsMatch;
    formatIssues: string[];
    recommendation: string;
}

const ATSCheckerSection: React.FC = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');


    // Resume state
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [resumeText, setResumeText] = useState('');
    const [parsingPdf, setParsingPdf] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Extract text from PDF
    const extractTextFromPdf = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        return fullText;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadedFile(file);
        setError('');
        setResumeText('');

        if (file.type === 'application/pdf') {
            setParsingPdf(true);
            try {
                const text = await extractTextFromPdf(file);
                setResumeText(text);
            } catch (err) {
                console.error('PDF parsing error:', err);
                setError('Failed to parse PDF. Please try a different file.');
            } finally {
                setParsingPdf(false);
            }
        } else if (file.type === 'text/plain') {
            const text = await file.text();
            setResumeText(text);
        } else {
            setError('Please upload a PDF or TXT file');
        }
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        setResumeText('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAnalyze = async () => {
        if (!resumeText.trim()) {
            setError('Please upload your resume');
            return;
        }

        if (!jobDescription.trim()) {
            setError('Please provide the job description');
            return;
        }

        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const res = await apiClient.post('/ats/analyze', {
                resumeText,
                jobDescription
            }, {
                timeout: 60000 // 60 seconds timeout for AI analysis
            });
            setAnalysis(res.data.analysis);
        } catch (err: any) {
            console.error('ATS Analysis error:', err);
            setError(err.response?.data?.message || 'Failed to analyze. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return 'from-green-500 to-emerald-500';
        if (score >= 60) return 'from-yellow-500 to-amber-500';
        if (score >= 40) return 'from-orange-500 to-amber-500';
        return 'from-red-500 to-rose-500';
    };

    const SkillBar = ({ label, value }: { label: string; value: number }) => (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className={getScoreColor(value)}>{value}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full bg-gradient-to-r ${getScoreGradient(value)} rounded-full`}
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        ATS Resume Checker
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Upload your resume and job description to check ATS compatibility
                    </p>
                </div>
            </div>

            {/* Main Input Section - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Resume Upload */}
                <div className="glass-card p-5 space-y-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        Upload Resume
                    </label>

                    {!uploadedFile ? (
                        /* Upload Area */
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-white/5 transition-all min-h-[200px] flex flex-col items-center justify-center"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".pdf,.txt"
                                className="hidden"
                            />
                            <Upload className="w-10 h-10 text-gray-400 mb-3" />
                            <p className="text-gray-300 font-medium">
                                Click to upload resume
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                PDF or TXT files
                            </p>
                        </div>
                    ) : (
                        /* File Uploaded */
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <File className="w-5 h-5 text-green-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-green-400 font-medium truncate">{uploadedFile.name}</p>
                                    <p className="text-xs text-gray-400">
                                        {parsingPdf ? 'Extracting text...' : `${resumeText.length} characters extracted`}
                                    </p>
                                </div>
                                <button
                                    onClick={handleRemoveFile}
                                    className="p-1 hover:bg-white/10 rounded"
                                >
                                    <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                                </button>
                            </div>

                            {parsingPdf && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400 mr-2" />
                                    <span className="text-sm text-gray-400">Extracting text from PDF...</span>
                                </div>
                            )}

                            {resumeText && !parsingPdf && (
                                <div className="bg-white/5 rounded-lg p-3 max-h-[150px] overflow-auto">
                                    <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                                        {resumeText.slice(0, 500)}...
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Job Description */}
                <div className="glass-card p-5 space-y-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Briefcase className="w-4 h-4 text-purple-400" />
                        Job Description
                    </label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here...

Example:
We are looking for a Software Engineer with:
- 2+ years experience in React and Node.js
- Strong knowledge of JavaScript and TypeScript
- Experience with cloud services (AWS/GCP)
- Good communication skills"
                        className="input-glass min-h-[250px] resize-none text-sm"
                    />
                    <p className="text-xs text-gray-500 text-right">
                        {jobDescription.length} characters
                    </p>
                </div>
            </div>

            {/* Analyze Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleAnalyze}
                    disabled={loading || !resumeText.trim() || !jobDescription.trim() || parsingPdf}
                    className="btn-primary flex items-center gap-2 px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Analyzing with AI...
                        </>
                    ) : (
                        <>
                            <Target className="w-5 h-5" />
                            Check ATS Score
                        </>
                    )}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-center"
                >
                    {error}
                </motion.div>
            )}

            {/* Results Section */}
            <AnimatePresence>
                {analysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Score Card */}
                        <div className="glass-card p-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                {/* Score Circle */}
                                <div className="relative">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/10" />
                                        <motion.circle
                                            cx="64" cy="64" r="56"
                                            stroke="url(#scoreGradient)"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={352}
                                            initial={{ strokeDashoffset: 352 }}
                                            animate={{ strokeDashoffset: 352 - (352 * analysis.atsScore) / 100 }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                        />
                                        <defs>
                                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor={analysis.atsScore >= 60 ? '#22c55e' : '#ef4444'} />
                                                <stop offset="100%" stopColor={analysis.atsScore >= 60 ? '#10b981' : '#f97316'} />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-3xl font-bold ${getScoreColor(analysis.atsScore)}`}>{analysis.atsScore}%</span>
                                        <span className="text-xs text-gray-400">ATS Score</span>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="flex-1 text-center md:text-left">
                                    <h4 className="text-xl font-semibold text-white mb-2">Analysis Complete</h4>
                                    <p className="text-gray-400">{analysis.summary}</p>
                                    <p className="mt-3 text-sm">
                                        <span className={`font-medium ${getScoreColor(analysis.atsScore)}`}>{analysis.recommendation}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Skills Breakdown */}
                        <div className="glass-card p-6">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                Skills Match Breakdown
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SkillBar label="Technical Skills" value={analysis.skillsMatch.technical} />
                                <SkillBar label="Experience Match" value={analysis.skillsMatch.experience} />
                                <SkillBar label="Education" value={analysis.skillsMatch.education} />
                                <SkillBar label="Soft Skills" value={analysis.skillsMatch.softSkills} />
                            </div>
                        </div>

                        {/* Keywords */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="glass-card p-4">
                                <h5 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Matched Keywords ({analysis.matchedKeywords.length})
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.matchedKeywords.length > 0 ? (
                                        analysis.matchedKeywords.map((keyword, i) => (
                                            <span key={i} className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs">{keyword}</span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 text-sm">No keywords matched</span>
                                    )}
                                </div>
                            </div>

                            <div className="glass-card p-4">
                                <h5 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    Missing Keywords ({analysis.missingKeywords.length})
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.missingKeywords.length > 0 ? (
                                        analysis.missingKeywords.map((keyword, i) => (
                                            <span key={i} className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-xs">{keyword}</span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 text-sm">All keywords matched!</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Strengths & Improvements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="glass-card p-4">
                                <h5 className="text-sm font-medium text-indigo-400 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Strengths
                                </h5>
                                <ul className="space-y-2">
                                    {analysis.strengths.length > 0 ? (
                                        analysis.strengths.map((s, i) => (
                                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                <span className="text-green-400 mt-1">✓</span>{s}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-gray-500 text-sm">No specific strengths identified</li>
                                    )}
                                </ul>
                            </div>

                            <div className="glass-card p-4">
                                <h5 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4" />
                                    Suggestions
                                </h5>
                                <ul className="space-y-2">
                                    {analysis.improvements.length > 0 ? (
                                        analysis.improvements.map((imp, i) => (
                                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                <span className="text-yellow-400 mt-1">→</span>{imp}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-gray-500 text-sm">No improvements needed!</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {analysis.formatIssues && analysis.formatIssues.length > 0 && (
                            <div className="glass-card p-4">
                                <h5 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Format Issues
                                </h5>
                                <ul className="space-y-2">
                                    {analysis.formatIssues.map((issue, i) => (
                                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                            <span className="text-orange-400 mt-1">⚠</span>{issue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ATSCheckerSection;
