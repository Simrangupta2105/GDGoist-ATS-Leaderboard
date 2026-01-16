const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        index: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false
})

// Index for efficient querying
auditLogSchema.index({ action: 1, timestamp: -1 })
auditLogSchema.index({ performedBy: 1, timestamp: -1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)
