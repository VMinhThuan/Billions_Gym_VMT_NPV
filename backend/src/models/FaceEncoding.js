const mongoose = require('mongoose');

const FaceEncodingSchema = new mongoose.Schema({
    hoiVien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HoiVien',
        required: true,
        unique: true,
        index: true
    },
    encodings: {
        type: [{
            type: [Number], // Array of 128 numbers (128D face descriptor)
            required: true
        }],
        required: true,
        validate: {
            validator: function (v) {
                return v.length === 3; // Must have exactly 3 encodings
            },
            message: 'Must provide exactly 3 face encodings'
        }
    },
    averageEncoding: {
        type: [Number], // Average of 3 encodings for faster matching
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better performance
FaceEncodingSchema.index({ hoiVien: 1, isActive: 1 });

// Method to calculate average encoding
FaceEncodingSchema.methods.calculateAverageEncoding = function () {
    if (this.encodings.length === 0) {
        return null;
    }

    const dimension = this.encodings[0].length;
    const average = new Array(dimension).fill(0);

    // Sum all encodings
    this.encodings.forEach(encoding => {
        encoding.forEach((value, index) => {
            average[index] += value;
        });
    });

    // Divide by number of encodings
    return average.map(value => value / this.encodings.length);
};

// Pre-save hook to calculate average encoding
FaceEncodingSchema.pre('save', function (next) {
    if (this.isModified('encodings')) {
        this.averageEncoding = this.calculateAverageEncoding();
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('FaceEncoding', FaceEncodingSchema);

