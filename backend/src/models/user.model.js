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
  },
  { timestamps: true }
)

module.exports = mongoose.models.User || mongoose.model('User', UserSchema)
