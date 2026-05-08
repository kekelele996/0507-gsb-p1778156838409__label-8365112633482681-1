import React, { useState, useEffect } from 'react';
import { FileText, Phone, Users, Heart, Activity, TrendingUp, Calendar, Settings, LogOut } from 'lucide-react';

const API_URL = '/src/api';

// Helper function to get auth headers
function getAuthHeaders() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    const token = user.token || btoa(`${user.id}:${user.username}:${Date.now()}`);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  return { 'Content-Type': 'application/json' };
}

// Stat Card Component
function StatCard({ title, value, subtitle, icon: Icon, color, extra }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
      <div className={`p-6 bg-gradient-to-r ${color}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium opacity-90">{title}</p>
            <p className="text-white text-3xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-white text-sm opacity-75 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 bg-white bg-opacity-20 rounded-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
        {extra && (
          <div className="mt-3 pt-3 border-t border-white border-opacity-20">
            <p className="text-white text-xs opacity-75">{extra}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Recent Activity Item
function RecentActivityItem({ icon: Icon, title, subtitle, time, color }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">{time}</span>
    </div>
  );
}

export default function PublicDashboard({ isLoggedIn = false, user = null, onSwitchToAdmin = null, onLogout = null }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicStats();
  }, []);

  const fetchPublicStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin.php/stats/dashboard`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch public stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const statCards = [
    {
      key: 'death_records',
      title: '死亡登记',
      icon: FileText,
      color: 'from-red-500 to-red-600',
      getValue: (s) => s.summary.death_records.total,
      getSubtitle: (s) => `本月新增 ${s.summary.death_records.this_month} 人`,
      getExtra: (s) => '人口死亡登记管理',
    },
    {
      key: 'village_contacts',
      title: '村级联系人',
      icon: Phone,
      color: 'from-emerald-500 to-emerald-600',
      getValue: (s) => s.summary.village_contacts.active,
      getSubtitle: (s) => `共 ${s.summary.village_contacts.total} 人`,
      getExtra: (s) => '村庄联络员信息管理',
    },
    {
      key: 'subsistence',
      title: '低保人员',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      getValue: (s) => s.summary.subsistence.total,
      getSubtitle: (s) => `月补助 ¥${s.summary.subsistence.total_allowance.toLocaleString()}`,
      getExtra: (s) => '低保户及补助管理',
    },
    {
      key: 'special_assistance',
      title: '特困供养',
      icon: Heart,
      color: 'from-purple-500 to-purple-600',
      getValue: (s) => s.summary.special_assistance.total,
      getSubtitle: (s) => `月补助 ¥${s.summary.special_assistance.total_allowance.toLocaleString()}`,
      getExtra: (s) => '特困人员供养管理',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
      {/* Top Navigation Bar for logged-in users */}
      {isLoggedIn && (
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-14 items-center">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">数据看板</span>
                <span className="text-sm text-gray-500">（公开信息）</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">欢迎, {user?.username}</span>
                {onSwitchToAdmin && (
                  <button
                    onClick={onSwitchToAdmin}
                    className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
                  >
                    <Settings className="w-4 h-4 mr-1.5" />
                    进入管理后台
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition"
                  >
                    <LogOut className="w-4 h-4 mr-1.5" />
                    退出登录
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">村级信息管理系统</h1>
          <p className="text-gray-600">数据概览</p>
        </div>

        {/* System Introduction */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">系统简介</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">核心功能</h3>
              <ul className="space-y-1">
                <li>• 死亡登记管理：记录村民死亡信息</li>
                <li>• 村级联系人：管理各村联络员信息</li>
                <li>• 低保管理：低保户信息与补助管理</li>
                <li>• 特困供养：特困人员供养信息管理</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">系统特点</h3>
              <ul className="space-y-1">
                <li>• 统一的信息管理平台</li>
                <li>• 数据实时更新与统计</li>
                <li>• 便捷的查询与操作功能</li>
                <li>• 安全的后台管理系统</li>
              </ul>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map((card) => (
                <StatCard
                  key={card.key}
                  title={card.title}
                  value={card.getValue(stats)}
                  subtitle={card.getSubtitle(stats)}
                  icon={card.icon}
                  color={card.color}
                  extra={card.getExtra(stats)}
                />
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Death Records */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-semibold text-gray-900">最近死亡登记</h2>
                </div>
                <div className="space-y-2">
                  {stats.recent.death_records?.length > 0 ? (
                    stats.recent.death_records.map((record) => (
                      <RecentActivityItem
                        key={record.id}
                        icon={FileText}
                        title={record.name}
                        subtitle={`${record.village} · ${record.death_date}`}
                        time={formatTime(record.created_at)}
                        color="bg-red-500"
                      />
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">暂无数据</p>
                  )}
                </div>
              </div>

              {/* Recent Village Contacts */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-gray-900">最近联系人</h2>
                </div>
                <div className="space-y-2">
                  {stats.recent.village_contacts?.length > 0 ? (
                    stats.recent.village_contacts.map((contact) => (
                      <RecentActivityItem
                        key={contact.id}
                        icon={Phone}
                        title={contact.name}
                        subtitle={`${contact.village} · ${contact.position || '联系人'}`}
                        time={formatTime(contact.created_at)}
                        color="bg-emerald-500"
                      />
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">暂无数据</p>
                  )}
                </div>
              </div>

              {/* Recent Subsistence */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">最近低保户</h2>
                </div>
                <div className="space-y-2">
                  {stats.recent.subsistence?.length > 0 ? (
                    stats.recent.subsistence.map((record) => (
                      <RecentActivityItem
                        key={record.id}
                        icon={Users}
                        title={record.name}
                        subtitle={`${record.village} · ¥${record.monthly_allowance}/月`}
                        time={formatTime(record.created_at)}
                        color="bg-blue-500"
                      />
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">暂无数据</p>
                  )}
                </div>
              </div>

              {/* Recent Special Assistance */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">最近特困人员</h2>
                </div>
                <div className="space-y-2">
                  {stats.recent.special_assistance?.length > 0 ? (
                    stats.recent.special_assistance.map((record) => (
                      <RecentActivityItem
                        key={record.id}
                        icon={Heart}
                        title={record.name}
                        subtitle={`${record.village} · ${record.assistance_type} · ¥${record.monthly_amount}/月`}
                        time={formatTime(record.created_at)}
                        color="bg-purple-500"
                      />
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">暂无数据</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>无法加载数据</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>© 2024 村级信息管理系统. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
