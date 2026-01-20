import React, { useState, useEffect, useCallback } from 'react'
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

  const fetchUserScore = useCallback(async () => {
    try {
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
      setUserScore({
        totalScore: 0,
        atsComponent: 0,
        gitComponent: 0,
        badgeComponent: 0,
        rank: null
      })
    }
  }, [apiCall])

  useEffect(() => {
    if (!user?.department || !user?.graduationYear) {
      navigate('/onboarding')
      return
    }

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

    checkConsentAndFetchData()
  }, [user, navigate, apiCall, fetchUserScore])

  const handleConsentGiven = () => {
    setHasConsent(true)
    setShowConsentModal(false)
  }

  const getAIInsight = () => {
    const score = userScore?.totalScore || 0
    const atsScore = userScore?.atsComponent || 0
    const gitScore = userScore?.gitComponent || 0

    if (score === 0) {
      return {
        title: "Let's get started",
        message: "Upload your resume to receive personalized insights and recommendations.",
        status: 'neutral'
      }
    } else if (score < 40) {
      return {
        title: "Building your profile",
        message: atsScore === 0
          ? "Upload a detailed resume highlighting your skills and experience"
          : "Connect your GitHub to showcase your projects",
        status: 'developing'
      }
    } else if (score < 70) {
      return {
        title: "Making progress",
        message: gitScore === 0
          ? "Add your GitHub profile to demonstrate hands-on experience"
          : "Earn skill badges to strengthen your profile",
        status: 'progressing'
      }
    } else {
      return {
        title: "Excellent work",
        message: "You're in a strong position. Keep your resume updated and continue building your portfolio.",
        status: 'advanced'
      }
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <div className="spinner-premium mb-4" style={{ width: '40px', height: '40px' }} />
          <p className="text-body" style={{ color: 'var(--text-muted)' }}>
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'github', label: 'GitHub' },
    { id: 'badges', label: 'Badges' },
    { id: 'peers', label: 'Peers' },
    { id: 'skillgap', label: 'Skills' },
  ]

  const insight = getAIInsight()

  return (
    <div className="min-h-screen page-transition" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="container-premium py-10">
        {/* Header */}
        <header className="mb-10 animate-fadeUp">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1
                className="text-display mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Welcome, {user?.name?.split(' ')[0]}
              </h1>
              <p
                className="text-body"
                style={{ color: 'var(--text-muted)' }}
              >
                {user?.department} · Class of {user?.graduationYear}
              </p>
            </div>
          </div>
        </header>

        {/* Score Overview Card */}
        <div
          className="card-elevated mb-8 animate-fadeUp stagger-1"
          style={{
            background: 'linear-gradient(135deg, rgba(132, 89, 43, 0.03) 0%, transparent 100%)'
          }}
        >
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Score Display */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div
                  className="text-5xl font-bold mb-1"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  {userScore?.totalScore || 0}
                </div>
                <div
                  className="text-small font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Overall Score
                </div>
              </div>

              <div
                className="hidden sm:block w-px h-16"
                style={{ backgroundColor: 'var(--border-subtle)' }}
              />

              <div className="hidden sm:flex gap-6">
                <div className="text-center">
                  <div
                    className="text-2xl font-semibold mb-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {userScore?.atsComponent || 0}
                  </div>
                  <div
                    className="text-small"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Resume
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-2xl font-semibold mb-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {userScore?.gitComponent || 0}
                  </div>
                  <div
                    className="text-small"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    GitHub
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-2xl font-semibold mb-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {userScore?.badgeComponent || 0}
                  </div>
                  <div
                    className="text-small"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Badges
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insight */}
            <div
              className="flex-1 lg:pl-8 lg:border-l"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(132, 89, 43, 0.08)' }}
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: 'var(--accent-primary)' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    className="text-subheading mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {insight.title}
                  </h3>
                  <p
                    className="text-body"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {insight.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex gap-1 mb-8 pb-px overflow-x-auto animate-fadeUp stagger-2"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-4 py-3 text-small font-medium whitespace-nowrap transition-colors"
              style={{
                color: activeTab === tab.id
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)'
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="card-premium">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-subheading"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Profile
                  </h3>
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="px-4 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'white',
                      borderRadius: 'var(--radius-lg)'
                    }}
                  >
                    Edit Profile
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <dt
                      className="text-small mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Department
                    </dt>
                    <dd
                      className="text-body font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {user?.department}
                    </dd>
                  </div>
                  <div>
                    <dt
                      className="text-small mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Graduation
                    </dt>
                    <dd
                      className="text-body font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {user?.graduationYear}
                    </dd>
                  </div>
                  <div>
                    <dt
                      className="text-small mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Email
                    </dt>
                    <dd
                      className="text-body font-medium truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {user?.email}
                    </dd>
                  </div>
                  <div>
                    <dt
                      className="text-small mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Account
                    </dt>
                    <dd
                      className="text-body font-medium capitalize"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {user?.role}
                    </dd>
                  </div>
                </div>
              </div>

              {/* Resume Upload */}
              {hasConsent ? (
                <ResumeUpload onScoreUpdate={fetchUserScore} />
              ) : (
                <div
                  className="card-premium"
                  style={{
                    backgroundColor: 'var(--warning-bg)',
                    borderColor: 'rgba(154, 103, 0, 0.15)'
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(154, 103, 0, 0.1)' }}
                    >
                      <svg
                        className="w-5 h-5"
                        style={{ color: 'var(--warning)' }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-body font-semibold mb-1"
                        style={{ color: 'var(--warning)' }}
                      >
                        Consent Required
                      </h3>
                      <p
                        className="text-small mb-4"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        To analyze your resume and provide personalized insights, we need your consent for data processing.
                      </p>
                      <button
                        onClick={() => setShowConsentModal(true)}
                        className="btn-primary"
                      >
                        Provide Consent
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'github' && <GitHubConnect />}
          {activeTab === 'badges' && <Badges />}
          {activeTab === 'peers' && <PeerDiscovery />}
          {activeTab === 'skillgap' && <SkillGap />}
        </div>
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