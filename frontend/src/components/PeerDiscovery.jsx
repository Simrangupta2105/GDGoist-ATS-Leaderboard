import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function PeerDiscovery() {
  const [searchQuery, setSearchQuery] = useState('')
  const [peers, setPeers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPeer, setSelectedPeer] = useState(null)
  const [copied, setCopied] = useState(false)
  const { apiCall } = useAuth()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await apiCall(`/peers/search?q=${encodeURIComponent(searchQuery)}`)
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

  const handleConnectClick = (peer) => {
    setSelectedPeer(peer)
    setCopied(false)
  }

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConnectProcess = async (peerId) => {
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
          placeholder="Search by name or skills (e.g., React, Alice)"
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
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  {peer.profilePicture ? (
                    <img
                      src={peer.profilePicture}
                      alt={peer.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.insertAdjacentHTML('afterend', `<span style="color: white; font-weight: 600; font-size: 1.125rem">${peer.name?.charAt(0) || '?'}</span>`);
                      }}
                    />
                  ) : (
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '1.125rem' }}>
                      {peer.name?.charAt(0) || '?'}
                    </span>
                  )}
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
                  onClick={() => handleConnectClick(peer)}
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
          <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Find peers</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Search by name or skills to find classmates
          </p>
        </div>
      )}

      {/* Connection Modal */}
      {selectedPeer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPeer(null)}
          ></div>
          <div
            className="relative card w-full max-w-md p-8 animate-in fade-in zoom-in duration-300"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            <button
              onClick={() => setSelectedPeer(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              ✕
            </button>

            <div className="flex flex-col items-center text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4 overflow-hidden"
                style={{ backgroundColor: 'var(--accent-primary)', border: '4px solid var(--bg-card-soft)' }}
              >
                {selectedPeer.profilePicture ? (
                  <img
                    src={selectedPeer.profilePicture}
                    alt={selectedPeer.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.insertAdjacentHTML('afterend', `<span style="color: white; font-weight: 700; font-size: 2rem">${selectedPeer.name?.charAt(0) || '?'}</span>`);
                    }}
                  />
                ) : (
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '2rem' }}>
                    {selectedPeer.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>

              <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>
                {selectedPeer.name}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {selectedPeer.department}
              </p>
              <p style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 500 }}>
                Class of {selectedPeer.graduationYear}
              </p>

              <div className="w-full mt-8 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card-soft)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Student Email
                </p>
                <div
                  onClick={() => handleCopyEmail(selectedPeer.email)}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-all group"
                  style={{ border: '1px dashed var(--border-subtle)' }}
                >
                  <span className="truncate flex-1" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.925rem' }}>
                    {selectedPeer.email || 'No email provided'}
                  </span>
                  <div
                    className="flex-shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase transition-all"
                    style={{
                      backgroundColor: copied ? 'var(--accent-success)' : 'var(--bg-card)',
                      color: copied ? 'white' : 'var(--text-muted)'
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  handleConnectProcess(selectedPeer.id)
                  setSelectedPeer(null)
                }}
                className="w-full mt-6 py-3 font-bold"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 4px 12px rgba(212, 160, 83, 0.2)'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
