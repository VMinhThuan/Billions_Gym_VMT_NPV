// seedChiNhanh_PT_full.js

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
require('dotenv').config();

// Import model
const ChiNhanh = require('../src/models/ChiNhanh');
const { PT } = require('../src/models/NguoiDung');
const TaiKhoan = require('../src/models/TaiKhoan');
const { hashPassword } = require('../src/utils/hashPassword');

// Các chi nhánh bạn đã có sẵn
const chiNhanhs = [
    {
        _id: new ObjectId('68ed2600870d91f7e6db7f63'),
        tenChiNhanh: "Billions Bình Thạnh - Điện Biên Phủ",
        diaChi: "700 Điện Biên Phủ, Bình Thạnh, TP.HCM",
        soDienThoai: "028-1111-0012",
        thuTu: 7,
        location: {
            type: "Point",
            coordinates: [106.6927, 10.8014] // Tọa độ Bình Thạnh
        }
    },
    {
        _id: new ObjectId('68ed2600870d91f7e6db7f64'),
        tenChiNhanh: "Billions Phú Nhuận - Phan Xích Long",
        diaChi: "180 Phan Xích Long, Phú Nhuận, TP.HCM",
        soDienThoai: "028-1111-0013",
        thuTu: 8,
        location: {
            type: "Point",
            coordinates: [106.6900, 10.8000] // Tọa độ Phú Nhuận
        }
    },
    {
        _id: new ObjectId('68ed2600870d91f7e6db7f65'),
        tenChiNhanh: "Billions Tân Bình - Cộng Hòa",
        diaChi: "400 Cộng Hòa, Tân Bình, TP.HCM",
        soDienThoai: "028-1111-0014",
        thuTu: 9,
        location: {
            type: "Point",
            coordinates: [106.6500, 10.8000] // Tọa độ Tân Bình
        }
    },
    {
        _id: new ObjectId('68ed2600870d91f7e6db7f66'),
        tenChiNhanh: "Billions TP Thủ Đức - Xa Lộ Hà Nội",
        diaChi: "Xa Lộ Hà Nội, TP Thủ Đức, TP.HCM",
        soDienThoai: "028-1111-0015",
        thuTu: 10,
        location: {
            type: "Point",
            coordinates: [106.7500, 10.8500] // Tọa độ Thủ Đức
        }
    },
    {
        _id: new ObjectId('68ed2600870d91f7e6db7f67'),
        tenChiNhanh: "Billions Quận 1 - Nguyễn Huệ",
        diaChi: "22 Nguyễn Huệ, Quận 1, TP.HCM",
        soDienThoai: "028-1111-0016",
        thuTu: 11,
        location: {
            type: "Point",
            coordinates: [106.7000, 10.7769] // Tọa độ Quận 1
        }
    },
    {
        _id: new ObjectId('68ed2600870d91f7e6db7f68'),
        tenChiNhanh: "Billions Quận 3 - Lý Chính Thắng",
        diaChi: "15 Lý Chính Thắng, Quận 3, TP.HCM",
        soDienThoai: "028-1111-0017",
        thuTu: 12,
        location: {
            type: "Point",
            coordinates: [106.6900, 10.7800] // Tọa độ Quận 3
        }
    },
    {
        _id: new ObjectId('68ed2600870d91f7e6db7f69'),
        tenChiNhanh: "Billions Quận 5 - Trần Hưng Đạo",
        diaChi: "350 Trần Hưng Đạo, Quận 5, TP.HCM",
        soDienThoai: "028-1111-0018",
        thuTu: 13,
        location: {
            type: "Point",
            coordinates: [106.6800, 10.7500] // Tọa độ Quận 5
        }
    },
    {
        _id: new ObjectId('68ed2600870d91f7e6db7f6a'),
        tenChiNhanh: "Billions Quận 7 - Phú Mỹ Hưng",
        diaChi: "Đường số 1, Phú Mỹ Hưng, Quận 7, TP.HCM",
        soDienThoai: "028-1111-0019",
        thuTu: 14,
        location: {
            type: "Point",
            coordinates: [106.7200, 10.7300] // Tọa độ Quận 7
        }
    },
    {
        _id: new ObjectId('68ed2600870d91f7e6db7f6b'),
        tenChiNhanh: "Billions Quận 10 - 3/2",
        diaChi: "600 Đường 3/2, Quận 10, TP.HCM",
        soDienThoai: "028-1111-0020",
        thuTu: 15,
        location: {
            type: "Point",
            coordinates: [106.6600, 10.7700] // Tọa độ Quận 10
        }
    },
    {
        _id: new ObjectId('68ed2600870d91f7e6db7f6c'),
        tenChiNhanh: "Billions Quận 11 - Lạc Long Quân",
        diaChi: "800 Lạc Long Quân, Quận 11, TP.HCM",
        soDienThoai: "028-1111-0021",
        thuTu: 16,
        location: {
            type: "Point",
            coordinates: [106.6400, 10.7600] // Tọa độ Quận 11
        }
    },
];

// Danh sách tên PT mẫu (100 tên), có ý nghĩa, không chỉ a,b,c...
const ptNames = [
    "Nguyễn Thành Long", "Lê Minh Hoàng", "Trần Quốc Việt", "Phạm Ngọc Anh", "Vũ Bảo Châu",
    "Hoàng Gia Huy", "Đặng Thị Hạnh", "Ngô Tuấn Kiệt", "Trịnh Thanh Tùng", "Bùi Khánh Duy",
    "Đỗ Minh Quân", "Hà Thị Linh", "Lương Trung Kiên", "Phan Ngọc Trâm", "Võ Thành Nam",
    "Lê Thanh Tâm", "Nguyễn Khả Hân", "Trần Như Ý", "Phạm Trường An", "Ngô Phương Thảo",
    "Trương Hoàng Sơn", "Nguyễn Xuân Phúc", "Bùi Nhật Minh", "Đặng Ngọc Mai", "Lê Thuỳ Dương",
    "Lý Minh Châu", "Ngô Thanh Bình", "Phan Quang Huy", "Trần Thùy Chi", "Bùi Quang Hòa",
    "Đỗ Xuân Bắc", "Trịnh Huy Hoàng", "Phạm Thiện Nhân", "Nguyễn Hà My", "Vũ Minh Chính",
    "Lê Ngọc Khang", "Hoàng Nhật Anh", "Đặng Thanh Hà", "Bùi Minh Khôi", "Phan Bảo Ngọc",
    "Trần Đức Huy", "Nguyễn Thảo Vi", "Đặng Gia Bảo", "Lê Mỹ Linh", "Phạm Thanh Tùng",
    "Ngô Khánh Linh", "Vũ Đức Anh", "Hoàng Minh Quân", "Trần Hồng Phúc", "Đỗ Linh Trang",
    "Lê Hoàng Dương", "Nguyễn Nhật Linh", "Bùi Phúc Lộc", "Phan Thuỳ Trang", "Đặng Hoàng Nam",
    "Vũ Khánh Duy", "Trần Gia Hân", "Nguyễn Bảo Trâm", "Lê Hồng Ân", "Phạm Gia Huy",
    "Ngô Quang Vinh", "Hoàng Thị Mai", "Đặng Minh Châu", "Lê Xuân Trường", "Phan Minh Nhật",
    "Trần Khánh Linh", "Vũ Thanh Sơn", "Nguyễn Yến Nhi", "Lê Bảo Ngọc", "Phạm Nhật Minh",
    "Đặng Hồng Vân", "Trần Thuỳ Anh", "Nguyễn Đăng Khoa", "Bùi Khánh Hạ", "Vũ Minh Tâm",
    "Hoàng Ngọc Hân", "Lê Thị Hoa", "Ngô Khắc Khang", "Trần Thị Ngọc", "Phạm Hoàng Phúc",
    "Đặng Quang Khải", "Vũ Hoàng Phước", "Lê Minh Trí", "Nguyễn Phương Uyên", "Trần Hùng Dũng",
    "Phạm Bảo An", "Lê Minh Đức", "Nguyễn Thiên Long", "Bùi Thị Bích", "Đặng Trường Sơn",
    "Phan Thị Kiều", "Vũ Thiên Ân", "Hoàng Bảo Ngọc", "Trần Minh Phong"
];

// Danh sách ảnh thật từ Unsplash, Pexels và Pixabay
const placeholderImages = [
    // UNSPLASH - GYM ACTION SHOTS (0-33)
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1551836022-deb498b8ce96?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1552674604-bfbb4b3a4e23?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1594381898412-9c1f03b9b7b6?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1607345368928-199ea74c8d03?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1611258026544-9960e8a93be0?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1597190123245-5e7d2a3a2f9e?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1608248597869-7f38fd0fa8e7?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1574680178050-b95e0fc3f3d7?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1519710164239-da54291b26ef?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1518611016407-adee195df3e1?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1579260663785-6d7d8e7a5c92?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1535224206242-487f7090b5bb?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1518894639645-6b961e696a41?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1519710164239-da54291b26f0?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1517838277536-f5f9b2d18827?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1519710164239-da54291b26f1?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8c?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1551836022-deb498b8ce97?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2e?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1594381898412-9c1f03b9b7b7?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1607345368928-199ea74c8d04?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1611258026544-9960e8a93be1?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1597190123245-5e7d2a3a2f9f?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1608248597869-7f38fd0fa8e8?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1574680178050-b95e0fc3f3d8?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1552674604-bfbb4b3a4e24?w=400&h=600&fit=crop",

    // PEXELS - GYM WORKOUTS (34-66)
    "https://images.pexels.com/photos/247431/pexels-photo-247431.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/414837/pexels-photo-414837.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/843998/pexels-photo-843998.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/416490/pexels-photo-416490.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/5676594/pexels-photo-5676594.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/3757049/pexels-photo-3757049.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/3772439/pexels-photo-3772439.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/261695/pexels-photo-261695.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/1552241/pexels-photo-1552241.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/247432/pexels-photo-247432.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/414838/pexels-photo-414838.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/843999/pexels-photo-843999.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/1552243/pexels-photo-1552243.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/416491/pexels-photo-416491.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/5676595/pexels-photo-5676595.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/3757050/pexels-photo-3757050.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/3772440/pexels-photo-3772440.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/261696/pexels-photo-261696.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/1552244/pexels-photo-1552244.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/220454/pexels-photo-220454.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/302900/pexels-photo-302900.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/3757051/pexels-photo-3757051.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/3772441/pexels-photo-3772441.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/261697/pexels-photo-261697.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/1552245/pexels-photo-1552245.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/220455/pexels-photo-220455.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/302901/pexels-photo-302901.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/3757052/pexels-photo-3757052.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/3772442/pexels-photo-3772442.jpeg?w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/5676596/pexels-photo-5676596.jpeg?w=400&h=600&fit=crop",

    // PIXABAY - FITNESS TRAINERS (67-99)
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441591_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/08/07/18/09/person-2603823_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2016/11/19/14/00/codecanyon-1837458_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441592_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/08/07/18/09/person-2603824_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2016/11/19/14/00/codecanyon-1837459_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441593_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/08/07/18/09/person-2603825_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2016/11/19/14/00/codecanyon-1837460_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441594_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441595_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/08/07/18/09/person-2603826_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2016/11/19/14/00/codecanyon-1837461_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441596_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/08/07/18/09/person-2603827_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2016/11/19/14/00/codecanyon-1837462_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441597_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/08/07/18/09/person-2603828_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2016/11/19/14/00/codecanyon-1837463_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441598_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441599_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/08/07/18/09/person-2603829_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2016/11/19/14/00/codecanyon-1837464_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441600_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/08/07/18/09/person-2603830_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2016/11/19/14/00/codecanyon-1837465_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441601_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/08/07/18/09/person-2603831_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2016/11/19/14/00/codecanyon-1837466_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441602_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/06/26/21/43/gym-2441603_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2017/08/07/18/09/person-2603832_1280.jpg?w=400&h=600&fit=crop",
    "https://cdn.pixabay.com/photo/2016/11/19/14/00/codecanyon-1837467_1280.jpg?w=400&h=600&fit=crop"
];

// Hàm tạo PT mẫu gắn chi nhánh
function createPT(chiNhanhId, idx) {
    const name = ptNames[idx % ptNames.length];
    const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`; // 10 số bắt đầu 09
    const cccd = `${Math.floor(100000000 + Math.random() * 900000000)}`; // 9 chữ số giả lập
    const img = placeholderImages[idx % placeholderImages.length];
    const rating = Math.floor(Math.random() * 5) + 1;
    const experience = Math.floor(Math.random() * 10) + 1;

    return {
        _id: new ObjectId(),
        soCCCD: cccd,
        hoTen: name,
        ngaySinh: new Date(1990, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        gioiTinh: idx % 2 === 0 ? "Nam" : "Nữ",
        sdt: phone,
        vaiTro: "PT",
        trangThaiPT: "DANG_HOAT_DONG",
        chuyenMon: "Giảm cân, tăng cơ",
        anhDaiDien: img,
        bangCapChungChi: "ACE / NASM",
        danhGia: rating,
        diaChi: "TP.HCM",
        kinhNghiem: experience,
        ngayVaoLam: new Date(2024, 0, 1),
        chinhanh: chiNhanhId,
    };
}

async function seedFull() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✔️ Kết nối DB thành công");

        // Seed chi nhánh (upsert)
        for (const cn of chiNhanhs) {
            await ChiNhanh.updateOne(
                { _id: cn._id },
                { $set: cn },
                { upsert: true }
            );
        }
        console.log("✔️ Đã seed chi nhánh");

        // Seed PT mỗi chi nhánh 10 cái => tổng 100 PT
        for (const cn of chiNhanhs) {
            for (let i = 0; i < 10; i++) {
                const pt = createPT(cn._id, i);
                // Upsert PT
                await PT.updateOne(
                    { _id: pt._id },
                    { $set: pt },
                    { upsert: true }
                );

                // Tạo tài khoản cho PT nếu chưa có (đặt mật khẩu mặc định 123456)
                const hashed = await hashPassword('123456');
                await TaiKhoan.updateOne(
                    { sdt: pt.sdt },
                    {
                        $setOnInsert: {
                            sdt: pt.sdt,
                            matKhau: hashed,
                            nguoiDung: pt._id,
                            trangThaiTK: 'DANG_HOAT_DONG'
                        }
                    },
                    { upsert: true }
                );
            }
        }
        console.log("✔️ Đã seed 100 PT");

        mongoose.disconnect();
        console.log("🎉 Seed hoàn tất, kết nối DB đóng");
    } catch (error) {
        console.error("❌ Lỗi seed:", error);
        process.exit(1);
    }
}

seedFull();
