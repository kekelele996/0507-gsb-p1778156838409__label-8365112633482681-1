import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import { Home, Shield, Menu, X } from 'lucide-react';

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mr-2">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    村级信息管理系统
                  </span>
                </Link>
              </div>
            </div>

            <div className="hidden sm:flex sm:items-center sm:space-x-3">
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-sm font-medium rounded-lg text-white hover:from-purple-700 hover:to-indigo-700 transition shadow-md"
              >
                <Shield className="w-4 h-4 mr-2" />
                登录
              </Link>
            </div>

            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="sm:hidden border-t border-gray-200">
            <div className="pt-2 pb-3 space-y-1 px-4">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-3 py-2 text-base font-medium rounded-lg transition text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Home className="w-5 h-5 mr-3" />
                首页
              </Link>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-3 py-2 text-base font-medium rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              >
                <Shield className="w-5 h-5 mr-3" />
                登录
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

// 内部路由组件，可以访问 location
function AppRoutes() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  // 每次路由变化时检查用户登录状态
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, [location]);

  return (
    <>
      {/* 只有未登录时才显示全局导航栏，登录后 AdminPanel 有自己的导航 */}
      {!user && <Navigation />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
