import React, { useState, useEffect } from 'react';
import { Brand } from '../brand.js';
import { getCurrentUserId, isLoggedIn } from '../utils/getCurrentUser';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, unread, booking_created, etc.
    const [stats, setStats] = useState({ total: 0, unread: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const userId = getCurrentUserId();

    useEffect(() => {
        if (isLoggedIn() && userId) {
            fetchNotifications();
            fetchStats();
        } else {
            setError('Please log in to view notifications');
            setLoading(false);
        }
    }, [userId, filter, currentPage]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                ...(filter === 'unread' && { unreadOnly: 'true' }),
                ...(filter !== 'all' && filter !== 'unread' && { type: filter })
            });

            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const response = await fetch(`/api/notifications?${params}`, {
                headers: {
                    'Authorization': `Bearer ${userInfo?.token}`,
                    'user-id': userId
                }
            });

            const data = await response.json();

            if (data.success) {
                setNotifications(data.data.notifications || []);
                setTotalPages(data.data.pagination?.pages || 1);
                setStats(prev => ({ ...prev, unread: data.data.unreadCount || 0 }));
            } else {
                setError('Failed to fetch notifications');
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const response = await fetch('/api/notifications/stats', {
                headers: {
                    'Authorization': `Bearer ${userInfo?.token}`,
                    'user-id': userId
                }
            });

            const data = await response.json();
            if (data.success) {
                setStats(data.data.overview);
            }
        } catch (err) {
            console.error('Error fetching notification stats:', err);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${userInfo?.token}`,
                    'user-id': userId
                }
            });

            // Update local state
            setNotifications(prev =>
                prev.map(notification =>
                    notification._id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            );

            setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await fetch('/api/notifications/read-all', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${userInfo?.token}`,
                    'user-id': userId
                }
            });

            // Update local state
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, isRead: true }))
            );
            setStats(prev => ({ ...prev, unread: 0 }));
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    };

    const deleteNotification = async (notificationId) => {
        if (!window.confirm('Are you sure you want to delete this notification?')) {
            return;
        }

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userInfo?.token}`,
                    'user-id': userId
                }
            });

            // Update local state
            const deletedNotification = notifications.find(n => n._id === notificationId);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));

            if (deletedNotification && !deletedNotification.isRead) {
                setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'booking_created': return '🆕';
            case 'booking_updated': return '📝';
            case 'booking_cancelled': return '❌';
            case 'booking_confirmed': return '✅';
            case 'booking_completed': return '🏁';
            case 'status_changed': return '📋';
            default: return '📢';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#d97706';
            case 'low': return '#65a30d';
            default: return Brand.body;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="py-20 text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                <p className="text-lg" style={{ color: Brand.body }}>
                    Loading notifications...
                </p>
            </div>
        );
    }

    return (
        <div className="p-6" style={{ backgroundColor: Brand.light, minHeight: '100vh' }}>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold" style={{ color: Brand.primary }}>
                    Notifications
                </h1>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-lg" style={{ color: Brand.body }}>
                        Stay updated with your ground booking activities
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-sm" style={{ color: Brand.body }}>
                            {stats.unread} unread of {stats.total} total
                        </span>
                        {stats.unread > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-80"
                                style={{ backgroundColor: Brand.secondary }}
                            >
                                Mark All Read
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 mb-6 text-red-700 bg-red-100 border border-red-400 rounded-lg">
                    {error}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
                <div className="flex flex-wrap gap-2">
                    {{
                        all: 'All Notifications',
                        unread: `Unread (${stats.unread})`,
                        booking_created: '🆕 New Bookings',
                        status_changed: '📋 Status Changes',
                        booking_cancelled: '❌ Cancellations',
                        booking_confirmed: '✅ Confirmations'
                    }[filter]}
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="py-12 text-center bg-white rounded-lg shadow-md">
                        <div className="mb-4 text-6xl">🔕</div>
                        <h3 className="mb-2 text-xl font-semibold" style={{ color: Brand.heading }}>
                            No notifications found
                        </h3>
                        <p style={{ color: Brand.body }}>
                            {filter === 'unread'
                                ? 'You have no unread notifications.'
                                : 'No notifications match your current filter.'}
                        </p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification._id}
                            className={`p-6 bg-white rounded-lg shadow-md transition-all duration-200 ${!notification.isRead
                                    ? 'border-l-4 hover:shadow-lg'
                                    : 'hover:shadow-lg opacity-75'
                                }`}
                            style={{
                                borderLeftColor: !notification.isRead ? Brand.secondary : 'transparent'
                            }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div>
                                            <h3
                                                className="font-semibold text-lg"
                                                style={{ color: Brand.heading }}
                                            >
                                                {notification.title}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span
                                                    className="text-sm"
                                                    style={{ color: getPriorityColor(notification.priority) }}
                                                >
                                                    {notification.priority.toUpperCase()}
                                                </span>
                                                <span className="text-sm" style={{ color: Brand.body }}>
                                                    {formatTime(notification.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="mb-3" style={{ color: Brand.body }}>
                                        {notification.message}
                                    </p>

                                    {/* Booking Details */}
                                    {notification.metadata && (
                                        <div className="p-3 rounded-lg" style={{ backgroundColor: `${Brand.secondary}15` }}>
                                            <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: Brand.body }}>
                                                {notification.metadata.groundName && (
                                                    <div><strong>Ground:</strong> {notification.metadata.groundName}</div>
                                                )}
                                                {notification.metadata.bookingDate && (
                                                    <div><strong>Date:</strong> {new Date(notification.metadata.bookingDate).toLocaleDateString()}</div>
                                                )}
                                                {notification.metadata.startTime && notification.metadata.endTime && (
                                                    <div><strong>Time:</strong> {notification.metadata.startTime} - {notification.metadata.endTime}</div>
                                                )}
                                                {notification.metadata.customerName && (
                                                    <div><strong>Customer:</strong> {notification.metadata.customerName}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 ml-4">
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => markAsRead(notification._id)}
                                            className="px-3 py-1 text-xs text-white rounded hover:opacity-80"
                                            style={{ backgroundColor: Brand.secondary }}
                                        >
                                            Mark Read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(notification._id)}
                                        className="px-3 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50"
                        style={{ borderColor: Brand.light }}
                    >
                        Previous
                    </button>

                    <span className="px-4 py-2" style={{ color: Brand.body }}>
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50"
                        style={{ borderColor: Brand.light }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default Notifications;
