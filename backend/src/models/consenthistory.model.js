const mongoose = require('mongoose')

const consentHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    consented: {
        type: Boolean,
        required: true
    },
    consentType: {
        type: String,
        required: true,
        default: 'DPDP_DATA_PROCESSING'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    ipAddress: String,
    userAgent: String
}, {
    timestamps: false
})

// Compound index for efficient user consent history queries
consentHistorySchema.index({ user: 1, timestamp: -1 })

module.exports = mongoose.model('ConsentHistory', consentHistorySchema)
