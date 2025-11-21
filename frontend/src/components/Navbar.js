import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        刷题平台
      </Link>
      <div className="navbar-nav">
        {isAuthenticated ? (
          <>
            <span>欢迎, {user?.username}</span>
            <button className="btn btn-secondary" onClick={handleLogout}>
              退出登录
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>
              登录
            </Link>
            <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>
              注册
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
