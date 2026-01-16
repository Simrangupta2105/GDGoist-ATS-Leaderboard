import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ResumeUpload from './ResumeUpload'
import ConsentModal from './ConsentModal'
import GitHubConnect from './GitHubConnect'
import Badges from './Badges'
import PeerDiscovery from './PeerDiscovery'
import SkillGap from './SkillGap'

export default function Dashboard() {
  const { user, apiCall } = useAuth()
  const navigate = useNavigate()
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)
  const [userScore, setUserScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!user?.department || !user?.graduationYear) {
      navigate('/onboarding')
      return
    }
    checkConsentAndFetchData()
  }, [user, navigate])

  const checkConsentAndFetchData = async () => {
    try {
      const testResponse = await apiCall('/me')
      const userData = await testResponse.json()

      if (testResponse.ok) {
        const hasConsentGiven = userData.user?.dpdpConsent?.consented === true
        setHasConsent(hasConsentGiven)
        if (!hasConsentGiven) {
          setShowConsentModal(true)
        }
      }
      await fetchUserScore()
    } catch (error) {
      console.error('Error checking consent:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserScore = async () => {
    try {
      // Fetch real score from backend (single source of truth)
      const response = await apiCall('/score/breakdown')
      if (response.ok) {
        const data = await response.json()
        setUserScore({
          totalScore: data.totalScore || 0,
          atsComponent: data.components?.ats?.score || 0,
          gitComponent: data.components?.github?.score || 0,
          badgeComponent: data.components?.badges?.score || 0,
          rank: null
        })
      } else {
        // No score yet - set to zeros
        setUserScore({
          totalScore: 0,
          atsComponent: 0,
          gitComponent: 0,
          badgeComponent: 0,
          rank: null
        })
      }
    } catch (error) {
      console.error('Error fetching user score:', error)
      // Fallback to zeros on error
      setUserScore({
        totalScore: 0,
        atsComponent: 0,
        gitComponent: 0,
        badgeComponent: 0,
        rank: null
      })
    }
  }

  const handleConsentGiven = () => {
    setHasConsent(true)
    setShowConsentModal(false)
  }

  // AI Insights based on score
  const getAIInsight = () => {
    const score = userScore?.totalScore || 0
    const atsScore = userScore?.atsComponent || 0
    const gitScore = userScore?.gitComponent || 0

    if (score === 0) {
      return {
        message: "Let's get started on your employability journey.",
        action: "Upload your resume to receive personalized AI insights and recommendations.",
        tone: "supportive"
      }
    } else if (score < 40) {
      return {
        message: "You're building your profile. Here's what will help most:",
        action: atsScore === 0 ? "Upload a detailed resume highlighting your skills and experience" : "Connect your GitHub to showcase your projects",
        tone: "encouraging"
      }
    } else if (score < 70) {
      return {
        message: "You're making good progress. To reach the next level:",
        action: gitScore === 0 ? "Add your GitHub profile to demonstrate hands-on experience" : "Earn skill badges to strengthen your profile",
        tone: "motivating"
      }
    } else {
      return {
        message: "Excellent work! You're in a strong position.",
        action: "Keep your resume updated and continue building your GitHub portfolio",
        tone: "affirming"
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="spinner-premium mb-4" style={{ width: '40px', height: '40px', borderWidth: '2px' }}></div>
          <p className="text-body" style={{ color: 'var(--text-muted)' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'github', label: 'GitHub' },
    { id: 'badges', label: 'Badges' },
    { id: 'peers', label: 'Peers' },
    { id: 'skillgap', label: 'Skill Analysis' },
  ]

  const insight = getAIInsight()

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="container-premium py-10">
        {/* Header - Calm, Personal */}
        <div className="mb-12 animate-fadeIn">
          <h1 className="text-display mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-body" style={{ color: 'var(--text-muted)' }}>
            {user?.department} · Class of {user?.graduationYear}
          </p>
        </div>

        {/* AI Insight Card - Primary Focus */}
        <div
          className="card-elevated mb-8 animate-scaleIn"
          style={{
            background: 'linear-gradient(135deg, rgba(232, 209, 167, 0.08) 0%, rgba(157, 145, 103, 0.08) 100%)',
            borderColor: 'rgba(132, 89, 43, 0.15)'
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(132, 89, 43, 0.1)' }}
            >
              <svg className="w-6 h-6" style={{ color: '#84592B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-subheading mb-2" style={{ color: 'var(--text-primary)' }}>
                {insight.message}
              </h2>
              <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                {insight.action}
              </p>

              {/* Score Display - Secondary to AI Insight */}
              <div className="flex items-center gap-6 mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <div className="text-4xl font-bold mb-1" style={{ color: '#84592B' }}>
                    {userScore?.totalScore || 0}
                  </div>
                  <div className="text-small font-medium" style={{ color: 'var(--text-muted)' }}>
                    Overall Score
                  </div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {userScore?.atsComponent || 0}
                    </div>
                    <div className="text-small" style={{ color: 'var(--text-muted)' }}>Resume</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {userScore?.gitComponent || 0}
                    </div>
                    <div className="text-small" style={{ color: 'var(--text-muted)' }}>GitHub</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {userScore?.badgeComponent || 0}
                    </div>
                    <div className="text-small" style={{ color: 'var(--text-muted)' }}>Badges</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Minimal */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-small whitespace-nowrap transition-all relative ${activeTab === tab.id ? 'font-semibold' : ''
                }`}
              style={{
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: '#84592B' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Profile Information - Recessed */}
            <div className="card-premium animate-slideIn">
              <h3 className="text-body font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Profile Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-small mb-1" style={{ color: 'var(--text-muted)' }}>Department</dt>
                  <dd className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>{user?.department}</dd>
                </div>
                <div>
                  <dt className="text-small mb-1" style={{ color: 'var(--text-muted)' }}>Graduation Year</dt>
                  <dd className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>{user?.graduationYear}</dd>
                </div>
                <div>
                  <dt className="text-small mb-1" style={{ color: 'var(--text-muted)' }}>Email</dt>
                  <dd className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>{user?.email}</dd>
                </div>
                <div>
                  <dt className="text-small mb-1" style={{ color: 'var(--text-muted)' }}>Role</dt>
                  <dd className="text-body font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{user?.role}</dd>
                </div>
              </div>
            </div>

            {/* Resume Upload Section */}
            {hasConsent ? (
              <div className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
                <ResumeUpload onScoreUpdate={fetchUserScore} />
              </div>
            ) : (
              <div
                className="card-premium animate-slideIn"
                style={{
                  animationDelay: '0.1s',
                  backgroundColor: 'rgba(116, 48, 20, 0.05)',
                  borderColor: 'rgba(116, 48, 20, 0.2)'
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(116, 48, 20, 0.1)' }}>
                    <svg className="w-5 h-5" style={{ color: '#743014' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-body font-semibold mb-2" style={{ color: '#743014' }}>
                      Consent Required
                    </h3>
                    <p className="text-small mb-4" style={{ color: '#8A3D1A' }}>
                      To analyze your resume and provide personalized insights, we need your consent for data processing.
                    </p>
                    <button
                      onClick={() => setShowConsentModal(true)}
                      className="btn-primary focus-ring"
                    >
                      Provide Consent
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'github' && (
          <div className="animate-slideIn">
            <GitHubConnect />
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="animate-slideIn">
            <Badges />
          </div>
        )}

        {activeTab === 'peers' && (
          <div className="animate-slideIn">
            <PeerDiscovery />
          </div>
        )}

        {activeTab === 'skillgap' && (
          <div className="animate-slideIn">
            <SkillGap />
          </div>
        )}
      </div>

      {showConsentModal && (
        <ConsentModal
          onConsent={handleConsentGiven}
          onClose={() => setShowConsentModal(false)}
        />
      )}
    </div>
  )
}