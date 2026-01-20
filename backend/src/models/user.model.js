const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, index: true, unique: true, sparse: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    department: { type: String },
    graduationYear: { type: Number },
    dpdpConsent: {
      consented: { type: Boolean, default: false },
      timestamp: { type: Date },
    },
    // Phase 2: GitHub connection state
    github: {
      username: { type: String },
      connected: { type: Boolean, default: false },
      lastSyncedAt: { type: Date }
    },
    // Phase 2/3 placeholders (not used in Phase 1)
    githubProfile: { type: String },
    badges: { type: [String] },

    // ============ PROFILE ENHANCEMENTS ============
    // Profile picture (S3 URL or base64)
    profilePicture: { type: String },

    // Bio/About section
    bio: { type: String, maxLength: 500 },

    // Social media handles
    socialLinks: {
      linkedin: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      portfolio: { type: String },
      github: { type: String } // Separate from github connection
    },

    // Projects
    projects: [{
      title: { type: String, required: true },
      description: { type: String },
      technologies: [{ type: String }],
      url: { type: String },
      imageUrl: { type: String },
      startDate: { type: Date },
      endDate: { type: Date }
    }],

    // Experiences
    experiences: [{
      title: { type: String, required: true },
      company: { type: String, required: true },
      location: { type: String },
      description: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      current: { type: Boolean, default: false }
    }],

    // Profile visibility settings
    profileVisibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    }
  },
  { timestamps: true }
)

module.exports = mongoose.models.User || mongoose.model('User', UserSchema)
