import React from 'react';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';

interface Tab {
    id: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
}

interface DashboardSidebarProps {
    tabs: Tab[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    userInfo?: {
        name: string;
        role: string;
        avatar?: string;
    };
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
    tabs,
    activeTab,
    setActiveTab,
    collapsed,
    setCollapsed,
    userInfo
}) => {
    return (
        <aside
            className={`hidden md:flex fixed left-4 top-[100px] h-[calc(100vh-116px)] bg-[#0f1419]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 transition-all duration-300 z-30 flex-col overflow-hidden ${collapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* User Info */}
            {userInfo && (
                <div className={`p-4 border-b border-white/10 ${collapsed ? 'px-3' : ''}`}>
                    <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-indigo-500/30">
                            {userInfo.avatar ? (
                                <img src={userInfo.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                                userInfo.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden">
                                <p className="text-white font-medium text-sm truncate">{userInfo.name}</p>
                                <p className="text-gray-500 text-xs capitalize">{userInfo.role}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Navigation Items */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-3">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <li key={tab.id}>
                                <button
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive
                                        ? 'bg-indigo-500/20 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        } ${collapsed ? 'justify-center px-2' : ''}`}
                                    title={collapsed ? tab.label : undefined}
                                >
                                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />

                                    {!collapsed && (
                                        <span className="text-sm font-medium truncate">{tab.label}</span>
                                    )}

                                    {/* Badge */}
                                    {tab.badge && tab.badge > 0 && (
                                        <span className={`flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-bold rounded-full bg-red-500 text-white ${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'
                                            }`}>
                                            {tab.badge > 99 ? '99+' : tab.badge}
                                        </span>
                                    )}

                                    {/* Active indicator */}
                                    {isActive && (
                                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />
                                    )}

                                    {/* Tooltip on collapsed */}
                                    {collapsed && (
                                        <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 border border-white/10 rounded-lg text-sm text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                                            {tab.label}
                                        </div>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Collapse Toggle */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <>
                            <ChevronLeft className="h-5 w-5" />
                            <span className="text-sm">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default DashboardSidebar;
