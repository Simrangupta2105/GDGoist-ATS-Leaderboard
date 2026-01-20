import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ProfileEdit() {
    const { apiCall, setUser } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [profile, setProfile] = useState({
        name: '',
        department: '',
        graduationYear: '',
        bio: '',
        profilePicture: '',
        profileVisibility: 'public',
        socialLinks: { linkedin: '', twitter: '', instagram: '', portfolio: '', github: '' },
        projects: [],
        experiences: []
    })

    const departments = [
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

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiCall('/me/profile')
                if (res.ok) {
                    const data = await res.json()
                    setProfile({
                        ...data.profile,
                        graduationYear: data.profile.graduationYear || '',
                        socialLinks: data.profile.socialLinks || { linkedin: '', twitter: '', instagram: '', portfolio: '', github: '' },
                        projects: data.profile.projects || [],
                        experiences: data.profile.experiences || []
                    })
                }
            } catch (err) {
                setError('Failed to load profile')
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [apiCall])

    const handleSave = async () => {
        try {
            setSaving(true)
            setError('')
            setSuccess('')

            const res = await apiCall('/me/profile', {
                method: 'PUT',
                body: JSON.stringify(profile)
            })

            if (res.ok) {
                const data = await res.json()
                // Update global user context to sync Navbar
                setUser(prev => ({ ...prev, ...data.profile }))

                setSuccess('Profile updated successfully!')
                setTimeout(() => setSuccess(''), 3000)
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to update profile')
            }
        } catch (err) {
            setError('Failed to save profile')
        } finally {
            setSaving(false)
        }
    }

    const addProject = () => {
        setProfile(prev => ({
            ...prev,
            projects: [...prev.projects, { title: '', description: '', technologies: [], url: '' }]
        }))
    }

    const removeProject = (index) => {
        setProfile(prev => ({
            ...prev,
            projects: prev.projects.filter((_, i) => i !== index)
        }))
    }

    const updateProject = (index, field, value) => {
        setProfile(prev => ({
            ...prev,
            projects: prev.projects.map((p, i) => i === index ? { ...p, [field]: value } : p)
        }))
    }

    const addExperience = () => {
        setProfile(prev => ({
            ...prev,
            experiences: [...prev.experiences, { title: '', company: '', description: '', current: false }]
        }))
    }

    const removeExperience = (index) => {
        setProfile(prev => ({
            ...prev,
            experiences: prev.experiences.filter((_, i) => i !== index)
        }))
    }

    const updateExperience = (index, field, value) => {
        setProfile(prev => ({
            ...prev,
            experiences: prev.experiences.map((e, i) => i === index ? { ...e, [field]: value } : e)
        }))
    }

    const fileInputRef = useRef(null)
    const [uploading, setUploading] = useState(false)

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB')
            return
        }

        try {
            setUploading(true)
            setError('')

            const formData = new FormData()
            formData.append('avatar', file)

            const res = await apiCall('/me/avatar', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                const data = await res.json()
                setProfile(prev => ({ ...prev, profilePicture: data.url }))

                // Update global user context immediately
                setUser(prev => ({ ...prev, profilePicture: data.url }))

                setSuccess('Profile picture uploaded!')
                setTimeout(() => setSuccess(''), 3000)
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to upload image')
            }
        } catch (err) {
            setError('Failed to upload image')
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8 page-transition" style={{ backgroundColor: 'var(--bg-app)' }}>
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700 }}>Edit Profile</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage your public profile information</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 font-medium"
                        style={{ backgroundColor: 'var(--bg-card-soft)', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}
                    >
                        ← Back
                    </button>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-6 p-4" style={{ backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-lg)', color: 'var(--accent-danger)' }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4" style={{ backgroundColor: 'rgba(139, 154, 91, 0.15)', borderRadius: 'var(--radius-lg)', color: 'var(--accent-success)' }}>
                        {success}
                    </div>
                )}

                {/* Basic Info */}
                <div className="card p-6 mb-6">
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Basic Information</h2>

                    <div className="flex flex-col items-center mb-8">
                        <div
                            className="relative w-32 h-32 mb-4 rounded-full flex items-center justify-center overflow-hidden cursor-pointer group"
                            style={{ backgroundColor: 'var(--accent-primary)', border: '4px solid var(--bg-primary)' }}
                            onClick={() => !uploading && fileInputRef.current?.click()}
                        >
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center z-20" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                            )}

                            <div className="absolute inset-0 flex items-center justify-center transition-all z-10 opacity-0 group-hover:opacity-100" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                <span className="text-white text-sm font-bold">Upload Photo</span>
                            </div>

                            {profile.profilePicture ? (
                                <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span style={{ color: 'white', fontSize: '3rem', fontWeight: 700 }}>
                                    {profile.name?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/*"
                        />

                        <input
                            type="text"
                            placeholder="Or paste image URL (https://...)"
                            value={profile.profilePicture || ''}
                            onChange={(e) => setProfile(prev => ({ ...prev, profilePicture: e.target.value }))}
                            className="w-full max-w-md px-4 py-2 text-center text-sm"
                            style={{
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-lg)',
                                color: 'var(--text-muted)'
                            }}
                        />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            Click avatar to upload or paste a URL
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Name</label>
                            <input
                                type="text"
                                value={profile.name || ''}
                                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-3"
                                style={{ backgroundColor: 'var(--bg-card-soft)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Department</label>
                            <select
                                value={profile.department || ''}
                                onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))}
                                className="w-full px-4 py-3"
                                style={{ backgroundColor: 'var(--bg-card-soft)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                            >
                                <option value="">Select department</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Graduation Year</label>
                            <select
                                value={profile.graduationYear || ''}
                                onChange={(e) => setProfile(prev => ({ ...prev, graduationYear: parseInt(e.target.value) || '' }))}
                                className="w-full px-4 py-3"
                                style={{ backgroundColor: 'var(--bg-card-soft)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                            >
                                <option value="">Select year</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Profile Visibility</label>
                            <select
                                value={profile.profileVisibility || 'public'}
                                onChange={(e) => setProfile(prev => ({ ...prev, profileVisibility: e.target.value }))}
                                className="w-full px-4 py-3"
                                style={{ backgroundColor: 'var(--bg-card-soft)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                            >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Bio</label>
                        <textarea
                            value={profile.bio || ''}
                            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                            rows={3}
                            maxLength={500}
                            placeholder="Tell others about yourself..."
                            className="w-full px-4 py-3"
                            style={{ backgroundColor: 'var(--bg-card-soft)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', resize: 'none' }}
                        />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{(profile.bio || '').length}/500</p>
                    </div>
                </div>

                {/* Social Links */}
                <div className="card p-6 mb-6">
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Social Links</h2>

                    <div className="space-y-4">
                        {[
                            { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
                            { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
                            { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/username' },
                            { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
                            { key: 'portfolio', label: 'Portfolio Website', placeholder: 'https://yoursite.com' }
                        ].map(({ key, label, placeholder }) => (
                            <div key={key}>
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{label}</label>
                                <input
                                    type="url"
                                    value={profile.socialLinks?.[key] || ''}
                                    onChange={(e) => setProfile(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: e.target.value } }))}
                                    placeholder={placeholder}
                                    className="w-full px-4 py-3"
                                    style={{ backgroundColor: 'var(--bg-card-soft)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Projects */}
                <div className="card p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 600 }}>Projects</h2>
                        <button onClick={addProject} className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: 'var(--accent-primary)', color: 'white', borderRadius: 'var(--radius-lg)' }}>
                            + Add Project
                        </button>
                    </div>

                    {profile.projects?.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No projects added yet</p>
                    ) : (
                        <div className="space-y-4">
                            {profile.projects?.map((project, idx) => (
                                <div key={idx} className="p-4" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="flex justify-between mb-3">
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Project {idx + 1}</span>
                                        <button onClick={() => removeProject(idx)} style={{ color: 'var(--accent-danger)', fontSize: '0.875rem' }}>Remove</button>
                                    </div>
                                    <div className="space-y-3">
                                        <input
                                            placeholder="Project Title"
                                            value={project.title || ''}
                                            onChange={(e) => updateProject(idx, 'title', e.target.value)}
                                            className="w-full px-3 py-2"
                                            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                                        />
                                        <textarea
                                            placeholder="Description"
                                            value={project.description || ''}
                                            onChange={(e) => updateProject(idx, 'description', e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2"
                                            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', resize: 'none' }}
                                        />
                                        <input
                                            placeholder="Technologies (comma separated)"
                                            value={project.technologies?.join(', ') || ''}
                                            onChange={(e) => updateProject(idx, 'technologies', e.target.value.split(',').map(t => t.trim()))}
                                            className="w-full px-3 py-2"
                                            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                                        />
                                        <input
                                            placeholder="Project URL"
                                            value={project.url || ''}
                                            onChange={(e) => updateProject(idx, 'url', e.target.value)}
                                            className="w-full px-3 py-2"
                                            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Experiences */}
                <div className="card p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.125rem', fontWeight: 600 }}>Experience</h2>
                        <button onClick={addExperience} className="px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: 'var(--accent-primary)', color: 'white', borderRadius: 'var(--radius-lg)' }}>
                            + Add Experience
                        </button>
                    </div>

                    {profile.experiences?.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No experience added yet</p>
                    ) : (
                        <div className="space-y-4">
                            {profile.experiences?.map((exp, idx) => (
                                <div key={idx} className="p-4" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="flex justify-between mb-3">
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Experience {idx + 1}</span>
                                        <button onClick={() => removeExperience(idx)} style={{ color: 'var(--accent-danger)', fontSize: '0.875rem' }}>Remove</button>
                                    </div>
                                    <div className="space-y-3">
                                        <input
                                            placeholder="Job Title"
                                            value={exp.title || ''}
                                            onChange={(e) => updateExperience(idx, 'title', e.target.value)}
                                            className="w-full px-3 py-2"
                                            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                                        />
                                        <input
                                            placeholder="Company"
                                            value={exp.company || ''}
                                            onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                                            className="w-full px-3 py-2"
                                            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)' }}
                                        />
                                        <textarea
                                            placeholder="Description"
                                            value={exp.description || ''}
                                            onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2"
                                            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', resize: 'none' }}
                                        />
                                        <label className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={exp.current || false}
                                                onChange={(e) => updateExperience(idx, 'current', e.target.checked)}
                                            />
                                            Currently working here
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 font-semibold text-lg"
                    style={{ backgroundColor: saving ? 'var(--border-subtle)' : 'var(--accent-primary)', color: 'white', borderRadius: 'var(--radius-lg)', opacity: saving ? 0.5 : 1 }}
                >
                    {saving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </div>
    )
}
