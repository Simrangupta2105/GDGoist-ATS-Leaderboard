import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
    const { apiCall } = useAuth()
    const [loading, setLoading] = useState(true)
    const [platformStats, setPlatformStats] = useState(null)
    const [cohorts, setCohorts] = useState([])
    const [atRiskCohorts, setAtRiskCohorts] = useState([])
    const [error, setError] = useState('')

    useEffect(() => {
        fetchAdminData()
    }, [])

    const fetchAdminData = async () => {
        try {
            setLoading(true)
            setError('')

            // Fetch platform stats
            const statsRes = await apiCall('/admin/analytics/platform')
            if (statsRes.ok) {
                const data = await statsRes.json()
                setPlatformStats(data)
            }

            // Fetch cohort analytics
            const cohortsRes = await apiCall('/admin/analytics/cohorts')
            if (cohortsRes.ok) {
                const data = await cohortsRes.json()
                setCohorts(data.cohorts || [])
            }

            // Fetch at-risk cohorts
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
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className="text-center">
                    <div className="spinner-premium mb-4" style={{ width: '40px', height: '40px', borderWidth: '2px' }}></div>
                    <p className="text-body" style={{ color: 'var(--text-muted)' }}>Loading admin analytics...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="container-premium py-10">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-display mb-2" style={{ color: 'var(--text-primary)' }}>
                        Admin Dashboard
                    </h1>
                    <p className="text-body" style={{ color: 'var(--text-muted)' }}>
                        Institutional analytics and insights (Privacy-compliant, NO PII)
                    </p>
                </div>

                {error && (
                    <div className="error-message mb-6">
                        {error}
                    </div>
                )}

                {/* Platform Statistics */}
                {platformStats && (
                    <div className="card-premium mb-8">
                        <h2 className="text-subheading mb-4" style={{ color: 'var(--text-primary)' }}>
                            Platform Statistics
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-2xl font-bold mb-1" style={{ color: '#84592B' }}>
                                    {platformStats.platform.totalUsers}
                                </div>
                                <div className="text-small" style={{ color: 'var(--text-muted)' }}>Total Users</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold mb-1" style={{ color: '#84592B' }}>
                                    {platformStats.platform.totalScores}
                                </div>
                                <div className="text-small" style={{ color: 'var(--text-muted)' }}>Scored Users</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold mb-1" style={{ color: '#84592B' }}>
                                    {platformStats.platform.totalGitHubConnections}
                                </div>
                                <div className="text-small" style={{ color: 'var(--text-muted)' }}>GitHub Connections</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold mb-1" style={{ color: '#84592B' }}>
                                    {platformStats.platform.engagementRate}%
                                </div>
                                <div className="text-small" style={{ color: 'var(--text-muted)' }}>Engagement Rate</div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <h3 className="text-body font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                                Average Scores
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <div className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                        {platformStats.averageScores.total}
                                    </div>
                                    <div className="text-small" style={{ color: 'var(--text-muted)' }}>Total</div>
                                </div>
                                <div>
                                    <div className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                        {platformStats.averageScores.ats}
                                    </div>
                                    <div className="text-small" style={{ color: 'var(--text-muted)' }}>ATS</div>
                                </div>
                                <div>
                                    <div className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                        {platformStats.averageScores.github}
                                    </div>
                                    <div className="text-small" style={{ color: 'var(--text-muted)' }}>GitHub</div>
                                </div>
                                <div>
                                    <div className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                        {platformStats.averageScores.badges}
                                    </div>
                                    <div className="text-small" style={{ color: 'var(--text-muted)' }}>Badges</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* At-Risk Cohorts */}
                {atRiskCohorts.length > 0 && (
                    <div className="card-premium mb-8" style={{ backgroundColor: 'rgba(116, 48, 20, 0.05)', borderColor: 'rgba(116, 48, 20, 0.2)' }}>
                        <h2 className="text-subheading mb-4" style={{ color: '#743014' }}>
                            At-Risk Cohorts
                        </h2>
                        <p className="text-small mb-4" style={{ color: '#8A3D1A' }}>
                            Cohorts with &gt;50% students in "Developing" band (0-40 score range)
                        </p>
                        <div className="space-y-3">
                            {atRiskCohorts.map((cohort, idx) => (
                                <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                {cohort.cohort.department} - Class of {cohort.cohort.graduationYear}
                                            </div>
                                            <div className="text-small" style={{ color: 'var(--text-muted)' }}>
                                                {cohort.totalStudents} students
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold" style={{ color: '#743014' }}>
                                                {cohort.developingPercentage}% developing
                                            </div>
                                            <div className="text-small" style={{ color: 'var(--text-muted)' }}>
                                                Avg: {cohort.averageScore}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-small" style={{ color: '#8A3D1A' }}>
                                        💡 {cohort.recommendation}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cohort Analytics */}
                <div className="card-premium">
                    <h2 className="text-subheading mb-4" style={{ color: 'var(--text-primary)' }}>
                        Cohort Analytics
                    </h2>
                    <div className="space-y-4">
                        {cohorts.length === 0 ? (
                            <p className="text-body" style={{ color: 'var(--text-muted)' }}>
                                No cohort data available yet
                            </p>
                        ) : (
                            cohorts.map((cohort, idx) => (
                                <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-semibold text-body" style={{ color: 'var(--text-primary)' }}>
                                                {cohort.cohort.department} - Class of {cohort.cohort.graduationYear}
                                            </div>
                                            <div className="text-small" style={{ color: 'var(--text-muted)' }}>
                                                {cohort.metrics.totalStudents} students
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold" style={{ color: '#84592B' }}>
                                                {cohort.metrics.averageScores.total}
                                            </div>
                                            <div className="text-small" style={{ color: 'var(--text-muted)' }}>Average Score</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        <div>
                                            <div className="text-small font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                                {cohort.metrics.averageScores.ats}
                                            </div>
                                            <div className="text-small" style={{ color: 'var(--text-muted)' }}>ATS</div>
                                        </div>
                                        <div>
                                            <div className="text-small font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                                {cohort.metrics.averageScores.github}
                                            </div>
                                            <div className="text-small" style={{ color: 'var(--text-muted)' }}>GitHub</div>
                                        </div>
                                        <div>
                                            <div className="text-small font-semibold" style={{ color: 'var(--text-secondary)' }}>
                                                {cohort.metrics.averageScores.badges}
                                            </div>
                                            <div className="text-small" style={{ color: 'var(--text-muted)' }}>Badges</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 text-small">
                                        <span style={{ color: 'var(--text-muted)' }}>Distribution:</span>
                                        <span style={{ color: '#743014' }}>
                                            {cohort.metrics.distribution.developing.percentage}% Developing
                                        </span>
                                        <span style={{ color: '#9D9167' }}>
                                            {cohort.metrics.distribution.progressing.percentage}% Progressing
                                        </span>
                                        <span style={{ color: '#84592B' }}>
                                            {cohort.metrics.distribution.advanced.percentage}% Advanced
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
