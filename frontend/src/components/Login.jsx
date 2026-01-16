import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import gdgLogo from '../assets/gdg-logo.png'

export default function Login() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState('student') // 'student' or 'admin'
  const [authMode, setAuthMode] = useState('login') // 'login' or 'register'
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Admin registration mode
    if (authMode === 'register' && loginType === 'admin') {
      // Validate password confirmation
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      const result = await register(name, email, password)

      if (result.success) {
        const userRole = result.user?.role || 'student'

        // Check if user was actually assigned admin role
        if (userRole !== 'admin') {
          setError('This email is not authorized for admin registration. Please use an institutional email (@oist.edu, @college.ac.in) or contact your administrator.')
          setLoading(false)
          return
        }

        // Admin registration successful - redirect to admin dashboard
        navigate('/admin')
      } else {
        setError(result.error)
      }
      setLoading(false)
      return
    }

    // Login mode (student or admin)
    const result = await login(email, password)

    if (result.success) {
      // Role-aware redirect
      const userRole = result.user?.role || 'student'

      if (loginType === 'admin') {
        // Admin login selected
        if (userRole === 'admin') {
          // Authorized admin - redirect to admin dashboard
          navigate('/admin')
        } else {
          // Not authorized as admin
          setError('This email is not authorized for admin access. Please use an institutional email or contact your administrator.')
          setLoading(false)
          return
        }
      } else {
        // Student login selected
        if (userRole === 'admin') {
          // Admin trying to login as student - redirect to admin dashboard
          navigate('/admin')
        } else {
          // Regular student login
          navigate('/dashboard')
        }
      }
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        {/* Header Section - Centered */}
        <div className="text-center mb-10 animate-fadeIn">
          {/* GDG Logo - Centered, Larger */}
          <div className="flex justify-center mb-6">
            <img
              src={gdgLogo}
              alt="GDG Logo"
              className="h-16 w-16 object-contain opacity-90"
            />
          </div>

          {/* Product Branding */}
          <h1 className="text-heading mb-2" style={{ color: 'var(--text-primary)' }}>
            ATS Leaderboard
          </h1>
          <p className="text-small mb-6" style={{ color: 'var(--text-muted)' }}>
            GDG on Campus OIST
          </p>

          {/* Welcome Message */}
          <p className="text-body" style={{ color: 'var(--text-muted)' }}>
            {loginType === 'admin'
              ? (authMode === 'register' ? 'Admin & Organizer Registration' : 'Admin & Organizer Access')
              : (authMode === 'register' ? 'Create your account' : 'Sign in to access your employability dashboard')}
          </p>
        </div>

        {/* Login Type Toggle */}
        <div className="mb-6 animate-fadeIn">
          <div
            className="flex rounded-lg p-1"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setLoginType('student')
                setAuthMode('login')
                setError('')
              }}
              className={`flex-1 py-2.5 px-4 rounded-md text-small font-semibold transition-all ${loginType === 'student'
                  ? 'bg-white dark:bg-slate-700 shadow-sm'
                  : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              style={{
                color: loginType === 'student' ? '#84592B' : 'var(--text-muted)',
                borderColor: loginType === 'student' ? 'var(--border-color)' : 'transparent'
              }}
            >
              Student Login
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType('admin')
                setError('')
              }}
              className={`flex-1 py-2.5 px-4 rounded-md text-small font-semibold transition-all ${loginType === 'admin'
                  ? 'bg-white dark:bg-slate-700 shadow-sm'
                  : 'hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              style={{
                color: loginType === 'admin' ? '#84592B' : 'var(--text-muted)',
                borderColor: loginType === 'admin' ? 'var(--border-color)' : 'transparent'
              }}
            >
              Admin / Organizer
            </button>
          </div>
        </div>

        {/* Admin Auth Mode Toggle (Sign in / Register) */}
        {loginType === 'admin' && (
          <div className="mb-6 animate-fadeIn">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login')
                  setError('')
                }}
                className={`flex-1 py-2 px-4 rounded-md text-small font-medium transition-all ${authMode === 'login'
                    ? 'bg-caramel text-white'
                    : 'bg-transparent border border-gray-300 hover:bg-gray-50'
                  }`}
                style={{
                  color: authMode === 'login' ? 'white' : 'var(--text-secondary)'
                }}
              >
                Sign in as Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register')
                  setError('')
                }}
                className={`flex-1 py-2 px-4 rounded-md text-small font-medium transition-all ${authMode === 'register'
                    ? 'bg-caramel text-white'
                    : 'bg-transparent border border-gray-300 hover:bg-gray-50'
                  }`}
                style={{
                  color: authMode === 'register' ? 'white' : 'var(--text-secondary)'
                }}
              >
                Register as Admin
              </button>
            </div>
          </div>
        )}

        {/* Login/Register Form */}
        <div className="card-elevated animate-scaleIn" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="error-message animate-fadeIn">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Admin Registration Notice */}
            {loginType === 'admin' && authMode === 'register' && (
              <div
                className="p-3 rounded-lg animate-fadeIn"
                style={{
                  backgroundColor: 'rgba(132, 89, 43, 0.1)',
                  border: '1px solid rgba(132, 89, 43, 0.2)'
                }}
              >
                <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
                  <strong>Admin Registration:</strong> Only institutional emails (@oist.edu, @college.ac.in) or whitelisted addresses can register as admin.
                </p>
              </div>
            )}

            {/* Admin Login Notice */}
            {loginType === 'admin' && authMode === 'login' && (
              <div
                className="p-3 rounded-lg animate-fadeIn"
                style={{
                  backgroundColor: 'rgba(132, 89, 43, 0.1)',
                  border: '1px solid rgba(132, 89, 43, 0.2)'
                }}
              >
                <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
                  <strong>Admin Access:</strong> Use your institutional email (@oist.edu, @college.ac.in) or authorized organizer account.
                </p>
              </div>
            )}

            {/* Name Input (Registration only) */}
            {authMode === 'register' && (
              <div>
                <label htmlFor="name" className="label-premium">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input-premium"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="label-premium">
                {loginType === 'admin' ? 'Institutional Email' : 'Email address'}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-premium"
                placeholder={loginType === 'admin' ? 'admin@oist.edu' : 'you@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="label-premium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                required
                className="input-premium"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Confirm Password (Registration only) */}
            {authMode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="label-premium">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input-premium"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="spinner-premium mr-2"></span>
                  {authMode === 'register' ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                authMode === 'register'
                  ? (loginType === 'admin' ? 'Register as Admin' : 'Create Account')
                  : (loginType === 'admin' ? 'Sign in as Admin' : 'Sign in')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider-premium"></div>

          {/* Sign Up Link - Only for Student Login */}
          {loginType === 'student' && (
            <div className="text-center">
              <p className="text-small" style={{ color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold hover:underline"
                  style={{ color: '#84592B' }}
                >
                  Create one
                </Link>
              </p>
            </div>
          )}

          {/* Admin Help Text */}
          {loginType === 'admin' && (
            <div className="text-center">
              <p className="text-small" style={{ color: 'var(--text-muted)' }}>
                Need admin access?{' '}
                <a
                  href="mailto:admin@oist.edu"
                  className="font-semibold hover:underline"
                  style={{ color: '#84592B' }}
                >
                  Contact your administrator
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <p className="text-small" style={{ color: 'var(--text-muted)' }}>
            {loginType === 'admin'
              ? 'Institutional analytics and insights platform'
              : 'Track your career readiness with AI-powered insights'}
          </p>
        </div>
      </div>
    </div>
  )
}