import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await axios.get('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const list = res.data.data || [];
            setNotifications(list);
            setUnreadCount(list.filter((n) => !n.isRead).length);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `/api/notifications/${id}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    position: 'relative',
                }}
            >
                🔔
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            backgroundColor: 'red',
                            color: 'white',
                            borderRadius: '50%',
                            padding: '2px 6px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                        }}
                    >
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        marginTop: '8px',
                        width: '320px',
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        borderRadius: '8px',
                        zIndex: 1000,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #eee',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span>Notifications</span>
                        <small style={{ color: '#666' }}>{unreadCount} unread</small>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#888' }}>
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id || n.id}
                                    onClick={() => markAsRead(n._id || n.id)}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid #f0f0f0',
                                        backgroundColor: n.isRead ? '#fff' : '#f0f7ff',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem' }}>{n.message}</p>
                                    <small style={{ color: '#999', fontSize: '0.75rem' }}>
                                        {new Date(n.createdAt || Date.now()).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </small>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;