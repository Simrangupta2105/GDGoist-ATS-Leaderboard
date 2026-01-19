import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import ATSResults from './ATSResults'

export default function ResumeUpload({ onScoreUpdate }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)
  const fileInputRef = useRef(null)
  const { apiCall } = useAuth()

  useEffect(() => {
    fetchResumeStatus()
  }, [])

  const fetchResumeStatus = async () => {
    try {
      const response = await apiCall('/me/resume')
      if (response.ok) {
        const data = await response.json()
        if (data.hasResume && data.resume.status === 'scored') {
          setResults({
            score: data.resume.atsScore || 0,
            feedback: [],
            breakdown: {},
            contact: {},
            parsedSkills: data.resume.parsedSkills || [],
            similarityMethod: 'Backend Persisted',
            modelInfo: {},
            rawText: '',
            parsingErrors: []
          })
        }
      }
    } catch (error) {
      console.error('Error fetching resume status:', error)
    }
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a PDF or DOCX file')
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError('')
    setUploadStatus('Processing resume with ATS...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('job_description', 'Software Engineer position requiring programming skills, problem-solving abilities, and technical expertise.')

      const atsResponse = await fetch('http://localhost:4000/resumes/parse', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!atsResponse.ok) {
        throw new Error(`ATS processing failed: ${atsResponse.status}`)
      }

      const atsData = await atsResponse.json()

      setUploadStatus('')
      setError('')

      setResults({
        score: atsData.atsScore || 0,
        feedback: atsData.feedback || [],
        breakdown: atsData.breakdown || {},
        contact: atsData.contact || {},
        parsedSkills: atsData.parsedSkills || [],
        similarityMethod: atsData.similarity_method || 'Unknown',
        modelInfo: atsData.model_info || {},
        rawText: atsData.rawText || '',
        parsingErrors: atsData.parsingErrors || []
      })

      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (onScoreUpdate) {
        onScoreUpdate()
      }
    } catch (error) {
      setError(`Analysis failed: ${error.message}`)
      setUploadStatus('')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect({ target: { files: [droppedFile] } })
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  return (
    <div className="card px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 600 }}>
          Analyze Resume
        </h3>
      </div>

      {/* Upload Area */}
      <div
        className={`p-8 text-center transition-all duration-300 ${file ? '' : ''}`}
        style={{
          background: 'var(--bg-card-soft)',
          border: file ? '2px solid var(--accent-success)' : '2px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseEnter={(e) => !file && (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
        onMouseLeave={(e) => !file && (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
      >
        {!file ? (
          <div>
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <svg className="w-8 h-8 text-white" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <label htmlFor="file-upload" className="cursor-pointer">
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem' }}>
                Drop your resume here or{' '}
                <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>browse</span>
              </span>
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                ref={fileInputRef}
              />
            </label>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              PDF or DOCX up to 10MB
            </p>
          </div>
        ) : (
          <div>
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-success)' }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>✓ {file.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
              style={{
                color: 'var(--accent-danger)',
                marginTop: '0.75rem',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--danger-bg)',
                fontWeight: 500,
                fontSize: '0.875rem'
              }}
            >
              Remove file
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mt-4 px-4 py-3"
          style={{
            backgroundColor: 'var(--danger-bg)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--accent-danger)'
          }}
        >
          <p style={{ color: 'var(--accent-danger)', fontWeight: 500 }}>{error}</p>
        </div>
      )}

      {/* Upload Status */}
      {uploadStatus && (
        <div
          className="mt-4 px-4 py-3 flex items-center gap-3"
          style={{
            backgroundColor: 'var(--bg-card-soft)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--accent-primary)'
          }}
        >
          <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{uploadStatus}</span>
        </div>
      )}

      {/* Results */}
      {results && (
        <div data-results-container className="mt-6">
          <ATSResults
            score={results.score}
            feedback={results.feedback}
            breakdown={results.breakdown}
            contact={results.contact}
            parsedSkills={results.parsedSkills}
            similarityMethod={results.similarityMethod}
            modelInfo={results.modelInfo}
            rawText={results.rawText}
            parsingErrors={results.parsingErrors}
            onClose={() => setResults(null)}
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full mt-6 py-4 font-semibold transition-all"
        style={{
          backgroundColor: !file || uploading ? 'var(--border-subtle)' : 'var(--accent-primary)',
          color: 'white',
          borderRadius: 'var(--radius-lg)',
          opacity: !file || uploading ? 0.5 : 1,
          cursor: !file || uploading ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading ? 'Analyzing...' : file ? 'Analyze Resume' : 'Select a Resume First'}
      </button>

      {/* Info Section */}
      <div
        className="mt-6 p-4"
        style={{
          backgroundColor: 'var(--bg-card-soft)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          What happens next:
        </p>
        <ul style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }} className="space-y-1">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }}></span>
            Your resume will be uploaded securely
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }}></span>
            Our ATS will analyze for skills and keywords
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-success)' }}></span>
            You'll receive an employability score
          </li>
        </ul>
      </div>
    </div>
  )
}