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

  // Fetch persisted resume status on mount (backend as single source of truth)
  useEffect(() => {
    fetchResumeStatus()
  }, [])

  const fetchResumeStatus = async () => {
    try {
      const response = await apiCall('/me/resume')
      if (response.ok) {
        const data = await response.json()
        if (data.hasResume && data.resume.status === 'scored') {
          // Hydrate results from backend
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

  // Extract key improvement points from feedback
  const extractKeyImprovements = (feedback) => {
    const improvements = []

    feedback.forEach(item => {
      if (item.includes('Missing') && item.includes('section')) {
        if (item.includes('Education')) improvements.push('• Add Education section')
        if (item.includes('Experience')) improvements.push('• Add Work Experience section')
        if (item.includes('Skills')) improvements.push('• Add Skills section')
      }
      if (item.includes('Email not found')) improvements.push('• Add professional email address')
      if (item.includes('Phone not found')) improvements.push('• Add contact phone number')
      if (item.includes('Low semantic match')) improvements.push('• Use more relevant keywords from job description')
      if (item.includes('Moderate semantic match')) improvements.push('• Align experience with job requirements')
      if (item.includes('Formatting risk')) improvements.push('• Improve document formatting')
    })

    // Limit to top 4 most important improvements
    return improvements.slice(0, 4)
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a PDF or DOCX file')
        return
      }

      // Validate file size (10MB limit)
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
    setUploadStatus('Starting upload process...')

    try {
      console.log('Starting upload process for file:', file.name)

      setUploadStatus('Processing resume with ATS...')

      // Step 1: Send to ATS service for processing
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

      console.log('ATS response status:', atsResponse.status)

      if (!atsResponse.ok) {
        const errorText = await atsResponse.text()
        console.error('ATS processing failed:', errorText)
        throw new Error(`ATS processing failed: ${atsResponse.status}`)
      }

      const atsData = await atsResponse.json()
      console.log('ATS data received:', atsData)
      console.log('Score:', atsData.atsScore)
      console.log('Feedback:', atsData.feedback)
      console.log('Breakdown:', atsData.breakdown)
      console.log('Contact:', atsData.contact)
      console.log('Skills:', atsData.parsedSkills)

      setUploadStatus('')
      setError('')

      // Display full ATS results
      const resultsData = {
        score: atsData.atsScore || 0,
        feedback: atsData.feedback || [],
        breakdown: atsData.breakdown || {},
        contact: atsData.contact || {},
        parsedSkills: atsData.parsedSkills || [],
        similarityMethod: atsData.similarity_method || 'Unknown',
        modelInfo: atsData.model_info || {},
        rawText: atsData.rawText || '',
        parsingErrors: atsData.parsingErrors || []
      }

      console.log('Setting results:', resultsData)
      setResults(resultsData)

      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.querySelector('[data-results-container]')
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)

      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Update user score
      if (onScoreUpdate) {
        onScoreUpdate()
      }

    } catch (error) {
      console.error('Upload error:', error)
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
      // Create a fake event object for handleFileSelect
      handleFileSelect({ target: { files: [droppedFile] } })
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  return (
    <div className="card-modern hover-lift animate-fadeIn overflow-hidden bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
      <div className="px-6 py-6 bg-gradient-to-br from-white dark:from-slate-800 to-blue-50 dark:to-slate-700">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Analyze Resume
          </h3>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${file
              ? 'border-green-300 dark:border-green-600 bg-gradient-to-br from-green-50 dark:from-slate-700 to-emerald-50 dark:to-slate-600 hover-glow'
              : 'border-gray-300 dark:border-slate-600 bg-gradient-to-br from-gray-50 dark:from-slate-700 to-white dark:to-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50 dark:hover:from-slate-700 hover:to-indigo-50 dark:hover:to-slate-600'
            }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {!file ? (
            <div className="animate-fadeIn">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  className="w-8 h-8 text-white"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer group">
                  <span className="mt-2 block text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Drop your resume here or{' '}
                    <span className="text-blue-600 hover:text-blue-500 underline decoration-2 underline-offset-2">browse</span>
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.docx"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                  />
                </label>
                <p className="mt-2 text-sm text-gray-500 font-medium">
                  PDF or DOCX up to 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-scaleIn">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center animate-bounce">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="mt-4">
                <p className="text-lg font-bold text-gray-900">✓ {file.name}</p>
                <p className="text-sm text-gray-500 font-medium">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => {
                    setFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="mt-3 px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 hover-lift"
                >
                  Remove file
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 card-modern bg-gradient-to-r from-red-50 dark:from-slate-700 to-pink-50 dark:to-slate-600 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-6 py-4 animate-fadeIn">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">!</span>
              </div>
              <div>
                <div className="font-bold">Upload Error:</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          </div>
        )}

        {uploadStatus && (
          <div className="mt-6 card-modern bg-gradient-to-r from-blue-50 dark:from-slate-700 to-indigo-50 dark:to-slate-600 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 px-6 py-4 animate-fadeIn">
            <div className="flex items-center">
              <div className="spinner mr-3"></div>
              <div className="font-semibold">
                {uploadStatus}
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div data-results-container>
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

        <div className="mt-8">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Analyzing...
              </div>
            ) : file ? (
              'Analyze Resume'
            ) : (
              'Select a Resume First'
            )}
          </button>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 dark:from-slate-700 to-blue-50 dark:to-slate-600 rounded-xl border border-gray-200 dark:border-slate-600">
          <p className="text-sm font-bold text-gray-700 dark:text-slate-200 mb-2">
            What happens next:
          </p>
          <ul className="text-xs text-gray-600 dark:text-slate-300 space-y-1">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Your resume will be uploaded securely to our system
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
              Our ATS will analyze your resume for relevant skills and keywords
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              You'll receive an employability score based on the analysis
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
              Your score will be updated on the leaderboard (anonymously)
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}