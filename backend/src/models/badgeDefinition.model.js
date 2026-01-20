const mongoose = require('mongoose')

const BadgeDefinitionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        icon: { type: String, required: true }, // URL to stored icon
        criteria: { type: String }, // Human-readable criteria
        active: { type: Boolean, default: true },
        // Points value for this badge (Defaults to 2 as per frozen logic, but stored for future calc)
        points: { type: Number, default: 2 }
    },
    { timestamps: true }
)

module.exports = mongoose.models.BadgeDefinition || mongoose.model('BadgeDefinition', BadgeDefinitionSchema)
