import React, { useState, useEffect } from 'react';
import PublicDashboard from './PublicDashboard';
import AdminPanel from './AdminPanel';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('admin'); // 'admin' or 'dashboard'

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setViewMode('admin');
    window.location.reload();
  };

  const handleSwitchView = (mode) => {
    setViewMode(mode);
  };

  if (!user) {
    // NOT logged in: Show public dashboard
    return <PublicDashboard />;
  } else {
    // Logged in: Can switch between admin panel and public dashboard
    if (viewMode === 'dashboard') {
      return <PublicDashboard isLoggedIn={true} user={user} onSwitchToAdmin={() => handleSwitchView('admin')} onLogout={handleLogout} />;
    }
    return <AdminPanel user={user} onLogout={handleLogout} onSwitchToDashboard={() => handleSwitchView('dashboard')} />;
  }
}
