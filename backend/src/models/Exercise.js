const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExerciseSchema = new Schema({
    // Fields từ Exercise (mới)
    title: {
        type: String,
        required: true,
        trim: true
    },
    // Alias cho backward compatibility với BaiTap
    tenBaiTap: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['video_file', 'doc_file', 'external_link'],
        required: true,
        index: true
    },
    file_url: {
        type: String,
        default: null,
        trim: true
    },
    file_mime: {
        type: String,
        default: null,
        trim: true
    },
    source_url: {
        type: String,
        default: null,
        trim: true
    },
    duration_sec: {
        type: Number,
        default: null,
        min: 0
    },
    // Alias cho backward compatibility
    thoiGian: {
        type: Number,
        default: null,
        min: 0
    },
    description: {
        type: String,
        default: null,
        trim: true
    },
    // Alias cho backward compatibility với BaiTap
    moTa: {
        type: String,
        default: null,
        trim: true
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
        index: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner',
        index: true
    },
    // Alias cho backward compatibility (mucDoKho: DE, TRUNG_BINH, KHO -> beginner, intermediate, advanced)
    mucDoKho: {
        type: String,
        enum: ['DE', 'TRUNG_BINH', 'KHO'],
        default: null
    },
    ratings: {
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalRatings: {
            type: Number,
            default: 0,
            min: 0
        },
        ratings: [{
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'NguoiDung'
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            },
            comment: {
                type: String,
                trim: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    // Fields từ BaiTap (cũ)
    hinhAnh: {
        type: String,
        default: null,
        trim: true
    },
    nhomCo: {
        type: String,
        default: null,
        trim: true
    },
    thietBiSuDung: {
        type: String,
        default: null,
        trim: true
    },
    soHiepvaSoLanLap: {
        type: Number,
        default: 0
    },
    kcal: {
        type: Number,
        default: null
    },
    mucTieuBaiTap: {
        type: String,
        default: null,
        trim: true
    },
    hinhAnhMinhHoa: {
        type: [String],
        default: []
    },
    videoHuongDan: {
        type: String,
        default: null,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'exercises'
});

// Hàm tính kcal tự động (từ BaiTap)
function computeDefaultKcal(doc) {
    try {
        // Ưu tiên dùng duration_sec hoặc thoiGian
        const thoiGian = doc.duration_sec || doc.thoiGian || 0;
        if (thoiGian && Number(thoiGian) > 0) {
            return Math.round(Number(thoiGian) * 8);
        }

        // Nếu có difficulty, tính theo difficulty
        if (doc.difficulty) {
            if (doc.difficulty === 'beginner') return 50;
            if (doc.difficulty === 'advanced') return 150;
            return 100;
        }

        // Nếu có mucDoKho cũ
        if (doc.mucDoKho) {
            const diff = (doc.mucDoKho || '').toLowerCase();
            if (diff.includes('de') || diff.includes('dễ') || diff === 'de') return 50;
            if (diff.includes('khó') || diff.includes('kho') || diff === 'kho') return 150;
            return 100;
        }

        return 100;
    } catch (e) {
        return 100;
    }
}

// Sync fields giữa title/tenBaiTap và description/moTa
ExerciseSchema.pre('save', function (next) {
    // Sync title <-> tenBaiTap
    if (this.title && !this.tenBaiTap) {
        this.tenBaiTap = this.title;
    } else if (this.tenBaiTap && !this.title) {
        this.title = this.tenBaiTap;
    }

    // Sync description <-> moTa
    if (this.description && !this.moTa) {
        this.moTa = this.description;
    } else if (this.moTa && !this.description) {
        this.description = this.moTa;
    }

    // Sync duration_sec <-> thoiGian
    if (this.duration_sec && !this.thoiGian) {
        this.thoiGian = this.duration_sec;
    } else if (this.thoiGian && !this.duration_sec) {
        this.duration_sec = this.thoiGian;
    }

    // Sync difficulty <-> mucDoKho
    if (this.difficulty && !this.mucDoKho) {
        if (this.difficulty === 'beginner') this.mucDoKho = 'DE';
        else if (this.difficulty === 'intermediate') this.mucDoKho = 'TRUNG_BINH';
        else if (this.difficulty === 'advanced') this.mucDoKho = 'KHO';
    } else if (this.mucDoKho && !this.difficulty) {
        if (this.mucDoKho === 'DE') this.difficulty = 'beginner';
        else if (this.mucDoKho === 'TRUNG_BINH') this.difficulty = 'intermediate';
        else if (this.mucDoKho === 'KHO') this.difficulty = 'advanced';
    }

    // Sync videoHuongDan với source_url hoặc file_url
    if (this.videoHuongDan && !this.source_url && !this.file_url) {
        if (this.videoHuongDan.includes('youtube.com') || this.videoHuongDan.includes('youtu.be')) {
            this.type = 'external_link';
            this.source_url = this.videoHuongDan;
        } else {
            this.type = 'video_file';
            this.file_url = this.videoHuongDan;
        }
    }

    // Tính kcal tự động nếu chưa có
    if (this.kcal == null) {
        this.kcal = computeDefaultKcal(this);
    }

    // Validation: file_url required nếu type là video_file hoặc doc_file
    if (this.type === 'video_file' || this.type === 'doc_file') {
        if (!this.file_url) {
            return next(new Error('file_url là bắt buộc cho loại ' + this.type));
        }
    }
    if (this.type === 'external_link') {
        if (!this.source_url) {
            return next(new Error('source_url là bắt buộc cho loại external_link'));
        }
    }
    next();
});

// Indexes
ExerciseSchema.index({ type: 1, status: 1 });
ExerciseSchema.index({ status: 1 });
ExerciseSchema.index({ difficulty: 1, status: 1 });
ExerciseSchema.index({ 'ratings.averageRating': -1 });
ExerciseSchema.index({ tenBaiTap: 1 });
ExerciseSchema.index({ nhomCo: 1 });

// Tạo alias cho backward compatibility với BaiTap
const Exercise = mongoose.model('Exercise', ExerciseSchema);

// Export cả Exercise và BaiTap alias để tương thích với code cũ
module.exports = Exercise;
module.exports.BaiTap = Exercise; // Alias cho backward compatibility

