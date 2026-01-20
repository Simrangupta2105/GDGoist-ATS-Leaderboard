import React from 'react'

export default function ATSResults({ score, feedback, breakdown, parsedSkills, onClose }) {
  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  const getScoreIcon = (score) => {
    if (score >= 80) return '🎉'
    if (score >= 60) return '👍'
    if (score >= 40) return '⚡'
    return '🎯'
  }

  return (
    <div className="space-y-4">
      {/* Score Display */}
      <div
        className="card px-6 py-6"
        style={{ background: 'var(--bg-card)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{getScoreIcon(score)}</div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                {score}/100
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                {getScoreLabel(score)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ATS Score</div>
            <div style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>Resume Analysis</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="mt-4 h-2 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card-soft)', borderRadius: 'var(--radius-lg)' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${score}%`,
              backgroundColor: 'var(--accent-primary)',
              borderRadius: 'var(--radius-lg)'
            }}
          ></div>
        </div>
      </div>

      {/* Score Breakdown */}
      {breakdown && Object.keys(breakdown).length > 0 && (
        <div className="card px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <span className="text-white text-sm">📊</span>
            </div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Score Breakdown</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(breakdown).map(([key, value]) => (
              <div
                key={key}
                className="p-3"
                style={{
                  backgroundColor: 'var(--bg-card-soft)',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div style={{ color: 'var(--accent-primary)', fontSize: '1.125rem', fontWeight: 600 }}>
                  {typeof value === 'number' ? value.toFixed(1) : value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parsed Skills */}
      <div className="card px-6 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <span className="text-white text-sm">🛠️</span>
          </div>
          <h4 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            Detected Skills ({parsedSkills?.length || 0})
          </h4>
        </div>
        {parsedSkills && parsedSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {parsedSkills.slice(0, 15).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1"
                style={{
                  backgroundColor: 'var(--bg-card-soft)',
                  color: 'var(--accent-primary)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {skill}
              </span>
            ))}
            {parsedSkills.length > 15 && (
              <span
                className="px-3 py-1"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                +{parsedSkills.length - 15} more
              </span>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No skills confidently detected from your resume.</p>
        )}
      </div>

      {/* Detailed Feedback */}
      {feedback && feedback.length > 0 && (
        <div className="card px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <span className="text-white text-sm">💡</span>
            </div>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Detailed Feedback</h4>
          </div>
          <div className="space-y-2">
            {feedback.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3"
                style={{
                  backgroundColor: 'var(--bg-card-soft)',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>•</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-full py-3 font-semibold transition-all"
        style={{
          backgroundColor: 'var(--accent-primary)',
          color: 'white',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        Close Results
      </button>
    </div>
  )
}