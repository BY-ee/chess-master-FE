import { useNavigate, useLocation } from 'react-router-dom';
import { X, Home, Gamepad2, LogOut, List, ChevronDown, ChevronRight, type LucideIcon, Bot, Users } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useState } from 'react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MenuItem {
    label: string;
    icon?: LucideIcon;
    path?: string;
    children?: MenuItem[];
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

    const handleNavigation = (path: string) => {
        navigate(path);
        onClose();
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        onClose();
    };

    const toggleMenu = (label: string) => {
        setExpandedMenus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(label)) {
                newSet.delete(label);
            } else {
                newSet.add(label);
            }
            return newSet;
        });
    };

    const menuItems: MenuItem[] = [
        { label: 'Lobby', icon: Home, path: '/lobby' },
        { label: 'Rooms', icon: List, path: '/rooms' },
        { 
            label: 'Game', 
            icon: Gamepad2,
            children: [
                { label: 'vs User', icon: Users, path: '/rooms' },
                { label: 'vs AI', icon: Bot, path: '/game/ai' },
            ]
        },
    ];

    // Recursive menu item renderer
    const renderMenuItem = (item: MenuItem, depth = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedMenus.has(item.label);
        const isActive = item.path && location.pathname === item.path;
        const paddingLeft = depth * 12 + 16; // 16px base + 12px per depth level

        return (
            <div key={item.label}>
                <button
                    onClick={() => {
                        if (hasChildren) {
                            toggleMenu(item.label);
                        } else if (item.path) {
                            handleNavigation(item.path);
                        }
                    }}
                    className={`
                        w-full flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-all
                        ${isActive 
                            ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                        }
                    `}
                    style={{ paddingLeft: `${paddingLeft}px`, paddingRight: '16px' }}
                >
                    {item.icon && <item.icon size={18} className="flex-shrink-0" />}
                    <span className="flex-1 text-left">{item.label}</span>
                    {hasChildren && (
                        isExpanded ? 
                            <ChevronDown size={16} className="flex-shrink-0" /> : 
                            <ChevronRight size={16} className="flex-shrink-0" />
                    )}
                </button>
                
                {/* Submenu */}
                {hasChildren && isExpanded && (
                    <div className="mt-1 space-y-1">
                        {item.children!.map(child => renderMenuItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[59] backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <div className={`
                fixed top-0 left-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 z-[60] transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex-1 overflow-y-auto p-6 min-h-0 scrollbar-hide">
                    <div className="flex justify-between items-center mb-8">
                        <div 
                            onClick={() => handleNavigation('/lobby')}
                            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <img src="/logo.png" alt="Chess Master" className="w-8 h-8 object-contain rounded-lg" />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                Chess Master
                            </span>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {user && (
                        <div className="flex items-center gap-3 p-3 mb-6 bg-zinc-800/50 rounded-xl border border-zinc-700/50 flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.username}</p>
                                <p className="text-xs text-zinc-400">Online</p>
                            </div>
                        </div>
                    )}

                    <nav className="space-y-2">
                        {menuItems.map(item => renderMenuItem(item))}
                    </nav>
                </div>

                <div className="flex-none p-6 border-t border-zinc-800 bg-zinc-900">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
