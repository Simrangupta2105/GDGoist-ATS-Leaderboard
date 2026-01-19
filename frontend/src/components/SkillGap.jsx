import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function SkillGap() {
  const [targetRole, setTargetRole] = useState('')
  const [currentSkills, setCurrentSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchingSkills, setFetchingSkills] = useState(true)
  const { apiCall } = useAuth()

  useEffect(() => {
    fetchCurrentSkills()
  }, [])

  const fetchCurrentSkills = async () => {
    try {
      const response = await apiCall('/me/resume')
      if (response.ok) {
        const data = await response.json()
        if (data.resume?.parsedSkills) {
          setCurrentSkills(data.resume.parsedSkills)
        }
      }
    } catch (error) {
      console.error('Error fetching skills:', error)
    } finally {
      setFetchingSkills(false)
    }
  }

  const addSkill = () => {
    if (skillInput.trim() && !currentSkills.includes(skillInput.trim())) {
      setCurrentSkills([...currentSkills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (skill) => {
    setCurrentSkills(currentSkills.filter(s => s !== skill))
  }

  const analyzeGap = async () => {
    if (!targetRole.trim()) return

    setLoading(true)
    try {
      const response = await apiCall('/skill-gap/analyze', {
        method: 'POST',
        body: JSON.stringify({
          targetRole,
          currentSkills
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      }
    } catch (error) {
      console.error('Error analyzing skill gap:', error)
    } finally {
      setLoading(false)
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
          <span className="text-xl">📊</span>
        </div>
        <div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>
            Skill Gap Analysis
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Identify skills needed for your target role
          </p>
        </div>
      </div>

      {/* Target Role Input */}
      <div className="mb-6">
        <label style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>
          Target Role
        </label>
        <input
          type="text"
          placeholder="e.g., Frontend Developer, Data Scientist"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="w-full px-4 py-3"
          style={{
            backgroundColor: 'var(--bg-card-soft)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem'
          }}
        />
      </div>

      {/* Current Skills */}
      <div className="mb-6">
        <label style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>
          Your Current Skills
        </label>

        {fetchingSkills ? (
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
            Loading skills from resume...
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Add a skill"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                className="flex-1 px-4 py-2"
                style={{
                  backgroundColor: 'var(--bg-card-soft)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              />
              <button
                onClick={addSkill}
                className="px-4 py-2 font-medium"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {currentSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--bg-card-soft)',
                    color: 'var(--accent-primary)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.875rem',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    style={{ color: 'var(--accent-danger)', fontSize: '1rem', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </span>
              ))}
              {currentSkills.length === 0 && (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No skills added yet
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Analyze Button */}
      <button
        onClick={analyzeGap}
        disabled={loading || !targetRole.trim()}
        className="w-full py-3 font-semibold mb-6"
        style={{
          backgroundColor: loading || !targetRole.trim() ? 'var(--border-subtle)' : 'var(--accent-primary)',
          color: 'white',
          borderRadius: 'var(--radius-lg)',
          opacity: loading || !targetRole.trim() ? 0.5 : 1,
          cursor: loading || !targetRole.trim() ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Analyzing...' : 'Analyze Skill Gap'}
      </button>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Overall Score */}
          <div
            className="p-4 text-center"
            style={{
              backgroundColor: 'var(--bg-card-soft)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--accent-primary)'
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Readiness Score for {analysis.targetRole || targetRole}
            </div>
            <div style={{ color: 'var(--accent-primary)', fontSize: '2.5rem', fontWeight: 700 }}>
              {analysis.readinessScore || 0}%
            </div>
          </div>

          {/* Skills You Have */}
          {analysis.matchingSkills?.length > 0 && (
            <div
              className="p-4"
              style={{
                backgroundColor: 'var(--bg-card-soft)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--accent-success)'
              }}
            >
              <h4 style={{ color: 'var(--accent-success)', fontWeight: 600, marginBottom: '0.75rem' }}>
                ✓ Skills You Have ({analysis.matchingSkills.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.matchingSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--accent-success)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      border: '1px solid var(--accent-success)'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills to Learn */}
          {analysis.missingSkills?.length > 0 && (
            <div
              className="p-4"
              style={{
                backgroundColor: 'var(--bg-card-soft)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--accent-primary)'
              }}
            >
              <h4 style={{ color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
                📚 Skills to Learn ({analysis.missingSkills.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--accent-primary)',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '0.875rem',
                      border: '1px solid var(--accent-primary)'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <div
              className="p-4"
              style={{
                backgroundColor: 'var(--bg-card-soft)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.75rem' }}>
                💡 Recommendations
              </h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2"
                    style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}
                  >
                    <span style={{ color: 'var(--accent-primary)' }}>•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
