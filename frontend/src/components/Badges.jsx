import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Badges() {
  const [badges, setBadges] = useState([])
  const [availableBadges, setAvailableBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const { apiCall } = useAuth()

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      const [userBadgesRes, allBadgesRes] = await Promise.all([
        apiCall('/me/badges'),
        apiCall('/badges')
      ])

      if (userBadgesRes.ok) {
        const data = await userBadgesRes.json()
        setBadges(data.badges || [])
      }

      if (allBadgesRes.ok) {
        const data = await allBadgesRes.json()
        setAvailableBadges(data.badges || [])
      }
    } catch (error) {
      console.error('Error fetching badges:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
      </div>
    )
  }

  return (
    <div className="card px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <span className="text-xl">🏆</span>
        </div>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>
          Achievements & Badges
        </h3>
      </div>

      {/* Earned Badges */}
      <div className="mb-6">
        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem' }}>
          Earned Badges ({badges.length})
        </h4>
        {badges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((badge, index) => (
              <div
                key={index}
                className="p-4 text-center"
                style={{
                  backgroundColor: 'var(--bg-card-soft)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div className="text-3xl mb-2">{badge.icon || '🏅'}</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                  {badge.name}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {badge.description}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="p-6 text-center"
            style={{
              backgroundColor: 'var(--bg-card-soft)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <span className="text-4xl mb-2 block">🎯</span>
            <p style={{ color: 'var(--text-muted)' }}>No badges earned yet. Keep improving!</p>
          </div>
        )}
      </div>

      {/* Available Badges */}
      <div>
        <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem' }}>
          Available Badges
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableBadges.map((badge, index) => {
            const isEarned = badges.some(b => b.name === badge.name)
            return (
              <div
                key={index}
                className="p-4 text-center"
                style={{
                  backgroundColor: 'var(--bg-card-soft)',
                  border: isEarned ? '1px solid var(--accent-success)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  opacity: isEarned ? 1 : 0.7
                }}
              >
                <div className="text-3xl mb-2" style={{ filter: isEarned ? 'none' : 'grayscale(1)' }}>
                  {badge.icon || '🏅'}
                </div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                  {badge.name}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {badge.criteria}
                </div>
                {isEarned && (
                  <div
                    className="mt-2 px-2 py-1 inline-block"
                    style={{
                      backgroundColor: 'var(--accent-success)',
                      color: 'white',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.625rem',
                      fontWeight: 600
                    }}
                  >
                    ✓ Earned
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
