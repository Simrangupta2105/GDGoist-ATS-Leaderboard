import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AdminBadgeManager() {
    const [badges, setBadges] = useState([])
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        criteria: '',
        points: 2
    })
    const [iconFile, setIconFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [creating, setCreating] = useState(false)
    const [deleting, setDeleting] = useState(null) // Track which badge is being deleted
    const [error, setError] = useState('')

    const { apiCall } = useAuth()

    const fetchBadges = useCallback(async () => {
        try {
            const response = await apiCall('/badges/all')
            if (response.ok) {
                const data = await response.json()
                setBadges(data.badges || [])
            }
        } catch (err) {
            console.error('Error fetching badges:', err)
        } finally {
            setLoading(false)
        }
    }, [apiCall])

    useEffect(() => {
        fetchBadges()
    }, [fetchBadges])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setIconFile(file)
            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewUrl(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!iconFile) {
            setError('Please upload an icon')
            return
        }

        setCreating(true)
        setError('')

        try {
            const data = new FormData()
            data.append('name', formData.name)
            data.append('description', formData.description)
            data.append('criteria', formData.criteria)
            data.append('points', formData.points)
            data.append('icon', iconFile)

            const response = await apiCall('/admin/badges', {
                method: 'POST',
                body: data, // apiCall handles non-JSON body by not setting Content-Type
            })

            if (response.ok) {
                // Reset form
                setFormData({ name: '', description: '', criteria: '', points: 2 })
                setIconFile(null)
                setPreviewUrl(null)
                // Refresh list
                fetchBadges()
            } else {
                const errData = await response.json()
                setError(errData.error || 'Failed to create badge')
            }
        } catch (err) {
            console.error(err)
            setError('Network error')
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteBadge = async (badgeId, badgeName) => {
        if (!window.confirm(`Are you sure you want to delete the badge "${badgeName}"? This action cannot be undone.`)) {
            return
        }

        setDeleting(badgeId)
        setError('')

        try {
            const response = await apiCall(`/admin/badges/${badgeId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                // Remove from local state immediately
                setBadges(badges.filter(b => b._id !== badgeId))
            } else {
                const errData = await response.json()
                setError(errData.error || 'Failed to delete badge')
            }
        } catch (err) {
            console.error(err)
            setError('Network error')
        } finally {
            setDeleting(null)
        }
    }

    if (loading) return <div>Loading badges...</div>

    return (
        <div className="space-y-8 page-transition">
            {/* Create Badge Form */}
            <div className="card p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
                        <span className="text-xl">✨</span>
                    </div>
                    <div>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>Create New Badge</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Define a new achievement for the platform</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4" style={{ backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-lg)', color: 'var(--accent-danger)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Right Side - Icon Upload First (matching Profile's visual priority) */}
                        <div className="flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Badge Icon</label>

                            <div
                                className="relative w-32 h-32 mb-6 rounded-full flex items-center justify-center overflow-hidden cursor-pointer group"
                                style={{ backgroundColor: 'var(--bg-app)', border: '4px solid var(--border-subtle)', transition: 'all 0.3s ease' }}
                                onClick={() => document.getElementById('badge-icon-input').click()}
                            >
                                <div className="absolute inset-0 flex items-center justify-center transition-all z-10 opacity-0 group-hover:opacity-100" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
                                    <span className="text-white text-xs font-bold uppercase tracking-wider">Upload Icon</span>
                                </div>

                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <span style={{ color: 'var(--text-muted)', fontSize: '2.5rem' }}>?</span>
                                    </div>
                                )}
                            </div>

                            <input
                                id="badge-icon-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            <div className="w-full">
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem', textAlign: 'center' }}>Or paste icon URL</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    className="w-full px-4 py-2 text-sm text-center"
                                    style={{
                                        backgroundColor: 'transparent',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-lg)',
                                        color: 'var(--text-muted)'
                                    }}
                                    onChange={(e) => setPreviewUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Left Side - Details */}
                        <div className="space-y-5">
                            <div>
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Badge Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Resume Master"
                                    className="w-full px-4 py-3"
                                    style={{ backgroundColor: 'var(--bg-card-soft)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                                <textarea
                                    required
                                    placeholder="What achievement does this badge recognize?"
                                    className="w-full px-4 py-3 h-24 resize-none"
                                    style={{ backgroundColor: 'var(--bg-card-soft)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Points</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-3"
                                        style={{ backgroundColor: 'var(--bg-card-soft)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                                        value={formData.points}
                                        onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                                        min="1"
                                        max="50"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Criteria Filter</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. ats_score > 80"
                                        className="w-full px-4 py-3"
                                        style={{ backgroundColor: 'var(--bg-card-soft)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                                        value={formData.criteria}
                                        onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                            type="submit"
                            disabled={creating}
                            className="px-8 py-3 font-bold transition-all hover:scale-105 active:scale-95"
                            style={{
                                backgroundColor: 'var(--accent-primary)',
                                color: 'white',
                                borderRadius: 'var(--radius-lg)',
                                boxShadow: '0 4px 12px rgba(212, 160, 83, 0.2)'
                            }}
                        >
                            {creating ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Creating...</span>
                                </div>
                            ) : 'Create Achievement'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Existing Badges List */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>Platform Badges</h3>
                    <span className="px-3 py-1 text-xs font-bold" style={{ backgroundColor: 'var(--bg-card-soft)', color: 'var(--text-muted)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
                        {badges.length} total
                    </span>
                </div>

                {badges.length === 0 ? (
                    <div className="card p-12 text-center">
                        <p style={{ color: 'var(--text-muted)' }}>No custom badges created yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {badges.map((badge) => (
                            <div
                                key={badge._id}
                                className="card group hover:scale-[1.02] transition-all p-5"
                                style={{
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)'
                                }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0" style={{ border: '2px solid var(--border-subtle)' }}>
                                        <img
                                            src={badge.icon}
                                            alt={badge.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.insertAdjacentHTML('afterend', '<div style="width: 100%; height: 100%; display: flex; items-center; justify-center; background-color: var(--bg-card-soft); font-size: 1.5rem">🏅</div>');
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{badge.name}</div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter" style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}>
                                                    +{badge.points}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteBadge(badge._id, badge.name)}
                                                    disabled={deleting === badge._id}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                                                    style={{ color: 'var(--accent-danger)' }}
                                                    title="Delete badge"
                                                >
                                                    {deleting === badge._id ? (
                                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-sm line-clamp-2 mb-2" style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{badge.description}</div>
                                        {badge.criteria && (
                                            <div className="text-[10px] font-mono p-1 rounded" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--accent-primary)', border: '1px solid var(--border-subtle)' }}>
                                                target: {badge.criteria}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
