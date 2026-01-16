import React from 'react'
import { Link } from 'react-router-dom'
import gdgLogo from '../assets/gdg-logo.png'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="container-premium py-4">
          <div className="flex justify-between items-center">
            {/* GDG Logo - Static Image */}
            <div className="flex items-center gap-3">
              <img
                src={gdgLogo}
                alt="GDG Logo"
                className="h-8 w-8 object-contain flex-shrink-0 opacity-75"
              />
              <div className="flex flex-col leading-tight">
                <span
                  className="text-base font-semibold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  ATS Leaderboard
                </span>
                <span
                  className="text-xs font-normal"
                  style={{ color: 'var(--text-muted)', opacity: 0.65 }}
                >
                  GDG on Campus OIST
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-small font-medium hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-secondary)' }}
              >
                Sign in
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Calm, Institutional */}
      <section className="py-20 md:py-32">
        <div className="container-premium">
          <div className="max-w-3xl mx-auto text-center animate-fadeIn">
            <h1 className="text-display mb-6" style={{ color: 'var(--text-primary)' }}>
              AI-Powered Career Readiness Platform
            </h1>
            <p className="text-heading font-normal mb-8" style={{ color: 'var(--text-secondary)' }}>
              Understand your employability. Get personalized insights. Track your progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-base px-8 py-3">
                Start Your Analysis
              </Link>
              <Link to="/leaderboard" className="btn-secondary text-base px-8 py-3">
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Clear, Simple */}
      <section className="py-20 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container-premium">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-heading text-center mb-16" style={{ color: 'var(--text-primary)' }}>
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {/* Step 1 */}
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(132, 89, 43, 0.1)' }}
                >
                  <span className="text-xl font-bold" style={{ color: '#84592B' }}>1</span>
                </div>
                <h3 className="text-body font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Upload Your Resume
                </h3>
                <p className="text-small" style={{ color: 'var(--text-muted)' }}>
                  Our AI analyzes your resume against industry standards and job requirements
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(132, 89, 43, 0.1)' }}
                >
                  <span className="text-xl font-bold" style={{ color: '#84592B' }}>2</span>
                </div>
                <h3 className="text-body font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Get AI Insights
                </h3>
                <p className="text-small" style={{ color: 'var(--text-muted)' }}>
                  Receive personalized recommendations and understand what employers look for
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(132, 89, 43, 0.1)' }}
                >
                  <span className="text-xl font-bold" style={{ color: '#84592B' }}>3</span>
                </div>
                <h3 className="text-body font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Track Progress
                </h3>
                <p className="text-small" style={{ color: 'var(--text-muted)' }}>
                  Monitor your improvement over time and benchmark against your peers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Minimal, Credible */}
      <section className="py-20">
        <div className="container-premium">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-heading text-center mb-16" style={{ color: 'var(--text-primary)' }}>
              What You Get
            </h2>
            <div className="space-y-8">
              {/* Feature 1 */}
              <div className="card-premium hover-lift">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(132, 89, 43, 0.1)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#84592B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-body font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      ATS Compatibility Analysis
                    </h3>
                    <p className="text-small" style={{ color: 'var(--text-muted)' }}>
                      Understand how well your resume performs with Applicant Tracking Systems used by most companies
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="card-premium hover-lift">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(132, 89, 43, 0.1)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#84592B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-body font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Personalized Recommendations
                    </h3>
                    <p className="text-small" style={{ color: 'var(--text-muted)' }}>
                      AI-powered insights tailored to your profile, helping you understand exactly what to improve
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="card-premium hover-lift">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(132, 89, 43, 0.1)' }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#84592B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-body font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Progress Tracking
                    </h3>
                    <p className="text-small" style={{ color: 'var(--text-muted)' }}>
                      Monitor your employability score over time and see how you compare with your peers
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Calm */}
      <section className="py-20 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container-premium">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-heading mb-4" style={{ color: 'var(--text-primary)' }}>
              Ready to understand your career readiness?
            </h2>
            <p className="text-body mb-8" style={{ color: 'var(--text-muted)' }}>
              Join students who are taking control of their employability
            </p>
            <Link to="/register" className="btn-primary text-base px-8 py-3">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="container-premium">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <GDGLogo size="sm" showText={true} variant="full" />
            <p className="text-small" style={{ color: 'var(--text-muted)' }}>
              © 2026 ATS Leaderboard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
