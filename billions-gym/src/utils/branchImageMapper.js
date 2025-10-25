// Utility để map _id của chi nhánh với ảnh tương ứng
// Dựa vào thuTu hoặc _id để xác định ảnh nào sử dụng

// Import tất cả ảnh chi nhánh
import cn1 from '../assets/branches/cn-1.png';
import cn2 from '../assets/branches/cn-2.png';
import cn3 from '../assets/branches/cn-3.png';
import cn4 from '../assets/branches/cn-4.png';
import cn5 from '../assets/branches/cn-5.png';
import cn6 from '../assets/branches/cn-6.png';
import cn7 from '../assets/branches/cn-7.png';
import cn8 from '../assets/branches/cn-8.png';
import cn9 from '../assets/branches/cn-9.png';
import cn10 from '../assets/branches/cn-10.png';

// Map thuTu với ảnh
const branchImages = {
    1: cn1,
    2: cn2,
    3: cn3,
    4: cn4,
    5: cn5,
    6: cn6,
    7: cn7,
    8: cn8,
    9: cn9,
    10: cn10
};

// Map _id cụ thể với ảnh (nếu cần)
const branchIdToImage = {
    '68ed25ff870d91f7e6db7f5d': cn1, // Billions Q1 - Nguyễn Huệ (thuTu: 1)
    // Thêm các _id khác nếu cần - có thể map thêm các chi nhánh khác
};

/**
 * Lấy ảnh chi nhánh dựa vào thuTu hoặc _id
 * @param {Object} branch - Object chi nhánh
 * @returns {string} - Đường dẫn ảnh
 */
export const getBranchImage = (branch) => {
    if (!branch) return null;

    // Ưu tiên sử dụng _id nếu có trong map
    if (branch._id && branchIdToImage[branch._id]) {
        return branchIdToImage[branch._id];
    }

    // Fallback: sử dụng thuTu
    if (branch.thuTu && branchImages[branch.thuTu]) {
        return branchImages[branch.thuTu];
    }

    // Fallback cuối: sử dụng ảnh mặc định (cn-1.png)
    return cn1;
};

/**
 * Lấy ảnh chi nhánh dựa vào thuTu
 * @param {number} thuTu - Thứ tự chi nhánh
 * @returns {string} - Đường dẫn ảnh
 */
export const getBranchImageByThuTu = (thuTu) => {
    return branchImages[thuTu] || cn1;
};

/**
 * Lấy ảnh chi nhánh dựa vào _id
 * @param {string} branchId - ID chi nhánh
 * @returns {string} - Đường dẫn ảnh
 */
export const getBranchImageById = (branchId) => {
    return branchIdToImage[branchId] || cn1;
};

export default {
    getBranchImage,
    getBranchImageByThuTu,
    getBranchImageById,
    branchImages,
    branchIdToImage
};
