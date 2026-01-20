require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const fetch = require('node-fetch')
const FormData = require('form-data')
const path = require('path')
const fs = require('fs')
const { connect } = require('./db')
const app = express()
const bcrypt = require('bcryptjs')
const User = require('./models/user.model')
const Resume = require('./models/resume.model')
const Badge = require('./models/badge.model')
const BadgeDefinition = require('./models/badgeDefinition.model')
const { recalculateUserScore } = require('./scoreService')
const { generateToken, verifyToken, requireRole } = require('./middleware/auth')
const { requireOnboarded } = require('./middleware/onboarding')
const { requireConsent } = require('./middleware/consent')

connect()

app.use(cors())
app.use(express.json())
app.use(fileUpload())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ============ ADMIN AUTHORIZATION ============
/**
 * Check if email is in admin whitelist
 * Whitelist configured via ADMIN_EMAILS environment variable
 * Format: comma-separated list of emails
 */
function isAdminEmail(email) {
  const adminEmails = process.env.ADMIN_EMAILS || ''
  const whitelist = adminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return whitelist.includes(email.toLowerCase())
}

/**
 * Determine user role based on email whitelist
 * Returns 'admin' if email is whitelisted, 'student' otherwise
 */
function determineUserRole(email) {
  return isAdminEmail(email) ? 'admin' : 'student'
}
// ============================================

// SBERT Semantic Analysis Helper - with improved heuristic fallback
async function getSemanticSimilarity(resumeText, jobDescription) {
  try {
    // Try SBERT service first
    const formData = new FormData()
    formData.append('text1', resumeText.substring(0, 2000))
    formData.append('text2', jobDescription.substring(0, 1000))

    const response = await fetch('http://localhost:8001/semantic-similarity', {
      method: 'POST',
      body: formData,
      timeout: 5000
    })

    if (response.ok) {
      const data = await response.json()
      return data.similarity || 0
    }
  } catch (err) {
    console.log('SBERT service unavailable, using improved heuristic')
  }

  // Improved heuristic fallback - semantic-like matching
  return improvedSemanticHeuristic(resumeText, jobDescription)
}

// Enhanced Semantic Analysis with NLP techniques
function improvedSemanticHeuristic(resumeText, jobDescription) {
  if (!jobDescription) return 0

  const resume = resumeText.toLowerCase()
  const jd = jobDescription.toLowerCase()

  // Extended stopwords list
  const stopwords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'is', 'as', 'at',
    'by', 'in', 'of', 'on', 'or', 'to', 'a', 'an', 'be', 'but', 'if', 'it', 'no', 'not', 'so', 'up', 'we',
    'you', 'your', 'he', 'she', 'it', 'they', 'them', 'their', 'which', 'who', 'what', 'when', 'where', 'why',
    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'well', 'even', 'any', 'about', 'after', 'before',
    'between', 'during', 'through', 'throughout', 'within', 'without', 'above', 'below', 'under', 'over',
    'out', 'off', 'up', 'down', 'here', 'there', 'now', 'then', 'today', 'tomorrow', 'yesterday'
  ])

  // Extract and normalize terms
  const extractTerms = (text) => {
    return text.match(/\b\w{3,}\b/g)?.filter(w => !stopwords.has(w)) || []
  }

  // Extract n-grams (2-3 word phrases)
  const extractNGrams = (text, n = 2) => {
    const words = text.split(/\s+/).filter(w => w.length > 2)
    const ngrams = []
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '))
    }
    return ngrams
  }

  const jdTerms = extractTerms(jd)
  const resumeTerms = extractTerms(resume)
  const jdBigrams = extractNGrams(jd, 2)
  const resumeBigrams = extractNGrams(resume, 2)
  const jdTrigrams = extractNGrams(jd, 3)
  const resumeTrigrams = extractNGrams(resume, 3)

  if (jdTerms.length === 0) return 0

  // 1. Unigram matching (40% weight)
  const resumeTermSet = new Set(resumeTerms)
  const matchedTerms = jdTerms.filter(term => resumeTermSet.has(term))
  const unigramScore = (matchedTerms.length / jdTerms.length) * 0.4

  // 2. Bigram matching (30% weight) - more specific
  const resumeBigramSet = new Set(resumeBigrams)
  const matchedBigrams = jdBigrams.filter(bigram => resumeBigramSet.has(bigram))
  const bigramScore = (matchedBigrams.length / Math.max(1, jdBigrams.length)) * 0.3

  // 3. Trigram matching (15% weight) - very specific
  const resumeTrigramSet = new Set(resumeTrigrams)
  const matchedTrigrams = jdTrigrams.filter(trigram => resumeTrigramSet.has(trigram))
  const trigramScore = (matchedTrigrams.length / Math.max(1, jdTrigrams.length)) * 0.15

  // 4. Skill keyword matching (15% weight)
  const skillKeywords = [
    'javascript', 'python', 'java', 'c++', 'c#', 'typescript', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
    'react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'ember', 'backbone',
    'node', 'express', 'django', 'flask', 'fastapi', 'spring', 'laravel', 'rails', 'asp',
    'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'firebase', 'dynamodb', 'cassandra',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'github', 'gitlab', 'jenkins', 'circleci',
    'rest', 'graphql', 'grpc', 'websocket', 'oauth', 'jwt', 'microservices', 'serverless',
    'html', 'css', 'scss', 'sass', 'sql', 'nosql', 'xml', 'json', 'yaml',
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
    'agile', 'scrum', 'kanban', 'jira', 'confluence', 'linux', 'unix', 'windows', 'macos',
    'ci/cd', 'devops', 'testing', 'jest', 'mocha', 'pytest', 'selenium', 'cypress'
  ]

  let skillMatches = 0
  for (const skill of skillKeywords) {
    if (jd.includes(skill) && resume.includes(skill)) {
      skillMatches++
    }
  }
  const skillScore = (skillMatches / Math.max(1, skillKeywords.length)) * 0.15

  // 5. Semantic similarity bonus - check for related terms
  const semanticRelations = {
    'developer': ['engineer', 'programmer', 'coder', 'architect'],
    'frontend': ['ui', 'ux', 'client-side', 'web'],
    'backend': ['server-side', 'api', 'database'],
    'fullstack': ['full-stack', 'full stack'],
    'devops': ['infrastructure', 'deployment', 'cloud'],
    'data': ['analytics', 'warehouse', 'science', 'engineering'],
    'security': ['cybersecurity', 'encryption', 'authentication'],
    'testing': ['qa', 'quality assurance', 'automation'],
    'management': ['leadership', 'team lead', 'scrum master'],
    'design': ['ux', 'ui', 'figma', 'sketch']
  }

  let semanticBonus = 0
  for (const [key, values] of Object.entries(semanticRelations)) {
    if (jd.includes(key)) {
      for (const val of values) {
        if (resume.includes(val)) {
          semanticBonus += 0.02
        }
      }
    }
  }

  // 6. Experience level matching
  let experienceBonus = 0
  const experienceLevels = {
    'junior': ['entry', 'beginner', 'fresh', 'graduate'],
    'mid': ['intermediate', 'experienced', '3-5 years', '5+ years'],
    'senior': ['lead', 'principal', '10+ years', 'expert', 'architect'],
    'intern': ['internship', 'student', 'trainee']
  }

  for (const [level, keywords] of Object.entries(experienceLevels)) {
    if (jd.includes(level)) {
      for (const keyword of keywords) {
        if (resume.includes(keyword)) {
          experienceBonus += 0.03
        }
      }
    }
  }

  // Calculate final score
  const finalScore = Math.min(1.0, unigramScore + bigramScore + trigramScore + skillScore + semanticBonus + experienceBonus)
  return Math.max(0, finalScore)
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Test endpoint for debugging
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date() })
})

// Register (university email login). Role defaults to 'student'.
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })

    // Optional domain restriction via env var
    const domain = process.env.UNIVERSITY_DOMAIN
    if (domain && !email.toLowerCase().endsWith(domain.toLowerCase())) {
      return res.status(400).json({ error: `email must be a ${domain} address` })
    }

    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: 'User already exists' })

    // Determine role based on admin whitelist
    const role = determineUserRole(email)

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, passwordHash, role })
    const token = generateToken(user)

    console.log(`[Auth] User registered: ${email} with role: ${role}`)

    return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email and password required' })
    const user = await User.findOne({ email })
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    // Check if role needs to be updated based on current whitelist
    const expectedRole = determineUserRole(email)
    if (user.role !== expectedRole) {
      console.log(`[Auth] Updating role for ${email}: ${user.role} -> ${expectedRole}`)
      user.role = expectedRole
      await user.save()
    }

    const token = generateToken(user)
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ============ PASSWORD RESET (DEV/ADMIN SETUP) ============
/**
 * Password reset endpoint for admin setup and recovery
 * WARNING: This is a temporary endpoint for initial admin setup
 * In production, implement proper password reset flow with email verification
 * 
 * Usage:
 * POST /auth/reset-password
 * Body: { email, newPassword }
 */
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body

    // Validation
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'email and newPassword are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Hash new password using same logic as registration
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    user.passwordHash = passwordHash
    await user.save()

    console.log(`[Auth] Password reset successful for: ${email} (role: ${user.role})`)

    return res.json({
      message: 'Password reset successful',
      user: {
        email: user.email,
        role: user.role,
        name: user.name
      }
    })
  } catch (err) {
    console.error('[Auth] Password reset error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})
// ========================================================

// Consent endpoint - protected (Phase 3: Now tracks consent history)
app.post('/consent', verifyToken, async (req, res) => {
  try {
    const { consented } = req.body
    if (typeof consented !== 'boolean') return res.status(400).json({ error: 'consented (boolean) is required' })
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    user.dpdpConsent = { consented: !!consented, timestamp: new Date() }
    await user.save()

    // Phase 3: Record consent event in history (will be imported later)
    try {
      await recordConsentEvent(req.user.id, consented)
    } catch (historyErr) {
      console.error('Consent history recording error:', historyErr)
      // Don't fail the request if history recording fails
    }

    return res.json({ message: 'Consent recorded', dpdpConsent: user.dpdpConsent })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get current user profile (for auth state hydration)
app.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash')
    if (!user) return res.status(404).json({ error: 'User not found' })
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        graduationYear: user.graduationYear,
        dpdpConsent: user.dpdpConsent,
        githubProfile: user.githubProfile,
        github: user.github
      }
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ============ PROFILE MANAGEMENT ENDPOINTS ============

// Get current user's full profile
app.get('/me/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash')
    if (!user) return res.status(404).json({ error: 'User not found' })

    return res.json({
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        graduationYear: user.graduationYear,
        bio: user.bio || '',
        profilePicture: user.profilePicture || '',
        socialLinks: user.socialLinks || {},
        projects: user.projects || [],
        experiences: user.experiences || [],
        profileVisibility: user.profileVisibility || 'public',
        github: user.github,
        createdAt: user.createdAt
      }
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Update current user's profile
app.put('/me/profile', verifyToken, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'department', 'graduationYear', 'bio', 'profilePicture', 'socialLinks', 'projects', 'experiences', 'profileVisibility']
    const updates = {}
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select('-passwordHash')
    if (!user) return res.status(404).json({ error: 'User not found' })

    console.log(`[Profile] Updated profile for user ${user.email}`)
    return res.json({
      message: 'Profile updated successfully',
      profile: {
        id: user._id, name: user.name, email: user.email, department: user.department,
        graduationYear: user.graduationYear, bio: user.bio || '', profilePicture: user.profilePicture || '',
        socialLinks: user.socialLinks || {}, projects: user.projects || [],
        experiences: user.experiences || [], profileVisibility: user.profileVisibility || 'public'
      }
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Upload profile picture
app.post('/me/avatar', verifyToken, async (req, res) => {
  try {
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const file = req.files.avatar
    const uploadDir = path.join(__dirname, '../uploads')

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const fileExt = path.extname(file.name)
    const filename = `avatar-${req.user.id}-${Date.now()}${fileExt}`
    const uploadPath = path.join(uploadDir, filename)

    // Move file to uploads directory
    await file.mv(uploadPath)

    // Build URL (assuming backend is serving static files from /uploads)
    const protocol = req.protocol
    const host = req.get('host')
    const fileUrl = `${protocol}://${host}/uploads/${filename}`

    // Update user profile
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: fileUrl },
      { new: true }
    ).select('-passwordHash')

    return res.json({
      message: 'Avatar uploaded successfully',
      url: fileUrl,
      profile: {
        profilePicture: user.profilePicture
      }
    })

  } catch (err) {
    console.error('Avatar upload error:', err)
    return res.status(500).json({ error: 'Failed to upload avatar' })
  }
})

// Get public profile of any user (for leaderboard clicks)
app.get('/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params
    const user = await User.findById(userId).select('-passwordHash -email')
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Private profile - return limited info
    if (user.profileVisibility === 'private') {
      return res.json({ profile: { id: user._id, name: user.name, department: user.department, graduationYear: user.graduationYear, isPrivate: true } })
    }

    // Get user's score
    const Score = require('./models/score.model')
    const latestScore = await Score.findOne({ user: userId }).sort({ createdAt: -1 })

    return res.json({
      profile: {
        id: user._id, name: user.name, department: user.department, graduationYear: user.graduationYear,
        bio: user.bio || '', profilePicture: user.profilePicture || '', socialLinks: user.socialLinks || {},
        projects: user.projects || [], experiences: user.experiences || [],
        github: user.github?.username ? { username: user.github.username } : null,
        score: latestScore ? { total: latestScore.totalScore, ats: latestScore.resumeScore, github: latestScore.githubScore, badges: latestScore.badgesScore } : null,
        isPrivate: false
      }
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

const { generateUploadUrl } = require('./s3')
const Score = require('./models/score.model')
const GitHub = require('./models/github.model')
const Connection = require('./models/connection.model')
const SkillGap = require('./models/skillgap.model')
const { getAuthorizationUrl, getAccessToken, syncGitHubData } = require('./github')
const { checkAndAwardBadges, getUserBadges, calculateBadgeScore } = require('./badges')

// PHASE 2: Centralized Services
const { getScoreBreakdown } = require('./scoreService')
const { startScheduler: startGitHubScheduler, triggerUserSync } = require('./githubScheduler')

// PHASE 3: Admin Intelligence & Privacy
const {
  getCohortAnalytics,
  getSkillIntelligence,
  getAtRiskCohorts,
  getTrendAnalysis,
  getPlatformStats
} = require('./adminAnalytics')
const {
  executeRightToErasure,
  recordConsentEvent,
  getConsentHistory,
  createAuditLog,
  getAuditLogs,
  exportUserData
} = require('./privacyService')
const { withCache } = require('./analyticsCache')
const { generalLimiter, authLimiter, adminLimiter, uploadLimiter } = require('./middleware/rateLimit')

// Generate a pre-signed upload URL for a resume (PUT). Returns resume metadata record and upload URL.
app.post('/resumes/upload-url', verifyToken, requireConsent, async (req, res) => {
  try {
    const { filename, contentType, size } = req.body
    if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' })

    const lower = filename.toLowerCase()
    const allowed = ['.pdf', '.docx']
    if (!allowed.some(ext => lower.endsWith(ext))) {
      return res.status(400).json({ error: 'Only PDF and DOCX files are allowed' })
    }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid contentType for PDF/DOCX' })
    }

    const userId = req.user.id
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now())
    const ext = filename.slice(filename.lastIndexOf('.'))
    const key = `resumes/${userId}/${uuid}${ext}`

    // create metadata record (status pending)
    const resume = await Resume.create({
      user: userId,
      originalFilename: filename,
      contentType,
      size: size || 0,
      fileKey: key,
      status: 'pending'
    })

    const url = await generateUploadUrl(key, contentType)
    return res.json({ uploadUrl: url, fileKey: key, resumeId: resume._id })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Notify backend that client finished uploading to S3. Marks resume as uploaded (stores timestamp and size if provided).
app.post('/resumes/complete', verifyToken, requireConsent, async (req, res) => {
  try {
    const { resumeId, size } = req.body
    if (!resumeId) return res.status(400).json({ error: 'resumeId required' })
    const resume = await Resume.findById(resumeId)
    if (!resume) return res.status(404).json({ error: 'Resume not found' })
    if (resume.user.toString() !== req.user.id) return res.status(403).json({ error: 'Not allowed' })
    resume.status = 'uploaded'
    if (size) resume.size = size
    resume.uploadedAt = new Date()
    await resume.save()
    // Recalculate employability score for the user (Phase 1: GitHub=0, Badges=0)
    try {
      await recalculateUserScore(req.user.id)
    } catch (err) {
      console.error('recalculateUserScore error after complete:', err)
    }
    return res.json({ message: 'Resume upload recorded', resumeId: resume._id })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Endpoint for ATS service to POST scoring results back to BFF.
// Expects: { resumeId, atsScore, parsedSkills?, parsingErrors? }
app.post('/resumes/ats-result', async (req, res) => {
  try {
    const { resumeId, atsScore, parsedSkills, parsingErrors } = req.body
    if (!resumeId || typeof atsScore !== 'number') return res.status(400).json({ error: 'resumeId and numeric atsScore required' })
    const resume = await Resume.findById(resumeId)
    if (!resume) return res.status(404).json({ error: 'Resume not found' })
    // Update resume document with ATS results
    resume.atsScore = atsScore
    if (Array.isArray(parsedSkills)) resume.parsedSkills = parsedSkills
    if (Array.isArray(parsingErrors)) resume.parsingErrors = parsingErrors
    resume.status = 'scored'
    await resume.save()

    // Recalculate user score
    try {
      await recalculateUserScore(String(resume.user))
    } catch (err) {
      console.error('recalculateUserScore error after ats-result:', err)
    }

    return res.json({ message: 'ATS result recorded', resumeId: resume._id })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})


const crypto = require('crypto')

// Public leaderboard (anonymous-by-default)
// Query params: department, graduationYear, limit, page
app.get('/leaderboard', async (req, res) => {
  try {
    const { department, graduationYear, limit = 50, page = 1 } = req.query
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const lim = Math.max(1, Math.min(200, parseInt(limit, 10) || 50))

    const matchStage = {}
    if (department) matchStage['userDoc.department'] = department
    if (graduationYear) matchStage['userDoc.graduationYear'] = Number(graduationYear)

    const facet = {
      $facet: {
        data: [
          { $sort: { totalScore: -1 } },
          { $skip: (pageNum - 1) * lim },
          { $limit: lim },
        ],
        totalCount: [{ $count: 'count' }],
      },
    }

    const pipeline = [
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
      { $unwind: '$userDoc' },
    ]
    if (Object.keys(matchStage).length) pipeline.push({ $match: matchStage })
    pipeline.push(facet)

    const agg = await Score.aggregate(pipeline)
    const data = (agg[0] && agg[0].data) || []
    const totalCount = (agg[0] && agg[0].totalCount[0] && agg[0].totalCount[0].count) || 0

    // Need global ranks. We will compute rankOffset = (page-1)*lim and assign ranks accordingly
    const rankOffset = (pageNum - 1) * lim
    const entries = data.map((d, i) => ({
      rank: rankOffset + i + 1,
      userId: d.userDoc._id,
      totalScore: d.totalScore,
      name: d.userDoc.name || 'Anonymous',
      department: d.userDoc.department || null,
      graduationYear: d.userDoc.graduationYear || null,
      profilePicture: d.userDoc.profilePicture || null
    }))

    return res.json({ totalCount, page: pageNum, limit: lim, entries })
  } catch (err) {
    console.error('leaderboard error', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Admin leaderboard: includes user identity (admin-only)
app.get('/leaderboard/admin', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { department, graduationYear, limit = 200, page = 1 } = req.query
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const lim = Math.max(1, Math.min(1000, parseInt(limit, 10) || 200))

    const matchStage = {}
    if (department) matchStage['userDoc.department'] = department
    if (graduationYear) matchStage['userDoc.graduationYear'] = Number(graduationYear)

    const facet = {
      $facet: {
        data: [
          { $sort: { totalScore: -1 } },
          { $skip: (pageNum - 1) * lim },
          { $limit: lim },
        ],
        totalCount: [{ $count: 'count' }],
      },
    }

    const pipeline = [
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
      { $unwind: '$userDoc' },
    ]
    if (Object.keys(matchStage).length) pipeline.push({ $match: matchStage })
    pipeline.push(facet)

    const agg = await Score.aggregate(pipeline)
    const data = (agg[0] && agg[0].data) || []
    const totalCount = (agg[0] && agg[0].totalCount[0] && agg[0].totalCount[0].count) || 0

    const rankOffset = (pageNum - 1) * lim
    const entries = data.map((d, i) => ({
      rank: rankOffset + i + 1,
      totalScore: d.totalScore,
      user: {
        id: d.userDoc._id,
        name: d.userDoc.name,
        email: d.userDoc.email,
      },
      department: d.userDoc.department || null,
      graduationYear: d.userDoc.graduationYear || null,
    }))

    return res.json({ totalCount, page: pageNum, limit: lim, entries })
  } catch (err) {
    console.error('admin leaderboard error', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Admin statistics: department-wise distribution (no PII)
app.get('/admin/stats/departments', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // Fetch scores joined with users
    const docs = await Score.aggregate([
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
      { $unwind: '$userDoc' },
      { $project: { totalScore: 1, department: '$userDoc.department', graduationYear: '$userDoc.graduationYear' } },
    ])

    const byDept = {}
    for (const d of docs) {
      const dept = d.department || 'Unknown'
      if (!byDept[dept]) byDept[dept] = { scores: [] }
      byDept[dept].scores.push(d.totalScore || 0)
    }

    const result = []
    const buckets = Array.from({ length: 10 }, (_, i) => ({ min: i * 10, max: i * 10 + 9 }))
    for (const [dept, info] of Object.entries(byDept)) {
      const scores = info.scores
      const count = scores.length
      const avg = count ? (scores.reduce((a, b) => a + b, 0) / count) : 0
      const min = count ? Math.min(...scores) : 0
      const max = count ? Math.max(...scores) : 0
      // histogram buckets
      const hist = buckets.map(b => ({ range: `${b.min}-${b.max}`, count: 0 }))
      for (const s of scores) {
        const idx = Math.min(9, Math.floor((s || 0) / 10))
        hist[idx].count += 1
      }
      result.push({ department: dept, count, avg: Number(avg.toFixed(2)), min, max, histogram: hist })
    }
    return res.json({ departments: result })
  } catch (err) {
    console.error('admin stats departments error', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Admin statistics: year-wise averages (no PII)
app.get('/admin/stats/years', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const docs = await Score.aggregate([
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
      { $unwind: '$userDoc' },
      { $project: { totalScore: 1, graduationYear: '$userDoc.graduationYear' } },
      { $group: { _id: '$graduationYear', count: { $sum: 1 }, avg: { $avg: '$totalScore' }, min: { $min: '$totalScore' }, max: { $max: '$totalScore' } } },
      { $sort: { _id: 1 } },
    ])
    const result = docs.map(d => ({ graduationYear: d._id || 'Unknown', count: d.count, avg: Number((d.avg || 0).toFixed(2)), min: d.min || 0, max: d.max || 0 }))
    return res.json({ years: result })
  } catch (err) {
    console.error('admin stats years error', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Admin anonymized CSV export (no PII). Optional query params: department, graduationYear
app.get('/admin/export/anonymized.csv', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { department, graduationYear } = req.query
    const matchStage = {}
    if (department) matchStage['userDoc.department'] = department
    if (graduationYear) matchStage['userDoc.graduationYear'] = Number(graduationYear)

    const pipeline = [
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
      { $unwind: '$userDoc' },
    ]
    if (Object.keys(matchStage).length) pipeline.push({ $match: matchStage })
    pipeline.push({ $sort: { totalScore: -1 } })
    const docs = await Score.aggregate(pipeline)

    // Build CSV in memory
    const rows = []
    rows.push(['anon_id', 'department', 'graduationYear', 'rank', 'totalScore'])
    let rank = 1
    for (const d of docs) {
      const uid = String(d.user)
      const hash = crypto.createHash('sha256').update(uid).digest('hex').slice(0, 12)
      const dept = (d.userDoc && d.userDoc.department) || ''
      const year = (d.userDoc && d.userDoc.graduationYear) || ''
      rows.push([hash, dept, year, String(rank), String(d.totalScore || 0)])
      rank += 1
    }

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="leaderboard_anonymized.csv"')
    return res.send(csv)
  } catch (err) {
    console.error('admin export error', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Return current user profile (minimal)
app.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash')
    if (!user) return res.status(404).json({ error: 'User not found' })
    const onboardingRequired = !(user.department && user.graduationYear)
    return res.json({ user, onboardingRequired })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Onboarding: students must provide department and graduationYear
app.post('/onboarding', verifyToken, async (req, res) => {
  try {
    const { department, graduationYear } = req.body
    if (!department || !graduationYear) {
      return res.status(400).json({ error: 'department and graduationYear are required' })
    }
    const yearNum = Number(graduationYear)
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return res.status(400).json({ error: 'graduationYear must be a valid year' })
    }
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    user.department = department
    user.graduationYear = yearNum
    await user.save()
    return res.json({ message: 'Onboarding complete', user: { id: user._id, department: user.department, graduationYear: user.graduationYear } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Example protected route for students
app.get('/protected/student', verifyToken, requireOnboarded, (req, res) => {
  return res.json({ message: `Hello ${req.user.name}, you are authenticated as ${req.user.role}` })
})

// Example admin-only route (requires onboarding as well)
app.get('/protected/admin', verifyToken, requireOnboarded, requireRole('admin'), (req, res) => {
  return res.json({ message: `Hello Admin ${req.user.name}` })
})

// ============ PHASE 2: GitHub Integration ============

// Get GitHub OAuth URL
app.get('/github/auth-url', verifyToken, (req, res) => {
  const state = require('crypto').randomBytes(16).toString('hex')
  // Store state in session/cache (simplified: just return it)
  const url = getAuthorizationUrl(state)
  return res.json({ authUrl: url, state })
})

// GitHub OAuth callback handler
app.post('/github/callback', verifyToken, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'code required' })

    const accessToken = await getAccessToken(code)
    const syncResult = await syncGitHubData(code.split('_')[0] || 'unknown', accessToken) // simplified username extraction

    // Store GitHub data
    let githubDoc = await GitHub.findOne({ user: req.user.id })
    if (!githubDoc) {
      githubDoc = await GitHub.create({
        user: req.user.id,
        githubUsername: syncResult.profile.name || 'unknown',
        accessToken,
        profile: syncResult.profile,
        stats: syncResult.stats,
        lastSyncedAt: new Date(),
        syncStatus: 'completed',
      })
    } else {
      githubDoc.accessToken = accessToken
      githubDoc.profile = syncResult.profile
      githubDoc.stats = syncResult.stats
      githubDoc.lastSyncedAt = new Date()
      githubDoc.syncStatus = 'completed'
      await githubDoc.save()
    }

    // Update user GitHub profile AND connection state (CRITICAL for sync job)
    const user = await User.findById(req.user.id)
    user.githubProfile = syncResult.profile.name
    user.github = {
      username: syncResult.profile.login || syncResult.profile.name,
      connected: true,
      lastSyncedAt: new Date()
    }
    await user.save()

    // Check and award badges
    const newBadges = await checkAndAwardBadges(req.user.id)

    // Recalculate score
    await recalculateUserScore(req.user.id)

    return res.json({
      message: 'GitHub connected successfully',
      profile: syncResult.profile,
      stats: syncResult.stats,
      newBadges,
    })
  } catch (err) {
    console.error('GitHub callback error:', err)
    return res.status(500).json({ error: 'GitHub connection failed' })
  }
})

// Get user's GitHub profile
app.get('/github/profile', verifyToken, async (req, res) => {
  try {
    const githubData = await GitHub.findOne({ user: req.user.id })
    if (!githubData) return res.status(404).json({ error: 'GitHub not connected' })
    return res.json({
      profile: githubData.profile,
      stats: githubData.stats,
      lastSyncedAt: githubData.lastSyncedAt,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ============ PHASE 2: Badges & Gamification ============

// Get user badges
app.get('/badges', verifyToken, async (req, res) => {
  try {
    const badges = await getUserBadges(req.user.id)
    return res.json({ badges })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get all badge definitions
app.get('/badges/definitions', (req, res) => {
  const { BADGE_DEFINITIONS } = require('./badges')
  return res.json({ definitions: BADGE_DEFINITIONS })
})

// ============ PHASE 2: Peer Discovery & Networking ============

// Search peers by skills (skill-based search)
app.get('/peers/search', verifyToken, async (req, res) => {
  try {
    const { skills, limit = 20, page = 1 } = req.query
    if (!skills) return res.status(400).json({ error: 'skills query param required' })

    const skillArray = Array.isArray(skills) ? skills : [skills]
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 20))

    // Find users with matching GitHub languages or resume skills
    const matchingUsers = await GitHub.aggregate([
      {
        $match: {
          'stats.languages': { $in: skillArray }
        }
      },
      { $skip: (pageNum - 1) * lim },
      { $limit: lim },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDoc'
        }
      },
      { $unwind: '$userDoc' },
      {
        $lookup: {
          from: 'scores',
          localField: 'user',
          foreignField: 'user',
          as: 'scoreDoc'
        }
      },
      { $unwind: { path: '$scoreDoc', preserveNullAndEmptyArrays: true } },
    ])

    const peers = matchingUsers.map(m => ({
      id: m.user,
      name: m.userDoc.name,
      department: m.userDoc.department,
      skills: m.stats.languages,
      score: m.scoreDoc ? m.scoreDoc.totalScore : 0,
    }))

    return res.json({ peers, page: pageNum, limit: lim })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Send connection request
app.post('/connections/request', verifyToken, async (req, res) => {
  try {
    const { recipientId, message } = req.body
    if (!recipientId) return res.status(400).json({ error: 'recipientId required' })
    if (recipientId === req.user.id) return res.status(400).json({ error: 'Cannot connect with yourself' })

    const existing = await Connection.findOne({
      requester: req.user.id,
      recipient: recipientId,
    })
    if (existing) return res.status(409).json({ error: 'Connection request already exists' })

    const connection = await Connection.create({
      requester: req.user.id,
      recipient: recipientId,
      message,
      status: 'pending',
    })

    return res.status(201).json({ connection })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get pending connection requests
app.get('/connections/pending', verifyToken, async (req, res) => {
  try {
    const requests = await Connection.find({
      recipient: req.user.id,
      status: 'pending',
    }).populate('requester', 'name email department')

    return res.json({ requests })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Accept/reject connection request
app.post('/connections/:connectionId/respond', verifyToken, async (req, res) => {
  try {
    const { connectionId } = req.params
    const { action } = req.body // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be accept or reject' })
    }

    const connection = await Connection.findById(connectionId)
    if (!connection) return res.status(404).json({ error: 'Connection not found' })
    if (connection.recipient.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    connection.status = action === 'accept' ? 'accepted' : 'rejected'
    connection.respondedAt = new Date()
    if (action === 'accept') connection.connectedAt = new Date()
    await connection.save()

    // Check for networking badge
    if (action === 'accept') {
      const acceptedCount = await Connection.countDocuments({
        recipient: req.user.id,
        status: 'accepted',
      })
      if (acceptedCount >= 10) {
        await require('./badges').awardBadge(req.user.id, 'networking_ninja', { connections: acceptedCount })
        await recalculateUserScore(req.user.id)
      }
    }

    return res.json({ connection })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get user's connections
app.get('/connections', verifyToken, async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [
        { requester: req.user.id, status: 'accepted' },
        { recipient: req.user.id, status: 'accepted' },
      ],
    }).populate('requester recipient', 'name email department')

    return res.json({ connections })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ============ PHASE 2: Skill Gap Visualization ============

// Get or create skill gap analysis
app.get('/skillgap', verifyToken, async (req, res) => {
  try {
    let skillGap = await SkillGap.findOne({ user: req.user.id })
    if (!skillGap) {
      skillGap = await SkillGap.create({
        user: req.user.id,
        targetRole: 'Software Engineer',
      })
    }
    return res.json({ skillGap })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Update skill gap analysis
app.post('/skillgap', verifyToken, async (req, res) => {
  try {
    const { targetRole, userSkills } = req.body
    if (!targetRole) return res.status(400).json({ error: 'targetRole required' })

    let skillGap = await SkillGap.findOne({ user: req.user.id })
    if (!skillGap) {
      skillGap = await SkillGap.create({ user: req.user.id })
    }

    skillGap.targetRole = targetRole
    if (userSkills) skillGap.userSkills = userSkills

    // Calculate gaps
    const gaps = []
    const targetSkillsMap = {}
    if (skillGap.targetSkills) {
      for (const ts of skillGap.targetSkills) {
        targetSkillsMap[ts.skill] = ts.importance
      }
    }

    for (const skill of Object.keys(targetSkillsMap)) {
      const userSkill = skillGap.userSkills.find(s => s.skill === skill)
      const userProf = userSkill ? userSkill.proficiency : 0
      const importance = targetSkillsMap[skill]
      const gapScore = Math.max(0, importance - userProf)
      gaps.push({ skill, userProficiency: userProf, targetImportance: importance, gapScore })
    }

    skillGap.gaps = gaps
    skillGap.overallGapScore = gaps.length ? Math.round(gaps.reduce((sum, g) => sum + g.gapScore, 0) / gaps.length) : 0
    skillGap.lastAnalyzedAt = new Date()
    await skillGap.save()

    // Award skill seeker badge
    await require('./badges').awardBadge(req.user.id, 'skill_seeker', { targetRole })
    await recalculateUserScore(req.user.id)

    return res.json({ skillGap })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get peer comparison (skill gap vs peers)
app.get('/skillgap/peers', verifyToken, async (req, res) => {
  try {
    const userSkillGap = await SkillGap.findOne({ user: req.user.id })
    if (!userSkillGap) return res.status(404).json({ error: 'Skill gap not found' })

    // Find peers with same target role
    const peerSkillGaps = await SkillGap.find({
      targetRole: userSkillGap.targetRole,
      user: { $ne: req.user.id },
    }).limit(10)

    const comparison = peerSkillGaps.map(p => ({
      overallGapScore: p.overallGapScore,
      skillCount: p.gaps.length,
    }))

    const avgPeerGap = comparison.length ? Math.round(comparison.reduce((sum, c) => sum + c.overallGapScore, 0) / comparison.length) : 0

    return res.json({
      userGapScore: userSkillGap.overallGapScore,
      avgPeerGapScore: avgPeerGap,
      peerCount: comparison.length,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ============ RESUME PARSING & ATS ANALYSIS ============

// Resume parse endpoint - analyzes resume with improved heuristic analysis
app.post('/resumes/parse', verifyToken, async (req, res) => {
  try {
    const file = req.files?.file
    const jobDescription = req.body.job_description || ''

    if (!file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Read file content
    const fileContent = file.data.toString('utf8')

    // Comprehensive skill detection
    const skillCategories = {
      'Languages': [
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'TypeScript', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'R', 'MATLAB', 'Perl', 'Scala', 'Groovy', 'Dart', 'Elixir', 'Clojure', 'Haskell', 'Lua', 'Objective-C', 'VB.NET'
      ],
      'Frontend': [
        'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Ember', 'Backbone', 'jQuery', 'Bootstrap', 'Tailwind', 'Material UI', 'Webpack', 'Vite', 'Parcel', 'Gulp', 'Grunt', 'LESS', 'SCSS', 'Sass'
      ],
      'Backend': [
        'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot', 'Laravel', 'Rails', 'ASP.NET', 'Fastify', 'Nest.js', 'Gin', 'Echo', 'Fiber', 'Koa', 'Hapi', 'Sails.js'
      ],
      'Databases': [
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Firebase', 'DynamoDB', 'Cassandra', 'Oracle', 'SQL Server', 'MariaDB', 'CouchDB', 'Neo4j', 'Memcached', 'RabbitMQ'
      ],
      'Cloud & DevOps': [
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'GitLab', 'Jenkins', 'CircleCI', 'Travis CI', 'Terraform', 'Ansible', 'CloudFormation', 'Heroku', 'DigitalOcean', 'Netlify', 'Vercel'
      ],
      'APIs & Protocols': [
        'REST API', 'GraphQL', 'gRPC', 'SOAP', 'WebSocket', 'OAuth', 'JWT', 'HTTP/2', 'HTTPS', 'XML', 'JSON', 'YAML'
      ],
      'Data & ML': [
        'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Keras', 'OpenCV', 'NLP', 'Deep Learning', 'Computer Vision', 'Jupyter', 'Anaconda'
      ],
      'Testing': [
        'Jest', 'Mocha', 'Pytest', 'JUnit', 'Selenium', 'Cypress', 'Testing Library', 'RSpec', 'Jasmine', 'Vitest', 'Playwright'
      ],
      'Other': [
        'Agile', 'Scrum', 'Linux', 'Unix', 'Windows', 'macOS', 'HTML', 'CSS', 'SQL', 'NoSQL', 'Microservices', 'Serverless', 'Design Patterns'
      ]
    }

    const detectedSkills = []
    const skillsByCategory = {}

    for (const [category, skills] of Object.entries(skillCategories)) {
      skillsByCategory[category] = []
      skills.forEach(skill => {
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
        if (regex.test(fileContent)) {
          if (!detectedSkills.includes(skill)) {
            detectedSkills.push(skill)
            skillsByCategory[category].push(skill)
          }
        }
      })
    }

    // Remove empty categories
    Object.keys(skillsByCategory).forEach(key => {
      if (skillsByCategory[key].length === 0) delete skillsByCategory[key]
    })

    // Section detection
    const educationMatch = fileContent.match(/(?:education|academic|degree|university|college|school|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|phd|bachelor|master)[\s\S]{0,800}?(?=\n\n|\n(?:[A-Z][a-z]+|[A-Z]{2,})|$)/i)
    const experienceMatch = fileContent.match(/(?:experience|employment|work|professional|job|position|career)[\s\S]{0,1500}?(?=\n\n|\n(?:[A-Z][a-z]+|[A-Z]{2,})|$)/i)
    const skillsMatch = fileContent.match(/(?:skills|technical skills|competencies|expertise|technologies|tools)[\s\S]{0,800}?(?=\n\n|\n(?:[A-Z][a-z]+|[A-Z]{2,})|$)/i)
    const projectsMatch = fileContent.match(/(?:projects?|portfolio|work samples|case studies|achievements)[\s\S]{0,800}?(?=\n\n|\n(?:[A-Z][a-z]+|[A-Z]{2,})|$)/i)
    const certMatch = fileContent.match(/(?:certifications?|licenses?|awards?|achievements?|publications?)[\s\S]{0,500}?(?=\n\n|\n(?:[A-Z][a-z]+|[A-Z]{2,})|$)/i)

    const hasEducation = !!educationMatch
    const hasExperience = !!experienceMatch
    const hasSkills = !!skillsMatch
    const hasProjects = !!projectsMatch
    const hasCertifications = !!certMatch
    const hasContact = /(?:email|phone|linkedin|github|portfolio|website|contact|mobile|tel)/i.test(fileContent)

    // Calculate scores
    let educationScore = hasEducation ? 20 : 5
    let experienceScore = hasExperience ? 30 : 8
    let skillsScore = Math.min(25, 5 + detectedSkills.length * 1.0)
    let contactScore = hasContact ? 12 : 2
    let projectScore = hasProjects ? 13 : 4
    let certScore = hasCertifications ? 8 : 0
    let formatScore = 12

    const wordCount = fileContent.split(/\s+/).length
    if (wordCount < 100) formatScore -= 3
    else if (wordCount < 200) formatScore -= 1
    else if (wordCount > 2500) formatScore -= 2

    const heuristicsScore = Math.min(100, educationScore + experienceScore + skillsScore + contactScore + projectScore + certScore + formatScore)

    // Calculate relevance using improved semantic heuristic
    let relevanceScore = 0
    let usedSBERT = false

    if (jobDescription) {
      // Use improved semantic heuristic
      const semanticScore = await getSemanticSimilarity(fileContent, jobDescription)
      relevanceScore = Math.round(semanticScore * 100)
    }

    const finalScore = Math.round((heuristicsScore * 0.6 + relevanceScore * 0.4))

    // Generate feedback
    const feedback = []
    const improvements = []

    if (hasEducation) {
      feedback.push('✓ Education section detected')
    } else {
      feedback.push('⚠ Education section missing')
      improvements.push('Add Education section with degree, institution, and graduation date')
    }

    if (hasExperience) {
      feedback.push('✓ Work experience section found')
    } else {
      feedback.push('⚠ Work experience missing')
      improvements.push('Include Work Experience with job titles, companies, dates, and achievements')
    }

    if (detectedSkills.length > 15) {
      feedback.push(`✓ Excellent skills (${detectedSkills.length} detected)`)
    } else if (detectedSkills.length > 10) {
      feedback.push(`✓ Strong skills (${detectedSkills.length} detected)`)
    } else if (detectedSkills.length > 6) {
      feedback.push(`✓ Good skills (${detectedSkills.length} detected)`)
    } else if (detectedSkills.length > 3) {
      feedback.push(`⚠ Limited skills (${detectedSkills.length} detected)`)
      improvements.push('Add more technical skills and tools')
    } else {
      feedback.push('⚠ Few skills detected')
      improvements.push('Add a Skills section with programming languages and frameworks')
    }

    if (hasContact) {
      feedback.push('✓ Contact information present')
    } else {
      feedback.push('⚠ Contact information missing')
      improvements.push('Add email, phone, LinkedIn, and GitHub')
    }

    if (hasProjects) {
      feedback.push('✓ Projects section included')
    } else {
      feedback.push('⚠ Projects section missing')
      improvements.push('Add Projects section with descriptions and technologies')
    }

    if (hasCertifications) {
      feedback.push('✓ Certifications included')
    }

    if (relevanceScore > 75) {
      feedback.push('✓ Excellent job match')
    } else if (relevanceScore > 60) {
      feedback.push('✓ Good job match')
    } else if (relevanceScore > 40) {
      feedback.push('⚠ Moderate job match')
      improvements.push('Use more keywords from the job description')
    } else if (relevanceScore > 0) {
      feedback.push('⚠ Limited job match')
      improvements.push('Customize resume for this specific position')
    }

    if (wordCount < 150) {
      improvements.push('Resume is short - expand with more details')
    } else if (wordCount > 2500) {
      improvements.push('Resume is long - condense to 1-2 pages')
    } else {
      feedback.push('✓ Good resume length')
    }

    // Extract contact info
    const emailMatch = fileContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i)

    // Phone extraction - multiple patterns
    let phoneMatch = null
    const phonePatterns = [
      /\+?1?\s?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/,
      /\+[0-9]{1,3}\s?[0-9]{6,14}/,
      /\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/,
      /[0-9]{10,}/
    ]

    for (const pattern of phonePatterns) {
      const match = fileContent.match(pattern)
      if (match) {
        phoneMatch = match[0].trim()
        break
      }
    }

    // CRITICAL: Save resume to database - EVERY upload creates a NEW document
    // This ensures ATS analysis is ALWAYS fresh per resume upload

    // Generate unique resumeId for this upload event (outside try for response access)
    const resumeId = `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      console.log(`[ATS] NEW RESUME UPLOAD - Creating fresh analysis record`)
      console.log(`[ATS] Resume ID: ${resumeId}`)
      console.log(`[ATS] User ID: ${req.user.id}`)
      console.log(`[ATS] Filename: ${file.name}`)
      console.log(`[ATS] ATS Score: ${finalScore}`)
      console.log(`[ATS] Skills detected: ${detectedSkills.length}`)

      // Create NEW resume document (never overwrite previous ones)
      const resumeDoc = await Resume.create({
        user: req.user.id,
        originalFilename: file.name,
        contentType: file.mimetype,
        size: file.size,
        fileKey: resumeId,
        rawText: fileContent.substring(0, 10000), // Store first 10k chars
        status: 'scored',
        atsScore: finalScore,
        parsedSkills: detectedSkills,
        uploadedAt: new Date()
      })

      console.log(`[ATS] Resume document created: ${resumeDoc._id}`)

      // Recalculate composite employability score
      const scoreResult = await recalculateUserScore(req.user.id)
      console.log(`[Score] User ${req.user.id} score recalculated: ${scoreResult.totalScore}`)

    } catch (saveErr) {
      console.error('[ATS] Error saving resume or recalculating score:', saveErr)
      // Don't fail the request, but log the error
    }

    return res.json({
      resumeId, // Unique identifier for this analysis
      rawText: fileContent.substring(0, 2000),
      parsedSkills: detectedSkills,
      skillsByCategory,
      parsingErrors: [],
      atsScore: finalScore,
      breakdown: {
        education: educationScore,
        experience: experienceScore,
        skills: skillsScore,
        contact: contactScore,
        projects: projectScore,
        certifications: certScore,
        formatting: formatScore,
        heuristics: heuristicsScore,
        relevance: Math.round(relevanceScore)
      },
      feedback,
      improvements,
      contact: {
        email: emailMatch ? emailMatch[0] : 'Not found',
        phone: phoneMatch || 'Not found'
      },
      metrics: {
        wordCount,
        skillCount: detectedSkills.length,
        skillCategories: Object.keys(skillsByCategory).length,
        completeness: Math.round((heuristicsScore / 100) * 100)
      },
      similarity_method: 'Improved Semantic Heuristic',
      model_info: {
        sbert_enabled: false,
        model_name: 'Enhanced Semantic Heuristic v2'
      }
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ============ PHASE 2: Additional Endpoints ============

// Get score breakdown for current user
app.get('/score/breakdown', verifyToken, async (req, res) => {
  try {
    const breakdown = await getScoreBreakdown(req.user.id)
    return res.json(breakdown)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get user's resume status (for state hydration)
app.get('/me/resume', verifyToken, async (req, res) => {
  try {
    const latestResume = await Resume.findOne({ user: req.user.id })
      .sort({ uploadedAt: -1, createdAt: -1 })
      .select('originalFilename fileKey status atsScore parsedSkills uploadedAt createdAt')

    if (!latestResume) {
      return res.json({ hasResume: false })
    }

    return res.json({
      hasResume: true,
      resume: {
        resumeId: latestResume.fileKey || latestResume._id.toString(),
        filename: latestResume.originalFilename,
        status: latestResume.status,
        atsScore: latestResume.atsScore,
        parsedSkills: latestResume.parsedSkills,
        uploadedAt: latestResume.uploadedAt || latestResume.createdAt
      }
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get user's GitHub connection status (for state hydration)
app.get('/me/github', verifyToken, async (req, res) => {
  try {
    const githubData = await GitHub.findOne({ user: req.user.id })

    if (!githubData) {
      return res.json({ connected: false })
    }

    // Ensure profile has login field (backward compatibility)
    const profile = {
      ...githubData.profile?.toObject?.() || githubData.profile || {},
      login: githubData.profile?.login || githubData.githubUsername,
    }

    // Check if data is stale (older than 24 hours)
    const isStale = githubData.lastSyncedAt &&
      (Date.now() - new Date(githubData.lastSyncedAt).getTime() > 24 * 60 * 60 * 1000)

    return res.json({
      connected: true,
      github: {
        username: githubData.githubUsername,
        profile: profile,
        stats: githubData.stats,
        lastSyncedAt: githubData.lastSyncedAt
      },
      isStale: isStale
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Connect GitHub - Persist GitHub data to backend (SOURCE OF TRUTH)
app.post('/github/connect', verifyToken, async (req, res) => {
  try {
    const { username, profile, stats } = req.body

    if (!username) {
      return res.status(400).json({ error: 'GitHub username is required' })
    }

    // Upsert GitHub data
    const githubData = await GitHub.findOneAndUpdate(
      { user: req.user.id },
      {
        user: req.user.id,
        githubUsername: username,
        profile: {
          login: profile?.login || username,
          name: profile?.name || username,
          bio: profile?.bio || '',
          avatarUrl: profile?.avatarUrl || '',
          publicRepos: profile?.publicRepos || 0,
          followers: profile?.followers || 0,
          following: profile?.following || 0,
          location: profile?.location || '',
          company: profile?.company || '',
        },
        stats: {
          totalCommits: stats?.totalCommits || 0,
          totalPullRequests: stats?.totalPullRequests || 0,
          totalStars: stats?.totalStars || 0,
          languages: stats?.languages || [],
          topRepositories: stats?.topRepositories || [],
        },
        lastSyncedAt: new Date(),
        syncStatus: 'completed',
      },
      { upsert: true, new: true }
    )

    // Also update User model's github field for quick queries
    await User.findByIdAndUpdate(req.user.id, {
      'github.username': username,
      'github.connected': true,
      'github.lastSyncedAt': new Date(),
    })

    console.log(`[GitHub] Connected: ${username} for user ${req.user.id}`)

    return res.json({
      success: true,
      message: 'GitHub connected successfully',
      github: {
        username: githubData.githubUsername,
        profile: githubData.profile,
        stats: githubData.stats,
        lastSyncedAt: githubData.lastSyncedAt,
      },
    })
  } catch (err) {
    console.error('[GitHub] Connect error:', err)
    return res.status(500).json({ error: 'Failed to connect GitHub' })
  }
})

// Disconnect GitHub - Remove GitHub connection
app.delete('/github/disconnect', verifyToken, async (req, res) => {
  try {
    // Remove from GitHub collection
    await GitHub.findOneAndDelete({ user: req.user.id })

    // Update User model
    await User.findByIdAndUpdate(req.user.id, {
      'github.username': null,
      'github.connected': false,
      'github.lastSyncedAt': null,
    })

    console.log(`[GitHub] Disconnected for user ${req.user.id}`)

    return res.json({
      success: true,
      message: 'GitHub disconnected successfully',
    })
  } catch (err) {
    console.error('[GitHub] Disconnect error:', err)
    return res.status(500).json({ error: 'Failed to disconnect GitHub' })
  }
})

// Manually trigger GitHub sync for current user
app.post('/github/sync', verifyToken, async (req, res) => {
  try {
    const result = await triggerUserSync(req.user.id)
    if (result.skipped) {
      return res.json({
        message: 'Sync skipped - too recent',
        reason: result.reason
      })
    }
    if (result.success) {
      return res.json({
        message: 'GitHub data synced successfully',
        stats: result.stats
      })
    }
    return res.status(500).json({ error: result.error })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
})

// Get badge progress for current user
app.get('/badges/progress', verifyToken, async (req, res) => {
  try {
    const { getBadgeProgress } = require('./badges')
    const progress = await getBadgeProgress(req.user.id)
    return res.json({ progress })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ============ PHASE 3: Admin Intelligence & Privacy APIs ============

// Apply rate limiting to admin routes
app.use('/admin', adminLimiter)

// Get all users for admin (with pagination and search)
app.get('/admin/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', department = '', graduationYear = '' } = req.query

    // Build query
    const query = { role: { $ne: 'admin' } } // Exclude admins from user list

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    if (department) {
      query.department = department
    }
    if (graduationYear) {
      query.graduationYear = parseInt(graduationYear)
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const totalCount = await User.countDocuments(query)

    const users = await User.find(query)
      .select('name email department graduationYear totalScore atsScore githubScore badgesScore hasResume profilePicture createdAt')
      .sort({ totalScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    await createAuditLog('ADMIN_VIEW_USERS', req.user.id, { search, department, graduationYear })

    return res.json({
      users: users.map(u => ({
        id: u._id,
        name: u.name || 'Anonymous',
        email: u.email,
        department: u.department || 'Not set',
        graduationYear: u.graduationYear || null,
        totalScore: u.totalScore || 0,
        atsScore: u.atsScore || 0,
        githubScore: u.githubScore || 0,
        badgesScore: u.badgesScore || 0,
        hasResume: !!u.hasResume,
        profilePicture: u.profilePicture,
        joinedAt: u.createdAt
      })),
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit))
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Export users as CSV
app.get('/admin/users/export', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { search = '', department = '', graduationYear = '' } = req.query
    const query = { role: { $ne: 'admin' } }

    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
    if (department) query.department = department
    if (graduationYear) query.graduationYear = parseInt(graduationYear)

    const users = await User.find(query)
      .select('name email department graduationYear totalScore atsScore githubScore badgesScore bio profilePicture createdAt')
      .sort({ totalScore: -1 })

    // Generate CSV Header
    let csv = 'Name,Email,Department,Year,Total Score,ATS Score,GitHub Score,Badges Score,Bio,Profile Picture,Joined At\n'

    // Generate CSV Rows
    users.forEach(u => {
      const bio = (u.bio || '').replace(/"/g, '""') // Escape quotes
      const row = [
        `"${u.name || 'Anonymous'}"`,
        `"${u.email}"`,
        `"${u.department || 'Not set'}"`,
        u.graduationYear || '',
        u.totalScore || 0,
        u.atsScore || 0,
        u.githubScore || 0,
        u.badgesScore || 0,
        `"${bio}"`,
        `"${u.profilePicture || ''}"`,
        `"${new Date(u.createdAt).toISOString()}"`
      ].join(',')
      csv += row + '\n'
    })

    await createAuditLog('ADMIN_EXPORT_USERS', req.user.id, { search, department, graduationYear })

    res.header('Content-Type', 'text/csv')
    res.attachment(`users_export_${Date.now()}.csv`)
    return res.send(csv)

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get platform overview stats
app.get('/admin/analytics/platform', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } })
    const Score = require('./models/score.model')
    const GitHub = require('./models/github.model')

    const totalScores = await Score.countDocuments({})
    const totalGitHubConnections = await GitHub.countDocuments({})

    // Calculate engagement (users with scores / total users)
    const engagementRate = totalUsers > 0 ? Math.round((totalScores / totalUsers) * 100) : 0

    // Get average scores
    const scores = await Score.aggregate([
      {
        $group: {
          _id: null,
          avgTotal: { $avg: "$total" },
          avgAts: { $avg: "$ats" },
          avgGithub: { $avg: "$github" },
          avgBadges: { $avg: "$badges" }
        }
      }
    ])

    return res.json({
      platform: {
        totalUsers,
        totalScores,
        totalGitHubConnections,
        engagementRate
      },
      averageScores: scores[0] ? {
        total: Math.round(scores[0].avgTotal),
        ats: Math.round(scores[0].avgAts),
        github: Math.round(scores[0].avgGithub),
        badges: Math.round(scores[0].avgBadges)
      } : { total: 0, ats: 0, github: 0, badges: 0 }
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get cohort analytics (aggregated, NO PII)
app.get('/admin/analytics/cohorts', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { department, graduationYear } = req.query

    const analytics = await withCache('getCohortAnalytics', { department, graduationYear }, async () => {
      return await getCohortAnalytics({ department, graduationYear })
    })

    // Log admin access
    await createAuditLog('ADMIN_VIEW_COHORT_ANALYTICS', req.user.id, { department, graduationYear })

    return res.json({ cohorts: analytics })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get skill intelligence (aggregated, NO PII)
app.get('/admin/analytics/skills', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { department, graduationYear } = req.query

    const skills = await withCache('getSkillIntelligence', { department, graduationYear }, async () => {
      return await getSkillIntelligence({ department, graduationYear })
    })

    await createAuditLog('ADMIN_VIEW_SKILL_INTELLIGENCE', req.user.id, { department, graduationYear })

    return res.json(skills)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get at-risk cohorts (aggregated, NO PII)
app.get('/admin/analytics/at-risk', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const atRisk = await withCache('getAtRiskCohorts', {}, async () => {
      return await getAtRiskCohorts()
    })

    await createAuditLog('ADMIN_VIEW_AT_RISK_COHORTS', req.user.id)

    return res.json({ atRiskCohorts: atRisk })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get trend analysis (aggregated, NO PII)
app.get('/admin/analytics/trends', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { department, graduationYear, months } = req.query

    const trends = await withCache('getTrendAnalysis', { department, graduationYear, months }, async () => {
      return await getTrendAnalysis({ department, graduationYear, months: months ? Number(months) : 6 })
    })

    await createAuditLog('ADMIN_VIEW_TRENDS', req.user.id, { department, graduationYear, months })

    return res.json({ trends })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get platform statistics (aggregated, NO PII)
app.get('/admin/analytics/platform', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const stats = await withCache('getPlatformStats', {}, async () => {
      return await getPlatformStats()
    })

    await createAuditLog('ADMIN_VIEW_PLATFORM_STATS', req.user.id)

    return res.json(stats)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ============ PHASE 3: Privacy Compliance APIs ============

// Right to Erasure (hard delete user data)
app.delete('/admin/privacy/erase/:userId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params

    const result = await executeRightToErasure(userId, req.user.id)

    return res.json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
})

// Get consent history for a user
app.get('/admin/privacy/consent/:userId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params

    const history = await getConsentHistory(userId)

    await createAuditLog('ADMIN_VIEW_CONSENT_HISTORY', req.user.id, { targetUser: userId })

    return res.json({ consentHistory: history })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Export user data (for portability)
app.get('/admin/privacy/export/:userId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params

    const data = await exportUserData(userId)

    await createAuditLog('ADMIN_EXPORT_USER_DATA', req.user.id, { targetUser: userId })

    return res.json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// Get audit logs
app.get('/admin/audit-logs', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { action, performedBy, startDate, endDate, limit } = req.query

    const logs = await getAuditLogs(
      { action, performedBy, startDate, endDate },
      limit ? Number(limit) : 100
    )

    return res.json({ logs })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// User-facing: Request data export (self-service)
app.get('/me/export', verifyToken, async (req, res) => {
  try {
    const data = await exportUserData(req.user.id)

    return res.json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// User-facing: Request data deletion (self-service)
app.delete('/me/delete-account', verifyToken, async (req, res) => {
  try {
    const result = await executeRightToErasure(req.user.id, req.user.id)

    return res.json(result)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
})

// ============ BADGE MANAGEMENT SYSTEM ============

// GET all available badge definitions (Public)
app.get('/badges', async (req, res) => {
  try {
    const badges = await BadgeDefinition.find({ active: true }).sort('createdAt')
    return res.json({ badges })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// GET my badges (Student) - Populated with definitions
app.get('/me/badges', verifyToken, async (req, res) => {
  try {
    const badges = await Badge.find({ user: req.user.id })
      .populate('definitionId')
      .sort('-earnedAt')

    // Transform to include definition details if available, fallback to legacy
    const formattedBadges = badges.map(b => {
      const def = b.definitionId
      return {
        _id: b._id,
        name: def ? def.name : b.badgeType, // Fallback to basic name
        description: def ? def.description : (b.metadata?.description || 'Awarded badge'),
        icon: def ? def.icon : (b.metadata?.icon || '🏅'),
        earnedAt: b.earnedAt,
        isSystem: !def
      }
    })

    return res.json({ badges: formattedBadges })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// POST Create new badge definition (Admin) - With Icon Upload
app.post('/admin/badges', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, criteria, points } = req.body

    if (!req.files || !req.files.icon) {
      return res.status(400).json({ error: 'Icon image is required' })
    }

    const iconFile = req.files.icon

    // Validate image type
    if (!iconFile.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' })
    }

    // Save icon
    const fileExt = path.extname(iconFile.name)
    const iconFilename = `badge_${Date.now()}${fileExt}`
    const uploadPath = path.join(__dirname, '../uploads/badges', iconFilename)

    // Ensure directory exists
    const badgeDir = path.dirname(uploadPath)
    if (!fs.existsSync(badgeDir)) {
      fs.mkdirSync(badgeDir, { recursive: true })
    }

    await iconFile.mv(uploadPath)

    const iconUrl = `/uploads/badges/${iconFilename}`

    const badgeDef = await BadgeDefinition.create({
      name,
      description,
      criteria,
      icon: iconUrl,
      points: points ? Number(points) : 2
    })

    await createAuditLog('ADMIN_CREATE_BADGE', req.user.id, { badgeName: name })

    return res.json({ badge: badgeDef })
  } catch (err) {
    console.error(err)
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Badge name already exists' })
    }
    return res.status(500).json({ error: 'Server error' })
  }
})

// POST Assign badge to user (Admin)
app.post('/admin/users/:userId/badges', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params
    const { badgeDefinitionId } = req.body

    if (!badgeDefinitionId) return res.status(400).json({ error: 'Badge Definition ID required' })

    const badgeDef = await BadgeDefinition.findById(badgeDefinitionId)
    if (!badgeDef) return res.status(404).json({ error: 'Badge Definition not found' })

    // Check if already assigned
    const existing = await Badge.findOne({ user: userId, definitionId: badgeDefinitionId })
    if (existing) return res.status(400).json({ error: 'User already has this badge' })

    // Assign
    const newBadge = await Badge.create({
      user: userId,
      badgeType: badgeDef.name, // Store name as type for legacy compat
      definitionId: badgeDef._id,
      earnedAt: new Date()
    })

    // Recalculate score
    await recalculateUserScore(userId)

    await createAuditLog('ADMIN_ASSIGN_BADGE', req.user.id, { targetUser: userId, badgeName: badgeDef.name })

    return res.json({ success: true, badge: newBadge })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
})

const port = process.env.PORT || 4000

// Start server and initialize Phase 2 & 3 services
app.listen(port, () => {
  console.log(`Backend listening on ${port}`)
  console.log('='.repeat(50))
  console.log('PHASE 2 SERVICES INITIALIZED')
  console.log('='.repeat(50))

  // Start GitHub sync scheduler
  startGitHubScheduler()
  console.log('✓ GitHub sync scheduler started')
  console.log('✓ Score aggregation service ready')
  console.log('✓ Badge evaluation system ready')
  console.log('='.repeat(50))

  console.log('PHASE 3 SERVICES INITIALIZED')
  console.log('='.repeat(50))
  console.log('✓ Admin analytics endpoints ready')
  console.log('✓ Privacy compliance APIs ready')
  console.log('✓ Rate limiting active')
  console.log('✓ Analytics caching enabled (5min TTL)')
  console.log('✓ Audit logging active')
  console.log('='.repeat(50))
})
