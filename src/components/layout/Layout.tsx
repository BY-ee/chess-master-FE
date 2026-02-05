import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-zinc-900 flex flex-col">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <header className="flex-none p-4 sticky top-0 z-20 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800 flex items-center gap-4">
                 <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
                    aria-label="Open Sidebar"
                >
                    <Menu size={24} />
                </button>
                <Link to="/lobby" className="flex items-center gap-2 font-bold text-lg text-zinc-200 hover:text-white transition-colors cursor-pointer">
                    <img src="/logo.png" alt="Chess Master" className="w-8 h-8 object-contain rounded-lg" />
                    <span>Chess Master</span>
                </Link>
            </header>

            <main className="w-full flex-1 relative">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
