import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-[#1E293B] font-sans print:h-auto print:block">
            {/* Sidebar Component */}
            <div className="print:hidden">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative print:overflow-visible print:h-auto">
                {/* Topbar for Mobile */}
                <div className="print:hidden">
                    <Topbar onMenuClick={toggleSidebar} />
                </div>

                {/* Content Outlet */}
                <div className="flex-1 overflow-auto p-4 md:p-8 bg-[#F8FAFC] print:p-0 print:overflow-visible">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;