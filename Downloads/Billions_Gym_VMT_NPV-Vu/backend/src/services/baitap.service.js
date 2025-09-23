const BaiTap = require('../models/BaiTap');

const createBaiTap = async (data) => {
    const baiTap = new BaiTap(data);
    await baiTap.save();
    return baiTap;
};

const getAllBaiTap = async () => {
    return await BaiTap.find();
};

const getBaiTapById = async (id) => {
    const baiTap = await BaiTap.findById(id);
    if (!baiTap) {
        throw new Error('Không tìm thấy bài tập');
    }
    return baiTap;
};

const updateBaiTap = async (id, data) => {
    const baiTap = await BaiTap.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!baiTap) {
        throw new Error('Không tìm thấy bài tập');
    }
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
