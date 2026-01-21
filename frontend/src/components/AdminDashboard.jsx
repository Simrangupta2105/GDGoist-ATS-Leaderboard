import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminBadgeManager from './AdminBadgeManager'

export default function AdminDashboard() {
    const { apiCall } = useAuth()
    const [loading, setLoading] = useState(true)
    const [platformStats, setPlatformStats] = useState(null)
    const [cohorts, setCohorts] = useState([])
    const [atRiskCohorts, setAtRiskCohorts] = useState([])
    const [users, setUsers] = useState([])
    const [usersPagination, setUsersPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 })
    const [searchQuery, setSearchQuery] = useState('')
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('overview')

    // Badge Assignment State
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [availableBadges, setAvailableBadges] = useState([])
    const [selectedBadgeId, setSelectedBadgeId] = useState('')
    const [assigning, setAssigning] = useState(false)

    const fetchAdminData = useCallback(async () => {
        try {

            const statsRes = await apiCall('/admin/analytics/platform')
            if (statsRes.ok) {
                const data = await statsRes.json()
                setPlatformStats(data)
            }

            const cohortsRes = await apiCall('/admin/analytics/cohorts')
            if (cohortsRes.ok) {
                const data = await cohortsRes.json()
                setCohorts(data.cohorts || [])
            }

            const atRiskRes = await apiCall('/admin/analytics/at-risk')
            if (atRiskRes.ok) {
                const data = await atRiskRes.json()
                setAtRiskCohorts(data.atRiskCohorts || [])
            }

            setLoading(false)
        } catch (err) {
            console.error('Admin data fetch error:', err)
            setError('Failed to load admin analytics')
            setLoading(false)
        }
    }, [apiCall])

    const fetchUsers = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                page: usersPagination.page.toString(),
                limit: '20',
                search: searchQuery
            })

            const res = await apiCall(`/admin/users?${params}`)
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users || [])
                setUsersPagination({
                    page: data.page,
                    totalPages: data.totalPages,
                    totalCount: data.totalCount
                })
            }
        } catch (err) {
            console.error('Users fetch error:', err)
        }
    }, [apiCall, usersPagination.page, searchQuery])

    useEffect(() => {
        fetchAdminData()
    }, [fetchAdminData])

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers()
        }
    }, [activeTab, fetchUsers])

    const handleExport = async () => {
        try {
            const res = await apiCall('/admin/users/export')
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `users_export_${Date.now()}.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                setError('Failed to export CSV')
            }
        } catch (err) {
            console.error('Export failed', err)
            setError('Failed to export CSV')
        }
    }

    const handleSearch = () => {
        setUsersPagination(prev => ({ ...prev, page: 1 }))
        fetchUsers()
    }

    const handleAssignClick = async (user) => {
        setSelectedUser(user)
        setShowAssignModal(true)
        setSelectedBadgeId('')

        try {
            const res = await apiCall('/badges/all')
            if (res.ok) {
                const data = await res.json()
                // The API returns either an array or { badges: [...] }
                setAvailableBadges(Array.isArray(data) ? data : (data.badges || []))
            }
        } catch (err) {
            console.error('Failed to fetch available badges', err)
        }
    }

    const handleBadgeAssignSubmit = async (e) => {
        e.preventDefault()
        if (!selectedUser || !selectedBadgeId) return

        setAssigning(true)
        try {
            const res = await apiCall(`/admin/users/${selectedUser.id}/badges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ badgeDefinitionId: selectedBadgeId })
            })

            if (res.ok) {
                setShowAssignModal(false)
                // Refresh user list to show updated score
                fetchUsers()
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to assign badge')
            }
        } catch (err) {
            console.error('Badge assignment error:', err)
            setError('Failed to assign badge')
        } finally {
            setAssigning(false)
        }
    }

    const handleRemoveBadge = async (userId, badgeId) => {
        if (!window.confirm('Are you sure you want to remove this badge? Point deduction will occur.')) return

        try {
            const res = await apiCall(`/admin/users/${userId}/badges/${badgeId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                fetchUsers()
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to remove badge')
            }
        } catch (err) {
            console.error('Error removing badge:', err)
            alert('Failed to remove badge: Network or Server Error')
        }
    }


    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-app)' }}
            >
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-10 w-10 mx-auto mb-4 border-b-2"
                        style={{ borderColor: 'var(--accent-primary)' }}
                    />
                    <p style={{ color: 'var(--text-muted)' }}>
                        Loading analytics...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <p style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 500 }}>
                                Admin Dashboard
                            </p>
                            <h1 style={{ color: 'var(--text-primary)', fontSize: '2rem', fontWeight: 700 }}>
                                Platform Analytics
                            </h1>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Privacy-compliant · No PII exposed
                        </p>
                    </div>
                </header>

                {/* Tab Navigation */}
                <div
                    className="flex gap-2 mb-8 p-1"
                    style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}
                >
                    {['overview', 'users', 'analytics', 'badges'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-4 text-sm font-medium transition-all ${activeTab === tab ? 'shadow-sm' : ''}`}
                            style={{
                                backgroundColor: activeTab === tab ? 'var(--bg-elevated)' : 'transparent',
                                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                                borderRadius: 'var(--radius-lg)',
                            }}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {error && (
                    <div
                        className="mb-8 p-4"
                        style={{
                            backgroundColor: 'var(--danger-bg)',
                            borderRadius: 'var(--radius-lg)',
                            color: 'var(--accent-danger)'
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        {/* Platform Stats Grid */}
                        {platformStats && (
                            <div className="mb-10">
                                <h2 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                                    Platform Overview
                                </h2>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard label="Total Users" value={platformStats.platform?.totalUsers || 0} accent />
                                    <StatCard label="Scored Users" value={platformStats.platform?.totalScores || 0} />
                                    <StatCard label="GitHub Connections" value={platformStats.platform?.totalGitHubConnections || 0} />
                                    <StatCard label="Engagement Rate" value={`${platformStats.platform?.engagementRate || 0}%`} />
                                </div>

                                {/* Average Scores */}
                                <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                                        Platform Averages
                                    </h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <MiniStatCard label="Total Score" value={platformStats.averageScores?.total || 0} />
                                        <MiniStatCard label="ATS Score" value={platformStats.averageScores?.ats || 0} />
                                        <MiniStatCard label="GitHub Score" value={platformStats.averageScores?.github || 0} />
                                        <MiniStatCard label="Badges Score" value={platformStats.averageScores?.badges || 0} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* At-Risk Cohorts */}
                        {atRiskCohorts.length > 0 && (
                            <div className="mb-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 style={{ color: 'var(--accent-danger)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        At-Risk Cohorts
                                    </h2>
                                    <span
                                        className="px-2 py-1"
                                        style={{
                                            backgroundColor: 'var(--danger-bg)',
                                            color: 'var(--accent-danger)',
                                            borderRadius: 'var(--radius-lg)',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        {atRiskCohorts.length} cohort{atRiskCohorts.length > 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {atRiskCohorts.map((cohort, idx) => (
                                        <div
                                            key={idx}
                                            className="card p-4"
                                            style={{ borderColor: 'var(--accent-danger)', borderWidth: '1px' }}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div>
                                                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                                        {cohort.cohort?.department} · Class of {cohort.cohort?.graduationYear}
                                                    </div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                        {cohort.totalStudents} students · Avg: {cohort.averageScore}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div style={{ color: 'var(--accent-danger)', fontSize: '1.5rem', fontWeight: 700 }}>
                                                        {cohort.developingPercentage}%
                                                    </div>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                        developing
                                                    </div>
                                                </div>
                                            </div>
                                            {cohort.recommendation && (
                                                <div
                                                    className="mt-3 pt-3"
                                                    style={{
                                                        borderTop: '1px solid var(--border-subtle)',
                                                        color: 'var(--text-secondary)',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    💡 {cohort.recommendation}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cohort Analytics */}
                        <div>
                            <h2 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                                Cohort Breakdown
                            </h2>

                            {cohorts.length === 0 ? (
                                <div className="card p-8 text-center">
                                    <p style={{ color: 'var(--text-muted)' }}>
                                        No cohort data available yet
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cohorts.map((cohort, idx) => (
                                        <CohortCard key={idx} cohort={cohort} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>
                                All Users {`(${usersPagination.totalCount})`}
                            </h2>
                            <button
                                onClick={handleExport}
                                className="px-4 py-2 font-medium flex items-center gap-2"
                                style={{
                                    backgroundColor: 'var(--bg-card-soft)',
                                    color: 'var(--text-primary)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border-subtle)'
                                }}
                            >
                                <span>📥</span> Export CSV
                            </button>
                        </div>

                        {/* Search */}
                        <div className="flex gap-3 mb-6">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1 px-4 py-3"
                                style={{
                                    backgroundColor: 'var(--bg-card-soft)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-lg)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <button
                                onClick={handleSearch}
                                className="px-6 py-3 font-semibold"
                                style={{
                                    backgroundColor: 'var(--accent-primary)',
                                    color: 'white',
                                    borderRadius: 'var(--radius-lg)'
                                }}
                            >
                                Search
                            </button>
                        </div>

                        {/* Users List */}
                        <div className="space-y-3">
                            {users.length === 0 ? (
                                <div className="card p-8 text-center">
                                    <p style={{ color: 'var(--text-muted)' }}>No users found</p>
                                </div>
                            ) : (
                                users.map((user) => (
                                    <UserCard key={user.id} user={user} handleAssignClick={handleAssignClick} handleRemoveBadge={handleRemoveBadge} />
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {usersPagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-6">
                                <button
                                    onClick={() => setUsersPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={usersPagination.page === 1}
                                    className="px-4 py-2 font-medium"
                                    style={{
                                        backgroundColor: usersPagination.page === 1 ? 'var(--bg-card-soft)' : 'var(--accent-primary)',
                                        color: usersPagination.page === 1 ? 'var(--text-muted)' : 'white',
                                        borderRadius: 'var(--radius-lg)',
                                        opacity: usersPagination.page === 1 ? 0.5 : 1
                                    }}
                                >
                                    Previous
                                </button>
                                <span style={{ color: 'var(--text-muted)' }}>
                                    Page {usersPagination.page} of {usersPagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setUsersPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={usersPagination.page === usersPagination.totalPages}
                                    className="px-4 py-2 font-medium"
                                    style={{
                                        backgroundColor: usersPagination.page === usersPagination.totalPages ? 'var(--bg-card-soft)' : 'var(--accent-primary)',
                                        color: usersPagination.page === usersPagination.totalPages ? 'var(--text-muted)' : 'white',
                                        borderRadius: 'var(--radius-lg)',
                                        opacity: usersPagination.page === usersPagination.totalPages ? 0.5 : 1
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Analytics / Best Practices Tab */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <BestPracticeCard
                            icon="🔒"
                            title="Data Privacy"
                            items={[
                                "User PII is never exposed in analytics views",
                                "All admin actions are logged for audit purposes",
                                "Export only aggregated, anonymized data",
                                "Respect user consent and right to erasure"
                            ]}
                        />
                        <BestPracticeCard
                            icon="📊"
                            title="At-Risk Cohort Actions"
                            items={[
                                "Schedule career workshops for developing cohorts",
                                "Provide resume review sessions",
                                "Offer GitHub portfolio building workshops",
                                "Create peer mentorship programs with advanced students"
                            ]}
                        />
                        <BestPracticeCard
                            icon="🎯"
                            title="Engagement Strategies"
                            items={[
                                "Send reminders to users without uploaded resumes",
                                "Celebrate top performers on leaderboard",
                                "Create badge challenges to encourage participation",
                                "Track trends to measure program effectiveness"
                            ]}
                        />
                        <BestPracticeCard
                            icon="⚖️"
                            title="Compliance Notes"
                            items={[
                                "DPDP Act compliance: obtain consent before processing",
                                "Right to erasure: users can request data deletion",
                                "Data minimization: only collect necessary information",
                                "Regular data audits recommended quarterly"
                            ]}
                        />
                    </div>
                )}

                {/* Badges Tab */}
                {activeTab === 'badges' && (
                    <AdminBadgeManager />
                )}

                {/* Assign Badge Modal */}
                {showAssignModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg max-w-md w-full" style={{ backgroundColor: 'var(--bg-card)' }}>
                            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                                Assign Badge to {selectedUser?.name}
                            </h3>
                            <form onSubmit={handleBadgeAssignSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Select Badge</label>
                                    <select
                                        className="input-field w-full"
                                        value={selectedBadgeId}
                                        onChange={(e) => setSelectedBadgeId(e.target.value)}
                                        required
                                        style={{
                                            backgroundColor: 'var(--bg-card-soft)',
                                            color: 'var(--text-primary)',
                                            borderColor: 'var(--border-subtle)'
                                        }}
                                    >
                                        <option value="">-- Select Badge --</option>
                                        {availableBadges.map(b => (
                                            <option key={b._id} value={b._id}>{b.name} ({b.points} pts)</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignModal(false)}
                                        className="px-4 py-2 text-sm rounded-lg"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={assigning}
                                        className="btn-primary"
                                    >
                                        {assigning ? 'Assigning...' : 'Assign Badge'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// User Card Component - Name on top, Department + Class of Year below
function UserCard({ user, handleAssignClick, handleRemoveBadge }) {
    return (
        <div className="card p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                        {user.profilePicture ? (
                            <img
                                src={user.profilePicture}
                                alt={user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.insertAdjacentHTML('afterend', `<span style="color: white; font-weight: 600; font-size: 1.125rem">${user.name?.charAt(0)?.toUpperCase() || '?'}</span>`);
                                }}
                            />
                        ) : (
                            <span style={{ color: 'white', fontWeight: 600, fontSize: '1.125rem' }}>
                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                        )}
                    </div>
                    <div>
                        {/* Name on top */}
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem' }}>
                            {user.name}
                        </div>
                        {/* Department + Class of Year below */}
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {user.department} {user.graduationYear ? `• Class of ${user.graduationYear}` : ''}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => handleAssignClick(user)}
                        className="text-xs px-3 py-1 mr-2 rounded border hover:bg-gray-50 transition-colors"
                        style={{
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--accent-primary)',
                            backgroundColor: 'transparent'
                        }}
                    >
                        + Badge
                    </button>
                    <div className="text-right">
                        <div style={{ color: 'var(--accent-primary)', fontSize: '1.5rem', fontWeight: 700 }}>
                            {user.totalScore}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            Total Score
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {user.hasResume && (
                            <span
                                className="px-2 py-1"
                                style={{
                                    backgroundColor: 'var(--accent-success)',
                                    color: 'white',
                                    borderRadius: 'var(--radius-lg)',
                                    fontSize: '0.625rem',
                                    fontWeight: 600
                                }}
                            >
                                Resume
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Badges List */}
            {user.badges && user.badges.length > 0 && (
                <div className="mt-3 pt-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {user.badges.map(badge => (
                        <div
                            key={badge._id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                            style={{
                                backgroundColor: 'var(--bg-card-soft)',
                                border: '1px solid var(--border-subtle)'
                            }}
                        >
                            {badge.definition?.icon && (
                                <img
                                    src={badge.definition.icon}
                                    alt=""
                                    className="w-4 h-4 object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.insertAdjacentHTML('afterend', '<span style="font-size: 0.75rem">🏅</span>');
                                    }}
                                />
                            )}
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                                {badge.definition?.name || badge.badgeType}
                            </span>
                            <button
                                onClick={() => handleRemoveBadge && handleRemoveBadge(user.id, badge._id)}
                                className="ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                                title="Remove Badge"
                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
                                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Cohort Card Component
function CohortCard({ cohort }) {
    return (
        <div className="card p-6">
            {/* Cohort Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h3 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 600 }}>
                        {cohort.cohort?.department}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Class of {cohort.cohort?.graduationYear} · {cohort.metrics?.totalStudents} students
                    </p>
                </div>
                <div className="text-right">
                    <div style={{ color: 'var(--accent-primary)', fontSize: '1.75rem', fontWeight: 700 }}>
                        {cohort.metrics?.averageScores?.total || 0}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        avg score
                    </div>
                </div>
            </div>

            {/* Score Breakdown */}
            <div
                className="grid grid-cols-3 gap-4 pb-6 mb-6"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
                <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', fontWeight: 600 }}>
                        {cohort.metrics?.averageScores?.ats || 0}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ATS</div>
                </div>
                <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', fontWeight: 600 }}>
                        {cohort.metrics?.averageScores?.github || 0}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>GitHub</div>
                </div>
                <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', fontWeight: 600 }}>
                        {cohort.metrics?.averageScores?.badges || 0}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Badges</div>
                </div>
            </div>

            {/* Distribution */}
            <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.75rem' }}>
                    Score Distribution
                </div>
                <div className="flex gap-3">
                    <DistributionBadge
                        label="Developing"
                        value={cohort.metrics?.distribution?.developing?.percentage || 0}
                        variant="danger"
                    />
                    <DistributionBadge
                        label="Progressing"
                        value={cohort.metrics?.distribution?.progressing?.percentage || 0}
                        variant="warning"
                    />
                    <DistributionBadge
                        label="Advanced"
                        value={cohort.metrics?.distribution?.advanced?.percentage || 0}
                        variant="success"
                    />
                </div>
            </div>
        </div>
    )
}

// Stat Card Component
function StatCard({ label, value, accent = false }) {
    return (
        <div className="card p-4">
            <div
                style={{
                    color: accent ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontSize: '2rem',
                    fontWeight: 700,
                    marginBottom: '0.25rem'
                }}
            >
                {value}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {label}
            </div>
        </div>
    )
}

// Mini Stat Card
function MiniStatCard({ label, value }) {
    return (
        <div
            className="p-4"
            style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)' }}
        >
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', fontWeight: 600 }}>
                {value}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {label}
            </div>
        </div>
    )
}

// Distribution Badge
function DistributionBadge({ label, value, variant }) {
    const colors = {
        danger: { bg: 'var(--danger-bg)', color: 'var(--accent-danger)' },
        warning: { bg: 'rgba(212, 160, 83, 0.15)', color: 'var(--accent-primary)' },
        success: { bg: 'rgba(139, 154, 91, 0.15)', color: 'var(--accent-success)' },
    }

    const { bg, color } = colors[variant] || colors.warning

    return (
        <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ backgroundColor: bg, borderRadius: 'var(--radius-lg)' }}
        >
            <span style={{ color, fontSize: '0.875rem', fontWeight: 600 }}>
                {value}%
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {label}
            </span>
        </div>
    )
}

// Best Practice Card
function BestPracticeCard({ icon, title, items }) {
    return (
        <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                    <span className="text-xl">{icon}</span>
                </div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 600 }}>
                    {title}
                </h3>
            </div>
            <ul className="space-y-2">
                {items.map((item, idx) => (
                    <li
                        key={idx}
                        className="flex items-start gap-2"
                        style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}
                    >
                        <span style={{ color: 'var(--accent-primary)' }}>•</span>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    )
}
