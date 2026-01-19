import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ConsentModal({ onConsent, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { apiCall } = useAuth()

  const handleConsent = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await apiCall('/consent', {
        method: 'POST',
        body: JSON.stringify({ consented: true })
      })

      const data = await response.json()

      if (response.ok) {
        onConsent()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Network error')
    }

    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
    >
      <div
        className="relative p-6 w-11/12 md:w-3/4 lg:w-1/2 card"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <span className="text-white">📋</span>
              </div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>
                Data Processing Consent
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{ color: 'var(--text-muted)', padding: '0.5rem' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div
            className="mt-4 p-4 space-y-4"
            style={{
              backgroundColor: 'var(--bg-card-soft)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Data Protection and Privacy Policy (DPDP) Consent</strong>
            </p>

            <p style={{ color: 'var(--text-secondary)' }}>
              By providing consent, you agree to allow the GDGoist ATS Leaderboard platform to:
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li>Process and analyze your resume for ATS scoring</li>
              <li>Store your resume securely in our system</li>
              <li>Calculate and display your employability score</li>
              <li>Include your anonymized data in leaderboard rankings</li>
              <li>Use your data for platform improvement and analytics</li>
            </ul>

            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Your Rights:</strong>
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4" style={{ color: 'var(--text-secondary)' }}>
              <li>You can withdraw consent at any time</li>
              <li>Your personal information will be kept confidential</li>
              <li>Only anonymized data appears on public leaderboards</li>
              <li>You can request deletion of your data</li>
            </ul>

            <p style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Data Security:</strong> Your resume and personal information are encrypted and stored securely. We follow industry best practices for data protection.
            </p>

            <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              Do you consent to the processing of your data as described above?
            </p>
          </div>

          {error && (
            <div
              className="mt-4 px-4 py-3"
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

          <div className="flex items-center justify-end mt-6 space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 font-medium"
              style={{
                backgroundColor: 'var(--bg-card-soft)',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConsent}
              disabled={loading}
              className="px-4 py-2 font-semibold"
              style={{
                backgroundColor: loading ? 'var(--border-subtle)' : 'var(--accent-primary)',
                color: 'white',
                borderRadius: 'var(--radius-lg)',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Processing...' : 'I Consent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}