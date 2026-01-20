import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import gdgLogo from '../assets/gdg-logo.png'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/leaderboard', label: 'Leaderboard' },
  ]

  // Add admin link for admin users
  if (user?.role === 'admin') {
    navLinks.push({ path: '/admin', label: 'Admin' })
  }

  return (
    <nav
      className="sticky top-0 z-50 glass-effect"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="container-premium">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-3 group"
          >
            <img
              src={gdgLogo}
              alt="GDG Logo"
              className="h-8 w-8 object-contain opacity-75 group-hover:opacity-100 transition-opacity"
            />
            <div className="hidden sm:flex flex-col">
              <span
                className="text-base font-semibold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                ATS Leaderboard
              </span>
              <span
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                GDG on Campus OIST
              </span>
            </div>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative px-4 py-2 rounded-lg text-small font-medium transition-all"
                style={{
                  color: isActive(link.path)
                    ? 'var(--text-primary)'
                    : 'var(--text-tertiary)',
                  backgroundColor: isActive(link.path)
                    ? 'var(--bg-secondary)'
                    : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(link.path)) {
                    e.currentTarget.style.color = 'var(--text-primary)'
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(link.path)) {
                    e.currentTarget.style.color = 'var(--text-tertiary)'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {link.label}
                {isActive(link.path) && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* User Pill */}
            <Link
              to="/profile/edit"
              className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-opacity-80 transition-colors"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase()
                )}
              </div>
              <span
                className="text-small font-medium max-w-[120px] truncate"
                style={{ color: 'var(--text-secondary)' }}
              >
                {user?.name}
              </span>
            </Link>

            {/* Sign Out */}
            <button
              onClick={logout}
              className="btn-ghost"
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
