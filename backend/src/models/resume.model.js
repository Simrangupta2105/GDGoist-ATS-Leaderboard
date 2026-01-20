const mongoose = require('mongoose')

const ResumeSchema = new mongoose.Schema(
  {
    rawText: { type: String },
    parsedSkills: { type: [String], default: [] },
    parsingErrors: { type: [String], default: [] },
    atsScore: { type: Number },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // File metadata (Phase 1: store metadata only)
    originalFilename: { type: String },
    contentType: { type: String },
    size: { type: Number },
    fileKey: { type: String },
    status: { type: String, enum: ['pending', 'uploaded', 'processing', 'scored'], default: 'pending' },
    uploadedAt: { type: Date },
    // ATS results
    feedback: { type: [String], default: [] },
    breakdown: { type: Object, default: {} },
    analysisData: { type: Object },
    // Phase 2/3 placeholders
    sourceFileKey: { type: String },
  },
  { timestamps: true }
)

module.exports = mongoose.models.Resume || mongoose.model('Resume', ResumeSchema)
