import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import gdgLogo from '../assets/gdg-logo.png'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-sm"
      style={{
        backgroundColor: 'rgba(var(--bg-primary-rgb, 250, 249, 247), 0.8)',
        borderBottom: '1px solid var(--border-color)'
      }}
    >
      <div className="container-premium">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section - Left Aligned */}
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {/* GDG Logo Image - Subtle, Non-Dominant */}
            <img
              src={gdgLogo}
              alt="GDG Logo"
              className="h-8 w-8 object-contain flex-shrink-0 opacity-75"
            />

            {/* Product Branding */}
            <div className="flex flex-col leading-tight">
              <span
                className="text-base font-semibold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                ATS Leaderboard
              </span>
              <span
                className="text-xs font-normal"
                style={{ color: 'var(--text-muted)', opacity: 0.65 }}
              >
                GDG on Campus OIST
              </span>
            </div>
          </Link>

          {/* Navigation Links - Minimal */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-lg font-medium text-small transition-all ${isActive('/dashboard')
                ? 'bg-caramel text-white'
                : 'hover:bg-opacity-5 hover:bg-caramel'
                }`}
              style={!isActive('/dashboard') ? { color: 'var(--text-secondary)' } : {}}
            >
              Dashboard
            </Link>
            <Link
              to="/leaderboard"
              className={`px-4 py-2 rounded-lg font-medium text-small transition-all ${isActive('/leaderboard')
                ? 'bg-caramel text-white'
                : 'hover:bg-opacity-5 hover:bg-caramel'
                }`}
              style={!isActive('/leaderboard') ? { color: 'var(--text-secondary)' } : {}}
            >
              Leaderboard
            </Link>
            {/* Admin Dashboard - Only for admin users */}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg font-medium text-small transition-all ${isActive('/admin')
                  ? 'bg-caramel text-white'
                  : 'hover:bg-opacity-5 hover:bg-caramel'
                  }`}
                style={!isActive('/admin') ? { color: 'var(--text-secondary)' } : {}}
              >
                Admin
              </Link>
            )}
          </div>

          {/* User Section - Understated */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* User Info - Subtle */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: '#84592B' }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-small font-medium" style={{ color: 'var(--text-secondary)' }}>
                {user?.name}
              </span>
            </div>

            {/* Logout - Minimal */}
            <button
              onClick={logout}
              className="text-small font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-opacity-5 hover:bg-wine"
              style={{ color: 'var(--text-muted)' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
