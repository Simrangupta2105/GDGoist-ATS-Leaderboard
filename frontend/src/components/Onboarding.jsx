import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Onboarding() {
  const [department, setDepartment] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, apiCall, setUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user already has onboarding data
    if (user?.department && user?.graduationYear) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiCall('/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          department,
          graduationYear: parseInt(graduationYear)
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Update user data
        setUser({ ...user, department, graduationYear: parseInt(graduationYear) })
        navigate('/dashboard')
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Network error')
    }

    setLoading(false)
  }

  const departments = [
    // Undergraduate Programs
    'Computer Science & Engineering (CSE)',
    'CSE - AI & Machine Learning',
    'CSE - Data Science',
    'CSE - Computer Science & Business Systems',
    'Information Technology (IT)',
    'Electronics & Communication Engineering (ECE)',
    'Electrical & Electronics Engineering (EEE)',
    'Mechanical Engineering (ME)',
    'Civil Engineering (CE)',
    'Basic Science Engineering (BSE)',
    // Postgraduate Programs
    'Master of Computer Applications (MCA)',
    'M.Tech - Machine Design',
    'M.Tech - Power Systems',
    'M.Tech - Construction Technology & Management',
    'M.Tech - Digital Communications',
    'M.Tech - CSE (AI & ML)',
    'Other'
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i)

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <span className="text-2xl">👤</span>
          </div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.875rem', fontWeight: 800 }}>
            Complete Your Profile
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Tell us about your academic background
          </p>
        </div>

        <form
          className="mt-8 space-y-6 card p-6"
          onSubmit={handleSubmit}
        >
          {error && (
            <div
              className="px-4 py-3"
              style={{
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--accent-danger)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--accent-danger)'
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="department"
                style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}
              >
                Department
              </label>
              <select
                id="department"
                name="department"
                required
                className="block w-full px-4 py-3"
                style={{
                  backgroundColor: 'var(--bg-card-soft)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">Select your department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="graduationYear"
                style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}
              >
                Expected Graduation Year
              </label>
              <select
                id="graduationYear"
                name="graduationYear"
                required
                className="block w-full px-4 py-3"
                style={{
                  backgroundColor: 'var(--bg-card-soft)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
              >
                <option value="">Select graduation year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 font-semibold"
              style={{
                backgroundColor: loading ? 'var(--border-subtle)' : 'var(--accent-primary)',
                color: 'white',
                borderRadius: 'var(--radius-lg)',
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}