const mongoose = require('mongoose');

const PTGoalSchema = new mongoose.Schema({
    pt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PT',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED'],
        default: 'PENDING',
        index: true
    }
}, {
    timestamps: true,
    collection: 'ptgoals'
});

PTGoalSchema.index({ pt: 1, date: 1, status: 1 });

module.exports = mongoose.model('PTGoal', PTGoalSchema);


