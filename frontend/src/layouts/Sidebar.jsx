import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart2, BrainCircuit, ScanLine, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Prompt from '../components/ui/Prompt';

import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const [isLogoutPromptOpen, setIsLogoutPromptOpen] = useState(false);

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/tests', label: 'Mock Tests', icon: <FileText size={20} /> },
        { path: '/my-tests', label: 'My Tests', icon: <BarChart2 size={20} /> },
        { path: '/analysis', label: 'Analysis', icon: <BarChart2 size={20} /> },
        { path: '/ai-tutor', label: 'AI Tutor', icon: <BrainCircuit size={20} /> },
    ];

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const displayName = user?.profile?.name || user?.name || 'User';
    const displayEmail = user?.email || 'user@example.com';

    const handleLogoutClick = () => {
        setIsLogoutPromptOpen(true);
    };

    const confirmLogout = () => {
        logout();
        toast.success("Logged out successfully");
        setIsLogoutPromptOpen(false);
    };

    return (
        <>
            {/* Logout Prompt */}
            <Prompt
                isOpen={isLogoutPromptOpen}
                title="Log Out"
                message="Are you sure you want to log out? You will need to sign in again to access your account."
                confirmText="Log Out"
                onConfirm={confirmLogout}
                onCancel={() => setIsLogoutPromptOpen(false)}
            />

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                w-64 bg-white border-r border-gray-200 flex flex-col h-full
                transform transition-transform duration-200 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Brand Header */}
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        <ScanLine size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">MockUp</h1>
                        <p className="text-xs text-gray-500 font-medium tracking-wide">Strive to conquer</p>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onClose && window.innerWidth < 768 && onClose()}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Profile Section (Bottom) */}
                <div className="p-4 border-t border-gray-100 space-y-2">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 border-2 border-white shadow-sm overflow-hidden text-sm font-bold">
                            {user?.profile?.profileImage ? (
                                <img src={user.profile.profileImage} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                getInitials(displayName)
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate" title={displayName}>{displayName}</p>
                            <p className="text-xs text-gray-500 truncate" title={displayEmail}>
                                {displayEmail}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <NavLink
                            to="/settings"
                            className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
                        >
                            <Settings size={14} />
                            Settings
                        </NavLink>
                        <button
                            onClick={handleLogoutClick}
                            className="flex items-center justify-center gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg py-2 hover:bg-red-100 transition-colors"
                        >
                            <LogOut size={14} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
