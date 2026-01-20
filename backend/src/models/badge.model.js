const mongoose = require('mongoose')

const BadgeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // We keep badgeType as a String for "Name" or "Slug" for legacy/display support
    badgeType: { type: String, required: true },

    // Usage: Link to dynamic definition if it exists
    definitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'BadgeDefinition' },

    earnedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 }, // 0-100 for progression
    metadata: mongoose.Schema.Types.Mixed, // flexible metadata per badge type
  },
  { timestamps: true }
)

// Compound index to prevent duplicate badges per user
BadgeSchema.index({ user: 1, badgeType: 1 }, { unique: true })

module.exports = mongoose.models.Badge || mongoose.model('Badge', BadgeSchema)
