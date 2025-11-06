const mongoose = require('mongoose');
const { Schema } = mongoose;

const BaiTapSchema = new Schema({
    // Fields chính - chỉ dùng tiếng Việt
    tenBaiTap: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['video_file', 'doc_file', 'external_link'],
        default: 'external_link',
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
    thoiGian: {
        type: Number,
        default: null,
        min: 0
    },
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
        default: 'active'
    },
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
    collection: 'BaiTap',
    timestamps: true
});

// Hàm tính kcal tự động
function computeDefaultKcal(doc) {
    try {
        // Dùng thoiGian (tiếng Việt)
        const thoiGian = doc.thoiGian || 0;
        if (thoiGian && Number(thoiGian) > 0) {
            return Math.round(Number(thoiGian) * 8);
        }

        // Tính theo mucDoKho
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

// Pre-save hook để validate và tự động xóa fields tiếng Anh (nếu có)
BaiTapSchema.pre('save', function (next) {
    // Migration: Nếu có dữ liệu cũ với fields tiếng Anh, sync sang tiếng Việt trước khi xóa
    if (this.isNew || this.isModified()) {
        // Sync title -> tenBaiTap (nếu có)
        if (this.title && !this.tenBaiTap) {
            this.tenBaiTap = this.title;
        }
        // Sync description -> moTa (nếu có)
        if (this.description && !this.moTa) {
            this.moTa = this.description;
        }
        // Sync duration_sec -> thoiGian (nếu có)
        if (this.duration_sec && !this.thoiGian) {
            this.thoiGian = this.duration_sec;
        }
        // Sync difficulty -> mucDoKho (nếu có)
        if (this.difficulty && !this.mucDoKho) {
            if (this.difficulty === 'beginner') this.mucDoKho = 'DE';
            else if (this.difficulty === 'intermediate') this.mucDoKho = 'TRUNG_BINH';
            else if (this.difficulty === 'advanced') this.mucDoKho = 'KHO';
        }

        // Xóa các fields tiếng Anh sau khi đã sync
        if (this.title !== undefined) delete this.title;
        if (this.description !== undefined) delete this.description;
        if (this.duration_sec !== undefined) delete this.duration_sec;
        if (this.difficulty !== undefined) delete this.difficulty;
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
BaiTapSchema.index({ type: 1, status: 1 });
BaiTapSchema.index({ status: 1 });
BaiTapSchema.index({ mucDoKho: 1, status: 1 });
BaiTapSchema.index({ 'ratings.averageRating': -1 });
BaiTapSchema.index({ tenBaiTap: 1 });
BaiTapSchema.index({ nhomCo: 1 });

// Tạo model BaiTap
const BaiTap = mongoose.model('BaiTap', BaiTapSchema);

// Export BaiTap và alias Exercise để backward compatibility
module.exports = BaiTap;
module.exports.Exercise = BaiTap; // Alias cho backward compatibility