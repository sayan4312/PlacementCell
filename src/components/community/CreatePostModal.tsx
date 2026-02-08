import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
    X,
    Plus,
    Trash2,
    FileText,
    HelpCircle,
    Code,
    BookOpen,
    Bell,
    MessageSquare,
    Star,
    Building2,
    Briefcase,
    UploadCloud,
    Loader2
} from 'lucide-react';
import apiClient from '../../services/apiClient';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const POST_TYPES = [
    { id: 'interview_experience', label: 'Interview Experience', icon: FileText, description: 'Share your interview journey' },
    { id: 'question', label: 'Question', icon: HelpCircle, description: 'Ask for help or clarification' },
    { id: 'coding_question', label: 'Coding Question', icon: Code, description: 'Share a coding problem' },
    { id: 'resource', label: 'Resource', icon: BookOpen, description: 'Share study materials' },
    { id: 'drive_update', label: 'Drive Update', icon: Bell, description: 'Post drive news/updates' },
    { id: 'discussion', label: 'Discussion', icon: MessageSquare, description: 'Start a general discussion' }
];

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1 = select type, 2 = fill form
    const [postType, setPostType] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [form, setForm] = useState({
        title: '',
        companyName: '',
        role: '',
        year: new Date().getFullYear(),
        batch: '',
        driveType: 'fulltime',
        difficulty: 3,
        result: 'pending',
        content: '',
        tips: [''],
        tags: '',
        rounds: [{ roundName: 'Round 1', roundType: 'technical', questions: [''], description: '' }],
        resources: [{ title: '', url: '', type: 'link' }]
    });

    const handleAddRound = () => {
        setForm({
            ...form,
            rounds: [...form.rounds, { roundName: `Round ${form.rounds.length + 1}`, roundType: 'technical', questions: [''], description: '' }]
        });
    };

    const handleRemoveRound = (index: number) => {
        setForm({
            ...form,
            rounds: form.rounds.filter((_, i) => i !== index)
        });
    };

    const handleAddQuestion = (roundIndex: number) => {
        const newRounds = [...form.rounds];
        newRounds[roundIndex].questions.push('');
        setForm({ ...form, rounds: newRounds });
    };

    const handleRemoveQuestion = (roundIndex: number, qIndex: number) => {
        const newRounds = [...form.rounds];
        newRounds[roundIndex].questions = newRounds[roundIndex].questions.filter((_, i) => i !== qIndex);
        setForm({ ...form, rounds: newRounds });
    };

    const handleQuestionChange = (roundIndex: number, qIndex: number, value: string) => {
        const newRounds = [...form.rounds];
        newRounds[roundIndex].questions[qIndex] = value;
        setForm({ ...form, rounds: newRounds });
    };

    const handleRoundChange = (index: number, field: string, value: string) => {
        const newRounds = [...form.rounds];
        (newRounds[index] as any)[field] = value;
        setForm({ ...form, rounds: newRounds });
    };

    const handleAddTip = () => {
        setForm({ ...form, tips: [...form.tips, ''] });
    };

    const handleTipChange = (index: number, value: string) => {
        const newTips = [...form.tips];
        newTips[index] = value;
        setForm({ ...form, tips: newTips });
    };

    const handleAddResource = () => {
        setForm({ ...form, resources: [...form.resources, { title: '', url: '', type: 'link' }] });
    };

    const handleResourceChange = (index: number, field: string, value: string) => {
        const newResources = [...form.resources];
        (newResources[index] as any)[field] = value;
        setForm({ ...form, resources: newResources });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('postAttachment', file);

            const res = await apiClient.post('/experiences/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Add to resources
            setForm(prev => ({
                ...prev,
                resources: [...prev.resources, {
                    title: file.name,
                    url: res.data.url,
                    type: res.data.type // 'pdf' or 'image'
                }]
            }));
        } catch (err) {
            console.error(err);
            setError('Failed to upload file');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Validation based on post type
        if (!form.title) {
            setError('Title is required');
            return;
        }

        if (['interview_experience', 'drive_update'].includes(postType) && !form.companyName) {
            setError('Company Name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const payload = {
                ...form,
                postType,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                tips: form.tips.filter(Boolean),
                rounds: postType === 'interview_experience' ? form.rounds.map(r => ({
                    ...r,
                    questions: r.questions.filter(Boolean)
                })) : [],
                resources: form.resources.filter(r => (r.title && r.url) || r.type !== 'link') // Allow non-link resources (files)
            };

            await apiClient.post('/experiences', payload);
            onSuccess();
            onClose();
            resetForm();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setPostType('');
        setForm({
            title: '',
            companyName: '',
            role: '',
            year: new Date().getFullYear(),
            batch: '',
            driveType: 'fulltime',
            difficulty: 3,
            result: 'pending',
            content: '',
            tips: [''],
            tags: '',
            rounds: [{ roundName: 'Round 1', roundType: 'technical', questions: [''], description: '' }],
            resources: [{ title: '', url: '', type: 'link' }]
        });
        setError('');
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card w-full max-w-2xl relative border border-white/10 flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10">
                            <Plus className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Create Post</h2>
                            <p className="text-gray-400 text-sm">
                                {step === 1 ? 'Select post type' : `Creating ${POST_TYPES.find(t => t.id === postType)?.label}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { onClose(); resetForm(); }}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {step === 1 ? (
                        /* Step 1: Select Post Type */
                        <div className="grid grid-cols-2 gap-3">
                            {POST_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <motion.button
                                        key={type.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => { setPostType(type.id); setStep(2); }}
                                        className="p-4 rounded-lg border border-white/10 hover:border-indigo-500/50 bg-white/5 text-left transition-all"
                                    >
                                        <Icon className="w-6 h-6 text-indigo-400 mb-2" />
                                        <h4 className="text-white font-medium">{type.label}</h4>
                                        <p className="text-sm text-gray-400">{type.description}</p>
                                    </motion.button>
                                );
                            })}
                        </div>
                    ) : (
                        /* Step 2: Fill Form */
                        <div className="space-y-4">
                            {/* Basic Info */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        placeholder={postType === 'question' ? 'What is your question?' : "e.g., My Virtusa SDE Intern Interview Experience"}
                                        className="input-glass w-full"
                                    />
                                </div>

                                {/* Company & Role - Only for relevant types */}
                                {(['interview_experience', 'drive_update', 'coding_question'].includes(postType)) && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                <Building2 className="w-4 h-4 inline mr-1" />
                                                Company {['interview_experience', 'drive_update'].includes(postType) ? '*' : '(Optional)'}
                                            </label>
                                            <input
                                                type="text"
                                                value={form.companyName}
                                                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                                                placeholder="e.g., Virtusa"
                                                className="input-glass w-full"
                                            />
                                        </div>
                                        {['interview_experience', 'drive_update'].includes(postType) && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    <Briefcase className="w-4 h-4 inline mr-1" />
                                                    Role
                                                </label>
                                                <input
                                                    type="text"
                                                    value={form.role}
                                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                                    placeholder="e.g., SDE Intern"
                                                    className="input-glass w-full"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Batch & Type - Only for Interview/Drive */}
                                {['interview_experience', 'drive_update'].includes(postType) && (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Batch</label>
                                            <select
                                                value={form.batch}
                                                onChange={(e) => setForm({ ...form, batch: e.target.value })}
                                                className="input-glass w-full"
                                            >
                                                <option value="">Select</option>
                                                <option value="2024">2024</option>
                                                <option value="2025">2025</option>
                                                <option value="2026">2026</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                                            <select
                                                value={form.driveType}
                                                onChange={(e) => setForm({ ...form, driveType: e.target.value })}
                                                className="input-glass w-full"
                                            >
                                                <option value="internship">Internship</option>
                                                <option value="fulltime">Full-time</option>
                                                <option value="both">Both</option>
                                            </select>
                                        </div>
                                        {postType === 'interview_experience' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Result</label>
                                                <select
                                                    value={form.result}
                                                    onChange={(e) => setForm({ ...form, result: e.target.value })}
                                                    className="input-glass w-full"
                                                >
                                                    <option value="selected">Selected</option>
                                                    <option value="rejected">Rejected</option>
                                                    <option value="pending">Pending</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Difficulty */}
                                {postType === 'interview_experience' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <button
                                                    key={n}
                                                    onClick={() => setForm({ ...form, difficulty: n })}
                                                    className={`p-2 rounded-lg transition-all ${form.difficulty >= n
                                                        ? 'text-yellow-400'
                                                        : 'text-gray-600 hover:text-gray-400'
                                                        }`}
                                                >
                                                    <Star className={`w-6 h-6 ${form.difficulty >= n ? 'fill-yellow-400' : ''}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Rounds (for interview_experience) */}
                            {postType === 'interview_experience' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-300">Interview Rounds</label>
                                        <button
                                            type="button"
                                            onClick={handleAddRound}
                                            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                        >
                                            <Plus className="w-4 h-4" /> Add Round
                                        </button>
                                    </div>

                                    {form.rounds.map((round, rIndex) => (
                                        <div key={rIndex} className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={round.roundName}
                                                    onChange={(e) => handleRoundChange(rIndex, 'roundName', e.target.value)}
                                                    placeholder="Round Name"
                                                    className="input-glass flex-1"
                                                />
                                                <select
                                                    value={round.roundType}
                                                    onChange={(e) => handleRoundChange(rIndex, 'roundType', e.target.value)}
                                                    className="input-glass"
                                                >
                                                    <option value="aptitude">Aptitude</option>
                                                    <option value="coding">Coding</option>
                                                    <option value="technical">Technical</option>
                                                    <option value="hr">HR</option>
                                                    <option value="group_discussion">GD</option>
                                                </select>
                                                {form.rounds.length > 1 && (
                                                    <button onClick={() => handleRemoveRound(rIndex)} className="text-red-400 hover:text-red-300">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400">Questions Asked</label>
                                                {round.questions.map((q, qIndex) => (
                                                    <div key={qIndex} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={q}
                                                            onChange={(e) => handleQuestionChange(rIndex, qIndex, e.target.value)}
                                                            placeholder={`Question ${qIndex + 1}`}
                                                            className="input-glass flex-1 text-sm"
                                                        />
                                                        {round.questions.length > 1 && (
                                                            <button onClick={() => handleRemoveQuestion(rIndex, qIndex)} className="text-red-400 hover:text-red-300">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddQuestion(rIndex)}
                                                    className="text-xs text-indigo-400 hover:text-indigo-300"
                                                >
                                                    + Add Question
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    {postType === 'interview_experience' ? 'Overall Experience' : 'Content'}
                                </label>
                                <textarea
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    placeholder="Share your detailed experience, tips, and insights..."
                                    rows={4}
                                    className="input-glass w-full resize-none"
                                />
                            </div>

                            {/* Tips */}
                            {postType === 'interview_experience' && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-medium text-gray-300">Tips for Others</label>
                                        <button
                                            type="button"
                                            onClick={handleAddTip}
                                            className="text-xs text-indigo-400 hover:text-indigo-300"
                                        >
                                            + Add Tip
                                        </button>
                                    </div>
                                    {form.tips.map((tip, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            value={tip}
                                            onChange={(e) => handleTipChange(i, e.target.value)}
                                            placeholder={`Tip ${i + 1}`}
                                            className="input-glass w-full mb-2"
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={form.tags}
                                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                                    placeholder="e.g., DSA, OOPS, SQL"
                                    className="input-glass w-full"
                                />
                            </div>

                            {/* Resources - now attached to various types, not just resource/interview */}
                            {(['resource', 'interview_experience', 'drive_update', 'coding_question'].includes(postType)) && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-medium text-gray-300">Resources & Attachments</label>
                                        <div className="flex gap-2">
                                            <label className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1">
                                                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                                                <UploadCloud className="w-4 h-4" /> Upload File
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleAddResource}
                                                className="text-xs text-indigo-400 hover:text-indigo-300"
                                            >
                                                + Add Link
                                            </button>
                                        </div>
                                    </div>
                                    {loading && <div className="text-xs text-indigo-400 flex items-center gap-1 mb-2"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</div>}
                                    {form.resources.map((res, i) => (
                                        <div key={i} className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={res.title}
                                                onChange={(e) => handleResourceChange(i, 'title', e.target.value)}
                                                placeholder={res.type !== 'link' ? "File Name" : "Resource Title"}
                                                className="input-glass flex-1"
                                                readOnly={res.type !== 'link'}
                                            />
                                            {res.type === 'link' && (
                                                <input
                                                    type="url"
                                                    value={res.url}
                                                    onChange={(e) => handleResourceChange(i, 'url', e.target.value)}
                                                    placeholder="URL"
                                                    className="input-glass flex-1"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 shrink-0">
                    {step === 2 && (
                        <button
                            onClick={() => setStep(1)}
                            className="btn-secondary"
                        >
                            Back
                        </button>
                    )}
                    <div className="ml-auto flex gap-3">
                        <button onClick={() => { onClose(); resetForm(); }} className="btn-secondary">
                            Cancel
                        </button>
                        {step === 2 && (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? 'Posting...' : 'Post'}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default CreatePostModal;
