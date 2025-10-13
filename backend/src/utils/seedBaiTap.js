const BaiTap = require('../models/BaiTap');
const mongoose = require('mongoose');

const sampleBaiTaps = [
    {
        tenBaiTap: "Push-up",
        moTa: "Bài tập đẩy người lên bằng tay",
        hinhAnh: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
        nhomCo: "Ngực",
        mucDoKho: "TrungBinh",
        thietBiSuDung: "Không cần thiết bị",
        soHiepvaSoLanLap: 15,
        mucTieuBaiTap: "Tăng cường cơ ngực và tay",
        hinhAnhMinhHoa: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
        videoHuongDan: "https://example.com/pushup-video"
    },
    {
        tenBaiTap: "Squat",
        moTa: "Bài tập ngồi xổm",
        hinhAnh: "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400",
        nhomCo: "Chân",
        mucDoKho: "De",
        thietBiSuDung: "Không cần thiết bị",
        soHiepvaSoLanLap: 20,
        mucTieuBaiTap: "Tăng cường cơ chân và mông",
        hinhAnhMinhHoa: ["https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400"],
        videoHuongDan: "https://example.com/squat-video"
    },
    {
        tenBaiTap: "Plank",
        moTa: "Bài tập chống đẩy tĩnh",
        hinhAnh: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
        nhomCo: "Bụng",
        mucDoKho: "TrungBinh",
        thietBiSuDung: "Không cần thiết bị",
        soHiepvaSoLanLap: 1,
        mucTieuBaiTap: "Tăng cường cơ core",
        hinhAnhMinhHoa: ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400"],
        videoHuongDan: "https://example.com/plank-video"
    },
    {
        tenBaiTap: "Deadlift",
        moTa: "Bài tập nâng tạ từ sàn",
        hinhAnh: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400",
        nhomCo: "Lưng",
        mucDoKho: "Kho",
        thietBiSuDung: "Tạ đòn",
        soHiepvaSoLanLap: 8,
        mucTieuBaiTap: "Tăng cường cơ lưng và chân",
        hinhAnhMinhHoa: ["https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400"],
        videoHuongDan: "https://example.com/deadlift-video"
    },
    {
        tenBaiTap: "Bench Press",
        moTa: "Bài tập đẩy tạ trên ghế",
        hinhAnh: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400",
        nhomCo: "Ngực",
        mucDoKho: "Kho",
        thietBiSuDung: "Tạ đòn, ghế tập",
        soHiepvaSoLanLap: 10,
        mucTieuBaiTap: "Tăng cường cơ ngực",
        hinhAnhMinhHoa: ["https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400"],
        videoHuongDan: "https://example.com/benchpress-video"
    },
    {
        tenBaiTap: "Pull-up",
        moTa: "Bài tập kéo người lên thanh xà",
        hinhAnh: "https://images.unsplash.com/photo-1598632640487-6ea4a4e8b6bd?w=400",
        nhomCo: "Lưng",
        mucDoKho: "Kho",
        thietBiSuDung: "Thanh xà đơn",
        soHiepvaSoLanLap: 8,
        mucTieuBaiTap: "Tăng cường cơ lưng và tay",
        hinhAnhMinhHoa: ["https://images.unsplash.com/photo-1598632640487-6ea4a4e8b6bd?w=400"],
        videoHuongDan: "https://example.com/pullup-video"
    },
    {
        tenBaiTap: "Burpee",
        moTa: "Bài tập toàn thân kết hợp nhiều động tác",
        hinhAnh: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
        nhomCo: "Toàn thân",
        mucDoKho: "Kho",
        thietBiSuDung: "Không cần thiết bị",
        soHiepvaSoLanLap: 12,
        mucTieuBaiTap: "Cardio và tăng cường toàn thân",
        hinhAnhMinhHoa: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
        videoHuongDan: "https://example.com/burpee-video"
    },
    {
        tenBaiTap: "Mountain Climber",
        moTa: "Bài tập leo núi tại chỗ",
        hinhAnh: "https://images.unsplash.com/photo-1566241134950-3e3e698c2a84?w=400",
        nhomCo: "Bụng",
        mucDoKho: "TrungBinh",
        thietBiSuDung: "Không cần thiết bị",
        soHiepvaSoLanLap: 20,
        mucTieuBaiTap: "Cardio và cơ core",
        hinhAnhMinhHoa: ["https://images.unsplash.com/photo-1566241134950-3e3e698c2a84?w=400"],
        videoHuongDan: "https://example.com/mountain-climber-video"
    }
];

const seedBaiTap = async () => {
    try {
        // Xóa tất cả bài tập hiện có
        await BaiTap.deleteMany({});
        console.log('Đã xóa tất cả bài tập cũ');

        // Thêm bài tập mẫu
        const createdBaiTaps = await BaiTap.insertMany(sampleBaiTaps);
        console.log(`Đã tạo ${createdBaiTaps.length} bài tập mẫu`);

        return createdBaiTaps;
    } catch (error) {
        console.error('Lỗi khi seed bài tập:', error);
        throw error;
    }
};

module.exports = { seedBaiTap, sampleBaiTaps };