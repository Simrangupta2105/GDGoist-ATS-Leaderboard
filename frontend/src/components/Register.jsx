import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import gdgLogo from '../assets/gdg-logo.png'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const result = await register(name, email, password)

    if (result.success) {
      navigate('/onboarding')
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
            Start tracking your career readiness today
          </p>
        </div>

        {/* Registration Form */}
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

            {/* Name Input */}
            <div>
              <label htmlFor="name" className="label-premium">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input-premium"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="label-premium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-premium"
                placeholder="you@example.com"
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
                required
                className="input-premium"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1.5 text-small" style={{ color: 'var(--text-muted)' }}>
                Must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="label-premium">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input-premium"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="spinner-premium mr-2"></span>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider-premium"></div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-small" style={{ color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold hover:underline"
                style={{ color: '#84592B' }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <p className="text-small" style={{ color: 'var(--text-muted)' }}>
            By creating an account, you'll be able to track your ATS score and compete on the leaderboard
          </p>
        </div>
      </div>
    </div>
  )
}