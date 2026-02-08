import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Plus,
    TrendingUp,
    Clock,
    ArrowUp,
    Building2,
    Trophy,
    Bookmark,
    PenSquare,
    Home,
    ChevronRight,
    Flame,
    Menu,
    Flag,
    X
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import ExperienceCard from './ExperienceCard';
import CreatePostModal from './CreatePostModal';

interface CommunityHomeProps {
    currentUserId?: string;
}

interface UserProfile {
    user: { _id: string; name: string; role: string; createdAt: string };
    stats: {
        totalPosts: number;
        totalVotes: number;
        interviewPosts: number;
        resourcePosts: number;
        codingPosts: number;
        badges: string[];
    };
    recentPosts: any[];
}

type ViewType = 'home' | 'companies' | 'trending' | 'leaderboard' | 'saved' | 'my-posts' | 'company-view' | 'post-detail' | 'user-profile';
type SortType = 'trending' | 'new' | 'top';

const CommunityHome: React.FC<CommunityHomeProps> = ({ currentUserId }) => {
    const [experiences, setExperiences] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ViewType>('home');
    const [sort, setSort] = useState<SortType>('trending');
    const [searchQuery, setSearchQuery] = useState('');
    const [insights, setInsights] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [viewedUser, setViewedUser] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [filters, setFilters] = useState({
        postType: '',
        batch: '',
        driveType: ''
    });

    // Mobile state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileTrendingOpen, setMobileTrendingOpen] = useState(false);

    // Fetch experiences
    const fetchExperiences = async () => {
        setLoading(true);
        try {
            let url = '/experiences';
            const params = new URLSearchParams();
            params.append('sort', sort);
            if (searchQuery) params.append('search', searchQuery);
            if (filters.postType) params.append('postType', filters.postType);
            if (filters.batch) params.append('batch', filters.batch);
            if (filters.driveType) params.append('driveType', filters.driveType);

            if (view === 'saved') {
                url = '/experiences/saved';
            } else if (view === 'my-posts') {
                url = '/experiences/my-posts';
            } else if (view === 'company-view' && selectedCompany) {
                url = `/experiences/company/${encodeURIComponent(selectedCompany)}`;
            }

            const res = await apiClient.get(`${url}?${params.toString()}`);
            // Company API returns {posts: [...]} instead of {experiences: [...]}
            setExperiences(res.data.experiences || res.data.posts || []);
        } catch (err) {
            console.error('Error fetching experiences:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch insights
    const fetchInsights = async () => {
        try {
            const res = await apiClient.get('/experiences/insights');
            setInsights(res.data);
        } catch (err) {
            console.error('Error fetching insights:', err);
        }
    };

    // Fetch leaderboard
    const fetchLeaderboard = async () => {
        try {
            const res = await apiClient.get('/experiences/leaderboard');
            setLeaderboard(res.data.leaderboard || []);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        }
    };

    // Fetch companies
    const fetchCompanies = async () => {
        try {
            const res = await apiClient.get('/experiences/companies');
            setCompanies(res.data.companies || []);
        } catch (err) {
            console.error('Error fetching companies:', err);
        }
    };

    const fetchUserProfile = async (userId: string) => {
        setLoading(true);
        try {
            console.log('Fetching profile for:', userId);
            const res = await apiClient.get(`/experiences/user/${userId}/profile`);
            console.log('Profile data:', res.data);
            setUserProfile(res.data);
            setView('user-profile');
        } catch (err) {
            console.error('Error fetching user profile:', err);
            // alert('Failed to load user profile. Check console for details.'); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExperiences();
        fetchInsights();
    }, [view, sort, searchQuery, filters]);

    useEffect(() => {
        if (view === 'leaderboard') fetchLeaderboard();
        if (view === 'companies') fetchCompanies();
    }, [view]);

    // Handle vote
    const handleVote = async (id: string, voteType: 'up' | 'down') => {
        try {
            await apiClient.patch(`/experiences/${id}/vote`, { voteType });
            fetchExperiences();
        } catch (err) {
            console.error('Error voting:', err);
        }
    };

    // Handle save
    const handleSave = async (id: string) => {
        try {
            await apiClient.patch(`/experiences/${id}/save`);
            fetchExperiences();
        } catch (err) {
            console.error('Error saving:', err);
        }
    };

    // Handle click (navigate to detail view)
    const handleClick = (id: string) => {
        const post = experiences.find(exp => exp._id === id);
        if (post) {
            setSelectedPost(post);
            setView('post-detail');
        }
    };

    const handleReport = async (id: string) => {
        if (!window.confirm('Are you sure you want to report this post as inappropriate?')) return;
        try {
            await apiClient.patch(`/experiences/${id}/report`);
            // Optional: Optimistically hide or show reported status. For now, alert is fine for MVP.
            alert('Post reported. Thank you for keeping the community safe.');
        } catch (err) {
            console.error('Error reporting post:', err);
            alert('Failed to report post.');
        }
    };

    const handleUserClick = (userId: string) => {
        setViewedUser(userId);
        fetchUserProfile(userId);
    };

    const navItems = [
        { id: 'home', label: 'Community Home', icon: Home },
        { id: 'companies', label: 'Companies', icon: Building2 },
        { id: 'trending', label: 'Trending', icon: Flame },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
        { id: 'saved', label: 'Saved Posts', icon: Bookmark },
        { id: 'my-posts', label: 'My Contributions', icon: PenSquare }
    ];

    return (
        <div className="flex gap-6 min-h-[calc(100vh-200px)]">
            {/* Mobile Header */}
            <div className="lg:hidden mb-4 glass-card p-4 flex items-center justify-between sticky top-0 z-30">
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2 text-gray-400 hover:text-white"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <span className="font-bold text-white text-lg">Community</span>
                <button
                    onClick={() => setMobileTrendingOpen(true)}
                    className="p-2 text-gray-400 hover:text-white"
                >
                    <TrendingUp className="w-6 h-6" />
                </button>
            </div>

            {/* Left Sidebar - Navigation */}
            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-gray-900/95 backdrop-blur-xl p-4 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block lg:bg-transparent lg:p-0 lg:w-56 flex-shrink-0
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between lg:hidden mb-6">
                    <span className="text-xl font-bold text-white">Menu</span>
                    <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="glass-card p-4 sticky top-4">
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = view === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setView(item.id as ViewType);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isActive
                                        ? 'bg-indigo-500/20 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : ''}`} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Center - Main Feed */}
            <main className="flex-1 min-w-0">
                {/* Search & Filters */}
                {view !== 'post-detail' && (
                    <div className="glass-card p-4 mb-4">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search company, topic, question..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-glass w-full pl-10"
                                />
                            </div>
                            {/* Hide filters/create for specific views */}
                            {!['companies', 'leaderboard', 'saved', 'my-posts'].includes(view) && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-indigo-500/20' : ''}`}
                                    >
                                        <Filter className="w-4 h-4" />
                                        Filters
                                    </button>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create Post
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Expanded Filters */}
                        {!['companies', 'leaderboard', 'saved', 'my-posts'].includes(view) && (
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 mt-4 border-t border-white/10">
                                            <select
                                                value={filters.postType}
                                                onChange={(e) => setFilters({ ...filters, postType: e.target.value })}
                                                className="input-glass"
                                            >
                                                <option value="">All Post Types</option>
                                                <option value="interview_experience">Interview Experience</option>
                                                <option value="question">Question</option>
                                                <option value="coding_question">Coding Question</option>
                                                <option value="resource">Resource</option>
                                                <option value="drive_update">Drive Update</option>
                                                <option value="discussion">Discussion</option>
                                            </select>
                                            <select
                                                value={filters.batch}
                                                onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
                                                className="input-glass"
                                            >
                                                <option value="">All Batches</option>
                                                <option value="2024">2024</option>
                                                <option value="2025">2025</option>
                                                <option value="2026">2026</option>
                                            </select>
                                            <select
                                                value={filters.driveType}
                                                onChange={(e) => setFilters({ ...filters, driveType: e.target.value })}
                                                className="input-glass"
                                            >
                                                <option value="">All Drive Types</option>
                                                <option value="internship">Internship</option>
                                                <option value="fulltime">Full-time</option>
                                            </select>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                )}

                {/* Sort Tabs - only show for feed views */}
                {(view === 'home' || view === 'trending') && (
                    <div className="flex items-center gap-2 mb-4">
                        {[
                            { id: 'trending', label: 'Trending', icon: TrendingUp },
                            { id: 'new', label: 'New', icon: Clock },
                            { id: 'top', label: 'Top', icon: ArrowUp }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setSort(tab.id as SortType)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${sort === tab.id
                                        ? 'bg-indigo-500/20 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Feed - only show for home, trending, saved, my-posts, company-view */}
                {(view === 'home' || view === 'trending' || view === 'saved' || view === 'my-posts' || view === 'company-view') && (
                    <>
                        {/* Company View Header */}
                        {view === 'company-view' && selectedCompany && (
                            <div className="glass-card p-4 mb-4 flex items-center gap-4">
                                <button
                                    onClick={() => { setView('companies'); setSelectedCompany(null); }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    ← Back
                                </button>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {selectedCompany.charAt(0).toUpperCase()}
                                </div>
                                <h2 className="text-xl font-bold text-white">{selectedCompany} Community</h2>
                            </div>
                        )}
                        <div className="space-y-4">
                            {loading ? (
                                <div className="glass-card p-8 text-center text-gray-400">
                                    Loading experiences...
                                </div>
                            ) : experiences.length === 0 ? (
                                <div className="glass-card p-8 text-center text-gray-400">
                                    <p>{view === 'saved' ? 'No saved posts yet.' : view === 'my-posts' ? 'You haven\'t posted anything yet.' : 'No posts found. Be the first to share your experience!'}</p>
                                </div>
                            ) : (
                                experiences.map((exp) => (
                                    <ExperienceCard
                                        key={exp._id}
                                        experience={exp}
                                        currentUserId={currentUserId}
                                        onVote={handleVote}
                                        onSave={handleSave}
                                        onClick={handleClick}
                                        onReport={handleReport}
                                        onUserClick={handleUserClick}
                                    />
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* Companies Grid (conditional) */}
                {view === 'companies' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {companies
                            .filter(c => c._id.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((company) => (
                                <motion.div
                                    key={company._id}
                                    whileHover={{ scale: 1.02 }}
                                    className="glass-card p-4 border border-white/10 cursor-pointer hover:border-indigo-500/30 transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                            {company._id.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold">{company._id}</h3>
                                            <p className="text-sm text-gray-400">{company.postCount} posts</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Avg Difficulty: {company.avgDifficulty?.toFixed(1) || 'N/A'}</span>
                                        <button
                                            onClick={() => {
                                                setSelectedCompany(company._id);
                                                setView('company-view');
                                            }}
                                            className="text-indigo-400 flex items-center gap-1 hover:underline"
                                        >
                                            View Community <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                )}

                {/* Leaderboard (conditional) */}
                {view === 'leaderboard' && (
                    <div className="glass-card p-4 mt-4">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            Top Contributors
                        </h3>
                        <div className="space-y-3">
                            {leaderboard
                                .filter(entry => entry.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((entry, index) => (
                                    <div
                                        key={entry.user?._id || index}
                                        className={`flex items-center gap-4 p-3 rounded-lg ${index < 3 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : 'bg-white/5'
                                            }`}
                                    >
                                        <span className={`text-lg font-bold ${index === 0 ? 'text-yellow-400' :
                                            index === 1 ? 'text-gray-300' :
                                                index === 2 ? 'text-orange-400' : 'text-gray-500'
                                            }`}>
                                            #{entry.rank}
                                        </span>
                                        <div
                                            onClick={() => entry.user?._id && handleUserClick(entry.user._id)}
                                            className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80 transition-opacity">
                                            {entry.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1">
                                            <p
                                                onClick={() => entry.user?._id && handleUserClick(entry.user._id)}
                                                className="text-white font-medium cursor-pointer hover:text-indigo-400 hover:underline transition-colors">
                                                {entry.user?.name || 'Unknown'}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                {entry.badges?.map((badge: string, i: number) => (
                                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                                                        {badge}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-semibold">{entry.totalVotes} votes</p>
                                            <p className="text-sm text-gray-400">{entry.posts} posts</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* User Profile View */}
                {view === 'user-profile' && userProfile && (
                    <div className="space-y-4">
                        <button onClick={() => setView('home')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
                            ← Back to feed
                        </button>

                        {/* Profile Header */}
                        <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                                {userProfile.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-2xl font-bold text-white">{userProfile.user.name}</h2>
                                <p className="text-gray-400">{userProfile.user.role} • Joined {new Date(userProfile.user.createdAt).toLocaleDateString()}</p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                                    {userProfile.stats.badges.map((badge, i) => (
                                        <span key={i} className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm border border-indigo-500/30">
                                            {badge}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="md:ml-auto flex gap-8 text-center bg-white/5 p-4 rounded-xl border border-white/10">
                                <div>
                                    <p className="text-2xl font-bold text-white">{userProfile.stats.totalPosts}</p>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Posts</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{userProfile.stats.totalVotes}</p>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Karma</p>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="glass-card p-4 text-center">
                                <p className="text-2xl font-bold text-purple-400">{userProfile.stats.interviewPosts}</p>
                                <p className="text-xs text-gray-400">Interview Exp</p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <p className="text-2xl font-bold text-blue-400">{userProfile.stats.codingPosts}</p>
                                <p className="text-xs text-gray-400">Coding Qs</p>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <p className="text-2xl font-bold text-green-400">{userProfile.stats.resourcePosts}</p>
                                <p className="text-xs text-gray-400">Resources</p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-400" />
                                Recent Activity
                            </h3>
                            <div className="space-y-4">
                                {userProfile.recentPosts.length > 0 ? (
                                    userProfile.recentPosts.map(post => (
                                        <ExperienceCard
                                            key={post._id}
                                            experience={post}
                                            currentUserId={currentUserId}
                                            onVote={handleVote}
                                            onSave={handleSave}
                                            onClick={handleClick}
                                            onReport={handleReport}
                                            onUserClick={handleUserClick}
                                        />
                                    ))
                                ) : (
                                    <div className="glass-card p-8 text-center text-gray-400">
                                        No recent activity.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Post Detail View */}
                {view === 'post-detail' && selectedPost && (
                    <div className="space-y-4">
                        {/* Back Button */}
                        <button
                            onClick={() => { setView('home'); setSelectedPost(null); }}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                        >
                            ← Back to feed
                        </button>

                        {/* Post Header */}
                        <div className="glass-card p-4">
                            {/* Top row: badges + author + date */}
                            <div className="flex items-center gap-3 mb-3 text-xs">
                                <span className={`px-2 py-0.5 rounded-full ${selectedPost.postType === 'interview_experience' ? 'bg-purple-500/20 text-purple-400' :
                                    selectedPost.postType === 'coding_question' ? 'bg-blue-500/20 text-blue-400' :
                                        selectedPost.postType === 'resource' ? 'bg-green-500/20 text-green-400' :
                                            selectedPost.postType === 'drive_update' ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {selectedPost.postType?.replace('_', ' ')}
                                </span>
                                {selectedPost.result && (
                                    <span className={`px-2 py-0.5 rounded-full ${selectedPost.result === 'selected' ? 'bg-green-500/20 text-green-400' :
                                        selectedPost.result === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {selectedPost.result}
                                    </span>
                                )}
                                <span className="text-gray-500">•</span>
                                <span
                                    onClick={() => selectedPost.user?._id && handleUserClick(selectedPost.user._id)}
                                    className="text-gray-400 cursor-pointer hover:text-indigo-400 hover:underline transition-colors">
                                    {selectedPost.user?.name || 'Anonymous'}
                                </span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-500">{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* Title */}
                            <h1 className="text-xl font-semibold text-white mb-2">{selectedPost.title}</h1>

                            {/* Meta pills */}
                            <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-3">
                                {selectedPost.companyName && (
                                    <span className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded">
                                        <Building2 className="w-3 h-3" /> {selectedPost.companyName}
                                    </span>
                                )}
                                {selectedPost.role && <span className="px-2 py-1 bg-white/5 rounded">{selectedPost.role}</span>}
                                {selectedPost.batch && <span className="px-2 py-1 bg-white/5 rounded">Batch {selectedPost.batch}</span>}
                                {selectedPost.difficulty && (
                                    <span className="px-2 py-1 bg-white/5 rounded">
                                        {'⭐'.repeat(selectedPost.difficulty)}{'☆'.repeat(5 - selectedPost.difficulty)}
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed mb-4 max-h-80 overflow-y-auto">
                                {selectedPost.content}
                            </div>

                            {/* Interview Rounds - Collapsible look */}
                            {selectedPost.interviewRounds?.length > 0 && (
                                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                                    <h4 className="text-sm font-medium text-white mb-2">📝 Interview Rounds</h4>
                                    <div className="space-y-2">
                                        {selectedPost.interviewRounds.map((round: any, index: number) => (
                                            <div key={index} className="text-xs text-gray-400">
                                                <span className="text-white">R{round.roundNumber}: {round.roundType}</span> - {round.description}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tips - Compact */}
                            {selectedPost.tips?.length > 0 && (
                                <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                    <h4 className="text-sm font-medium text-green-400 mb-1">💡 Tips</h4>
                                    <ul className="text-xs text-gray-300 space-y-0.5">
                                        {selectedPost.tips.map((tip: string, i: number) => <li key={i}>• {tip}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Tags - Smaller */}
                            {selectedPost.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {selectedPost.tags.map((tag: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 bg-white/5 text-gray-500 rounded text-xs">#{tag}</span>
                                    ))}
                                </div>
                            )}

                            {/* Actions - Compact bar */}
                            <div className="flex items-center gap-3 pt-3 border-t border-white/10 text-sm">
                                <button
                                    onClick={() => handleVote(selectedPost._id, 'up')}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${selectedPost.upvotes?.includes(currentUserId) ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    ▲ {selectedPost.upvotes?.length || 0}
                                </button>
                                <button
                                    onClick={() => handleVote(selectedPost._id, 'down')}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${selectedPost.downvotes?.includes(currentUserId) ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    ▼ {selectedPost.downvotes?.length || 0}
                                </button>
                                <button
                                    onClick={() => handleSave(selectedPost._id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-gray-400 hover:bg-white/10 rounded transition-colors"
                                >
                                    <Bookmark className="w-3 h-3" /> Save
                                </button>
                                <button
                                    onClick={() => handleReport(selectedPost._id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                >
                                    <Flag className="w-3 h-3" /> Report
                                </button>
                                <span className="text-gray-500 text-xs ml-auto">
                                    💬 {selectedPost.comments?.length || 0} comments
                                </span>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="glass-card p-4">
                            <h4 className="text-sm font-medium text-white mb-3">
                                💬 Comments ({selectedPost.comments?.length || 0})
                            </h4>

                            {/* Add Comment Form */}
                            <div className="mb-4">
                                <textarea
                                    id="new-comment"
                                    placeholder="Add a comment..."
                                    className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none"
                                    rows={2}
                                />
                                <button
                                    onClick={async () => {
                                        const textarea = document.getElementById('new-comment') as HTMLTextAreaElement;
                                        const content = textarea.value.trim();
                                        if (!content) return;
                                        try {
                                            const res = await apiClient.post(`/experiences/${selectedPost._id}/comments`, { content });
                                            setSelectedPost({ ...selectedPost, comments: res.data.comments });
                                            textarea.value = '';
                                        } catch (err) { console.error(err); }
                                    }}
                                    className="mt-2 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    Post
                                </button>
                            </div>

                            {/* Comments List - Nested Reddit-style */}
                            <div className="space-y-2">
                                {(() => {
                                    const comments = selectedPost.comments || [];
                                    const topLevel = comments.filter((c: any) => !c.parentId);

                                    const renderComment = (comment: any) => {
                                        const replies = comments.filter((c: any) => c.parentId?.toString() === comment._id?.toString());
                                        return (
                                            <div key={comment._id} className="mb-4">
                                                {/* Comment Content */}
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-sm font-medium">
                                                        {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span
                                                                onClick={() => comment.user?._id && handleUserClick(comment.user._id)}
                                                                className="text-white font-medium text-sm cursor-pointer hover:text-indigo-400 hover:underline transition-colors">
                                                                {comment.user?.name || 'Anonymous'}
                                                            </span>
                                                            <span className="text-gray-500 text-xs">• {new Date(comment.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-gray-300 text-sm mb-2">{comment.content}</p>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-4 text-xs">
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        const res = await apiClient.patch(`/experiences/${selectedPost._id}/comments/${comment._id}/vote`, { voteType: 'up' });
                                                                        setSelectedPost({ ...selectedPost, comments: res.data.comments });
                                                                    } catch (err) { console.error(err); }
                                                                }}
                                                                className={`flex items-center gap-1 transition-colors ${comment.upvotes?.includes(currentUserId) ? 'text-orange-500 font-bold' : 'text-gray-500 hover:text-orange-500'}`}
                                                            >
                                                                ⬆ {comment.upvotes?.length || 0}
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        const res = await apiClient.patch(`/experiences/${selectedPost._id}/comments/${comment._id}/vote`, { voteType: 'down' });
                                                                        setSelectedPost({ ...selectedPost, comments: res.data.comments });
                                                                    } catch (err) { console.error(err); }
                                                                }}
                                                                className={`flex items-center gap-1 transition-colors ${comment.downvotes?.includes(currentUserId) ? 'text-blue-500 font-bold' : 'text-gray-500 hover:text-blue-500'}`}
                                                            >
                                                                ⬇ {comment.downvotes?.length || 0}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const replyDiv = document.getElementById(`reply-${comment._id}`);
                                                                    if (replyDiv) replyDiv.classList.toggle('hidden');
                                                                }}
                                                                className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                                                            >
                                                                💬 Reply
                                                            </button>
                                                        </div>

                                                        {/* Reply Input */}
                                                        <div id={`reply-${comment._id}`} className="hidden mt-3 mb-2">
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Write a reply..."
                                                                    className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                                                                    onKeyDown={async (e) => {
                                                                        if (e.key === 'Enter') {
                                                                            const input = e.target as HTMLInputElement;
                                                                            const content = input.value.trim();
                                                                            if (!content) return;
                                                                            try {
                                                                                const res = await apiClient.post(`/experiences/${selectedPost._id}/comments`, {
                                                                                    content,
                                                                                    parentId: comment._id
                                                                                });
                                                                                setSelectedPost({ ...selectedPost, comments: res.data.comments });
                                                                                input.value = '';
                                                                                document.getElementById(`reply-${comment._id}`)?.classList.add('hidden');
                                                                            } catch (err) { console.error(err); }
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Nested Replies Container */}
                                                {replies.length > 0 && (
                                                    <div className="ml-4 pl-4 border-l-2 border-white/10 mt-3">
                                                        {replies.map((reply: any) => renderComment(reply))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    };

                                    return topLevel.length > 0
                                        ? topLevel.map((c: any) => renderComment(c))
                                        : <p className="text-gray-500 text-center py-4 text-sm">No comments yet. Be the first to comment!</p>;
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Right Sidebar - Smart Insights */}
            {view !== 'post-detail' && (
                <>
                    {/* Mobile Overlay */}
                    {mobileTrendingOpen && (
                        <div
                            className="fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-sm"
                            onClick={() => setMobileTrendingOpen(false)}
                        />
                    )}

                    <aside className={`
                        fixed inset-y-0 right-0 z-50 w-72 bg-gray-900/95 backdrop-blur-xl p-4 transform transition-transform duration-300 ease-in-out xl:translate-x-0 xl:static xl:block xl:bg-transparent xl:p-0 xl:w-72 flex-shrink-0
                        ${mobileTrendingOpen ? 'translate-x-0' : 'translate-x-full'}
                    `}>
                        <div className="flex items-center justify-between xl:hidden mb-6">
                            <span className="text-xl font-bold text-white">Trending</span>
                            <button onClick={() => setMobileTrendingOpen(false)} className="text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="glass-card p-4 sticky top-4">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                This Month
                            </h3>

                            {insights ? (
                                <div className="space-y-4">
                                    {/* Top Companies */}
                                    <div>
                                        <h4 className="text-sm text-gray-400 mb-2">Most Discussed Companies</h4>
                                        {insights.topCompanies?.slice(0, 3).map((c: any) => (
                                            <div key={c._id} className="flex items-center justify-between py-1">
                                                <span className="text-white">#{c._id}</span>
                                                <span className="text-sm text-gray-400">{c.count} posts</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Top Topics */}
                                    <div>
                                        <h4 className="text-sm text-gray-400 mb-2">🔥 Top 5 FAQs</h4>
                                        {insights.topTopics?.slice(0, 5).map((t: any) => (
                                            <div key={t._id} className="flex items-center justify-between py-1">
                                                <span className="text-white capitalize">{t._id}</span>
                                                <span className="text-sm text-gray-400">{t.count} mentions</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Top Contributors */}
                                    <div>
                                        <h4 className="text-sm text-gray-400 mb-2">Top Contributors</h4>
                                        {insights.topContributors?.slice(0, 3).map((c: any) => (
                                            <div key={c.user?._id} className="flex items-center gap-2 py-1">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {c.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <span
                                                    onClick={() => c.user?._id && handleUserClick(c.user._id)}
                                                    className="text-white text-sm cursor-pointer hover:text-indigo-400 hover:underline transition-colors">
                                                    {c.user?.name}
                                                </span>
                                                <span className="text-xs text-gray-400 ml-auto">{c.posts} posts</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">Loading insights...</p>
                            )}
                        </div>
                    </aside>
                </>
            )}

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    fetchExperiences();
                    setShowCreateModal(false);
                }}
            />
        </div>
    );
};

export default CommunityHome;
