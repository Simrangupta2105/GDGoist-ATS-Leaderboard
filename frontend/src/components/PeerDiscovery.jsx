import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function PeerDiscovery() {
  const [searchQuery, setSearchQuery] = useState('')
  const [peers, setPeers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { apiCall } = useAuth()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await apiCall(`/peers/search?skills=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setPeers(data.peers || [])
      } else {
        setError('Failed to search peers')
      }
    } catch (error) {
      setError('Error searching peers')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (peerId) => {
    try {
      const response = await apiCall(`/peers/${peerId}/connect`, {
        method: 'POST'
      })
      if (response.ok) {
        setPeers(peers.map(p =>
          p.id === peerId ? { ...p, connected: true } : p
        ))
      }
    } catch (error) {
      console.error('Error connecting to peer:', error)
    }
  }

  return (
    <div className="card px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <span className="text-xl">👥</span>
        </div>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>
          Peer Discovery
        </h3>
      </div>

      {/* Search Box */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search by skills (e.g., React, Python)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-3"
          style={{
            backgroundColor: 'var(--bg-card-soft)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem'
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-3 font-semibold"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 px-4 py-3"
          style={{
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--accent-danger)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <p style={{ color: 'var(--accent-danger)' }}>{error}</p>
        </div>
      )}

      {/* Results */}
      {peers.length > 0 ? (
        <div className="space-y-3">
          {peers.map((peer) => (
            <div
              key={peer.id}
              className="p-4 flex items-center justify-between"
              style={{
                backgroundColor: 'var(--bg-card-soft)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <span style={{ color: 'white', fontWeight: 600, fontSize: '1.125rem' }}>
                    {peer.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{peer.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {peer.department} • Class of {peer.graduationYear}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {peer.skills?.slice(0, 4).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--accent-primary)',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: '0.75rem',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                    {peer.skills?.length > 4 && (
                      <span
                        className="px-2 py-0.5"
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.75rem'
                        }}
                      >
                        +{peer.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1.25rem' }}>
                  {peer.score}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ATS Score</div>
                <button
                  onClick={() => handleConnect(peer.id)}
                  disabled={peer.connected}
                  className="mt-2 px-4 py-1.5 font-medium"
                  style={{
                    backgroundColor: peer.connected ? 'var(--accent-success)' : 'var(--accent-primary)',
                    color: 'white',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.75rem',
                    opacity: peer.connected ? 0.8 : 1
                  }}
                >
                  {peer.connected ? '✓ Connected' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="p-8 text-center"
          style={{
            backgroundColor: 'var(--bg-card-soft)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <span className="text-4xl mb-3 block">🔍</span>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Find peers with similar skills</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Search by skills to discover classmates you can collaborate with
          </p>
        </div>
      )}
    </div>
  )
}
