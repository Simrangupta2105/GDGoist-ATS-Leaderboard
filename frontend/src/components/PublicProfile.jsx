import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function PublicProfile() {
    const { userId } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`http://localhost:4000/users/${userId}/profile`)
                if (res.ok) {
                    const data = await res.json()
                    setProfile(data.profile)
                } else {
                    setError('User not found')
                }
            } catch (err) {
                setError('Failed to load profile')
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [userId])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
            </div>
        )
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
                <div className="text-center">
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{error || 'Profile not found'}</p>
                    <button onClick={() => navigate(-1)} className="px-4 py-2" style={{ backgroundColor: 'var(--accent-primary)', color: 'white', borderRadius: 'var(--radius-lg)' }}>
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    if (profile.isPrivate) {
        return (
            <div className="min-h-screen py-8 page-transition" style={{ backgroundColor: 'var(--bg-app)' }}>
                <div className="max-w-2xl mx-auto px-4">
                    <button onClick={() => navigate(-1)} className="mb-6 px-4 py-2" style={{ backgroundColor: 'var(--bg-card-soft)', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>
                        ← Back
                    </button>
                    <div className="card p-8 text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
                            <span style={{ color: 'white', fontSize: '2rem', fontWeight: 700 }}>{profile.name?.charAt(0) || '?'}</span>
                        </div>
                        <h1 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>{profile.name}</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {profile.department} {profile.graduationYear && `• Class of ${profile.graduationYear}`}
                        </p>
                        <div className="mt-6 p-4" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>🔒 This profile is private</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8 page-transition" style={{ backgroundColor: 'var(--bg-app)' }}>
            <div className="max-w-2xl mx-auto px-4">
                {/* Back Button */}
                <button onClick={() => navigate(-1)} className="mb-6 px-4 py-2" style={{ backgroundColor: 'var(--bg-card-soft)', color: 'var(--text-muted)', borderRadius: 'var(--radius-lg)' }}>
                    ← Back
                </button>

                {/* Profile Header */}
                <div className="card p-8 mb-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 mb-4 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--accent-primary)' }}>
                            {profile.profilePicture ? (
                                <img
                                    src={profile.profilePicture}
                                    alt={profile.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.parentNode.innerHTML = `<span style="color: white; font-size: 2rem; font-weight: 700">${profile.name?.charAt(0) || '?'}</span>`;
                                    }}
                                />
                            ) : (
                                <span style={{ color: 'white', fontSize: '2rem', fontWeight: 700 }}>{profile.name?.charAt(0) || '?'}</span>
                            )}
                        </div>
                        <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700 }}>{profile.name}</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {profile.department} {profile.graduationYear && `• Class of ${profile.graduationYear}`}
                        </p>

                        {profile.bio && (
                            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', maxWidth: '400px' }}>{profile.bio}</p>
                        )}

                        {/* Score */}
                        {profile.score && (
                            <div className="mt-6 p-4 w-full max-w-sm" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)' }}>
                                <div className="flex items-center justify-center gap-6">
                                    <div className="text-center">
                                        <div style={{ color: 'var(--accent-primary)', fontSize: '2rem', fontWeight: 700 }}>{profile.score.total || 0}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Total Score</div>
                                    </div>
                                    <div className="text-center">
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', fontWeight: 600 }}>{profile.score.ats || 0}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ATS</div>
                                    </div>
                                    <div className="text-center">
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', fontWeight: 600 }}>{profile.score.github || 0}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>GitHub</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Social Links */}
                        {profile.socialLinks && Object.values(profile.socialLinks).some(v => v) && (
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                {profile.socialLinks.linkedin && (
                                    <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="px-4 py-2" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
                                        LinkedIn
                                    </a>
                                )}
                                {profile.socialLinks.github && (
                                    <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="px-4 py-2" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
                                        GitHub
                                    </a>
                                )}
                                {profile.socialLinks.twitter && (
                                    <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="px-4 py-2" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
                                        Twitter
                                    </a>
                                )}
                                {profile.socialLinks.instagram && (
                                    <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="px-4 py-2" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
                                        Instagram
                                    </a>
                                )}
                                {profile.socialLinks.portfolio && (
                                    <a href={profile.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="px-4 py-2" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
                                        Portfolio
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Badges */}
                {profile.badges?.length > 0 && (
                    <div className="card p-6 mb-6">
                        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Badges</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {profile.badges.map((badge, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border-subtle)' }}>
                                        <img
                                            src={badge.icon}
                                            alt={badge.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + badge.name + '&background=D4A053&color=fff' }}
                                        />
                                    </div>
                                    <div>
                                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{badge.name}</div>
                                        <div className="text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>{badge.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Projects */}
                {profile.projects?.length > 0 && (
                    <div className="card p-6 mb-6">
                        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Projects</h2>
                        <div className="space-y-4">
                            {profile.projects.map((project, idx) => (
                                <div key={idx} className="p-4" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{project.title}</h3>
                                            {project.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{project.description}</p>}
                                            {project.technologies?.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {project.technologies.map((tech, i) => (
                                                        <span key={i} className="px-2 py-1 text-xs" style={{ backgroundColor: 'var(--accent-primary)', color: 'white', borderRadius: 'var(--radius-lg)' }}>{tech}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {project.url && (
                                            <a href={project.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.875rem' }}>View →</a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Experience */}
                {profile.experiences?.length > 0 && (
                    <div className="card p-6">
                        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Experience</h2>
                        <div className="space-y-4">
                            {profile.experiences.map((exp, idx) => (
                                <div key={idx} className="p-4" style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{exp.title}</h3>
                                            <p style={{ color: 'var(--accent-primary)', fontSize: '0.875rem' }}>{exp.company}</p>
                                            {exp.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{exp.description}</p>}
                                        </div>
                                        {exp.current && (
                                            <span className="px-2 py-1 text-xs" style={{ backgroundColor: 'rgba(139, 154, 91, 0.15)', color: 'var(--accent-success)', borderRadius: 'var(--radius-lg)' }}>Current</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
