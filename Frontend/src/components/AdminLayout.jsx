import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

// --- A comprehensive set of icons for the Admin Panel ---
const UserCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const UserGroupIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const CreditCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const ShoppingBagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l.586-.586a2 2 0 012.828 0l.586.586m-3.414 0l.586.586m2.242 0l.586.586M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const WrenchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const ChatAlt2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2m8-4H5a2 2 0 00-2 2v10a2 2 0 002 2h11l4 4V4a2 2 0 00-2-2z" /></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const PayrollIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default function AdminLayout() {
    const [showSidebar, setShowSidebar] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (storedUserInfo) {
            setUserInfo(storedUserInfo);
        }
    }, []);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('userInfo');
            navigate('/login');
        }
    };

    // Helper to determine if a link is active
    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen flex bg-background">
            {showSidebar && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setShowSidebar(false)}></div>}

            <aside className={`fixed top-0 left-0 h-screen w-64 bg-surface shadow-xl transform transition-transform duration-300 z-40 ${showSidebar ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 lg:flex-shrink-0`}>
                <div className="p-4 flex flex-col h-full">
                    <div className="mb-8 text-center">
                        <img
                            src={userInfo?.profileImageURL ? `http://localhost:5000${userInfo.profileImageURL}` : `https://placehold.co/100x100/072679/FFFFFF?text=A`}
                            alt="Admin Profile"
                            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-primary"
                        />
                        <h2 className="text-xl font-bold text-primary">Admin Panel</h2>
                        <p className="text-sm text-text-body">{userInfo?.username}</p>
                    </div>

                    <nav className="space-y-1 flex-grow overflow-y-auto">
                        <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">My Account</p>
                        <Link to="/admin/profile" className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isActive('/admin/profile') ? 'bg-secondary text-white' : 'text-text-body hover:bg-gray-100'}`}>
                            <UserCircleIcon /> My Profile
                        </Link>
                        <Link to="/admin/edit-account" className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isActive('/admin/edit-account') ? 'bg-secondary text-white' : 'text-text-body hover:bg-gray-100'}`}>
                            <CogIcon /> Edit Profile
                        </Link>

                        <p className="px-4 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase">Management</p>
                        <Link to="/admin/users" className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isActive('/admin/users') ? 'bg-secondary text-white' : 'text-text-body hover:bg-gray-100'}`}>
                            <UserGroupIcon /> All Users
                        </Link>
                        <a href="/admin/payments" className="flex items-center px-4 py-2 rounded-lg font-medium text-text-body hover:bg-gray-100">
                            <CreditCardIcon /> All Payments
                        </a>
                        <Link to="/admin/payroll" className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isActive('/admin/payroll') ? 'bg-secondary text-white' : 'text-text-body hover:bg-gray-100'}`}>
                            <PayrollIcon /> Payroll Management
                        </Link>
                        <a href="/admin/inventory" className="flex items-center px-4 py-2 rounded-lg font-medium text-text-body hover:bg-gray-100">
                            <PlusCircleIcon /> Inventory
                        </a>
                        <a href="/admin/orders" className="flex items-center px-4 py-2 rounded-lg font-medium text-text-body hover:bg-gray-100">
                            <ShoppingBagIcon /> Orders
                        </a>
                        <a href="#" className="flex items-center px-4 py-2 rounded-lg font-medium text-text-body hover:bg-gray-100">
                            <CalendarIcon /> Coach Bookings
                        </a>
                        <Link to="/admin/ground-booking" className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isActive('/admin/ground-booking') ? 'bg-secondary text-white' : 'text-text-body hover:bg-gray-100'}`}>
                            <GlobeIcon /> Ground Bookings
                        </Link>
                        <a href="#" className="flex items-center px-4 py-2 rounded-lg font-medium text-text-body hover:bg-gray-100">
                            <WrenchIcon /> Repairs
                        </a>
                        <a href="#" className="flex items-center px-4 py-2 rounded-lg font-medium text-text-body hover:bg-gray-100">
                            <ChatAlt2Icon /> Feedbacks
                        </a>

                    </nav>

                    <div className="mt-auto">
                        <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium text-red-500 bg-red-100 hover:bg-red-200 transition-colors">
                            <LogoutIcon /> Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:ml-64">
                <header className="p-4 bg-surface shadow-md lg:hidden sticky top-0 z-20">
                    <button onClick={() => setShowSidebar(true)}>
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </header>
                <main className="flex-1 p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
