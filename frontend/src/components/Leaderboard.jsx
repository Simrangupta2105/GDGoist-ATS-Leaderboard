import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Leaderboard() {
  const navigate = useNavigate()
  const [leaderboardData, setLeaderboardData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    department: '',
    graduationYear: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0
  })

  useEffect(() => {
    fetchLeaderboard()
  }, [filters, pagination.page])

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (filters.department) {
        params.append('department', filters.department)
      }
      if (filters.graduationYear) {
        params.append('graduationYear', filters.graduationYear)
      }

      const response = await fetch(`http://localhost:4000/leaderboard?${params}`)
      const data = await response.json()

      if (response.ok) {
        setLeaderboardData(data.entries || [])
        setPagination(prev => ({
          ...prev,
          totalCount: data.totalCount || 0
        }))
      } else {
        setError('Failed to fetch leaderboard data')
      }
    } catch (error) {
      console.error('Leaderboard fetch error:', error)
      setError('Network error while fetching leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setPagination(prev => ({
      ...prev,
      page: 1
    }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }))
  }

  const totalPages = Math.ceil(pagination.totalCount / pagination.limit)

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

  const getRankStyle = (rank) => {
    if (rank === 1) return { backgroundColor: '#D4A053', color: '#1A1A18' }
    if (rank === 2) return { backgroundColor: '#8B8B88', color: 'white' }
    if (rank === 3) return { backgroundColor: '#CD7F32', color: 'white' }
    if (rank <= 10) return { backgroundColor: 'var(--accent-primary)', color: 'white' }
    return { backgroundColor: 'var(--bg-card-soft)', color: 'var(--text-muted)' }
  }

  return (
    <div className="page-transition" style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <span className="text-white text-xl">🏆</span>
              </div>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Leaderboard
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  See how you rank against your peers in employability scores.
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card px-6 py-6 mb-8">
            <div className="flex items-center mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <span className="text-white text-sm">🔍</span>
              </div>
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.125rem' }}>
                Filter Results
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="department"
                  style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}
                >
                  Department
                </label>
                <select
                  id="department"
                  className="block w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-card-soft)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    fontWeight: 500
                  }}
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <option value="">All Departments</option>
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
                  Graduation Year
                </label>
                <select
                  id="graduationYear"
                  className="block w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-card-soft)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    fontWeight: 500
                  }}
                  value={filters.graduationYear}
                  onChange={(e) => handleFilterChange('graduationYear', e.target.value)}
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({ department: '', graduationYear: '' })
                    setPagination(prev => ({ ...prev, page: 1 }))
                  }}
                  className="w-full py-3 px-4 font-semibold"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                    borderRadius: 'var(--radius-lg)'
                  }}
                >
                  🗑️ Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.125rem' }}>
                Rankings
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {pagination.totalCount > 0
                  ? `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.totalCount)} of ${pagination.totalCount} results`
                  : 'No results found'
                }
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
              </div>
            ) : error ? (
              <div className="px-6 py-5">
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
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div style={{ color: 'var(--text-muted)' }}>
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 style={{ marginTop: '0.5rem', color: 'var(--text-primary)', fontWeight: 500 }}>No rankings yet</h3>
                  <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Be the first to upload your resume and appear on the leaderboard!
                  </p>
                </div>
              </div>
            ) : (
              <ul>
                {leaderboardData.map((entry, index) => (
                  <li
                    key={index}
                    className="px-6 py-4 transition-colors cursor-pointer"
                    style={{
                      borderBottom: index < leaderboardData.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      backgroundColor: 'transparent'
                    }}
                    onClick={() => entry.userId && navigate(`/profile/${entry.userId}`)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-soft)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {entry.profilePicture ? (
                            <div className="relative">
                              <img
                                src={entry.profilePicture}
                                alt={entry.name}
                                className="w-10 h-10 rounded-full object-cover"
                                style={{ border: '2px solid var(--border-subtle)' }}
                              />
                              <span
                                className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full"
                                style={{
                                  ...getRankStyle(entry.rank),
                                  border: '2px solid var(--bg-card)'
                                }}
                              >
                                {entry.rank}
                              </span>
                            </div>
                          ) : (
                            <span
                              className="inline-flex items-center px-3 py-1 text-sm font-semibold"
                              style={{
                                ...getRankStyle(entry.rank),
                                borderRadius: 'var(--radius-lg)'
                              }}
                            >
                              #{entry.rank}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex flex-col">
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                              {entry.name || 'Anonymous'}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                              {entry.department || 'Unknown Department'} • Class of {entry.graduationYear || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right">
                          <p style={{ color: 'var(--accent-primary)', fontSize: '1.5rem', fontWeight: 700 }}>
                            {entry.totalScore || 0}
                          </p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Score</p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--bg-card-soft)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-lg)',
                      opacity: pagination.page === 1 ? 0.5 : 1
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    className="ml-3 px-4 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--bg-card-soft)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-lg)',
                      opacity: pagination.page === totalPages ? 0.5 : 1
                    }}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Page <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pagination.page}</span> of{' '}
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalPages}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 text-sm font-medium"
                      style={{
                        backgroundColor: pagination.page === 1 ? 'var(--bg-card-soft)' : 'var(--accent-primary)',
                        color: pagination.page === 1 ? 'var(--text-muted)' : 'white',
                        borderRadius: 'var(--radius-lg)',
                        opacity: pagination.page === 1 ? 0.5 : 1,
                        cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === totalPages}
                      className="px-4 py-2 text-sm font-medium"
                      style={{
                        backgroundColor: pagination.page === totalPages ? 'var(--bg-card-soft)' : 'var(--accent-primary)',
                        color: pagination.page === totalPages ? 'var(--text-muted)' : 'white',
                        borderRadius: 'var(--radius-lg)',
                        opacity: pagination.page === totalPages ? 0.5 : 1,
                        cursor: pagination.page === totalPages ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}