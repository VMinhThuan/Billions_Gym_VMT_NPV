// Sử dụng Exercise model (đã merge với BaiTap)
const BaiTap = require('../models/BaiTap');

const createBaiTap = async (data) => {
    const baiTap = new BaiTap(data);
    await baiTap.save();
    return baiTap;
};

const getAllBaiTap = async () => {
    try {
        console.log('📋 getAllBaiTap - Fetching exercises...');
        const startTime = Date.now();
        
        // Optimized query: filter by status, select only needed fields, limit results
        const result = await BaiTap.find({ status: 'active' })
            .select('tenBaiTap hinhAnh moTa mucDoKho nhomCo thietBiSuDung thoiGian type file_url source_url ratings')
            .sort({ createdAt: -1 }) // Latest first
            .limit(100) // Limit to 100 exercises for better performance
            .maxTimeMS(30000) // Tăng timeout lên 30 giây
            .lean() // Faster query, returns plain objects
            .exec();
        
        const duration = Date.now() - startTime;
        console.log(`✅ Successfully fetched ${result.length} bài tập in ${duration}ms`);
        return result;
    } catch (error) {
        console.error('❌ getAllBaiTap failed:', {
            message: error.message,
            code: error.code,
            name: error.name
        });
        
        // Return empty array instead of throwing to prevent frontend crash
        console.warn('⚠️ Returning empty array to prevent crash');
        return [];
    }
};

const getBaiTapById = async (id) => {
    const baiTap = await BaiTap.findById(id);
    if (!baiTap) {
        throw new Error('Không tìm thấy bài tập');
    }
    return baiTap;
};

const updateBaiTap = async (id, data) => {
    // Load document and assign then save so pre-save hooks (which compute kcal) run
    const baiTap = await BaiTap.findById(id);
    if (!baiTap) {
        throw new Error('Không tìm thấy bài tập');
    }

    Object.assign(baiTap, data);
    await baiTap.save();
    return baiTap;
};

const deleteBaiTap = async (id) => {
    const baiTap = await BaiTap.findByIdAndDelete(id);
    if (!baiTap) {
        throw new Error('Không tìm thấy bài tập');
    }
    return { message: 'Đã xóa bài tập' };
};

module.exports = {
    createBaiTap,
    getAllBaiTap,
    getBaiTapById,
    updateBaiTap,
    deleteBaiTap,
};
