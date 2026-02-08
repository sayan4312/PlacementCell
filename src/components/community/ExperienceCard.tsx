import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowBigUp,
    ArrowBigDown,
    MessageCircle,
    Bookmark,
    CheckCircle2,
    Clock,
    Star,
    Building2,
    Briefcase,
    Flag
} from 'lucide-react';

interface ExperienceCardProps {
    experience: {
        _id: string;
        title: string;
        companyName: string;
        role?: string;
        postType: string;
        difficulty?: number;
        result?: string;
        voteScore: number;
        upvotes: string[];
        downvotes: string[];
        commentCount: number;
        user: { _id: string; name: string; role?: string };
        createdAt: string;
        isVerified?: boolean;
        tags?: string[];
        savedBy?: string[];
    };
    currentUserId?: string;
    onVote: (id: string, voteType: 'up' | 'down') => void;
    onSave: (id: string) => void;
    onClick: (id: string) => void;
    onReport?: (id: string) => void;
    onUserClick?: (userId: string) => void;
}

const ExperienceCard: React.FC<ExperienceCardProps> = ({
    experience,
    currentUserId,
    onVote,
    onSave,
    onClick,
    onReport,
    onUserClick
}) => {
    const {
        _id,
        title,
        companyName,
        role,
        postType,
        difficulty,
        result,
        voteScore,
        upvotes,
        downvotes,
        commentCount,
        user,
        createdAt,
        isVerified,
        tags,
        savedBy
    } = experience;

    const hasUpvoted = currentUserId && upvotes?.includes(currentUserId);
    const hasDownvoted = currentUserId && downvotes?.includes(currentUserId);
    const isSaved = currentUserId && savedBy?.includes(currentUserId);

    const getPostTypeBadge = () => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            interview_experience: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', label: 'Interview' },
            question: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Question' },
            coding_question: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Coding' },
            resource: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Resource' },
            drive_update: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Update' },
            discussion: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Discussion' }
        };
        const badge = badges[postType] || badges.discussion;
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    const getResultBadge = () => {
        if (!result || postType !== 'interview_experience') return null;
        const badges: Record<string, { bg: string; text: string }> = {
            selected: { bg: 'bg-green-500/20', text: 'text-green-400' },
            rejected: { bg: 'bg-red-500/20', text: 'text-red-400' },
            pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
            waiting: { bg: 'bg-blue-500/20', text: 'text-blue-400' }
        };
        const badge = badges[result] || badges.pending;
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text} capitalize`}>
                {result}
            </span>
        );
    };

    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.005 }}
            className="glass-card p-4 border border-white/10 cursor-pointer transition-all hover:border-indigo-500/30"
            onClick={() => onClick(_id)}
        >
            <div className="flex gap-3">
                {/* Vote Column */}
                <div className="flex flex-col items-center gap-1 min-w-[40px]">
                    <button
                        onClick={(e) => { e.stopPropagation(); onVote(_id, 'up'); }}
                        className={`p-1 rounded transition-colors ${hasUpvoted ? 'text-indigo-400 bg-indigo-500/20' : 'text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
                    >
                        <ArrowBigUp className="w-6 h-6" />
                    </button>
                    <span className={`text-sm font-bold ${voteScore > 0 ? 'text-indigo-400' : voteScore < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {voteScore}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onVote(_id, 'down'); }}
                        className={`p-1 rounded transition-colors ${hasDownvoted ? 'text-red-400 bg-red-500/20' : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'}`}
                    >
                        <ArrowBigDown className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0">
                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {getPostTypeBadge()}
                        {getResultBadge()}
                        {isVerified && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                        )}
                        {voteScore >= 10 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
                                🔥 Hot
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-semibold text-lg mb-1 truncate hover:text-indigo-400 transition-colors">
                        {title}
                    </h3>

                    {/* Company & Role */}
                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span className="text-indigo-400 font-medium">#{companyName}</span>
                        </span>
                        {role && (
                            <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {role}
                            </span>
                        )}
                        {difficulty && (
                            <span className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < difficulty ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                                ))}
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    {tags && tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                            {tags.slice(0, 4).map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 rounded text-xs bg-white/5 text-gray-400">
                                    {tag}
                                </span>
                            ))}
                            {tags.length > 4 && (
                                <span className="text-xs text-gray-500">+{tags.length - 4} more</span>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                            <span
                                onClick={(e) => {
                                    if (user?._id) {
                                        e.stopPropagation();
                                        onUserClick?.(user._id);
                                    }
                                }}
                                className="hover:text-indigo-400 hover:underline cursor-pointer transition-colors"
                            >
                                by {user?.name || 'Anonymous'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(createdAt)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                {commentCount}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); onSave(_id); }}
                                className={`p-1 rounded transition-colors ${isSaved ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400'}`}
                            >
                                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onReport?.(_id); }}
                                className="p-1 rounded transition-colors text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                                title="Report post"
                            >
                                <Flag className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ExperienceCard;
