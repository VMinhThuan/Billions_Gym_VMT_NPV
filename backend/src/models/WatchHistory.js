const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
    nguoiDung: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NguoiDung',
        required: true
    },
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TemplateBuoiTap',
        required: true
    },
    baiTapDaXem: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BaiTap'
    }],
    lanXemCuoi: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index để query nhanh
watchHistorySchema.index({ nguoiDung: 1, template: 1 });

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
