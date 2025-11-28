const { GoogleGenerativeAI } = require('@google/generative-ai');
const { HoiVien, PT, OngChu } = require('../models/NguoiDung');
const GoiTap = require('../models/GoiTap');
const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const LichTap = require('../models/LichTap');
const BuoiTap = require('../models/BuoiTap');
const LichSuTap = require('../models/LichSuTap');
const ChiSoCoThe = require('../models/ChiSoCoThe');
const ThanhToan = require('../models/ThanhToan');
const Session = require('../models/Session');
const ChiNhanh = require('../models/ChiNhanh');
const Exercise = require('../models/BaiTap'); // BaiTap collection (alias cho Exercise)
const DinhDuong = require('../models/DinhDuong');
const ThucDon = require('../models/ThucDon');
const Review = require('../models/Review');
const HangHoiVien = require('../models/HangHoiVien');
const LichHenPT = require('../models/LichHenPT');
const TemplateBuoiTap = require('../models/TemplateBuoiTap');
const SessionOption = require('../models/SessionOption');
const BaoCao = require('../models/BaoCao');
const ThongBao = require('../models/ThongBao');
const PackageRegistration = require('../models/PackageRegistration');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAGnazb2y6mKo_FLwQjwomWXM2V3030nfo';

if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY không được cấu hình trong .env');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
// Sử dụng gemini-2.5-flash (model mới nhất, nhanh và hiệu quả) hoặc gemini-2.5-pro (mạnh hơn, chậm hơn)
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }) : null;

/**
 * Lấy context người dùng (profile, roles, branch_id)
 */
const getUserContext = async (userId, vaiTro) => {
    try {
        let userData = {};

        if (vaiTro === 'HoiVien') {
            const hoiVien = await HoiVien.findById(userId).populate('hangHoiVien');
            const chiSoCoThe = await ChiSoCoThe.findOne({ hoiVien: userId }).sort({ ngayDo: -1 });
            const chiTietGoiTap = await ChiTietGoiTap.findOne({
                nguoiDungId: userId,
                trangThaiSuDung: { $in: ['DANG_HOAT_DONG', 'DANG_SU_DUNG'] }
            }).populate('goiTapId').populate('branchId');

            userData = {
                userId: userId.toString(),
                vaiTro: 'HoiVien',
                hoTen: hoiVien?.hoTen,
                sdt: hoiVien?.sdt,
                email: hoiVien?.email,
                branchId: chiTietGoiTap?.branchId?._id?.toString(),
                branchName: chiTietGoiTap?.branchId?.tenChiNhanh,
                goiTap: chiTietGoiTap?.goiTapId ? {
                    tenGoiTap: chiTietGoiTap.goiTapId.tenGoiTap,
                    ngayBatDau: chiTietGoiTap.ngayBatDau,
                    ngayKetThuc: chiTietGoiTap.ngayKetThuc || chiTietGoiTap.ngayKetThuc,
                    trangThai: chiTietGoiTap.trangThaiSuDung
                } : null,
                chiSoCoThe: chiSoCoThe ? {
                    canNang: chiSoCoThe.canNang,
                    chieuCao: chiSoCoThe.chieuCao,
                    BMI: chiSoCoThe.BMI,
                    mucTieu: chiSoCoThe.mucTieu
                } : null,
                hangHoiVien: hoiVien?.hangHoiVien ? {
                    tenHang: hoiVien.hangHoiVien.tenHang,
                    uuDai: hoiVien.hangHoiVien.uuDai
                } : null
            };
        } else if (vaiTro === 'PT') {
            const pt = await PT.findById(userId).populate('chinhanh');
            userData = {
                userId: userId.toString(),
                vaiTro: 'PT',
                hoTen: pt?.hoTen,
                sdt: pt?.sdt,
                email: pt?.email,
                branchId: pt?.chinhanh?._id?.toString(),
                branchName: pt?.chinhanh?.tenChiNhanh,
                chuyenMon: pt?.chuyenMon,
                kinhNghiem: pt?.kinhNghiem
            };
        } else if (vaiTro === 'OngChu') {
            const ongChu = await require('../models/NguoiDung').OngChu.findById(userId);
            userData = {
                userId: userId.toString(),
                vaiTro: 'OngChu',
                hoTen: ongChu?.hoTen,
                sdt: ongChu?.sdt,
                email: ongChu?.email,
                branchId: null, // Admin có thể xem tất cả
                branchName: null
            };
        }

        return userData;
    } catch (error) {
        console.error('Error getting user context:', error);
        return { userId: userId.toString(), vaiTro };
    }
};

/**
 * Tạo system prompt cho Gemini
 */
const createSystemPrompt = (userContext) => {
    return `Bạn là trợ lý Chat AI nhúng dưới dạng "bubble chat" xuất hiện trên mọi trang của ứng dụng quản lý phòng gym Billions Fitness & Gym.

NGỮ CẢNH NGƯỜI DÙNG:
- User ID: ${userContext.userId}
- Vai trò: ${userContext.vaiTro}
- Họ tên: ${userContext.hoTen || 'Chưa có'}
- Số điện thoại: ${userContext.sdt || 'Chưa có'}
${userContext.branchId ? `- Chi nhánh: ${userContext.branchName} (ID: ${userContext.branchId})` : ''}
${userContext.goiTap ? `- Gói tập hiện tại: ${userContext.goiTap.tenGoiTap}, Trạng thái: ${userContext.goiTap.trangThai}` : ''}

NHIỆM VỤ:
1. Trả lời tự nhiên bằng tiếng Việt
2. Giúp hội viên tra cứu mọi thông tin có trong hệ thống (database và các API nội bộ)
3. Giải thích ngắn gọn, có bước-làm khi phù hợp, và cung cấp đường dẫn/đi tới màn hình liên quan nếu có
4. Bảo đảm quyền riêng tư: chỉ hiển thị dữ liệu mà hội viên hiện tại được phép xem

NGUỒN DỮ LIỆU:
Bạn KHÔNG TRUY CẬP DB trực tiếp. Backend sẽ TỰ ĐỘNG query database và cung cấp dữ liệu cho bạn dựa trên câu hỏi.

CÁC RESOURCE CÓ SẴN TRONG DATABASE (TẤT CẢ CÁC BẢNG):
1. **goitap** / **packages** - Gói tập (tenGoiTap, giaTien, thoiGian, moTa, trangThai)
2. **chitietgoitap** / **membership** - Chi tiết đăng ký gói tập (nguoiDungId, goiTapId, ngayBatDau, ngayKetThuc, trangThaiSuDung)
3. **lichtap** / **schedule** - Lịch tập (hoiVien, pt, ngay, gioBatDau, gioKetThuc, trangThai)
4. **buoitap** / **sessions** - Buổi tập (ngayTap, gioBatDau, gioKetThuc, cacBaiTap, trangThai)
5. **lichsutap** / **history** - Lịch sử tập (hoiVien, ngayTap, baiTap, ghiChu, trangThai)
6. **chisocothe** / **body_metrics** - Chỉ số cơ thể (hoiVien, canNang, chieuCao, BMI, ngayDo, mucTieu)
7. **thanhtoan** / **payments** - Thanh toán (maHoiVien, soTien, ngayThanhToan, phuongThuc, trangThai)
8. **chinhanh** / **branch** / **branches** - Chi nhánh (tenChiNhanh, diaChi, sdt)
9. **exercise** / **baitap** / **exercises** - Bài tập (title/tenBaiTap, type, source_url, duration_sec, difficulty, ratings)
10. **session** / **sessions_new** - Phiên tập (chiNhanh, ptPhuTrach, goiTap, ngay, gioBatDau, gioKetThuc, doKho, trangThai)
11. **templatebuoitap** / **templates** - Template buổi tập (tenTemplate, loai, doKho, baiTap)
12. **dinhduong** / **nutrition** - Dinh dưỡng (các chỉ số dinh dưỡng)
13. **thucdon** / **menu** / **meals** - Thực đơn (các bữa ăn, calories, protein, carbs, fat)
14. **review** / **reviews** / **danhgia** - Đánh giá (hoiVien, noiDung, diemSo, ngayTao)
15. **hanghoivien** / **membership_tier** / **tier** - Hạng hội viên (tenHang, uuDai, dieuKien)
16. **lichhenpt** / **pt_appointment** / **appointment** - Lịch hẹn PT (hoiVien, pt, ngayHen, gioHen, trangThai)
17. **baocao** / **report** / **reports** - Báo cáo (chỉ admin/PT xem được)
18. **thongbao** / **notification** / **notifications** - Thông báo (tieuDe, noiDung, ngayTao, nguoiNhan)
19. **hoivien** / **members** / **member** - Hội viên (hoTen, sdt, email, trangThaiHoiVien, hangHoiVien) - CHỈ ADMIN
20. **pt** / **trainer** / **trainers** - Huấn luyện viên (hoTen, sdt, email, chinhanh, chuyenMon) - CHỈ ADMIN
21. **packageregistration** / **dangkygoitap** - Đăng ký gói tập (hoiVien, goiTap, ngayDangKy, trangThai) - CHỈ ADMIN/PT

KHI TRẢ LỜI:
- Nếu câu hỏi liên quan đến dữ liệu ở trên, backend sẽ TỰ ĐỘNG query và cung cấp dữ liệu cho bạn trong context.
- Bạn chỉ cần phân tích và trả lời dựa trên dữ liệu đã được cung cấp.
- Nếu thiếu dữ liệu, bạn có thể đề xuất người dùng cập nhật hoặc liên hệ admin.

KIỂM SOÁT TRUY CẬP:
- Nếu yêu cầu vượt quyền, hãy: (1) nói rõ cần quyền gì, (2) gợi ý người dùng liên hệ quản trị viên, (3) đề xuất thông tin thay thế không nhạy cảm

PHONG CÁCH TRẢ LỜI:
- Ưu tiên ngắn gọn, có headline 1 câu + gạch đầu dòng
- Khi kết quả dài, tóm tắt trước, sau đó cung cấp nút "Xem chi tiết"
- Đưa link điều hướng nội bộ (deep link) khi có, ví dụ: /home, /schedule
- Nếu thiếu dữ liệu: nêu rõ thiếu gì và đề xuất câu hỏi/bước kế tiếp

ĐỊNH DẠNG ĐẦU RA:
Sử dụng Markdown cơ bản (tiêu đề ngắn, danh sách) + trả về JSON với field "actions" đính kèm cho UI render nút bấm.

Ví dụ format response:
\`\`\`json
{
  "text": "Nội dung trả lời bằng markdown...",
  "actions": [
    {"type": "link", "label": "Xem lịch tập", "href": "/schedule"},
    {"type": "run_query", "label": "Lọc lịch hôm nay", "endpoint": "/api/ai/query", "payload": {"resource":"schedule","filters":{"date":"today"}}}
  ]
}
\`\`\`

GIỚI HẠN & AN TOÀN:
- Không trả về dữ liệu nhạy cảm (số thẻ, mật khẩu, token)
- Không phỏng đoán khi thiếu dữ liệu; hãy hỏi lại 1 câu ngắn gọn để làm rõ
- Ghi chú nguồn: "(dữ liệu từ hệ thống nội bộ, thời điểm ${new Date().toLocaleString('vi-VN')})"

Hãy luôn trả về response dưới dạng JSON với format trên.`;
};

/**
 * Xử lý query để lấy dữ liệu từ database
 */
const processQuery = async (queryPayload, userContext) => {
    try {
        const { resource, filters, sort, limit = 10, skip = 0 } = queryPayload;

        let result = [];

        // Đảm bảo filters không null
        if (!filters) {
            filters = {};
        }

        // Kiểm tra quyền truy cập
        if (userContext.vaiTro === 'HoiVien') {
            // Hội viên chỉ được xem dữ liệu của mình
            if (filters.userId && filters.userId !== userContext.userId) {
                throw new Error('Không có quyền truy cập dữ liệu của người dùng khác');
            }
        }

        switch (resource) {
            case 'goitap':
            case 'packages':
                // Nếu có filter _id (tìm gói cụ thể), query theo đó
                // Nếu không, query tất cả hoặc theo filters khác
                const goiTapQuery = filters || {};

                // Nếu không có filter cụ thể, query tất cả (để AI có thể list)
                result = await GoiTap.find(goiTapQuery)
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || { createdAt: -1 });
                break;

            case 'chitietgoitap':
            case 'membership':
                const query = filters || {};
                if (userContext.vaiTro === 'HoiVien') {
                    query.nguoiDungId = userContext.userId;
                }
                result = await ChiTietGoiTap.find(query)
                    .populate('goiTapId')
                    .populate('nguoiDungId', 'hoTen sdt')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || { ngayDangKy: -1 });
                break;

            case 'lichtap':
            case 'schedule':
                const lichQuery = filters || {};
                if (userContext.vaiTro === 'HoiVien') {
                    lichQuery.hoiVien = userContext.userId;
                }
                result = await LichTap.find(lichQuery)
                    .populate('hoiVien', 'hoTen')
                    .populate('pt', 'hoTen')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || {});
                break;

            case 'buoitap':
            case 'sessions':
                const buoiQuery = { ...filters };
                // Xóa các filter không thuộc BuoiTap model
                delete buoiQuery.ngay; // BuoiTap dùng 'ngayTap', không phải 'ngay'

                if (userContext.vaiTro === 'HoiVien') {
                    // Lấy buổi tập từ lịch tập của họ
                    const lichTap = await LichTap.findOne({ hoiVien: userContext.userId });
                    if (lichTap) {
                        buoiQuery._id = { $in: lichTap.cacBuoiTap };
                    } else {
                        buoiQuery._id = { $in: [] }; // Không có buổi tập nào
                    }
                }
                result = await BuoiTap.find(buoiQuery)
                    .populate('chiNhanh', 'tenChiNhanh diaChi')
                    .populate('ptPhuTrach', 'hoTen sdt')
                    .populate('cacBaiTap.baiTap')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || { ngayTap: -1 });
                break;

            case 'lichsutap':
            case 'history':
                const historyQuery = filters || {};
                if (userContext.vaiTro === 'HoiVien') {
                    historyQuery.hoiVien = userContext.userId;
                }
                result = await LichSuTap.find(historyQuery)
                    .populate('hoiVien', 'hoTen')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || { ngayTap: -1 });
                break;

            case 'chisocothe':
            case 'body_metrics':
                const chiSoQuery = filters || {};
                if (userContext.vaiTro === 'HoiVien') {
                    chiSoQuery.hoiVien = userContext.userId;
                }
                result = await ChiSoCoThe.find(chiSoQuery)
                    .populate('hoiVien', 'hoTen')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || { ngayDo: -1 });
                break;

            case 'thanhtoan':
            case 'payments':
                const thanhToanQuery = filters || {};
                if (userContext.vaiTro === 'HoiVien') {
                    // Lấy từ ChiTietGoiTap
                    const chiTietGoiTap = await ChiTietGoiTap.find({ nguoiDungId: userContext.userId });
                    const thanhToanIds = chiTietGoiTap.map(ct => ct.maThanhToan).filter(Boolean);
                    if (thanhToanIds.length > 0) {
                        thanhToanQuery._id = { $in: thanhToanIds };
                    } else {
                        thanhToanQuery._id = { $in: [] };
                    }
                }
                result = await ThanhToan.find(thanhToanQuery)
                    .populate('maHoiVien', 'hoTen')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || { ngayThanhToan: -1 });
                break;

            case 'chinhanh':
            case 'branch':
            case 'branches':
                result = await ChiNhanh.find(filters || {}).limit(limit).skip(skip).sort(sort || {});
                break;

            case 'exercise':
            case 'baitap':
            case 'exercises':
                result = await Exercise.find(filters || {}).limit(limit).skip(skip).sort(sort || {});
                break;

            case 'session':
            case 'sessions_new':
                // Session model (khác với buoitap)
                const sessionQuery = { ...filters };
                // Xóa các filter không thuộc Session model
                delete sessionQuery.ngayTap; // Session dùng 'ngay', không phải 'ngayTap'

                if (userContext.vaiTro === 'HoiVien') {
                    // Session có thể filter theo goiTap hoặc pt
                    // Không có trường hoiVien trực tiếp
                }
                result = await Session.find(sessionQuery)
                    .populate('chiNhanh', 'tenChiNhanh diaChi')
                    .populate('ptPhuTrach', 'hoTen sdt')
                    .populate('goiTap', 'tenGoiTap')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || { ngay: -1 });
                break;

            case 'templatebuoitap':
            case 'templates':
            case 'template':
                result = await TemplateBuoiTap.find(filters || {})
                    .populate('baiTap')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || {});
                break;

            case 'dinhduong':
            case 'nutrition':
                const dinhDuongQuery = filters || {};
                if (userContext.vaiTro === 'HoiVien') {
                    // Có thể filter theo hoiVien nếu có
                }
                result = await DinhDuong.find(dinhDuongQuery).limit(limit).skip(skip).sort(sort || {});
                break;

            case 'thucdon':
            case 'menu':
            case 'meals':
                result = await ThucDon.find(filters || {}).limit(limit).skip(skip).sort(sort || {});
                break;

            case 'review':
            case 'reviews':
            case 'danhgia':
                const reviewQuery = filters || {};
                result = await Review.find(reviewQuery)
                    .populate('hoiVien', 'hoTen')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || { ngayTao: -1 });
                break;

            case 'hanghoivien':
            case 'membership_tier':
            case 'tier':
                result = await HangHoiVien.find(filters || {}).limit(limit).skip(skip).sort(sort || {});
                break;

            case 'lichhenpt':
            case 'pt_appointment':
            case 'appointment':
                const lichHenQuery = filters || {};
                if (userContext.vaiTro === 'HoiVien') {
                    lichHenQuery.hoiVien = userContext.userId;
                }
                result = await LichHenPT.find(lichHenQuery)
                    .populate('hoiVien', 'hoTen')
                    .populate('pt', 'hoTen')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || { ngayHen: -1 });
                break;

            case 'baocao':
            case 'report':
            case 'reports':
                // Admin/OngChu mới có quyền xem báo cáo
                if (userContext.vaiTro !== 'OngChu' && userContext.vaiTro !== 'PT') {
                    throw new Error('Chỉ quản trị viên mới có quyền xem báo cáo');
                }
                result = await BaoCao.find(filters || {}).limit(limit).skip(skip).sort(sort || { ngayTao: -1 });
                break;

            case 'thongbao':
            case 'notification':
            case 'notifications':
                const thongBaoQuery = filters || {};
                if (userContext.vaiTro === 'HoiVien') {
                    // Có thể filter theo nguoiNhan
                }
                result = await ThongBao.find(thongBaoQuery).limit(limit).skip(skip).sort(sort || { ngayTao: -1 });
                break;

            case 'hoivien':
            case 'members':
            case 'member':
                // Admin/PT mới có quyền xem danh sách hội viên
                if (userContext.vaiTro !== 'OngChu' && userContext.vaiTro !== 'PT') {
                    throw new Error('Chỉ quản trị viên mới có quyền xem danh sách hội viên');
                }
                result = await HoiVien.find(filters || {})
                    .populate('hangHoiVien')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || {});
                break;

            case 'pt':
            case 'trainer':
            case 'trainers':
                // Admin mới có quyền xem danh sách PT
                if (userContext.vaiTro !== 'OngChu') {
                    throw new Error('Chỉ quản trị viên mới có quyền xem danh sách huấn luyện viên');
                }
                result = await PT.find(filters || {})
                    .populate('chinhanh')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || {});
                break;

            case 'packageregistration':
            case 'dangkygoitap':
                // Admin/PT mới có quyền xem
                if (userContext.vaiTro !== 'OngChu' && userContext.vaiTro !== 'PT') {
                    throw new Error('Chỉ quản trị viên mới có quyền xem đăng ký gói tập');
                }
                result = await PackageRegistration.find(filters || {})
                    .populate('hoiVien', 'hoTen')
                    .populate('goiTap', 'tenGoiTap')
                    .limit(limit)
                    .skip(skip)
                    .sort(sort || { ngayDangKy: -1 });
                break;

            default:
                throw new Error(`Resource không hỗ trợ: ${resource}. Các resource có sẵn: goitap, chitietgoitap, lichtap, buoitap, lichsutap, chisocothe, thanhtoan, chinhanh, exercise, session, templatebuoitap, dinhduong, thucdon, review, hanghoivien, lichhenpt, baocao, thongbao, hoivien, pt, packageregistration`);
        }

        return {
            success: true,
            data: result,
            total: result.length,
            limit,
            skip
        };
    } catch (error) {
        console.error('Error processing query:', error);
        throw error;
    }
};

/**
 * Tìm kiếm full-text qua các resources
 */
const search = async (query, userContext) => {
    try {
        const searchTerm = query.toLowerCase();
        const results = {
            goitap: [],
            chitietgoitap: [],
            lichtap: [],
            lichsutap: []
        };

        if (userContext.vaiTro === 'HoiVien') {
            // Tìm trong gói tập của họ
            const chiTietGoiTap = await ChiTietGoiTap.find({ nguoiDungId: userContext.userId })
                .populate('goiTapId')
                .limit(5);
            results.chitietgoitap = chiTietGoiTap.filter(ct =>
                ct.goiTapId?.tenGoiTap?.toLowerCase().includes(searchTerm)
            );

            // Tìm trong lịch tập
            const lichTap = await LichTap.findOne({ hoiVien: userContext.userId })
                .populate('hoiVien', 'hoTen')
                .populate('pt', 'hoTen');
            if (lichTap) {
                results.lichtap = [lichTap];
            }

            // Tìm trong lịch sử tập
            const lichSuTap = await LichSuTap.find({ hoiVien: userContext.userId })
                .populate('hoiVien', 'hoTen')
                .limit(10)
                .sort({ ngayTap: -1 });
            results.lichsutap = lichSuTap.filter(ls =>
                ls.ghiChu?.toLowerCase().includes(searchTerm) ||
                ls.baiTap?.toLowerCase().includes(searchTerm)
            );
        } else {
            // Admin/PT có thể tìm tất cả
            results.goitap = await GoiTap.find({
                $or: [
                    { tenGoiTap: { $regex: searchTerm, $options: 'i' } },
                    { moTa: { $regex: searchTerm, $options: 'i' } }
                ]
            }).limit(10);
        }

        return {
            success: true,
            query,
            results
        };
    } catch (error) {
        console.error('Error in search:', error);
        throw error;
    }
};

/**
 * Parse filters từ câu hỏi (date, branch name, package name, etc.)
 */
const parseFiltersFromMessage = async (message, detectedResource) => {
    const msg = message.toLowerCase();
    const filters = {};

    // Parse package name: "Weekend Gym", "gói tập X", etc.
    if (detectedResource === 'goitap' || detectedResource === 'packages') {
        // Tìm tên gói tập trong câu hỏi - CẢI THIỆN LOGIC
        let packageName = null;

        // 1. Tìm trong dấu ngoặc kép/đơn
        const quotedMatch = message.match(/["']([^"']+)["']/);
        if (quotedMatch) {
            packageName = quotedMatch[1].trim();
        }

        // 2. Tìm sau "gói tập" hoặc "package"
        if (!packageName) {
            const afterKeywordMatch = message.match(/(?:gói tập|goi tap|package|packages)\s+["']?([^"',.\n]+)["']?/i);
            if (afterKeywordMatch) {
                packageName = afterKeywordMatch[1].trim();
            }
        }

        // 3. Tìm các từ viết hoa (có thể là tên gói tập như "Weekend Gym")
        if (!packageName) {
            const capitalizedWords = message.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/);
            if (capitalizedWords) {
                packageName = capitalizedWords[0].trim();
            }
        }

        // 4. Tìm bất kỳ từ khóa nào có thể là tên gói tập (loại bỏ các từ thông thường)
        if (!packageName) {
            const commonWords = ['gói', 'tập', 'package', 'goi', 'tap', 'của', 'cua', 'cho', 'về', 've', 'với', 'voi', 'theo', 'từ', 'tu', 'có', 'co', 'là', 'la', 'được', 'duoc', 'trong', 'này', 'nay', 'nào', 'nao', 'nếu', 'neu', 'không', 'khong', 'có', 'co', 'tất', 'tat', 'cả', 'ca', 'hiện', 'hien', 'tại', 'tai'];
            const words = message.split(/\s+/).filter(w => w.length > 2 && !commonWords.includes(w.toLowerCase()));
            if (words.length > 0) {
                // Thử tìm với từ đầu tiên, hoặc kết hợp 2-3 từ đầu
                for (let i = 1; i <= Math.min(3, words.length); i++) {
                    const candidate = words.slice(0, i).join(' ');
                    try {
                        const packageFound = await GoiTap.findOne({
                            tenGoiTap: { $regex: candidate, $options: 'i' }
                        });
                        if (packageFound) {
                            packageName = candidate;
                            filters._id = packageFound._id;
                            console.log(`✅ Found package by candidate "${candidate}": ${packageFound.tenGoiTap}`);
                            break;
                        }
                    } catch (err) {
                        // Continue
                    }
                }
            }
        }

        // 5. Nếu đã có packageName nhưng chưa tìm thấy, search trong database
        if (packageName && !filters._id) {
            try {
                const packageFound = await GoiTap.findOne({
                    tenGoiTap: { $regex: packageName.replace(/\s+/g, '\\s*'), $options: 'i' }
                });
                if (packageFound) {
                    filters._id = packageFound._id;
                    console.log(`✅ Found package: ${packageFound.tenGoiTap} (${packageFound._id})`);
                } else {
                    console.log(`⚠️ Package name "${packageName}" not found, will query all packages`);
                }
            } catch (err) {
                console.warn('Error finding package:', err.message);
            }
        }

        // LƯU Ý: Nếu không tìm thấy với filter, sẽ query tất cả để AI có thể tìm trong danh sách
    }

    // Parse date: "hôm nay", "ngày mai", "hôm qua", "hôm nay", specific date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msg.includes('hôm nay') || msg.includes('hom nay') || msg.includes('today')) {
        filters.ngay = { $gte: today, $lt: tomorrow };
        filters.ngayTap = { $gte: today, $lt: tomorrow };
    } else if (msg.includes('ngày mai') || msg.includes('ngay mai') || msg.includes('tomorrow')) {
        filters.ngay = { $gte: tomorrow };
        filters.ngayTap = { $gte: tomorrow };
    } else if (msg.includes('hôm qua') || msg.includes('hom qua') || msg.includes('yesterday')) {
        filters.ngay = { $gte: yesterday, $lt: today };
        filters.ngayTap = { $gte: yesterday, $lt: today };
    }

    // Parse branch name: "Quận 3", "Quan 3", "chi nhánh X"
    if (msg.includes('quận') || msg.includes('quan')) {
        // Tìm tên chi nhánh trong câu hỏi
        const branchMatch = msg.match(/qu[ậa]n\s*(\d+)/i);
        if (branchMatch) {
            const branchName = `Quận ${branchMatch[1]}`;
            // Tìm chi nhánh trong database
            try {
                const branch = await ChiNhanh.findOne({ tenChiNhanh: { $regex: branchName, $options: 'i' } });
                if (branch) {
                    filters.chiNhanh = branch._id;
                    console.log(`✅ Found branch: ${branch.tenChiNhanh} (${branch._id})`);
                }
            } catch (err) {
                console.warn('Error finding branch:', err.message);
            }
        }
    }

    // Parse branch name variations
    if (msg.includes('chi nhánh') || msg.includes('branch')) {
        // Tìm tên chi nhánh sau "chi nhánh"
        const branchNameMatch = msg.match(/chi nh[áa]nh\s+([^,\s]+)/i) || msg.match(/branch\s+([^,\s]+)/i);
        if (branchNameMatch) {
            const branchName = branchNameMatch[1].trim();
            try {
                const branch = await ChiNhanh.findOne({ tenChiNhanh: { $regex: branchName, $options: 'i' } });
                if (branch) {
                    filters.chiNhanh = branch._id;
                    console.log(`✅ Found branch: ${branch.tenChiNhanh} (${branch._id})`);
                }
            } catch (err) {
                console.warn('Error finding branch:', err.message);
            }
        }
    }

    return filters;
};

/**
 * Phát hiện resource cần query từ câu hỏi (có thể nhiều resources)
 */
const detectResourcesFromMessage = (message) => {
    const msg = message.toLowerCase();
    const resources = [];
    const resourceMap = {
        // Gói tập
        'gói tập': 'goitap',
        'goi tap': 'goitap',
        'package': 'goitap',
        'packages': 'goitap',
        'đăng ký gói': 'chitietgoitap',
        'gói của tôi': 'chitietgoitap',
        'membership': 'chitietgoitap',
        // Lịch tập
        'lịch tập': 'lichtap',
        'schedule': 'lichtap',
        'lịch hôm nay': 'lichtap',
        // Buổi tập
        'buổi tập': 'buoitap',
        'session': 'buoitap',
        'sessions': 'buoitap',
        // Lịch sử
        'lịch sử tập': 'lichsutap',
        'history': 'lichsutap',
        // Chỉ số cơ thể
        'chỉ số cơ thể': 'chisocothe',
        'body metrics': 'chisocothe',
        'cân nặng': 'chisocothe',
        'bmi': 'chisocothe',
        'chiều cao': 'chisocothe',
        // Thanh toán
        'thanh toán': 'thanhtoan',
        'payment': 'thanhtoan',
        'payments': 'thanhtoan',
        'hóa đơn': 'thanhtoan',
        // Chi nhánh
        'chi nhánh': 'chinhanh',
        'branch': 'chinhanh',
        'branches': 'chinhanh',
        // Bài tập
        'bài tập': 'exercise',
        'baitap': 'exercise',
        'exercise': 'exercise',
        'exercises': 'exercise',
        // Session (phiên tập mới)
        'session new': 'session',
        'sessions_new': 'session',
        'phiên tập': 'session',
        // Template
        'template': 'templatebuoitap',
        'templates': 'templatebuoitap',
        'mẫu buổi tập': 'templatebuoitap',
        // Dinh dưỡng
        'dinh dưỡng': 'dinhduong',
        'nutrition': 'dinhduong',
        // Thực đơn
        'thực đơn': 'thucdon',
        'menu': 'thucdon',
        'meals': 'thucdon',
        'bữa ăn': 'thucdon',
        // Đánh giá
        'review': 'review',
        'reviews': 'review',
        'đánh giá': 'review',
        'danh gia': 'review',
        // Hạng hội viên
        'hạng hội viên': 'hanghoivien',
        'membership tier': 'hanghoivien',
        'tier': 'hanghoivien',
        // Lịch hẹn PT
        'lịch hẹn pt': 'lichhenpt',
        'pt appointment': 'lichhenpt',
        'appointment': 'lichhenpt',
        // Báo cáo
        'báo cáo': 'baocao',
        'report': 'baocao',
        'reports': 'baocao',
        // Thông báo
        'thông báo': 'thongbao',
        'notification': 'thongbao',
        'notifications': 'thongbao',
        // Hội viên (admin only)
        'hội viên': 'hoivien',
        'members': 'hoivien',
        'member': 'hoivien',
        // PT (admin only)
        'huấn luyện viên': 'pt',
        'trainer': 'pt',
        'trainers': 'pt',
        'pt': 'pt'
    };

    for (const [keyword, resource] of Object.entries(resourceMap)) {
        if (msg.includes(keyword)) {
            if (!resources.includes(resource)) {
                resources.push(resource);
            }
        }
    }

    // Nếu không tìm thấy resource cụ thể, nhưng có từ khóa về buổi tập/session
    if (resources.length === 0) {
        if (msg.includes('buổi') || msg.includes('buoi') || msg.includes('session')) {
            // Thử cả session và buoitap
            resources.push('session');
            resources.push('buoitap');
        }
    }

    return resources.length > 0 ? resources : null;
};

/**
 * Xử lý chat message với Gemini
 */
const processChatMessage = async (message, userContext, conversationHistory = []) => {
    try {
        if (!genAI) {
            throw new Error('Gemini API không được khởi tạo. Vui lòng kiểm tra API key.');
        }

        if (!model) {
            throw new Error('Gemini model không được khởi tạo. Vui lòng kiểm tra model name.');
        }

        // Tự động query database nếu cần - QUERY THÔNG MINH HƠN
        let databaseData = [];
        let detectedResources = detectResourcesFromMessage(message);

        // LUÔN query nếu có từ khóa về gói tập, dù có detect được resource hay không
        const msg = message.toLowerCase();
        const hasGoiTapKeywords = msg.includes('gói tập') || msg.includes('goi tap') || msg.includes('package') ||
            msg.includes('packages') || msg.includes('gói') || msg.includes('goi');

        if (hasGoiTapKeywords) {
            if (!detectedResources || !detectedResources.includes('goitap')) {
                if (!detectedResources) {
                    detectedResources = ['goitap'];
                } else {
                    detectedResources.push('goitap');
                }
            }
        }

        if (detectedResources && detectedResources.length > 0) {
            // Query từng resource với filters thông minh
            for (const resource of detectedResources) {
                try {
                    // Parse filters từ câu hỏi
                    const filters = await parseFiltersFromMessage(message, resource);

                    // Query dữ liệu từ database với filters
                    const queryResult = await processQuery({
                        resource: resource,
                        filters: filters,
                        limit: 50, // Tăng limit để có đủ dữ liệu (đặc biệt cho goitap)
                        skip: 0
                    }, userContext);

                    if (queryResult.success && queryResult.data && queryResult.data.length > 0) {
                        // Đặc biệt cho goitap: Nếu có filter _id nhưng không tìm thấy, query tất cả
                        if (resource === 'goitap' && filters._id && queryResult.data.length === 0) {
                            console.log(`⚠️ Package not found with _id filter, querying all packages...`);
                            const fallbackResult = await processQuery({
                                resource: resource,
                                filters: {},
                                limit: 100,
                                skip: 0
                            }, userContext);

                            if (fallbackResult.success && fallbackResult.data && fallbackResult.data.length > 0) {
                                databaseData.push({
                                    resource: resource,
                                    count: fallbackResult.data.length,
                                    total: fallbackResult.total || fallbackResult.data.length,
                                    data: fallbackResult.data,
                                    note: 'Query tất cả gói tập - AI cần tìm trong danh sách này'
                                });
                                console.log(`✅ Fallback query all packages: ${fallbackResult.data.length} records`);
                            }
                        } else {
                            // Format dữ liệu để đưa vào context
                            databaseData.push({
                                resource: resource,
                                count: queryResult.data.length,
                                total: queryResult.total || queryResult.data.length,
                                data: queryResult.data // Lấy tất cả dữ liệu
                            });
                            console.log(`✅ Auto-queried ${resource}: ${queryResult.data.length} records with filters:`, JSON.stringify(filters));
                        }
                    } else {
                        // Nếu không tìm thấy với filters, thử query tất cả (để AI có thể list)
                        if (Object.keys(filters).length > 0 || resource === 'goitap') {
                            console.log(`⚠️ No data found for ${resource} with filters, trying without filters...`);
                            const fallbackResult = await processQuery({
                                resource: resource,
                                filters: {},
                                limit: resource === 'goitap' ? 100 : 50, // Tăng limit cho goitap
                                skip: 0
                            }, userContext);

                            if (fallbackResult.success && fallbackResult.data && fallbackResult.data.length > 0) {
                                databaseData.push({
                                    resource: resource,
                                    count: fallbackResult.data.length,
                                    total: fallbackResult.total || fallbackResult.data.length,
                                    data: fallbackResult.data,
                                    note: resource === 'goitap' ? 'Danh sách TẤT CẢ gói tập - AI PHẢI tìm trong danh sách này' : 'Query tất cả vì không tìm thấy với filters cụ thể'
                                });
                                console.log(`✅ Fallback query ${resource}: ${fallbackResult.data.length} records`);
                            }
                        } else {
                            console.log(`⚠️ No data found for ${resource}`);
                        }
                    }
                } catch (queryError) {
                    console.warn(`Auto-query failed for ${resource}:`, queryError.message);
                    // Không fail toàn bộ request, chỉ log warning
                }
            }
        } else {
            // Nếu không detect được resource, thử query session/buoitap nếu có từ khóa về buổi tập
            const msg = message.toLowerCase();
            if (msg.includes('buổi') || msg.includes('buoi') || msg.includes('session') || msg.includes('hôm nay') || msg.includes('today')) {
                try {
                    const filters = await parseFiltersFromMessage(message, 'session');
                    // Thử query cả session và buoitap
                    for (const resource of ['session', 'buoitap']) {
                        try {
                            const queryResult = await processQuery({
                                resource: resource,
                                filters: filters,
                                limit: 20,
                                skip: 0
                            }, userContext);

                            if (queryResult.success && queryResult.data && queryResult.data.length > 0) {
                                databaseData.push({
                                    resource: resource,
                                    count: queryResult.data.length,
                                    total: queryResult.total || queryResult.data.length,
                                    data: queryResult.data
                                });
                                console.log(`✅ Auto-queried ${resource} (fallback): ${queryResult.data.length} records`);
                            }
                        } catch (err) {
                            console.warn(`Fallback query failed for ${resource}:`, err.message);
                        }
                    }
                } catch (err) {
                    console.warn('Fallback query failed:', err.message);
                }
            }
        }

        const systemPrompt = createSystemPrompt(userContext);

        // Thêm database data vào context nếu có - FORMAT RÕ RÀNG HƠN
        let dataContext = '';
        if (databaseData && databaseData.length > 0) {
            dataContext = `\n\n📊 DỮ LIỆU TỪ DATABASE (ĐÃ QUERY TỰ ĐỘNG):\n`;
            for (const data of databaseData) {
                dataContext += `\n**${data.resource.toUpperCase()}**: Tìm thấy ${data.count} bản ghi (tổng: ${data.total || data.count})\n`;
                if (data.note) {
                    dataContext += `📌 ${data.note}\n`;
                }
                dataContext += `Dữ liệu chi tiết:\n${JSON.stringify(data.data, null, 2)}\n`;
            }
            dataContext += `\n\n⚠️⚠️⚠️ QUAN TRỌNG - BẠN PHẢI LÀM THEO:\n`;
            dataContext += `1. Bạn PHẢI sử dụng dữ liệu trên để trả lời. KHÔNG được dùng placeholder như [số_lượng_buổi_tập] hay [số_lượng].\n`;
            dataContext += `2. Hãy sử dụng SỐ THỰC TẾ từ dữ liệu đã query.\n`;
            dataContext += `3. Nếu người dùng hỏi về một gói tập cụ thể (ví dụ "Weekend Gym"), BẠN PHẢI TÌM trong danh sách data trên.`;
            dataContext += `   - Tìm trong mảng data, so sánh trường "tenGoiTap" với tên người dùng hỏi (case-insensitive, partial match OK)\n`;
            dataContext += `   - Nếu tìm thấy, trả về thông tin chi tiết của gói tập đó\n`;
            dataContext += `   - Nếu KHÔNG tìm thấy trong danh sách, mới nói "không tìm thấy"\n`;
            dataContext += `4. Nếu count = 0, nói rõ "không tìm thấy" hoặc "không có dữ liệu"\n`;
            dataContext += `5. Nếu có dữ liệu, liệt kê chi tiết từ các trường trong data (tenGoiTap, donGia, thoiHan, moTa, etc.)\n`;
            dataContext += `6. Sử dụng số thực tế: count, các trường như ngay, gioBatDau, tenChiNhanh, etc.\n`;
            dataContext += `7. KHÔNG BAO GIỜ nói "không tìm thấy" nếu chưa kiểm tra kỹ trong danh sách data đã được cung cấp!`;
        } else {
            dataContext = `\n\n⚠️ LƯU Ý: Không tìm thấy dữ liệu từ database cho câu hỏi này. Nếu câu hỏi liên quan đến dữ liệu trong hệ thống, hãy thông báo rằng "Hiện tại không có dữ liệu phù hợp" hoặc đề xuất cách khác để tìm thông tin.`;
        }

        // Format instruction cho JSON response
        const formatInstruction = `\n\nHãy phân tích câu hỏi và trả lời bằng tiếng Việt. Trả về JSON với format:
{
  "text": "Nội dung trả lời markdown...",
  "actions": [
    {"type": "link", "label": "Nhãn nút", "href": "/đường-dẫn"},
    {"type": "run_query", "label": "Nhãn nút", "endpoint": "/api/ai/query", "payload": {...}}
  ]
}`;

        // Chuẩn bị full prompt với system context + database data
        const fullPrompt = `${systemPrompt}${dataContext}\n\nCÂU HỎI: ${message}${formatInstruction}`;

        // Đơn giản hóa: luôn dùng generateContent (ổn định nhất)
        // Chỉ dùng startChat nếu thực sự cần conversation context
        let result;

        if (conversationHistory.length > 0) {
            // Có history - thử dùng startChat
            try {
                // Chuyển đổi history sang format Gemini, đảm bảo bắt đầu với 'user'
                const history = [];
                for (let i = 0; i < conversationHistory.length && history.length < 10; i++) {
                    const msg = conversationHistory[i];
                    history.push({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }]
                    });
                }

                // Đảm bảo history bắt đầu với 'user'
                if (history.length > 0 && history[0].role === 'user') {
                    const chat = model.startChat({
                        history: history
                    });

                    // Gửi message mới (có system prompt trong đó)
                    result = await chat.sendMessage(fullPrompt);
                } else {
                    // History không hợp lệ, dùng generateContent
                    result = await model.generateContent(fullPrompt);
                }
            } catch (chatError) {
                // Nếu startChat lỗi, fallback về generateContent
                console.warn('startChat failed, using generateContent:', chatError.message);
                result = await model.generateContent(fullPrompt);
            }
        } else {
            // Không có history, dùng generateContent
            result = await model.generateContent(fullPrompt);
        }

        const response = await result.response;
        const text = response.text();

        // Parse JSON từ response
        let parsedResponse;
        try {
            // Tìm JSON trong response (có thể có markdown code block)
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                parsedResponse = JSON.parse(jsonStr);
            } else {
                parsedResponse = {
                    text: text,
                    actions: []
                };
            }
        } catch (parseError) {
            // Nếu không parse được JSON, trả về text như response
            parsedResponse = {
                text: text,
                actions: []
            };
        }

        return {
            success: true,
            response: parsedResponse.text || text,
            actions: parsedResponse.actions || [],
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error processing chat message:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack?.split('\n').slice(0, 5).join('\n')
        });
        throw error;
    }
};

/**
 * Generate nutrition plan với Gemini AI
 * @param {Object} request - Request object với goal, calories, period, preferences
 * @param {Object} userContext - User context từ getUserContext
 * @returns {Promise<Object>} Nutrition plan data
 */
const generateNutritionPlan = async (request, userContext) => {
    try {
        if (!genAI) {
            throw new Error('Gemini API không được khởi tạo. Vui lòng kiểm tra API key.');
        }

        if (!model) {
            throw new Error('Gemini model không được khởi tạo. Vui lòng kiểm tra model name.');
        }

        const { goal, calories, period, preferences, mealType, date } = request;
        const periodDays = period === 'weekly' ? 7 : 1;

        // Get target date from request or use today
        let targetDate = new Date();
        if (date) {
            targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) {
                targetDate = new Date(); // Fallback to today if invalid
            }
        }
        targetDate.setHours(0, 0, 0, 0);

        // Tạo prompt chi tiết cho Gemini với đầy đủ thuộc tính
        const prompt = `Bạn là chuyên gia dinh dưỡng AI. Tạo một kế hoạch dinh dưỡng ${period === 'weekly' ? '7 ngày' : '1 ngày'} cho mục tiêu "${goal}".

YÊU CẦU:
- Tổng calories mỗi ngày: ${calories} kcal
- Số ngày: ${periodDays} ngày
- Mục tiêu: ${goal}
- Sở thích/ưu tiên: ${preferences || 'Không có'}
- Loại bữa ăn: ${mealType || 'Tất cả các bữa'}

ĐỊNH DẠNG JSON BẮT BUỘC (phải trả về đúng format này với ĐẦY ĐỦ thuộc tính):
{
  "planType": "${period}",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "id": "unique-id",
          "name": "Tên món ăn bằng tiếng Việt",
          "description": "Mô tả ngắn gọn về món ăn",
          "image": "https://images.pexels.com/photos/1234567/food-photography.jpg",
          "mealType": "Bữa sáng" | "Phụ 1" | "Bữa trưa" | "Phụ 2" | "Bữa tối" | "Phụ 3",
          "difficulty": "Dễ" | "Trung bình" | "Khó",
          "cookingTimeMinutes": 15,
          "healthScore": 85,
          "stepCount": 4,
          "caloriesKcal": 450,
          "carbsGrams": 40,
          "proteinGrams": 35,
          "fatGrams": 12,
          "fiberGrams": 4,
          "sugarGrams": 2,
          "sodiumMg": 350,
          "rating": 4.8,
          "ratingCount": 125,
          "tags": ["low-fat", "high-protein", "balanced"],
          "cuisineType": "Vietnamese" | "Western" | "Mediterranean" | "Mexican" | "Asian",
          "dietaryRestrictions": ["vegetarian"] | ["vegan"] | ["gluten-free"] | [] | ...,
          "allergens": ["nuts"] | ["dairy"] | ["shellfish"] | [] | ...,
          "ingredients": [
            {
              "name": "Tên nguyên liệu",
              "amount": 150,
              "unit": "g" | "ml" | "cái" | "quả",
              "notes": "Ghi chú nếu có"
            }
          ],
          "instructions": [
            "Bước 1: Mô tả chi tiết",
            "Bước 2: Mô tả chi tiết",
            "Bước 3: Mô tả chi tiết"
          ],
          "cookingVideoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
          "isFeatured": false,
          "isPopular": false,
          "isRecommended": false
        }
      ]
    }
  ]
}

QUY TẮC QUAN TRỌNG:
1. Mỗi ngày PHẢI có ĐẦY ĐỦ 6 bữa ăn theo thứ tự:
   - Bữa sáng (bắt buộc)
   - Phụ 1 (bắt buộc - bữa phụ giữa sáng và trưa)
   - Bữa trưa (bắt buộc)
   - Phụ 2 (bắt buộc - bữa phụ giữa trưa và tối)
   - Bữa tối (bắt buộc)
   - Phụ 3 (bắt buộc - bữa phụ buổi tối)
   - KHÔNG được bỏ sót bất kỳ bữa nào. Mỗi ngày phải có đúng 6 bữa.
   - Ví dụ: Một ngày phải có: [Bữa sáng, Phụ 1, Bữa trưa, Phụ 2, Bữa tối, Phụ 3] - không được thiếu bất kỳ bữa nào.
2. Tổng calories mỗi ngày phải gần đúng ${calories} kcal (±50 kcal)
   - Phân bổ calories: Bữa sáng (~25%), Phụ 1 (~10%), Bữa trưa (~30%), Phụ 2 (~10%), Bữa tối (~20%), Phụ 3 (~5%)
3. Phân bổ macros hợp lý: Protein 25-35%, Carbs 40-50%, Fat 20-30%
4. Đánh dấu 1 món là isFeatured: true cho mỗi ngày (món nổi bật nhất)
5. Đánh dấu 2-3 món là isPopular: true (món phổ biến)
6. Đánh dấu 2-3 món là isRecommended: true (món được đề xuất)
7. Health score từ 70-100
8. Rating từ 4.5-5.0
9. Rating count từ 50-200
10. Tên món ăn phải bằng tiếng Việt, mô tả ngắn gọn
11. Difficulty: "Dễ" cho món đơn giản, "Trung bình" cho món thông thường, "Khó" cho món phức tạp
12. Cooking time từ 5-60 phút
13. Step count từ 3-8 bước
14. PHẢI có đầy đủ: ingredients (ít nhất 3-5 nguyên liệu), instructions (ít nhất 3-6 bước)
15. Tags phải phù hợp với món ăn (ví dụ: high-protein, low-fat, balanced, keto, etc.)
16. CuisineType phù hợp với món ăn (Vietnamese cho món Việt, Western cho món Tây, etc.)
17. DietaryRestrictions và allergens phải chính xác (nếu món có sữa thì allergens phải có "dairy")
18. FiberGrams, sugarGrams, sodiumMg phải hợp lý (fiber 2-10g, sugar 0-25g, sodium 100-600mg)
19. image: BẮT BUỘC - PHẢI là URL hình ảnh THẬT từ các trang web nấu ăn Việt Nam hoặc quốc tế, phù hợp chính xác với tên món ăn.
KHÔNG được dùng Unsplash placeholder (source.unsplash.com) hoặc URL giả.
PHẢI tìm kiếm và sử dụng link ảnh THẬT đại diện trực tiếp cho tên món ăn cụ thể (ví dụ: nếu món là "Cơm Gà Xé Phay", ảnh phải hiển thị cơm gà xé phay, không phải gà nướng hoặc món khác).
Ưu tiên tìm ảnh từ các nguồn Việt Nam trước: phugiafood.com, cookpad.com, monngonmoingay.com, vnfood.vn, vietnamesefood.com.vn, hoặc các blog ẩm thực .vn như helenrecipes.com, bepmina.vn.
Nếu không tìm thấy ở nguồn Việt, dùng nguồn quốc tế: AllRecipes.com, FoodNetwork.com, BBCGoodFood.com, SeriousEats.com, BonAppetit.com.
Hoặc CDN ảnh thực phẩm chất lượng cao: images.pexels.com, cdn.pixabay.com, i.imgur.com, live.staticflickr.com - nhưng phải đảm bảo ảnh khớp với tên món (tìm kiếm bằng tên món để xác nhận).
Ảnh PHẢI liên quan 100% đến tên món: sử dụng công cụ tìm kiếm hình ảnh để xác nhận (ví dụ: search "hình ảnh [tên món] Việt Nam" hoặc "recipe image [tên món]").
Format URL hợp lệ: https://domain.com/path/to/image.jpg hoặc https://cdn.domain.com/image.png
KHÔNG được để trống. Nếu không tìm được ảnh chính xác, chọn ảnh món tương tự có tên gần giống hoặc ảnh nguyên liệu chính, nhưng giải thích lý do trong comment.
Ví dụ URL hợp lệ cho món Việt Nam:
https://phugiafood.com/wp-content/uploads/2021/11/Com-ga-xe-phay-1-1024x768.jpg (Cơm Gà Xé Phay)
https://cdn.tgdd.vn/2021/09/CookDish/cach-lam-sua-chua-hat-chia-giam-can-tot-cho-suc-khoe-avt-1200x676.jpg (Sữa Chua Không Đường với Hạt Chia)
https://img-global.cpcdn.com/recipes/e276c175d20ca9b3/1200x630cq80/photo.jpg (Cơm Gạo Lứt, Cá Diêu Hồng Hấp Gừng)
https://vietnamesefood.com.vn/pictures/VietnameseFood2/Grilled_Chicken_with_Honey_and_Boiled_Rice_Recipe_1.jpg (Cơm Gà Nướng Mật Ong)
https://images.pexels.com/photos/2252616/pexels-photo-2252616.jpeg (Ảnh minh họa sinh tố chuối, nếu khớp tên)

KHÔNG chấp nhận: source.unsplash.com, placeholder URLs, hoặc URL không tồn tại. Luôn kiểm tra URL hoạt động.
QUAN TRỌNG: Sử dụng công cụ web search hoặc search_images để tìm URL ảnh thực tế dựa trên tên món chính xác, ưu tiên nguồn Việt Nam.

20. cookingVideoUrl: PHẢI là link YouTube THỰC SỰ HOẠT ĐỘNG về hướng dẫn nấu món ăn, phù hợp chính xác với tên món ăn.
Tìm kiếm video YouTube bằng query như: "cách nấu [tên món chính xác]" cho video tiếng Việt, hoặc "how to make [tên món tiếng Anh]" cho video quốc tế. TIÊU ĐỀ VIDEO PHẢI CHỨA TÊN MÓN HOẶC MÔ TẢ LIÊN QUAN TRỰC TIẾP.
Sử dụng format: https://www.youtube.com/watch?v=VIDEO_ID hoặc https://youtu.be/VIDEO_ID
Video phải là video HƯỚNG DẪN NẤU ĂN/RECIPE thực sự (ví dụ: tutorial nấu ăn, recipe video), không phải video ăn uống, review, nhạc, vlog, quảng cáo, hoặc không liên quan.
Ưu tiên video tiếng Việt nếu món là Việt Nam, và tiêu đề khớp tên món (ví dụ: "Cách Làm Phở Gà Thanh Đạm Ngon Tại Nhà").
Nếu không tìm được video đúng tên món, chọn video món tương tự (cùng loại, ví dụ: nếu "Phở Gà" thì video "Cách Nấu Phở Gà" thay vì "Phở Bò").
Nếu vẫn không tìm được video nấu ăn phù hợp, để trống (empty string "") và giải thích lý do.
KHÔNG được tạo video ID giả. PHẢI sử dụng video ID thực từ YouTube, xác nhận bằng công cụ web search hoặc x_search để tìm video phù hợp.
Ví dụ video hợp lệ:
https://www.youtube.com/watch?v=EXAMPLE_ID (Cách Nấu Phở Gà Thanh Đạm - Tiêu đề phải khớp)
https://youtu.be/ybF0RQdDAK8 (Khoai Lang Luộc - Nếu video hướng dẫn luộc khoai lang)
https://www.youtube.com/watch?v=w34Qnc-9KBU (Gỏi Cuốn Tôm Thịt - Video recipe gỏi cuốn)

TRẢ VỀ CHỈ JSON, KHÔNG CÓ TEXT KHÁC.`;

        // Gọi Gemini với JSON mode
        let result;
        let response;
        let jsonText;

        try {
            result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 32768, // Tăng lên 32768 để xử lý weekly plan (7 ngày x 6 bữa)
                    responseMimeType: 'application/json'
                }
            });

            response = await result.response;
            jsonText = response.text();

            if (!jsonText || jsonText.trim().length === 0) {
                throw new Error('Gemini trả về response rỗng');
            }
        } catch (geminiError) {
            console.error('Error calling Gemini API:', geminiError);
            console.error('Error details:', {
                name: geminiError.name,
                message: geminiError.message,
                code: geminiError.code,
                stack: geminiError.stack
            });
            throw new Error('Lỗi khi gọi Gemini API: ' + (geminiError.message || 'Không xác định'));
        }

        // Parse JSON response
        let planData;
        try {
            // Loại bỏ markdown code blocks nếu có
            let cleanedJson = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

            planData = JSON.parse(cleanedJson);
        } catch (parseError) {
            console.error('Error parsing Gemini JSON response:', parseError);
            console.error('Parse error details:', {
                message: parseError.message,
                name: parseError.name
            });
            console.error('Raw response length:', jsonText.length);
            console.error('Raw response (first 500 chars):', jsonText.substring(0, 500));
            console.error('Raw response (last 1000 chars):', jsonText.substring(Math.max(0, jsonText.length - 1000)));

            // Extract error position from error message
            let errorPosition = null;
            const positionMatch = parseError.message.match(/position (\d+)/);
            if (positionMatch) {
                errorPosition = parseInt(positionMatch[1]);
                console.log(`Error at position: ${errorPosition}`);
            }

            // Thử fix JSON bị cắt
            try {
                let fixedJson = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

                // Nếu có error position, cắt đến vị trí đó và thử fix
                if (errorPosition && errorPosition < fixedJson.length) {
                    // Tìm vị trí hợp lệ gần nhất trước error position
                    let cutPosition = errorPosition;

                    // Tìm dấu phẩy hoặc dấu đóng ngoặc gần nhất trước error
                    for (let i = errorPosition - 1; i >= Math.max(0, errorPosition - 100); i--) {
                        if (fixedJson[i] === ',' || fixedJson[i] === '}' || fixedJson[i] === ']') {
                            cutPosition = i + 1;
                            break;
                        }
                    }

                    // Cắt JSON đến vị trí hợp lệ
                    fixedJson = fixedJson.substring(0, cutPosition);

                    // Đóng các dấu ngoặc còn thiếu
                    const openBraces = (fixedJson.match(/\{/g) || []).length;
                    const closeBraces = (fixedJson.match(/\}/g) || []).length;
                    const openBrackets = (fixedJson.match(/\[/g) || []).length;
                    const closeBrackets = (fixedJson.match(/\]/g) || []).length;

                    // Đóng các dấu ngoặc còn thiếu theo thứ tự đúng
                    let closingChars = '';
                    for (let i = 0; i < openBrackets - closeBrackets; i++) {
                        closingChars += ']';
                    }
                    for (let i = 0; i < openBraces - closeBraces; i++) {
                        closingChars += '}';
                    }

                    fixedJson += closingChars;
                    console.log(`Đã cắt JSON tại vị trí ${cutPosition} và đóng ${closingChars.length} dấu ngoặc`);
                } else {
                    // Nếu không có error position, thử fix bằng cách đóng tất cả dấu ngoặc
                    const openBraces = (fixedJson.match(/\{/g) || []).length;
                    const closeBraces = (fixedJson.match(/\}/g) || []).length;
                    const openBrackets = (fixedJson.match(/\[/g) || []).length;
                    const closeBrackets = (fixedJson.match(/\]/g) || []).length;

                    // Tìm vị trí cắt hợp lệ (tìm dấu đóng ngoặc cuối cùng)
                    const lastBrace = fixedJson.lastIndexOf('}');
                    const lastBracket = fixedJson.lastIndexOf(']');
                    const lastValidChar = Math.max(lastBrace, lastBracket);

                    if (lastValidChar > fixedJson.length / 2) {
                        fixedJson = fixedJson.substring(0, lastValidChar + 1);

                        // Đóng các dấu ngoặc còn thiếu
                        let closingChars = '';
                        for (let i = 0; i < openBrackets - closeBrackets; i++) {
                            closingChars += ']';
                        }
                        for (let i = 0; i < openBraces - closeBraces; i++) {
                            closingChars += '}';
                        }

                        fixedJson += closingChars;
                        console.log(`Đã cắt JSON tại vị trí ${lastValidChar} và đóng ${closingChars.length} dấu ngoặc`);
                    }
                }

                // Thử parse lại
                planData = JSON.parse(fixedJson);
                console.log('✅ Đã parse thành công sau khi fix JSON bị cắt');

                // Validate structure
                if (!planData.days || !Array.isArray(planData.days)) {
                    throw new Error('JSON đã fix nhưng thiếu days array');
                }

                // Nếu là weekly plan và bị cắt, có thể một số ngày bị thiếu
                if (planData.planType === 'weekly' && planData.days.length < 7) {
                    console.warn(`⚠️ Weekly plan chỉ có ${planData.days.length}/7 ngày. Có thể response bị cắt.`);
                }

            } catch (recoveryError) {
                console.error('❌ Không thể recover JSON:', recoveryError);
                console.error('Recovery error:', recoveryError.message);

                // Log thêm thông tin để debug
                if (errorPosition) {
                    const contextStart = Math.max(0, errorPosition - 100);
                    const contextEnd = Math.min(jsonText.length, errorPosition + 100);
                    console.error('Context around error:', jsonText.substring(contextStart, contextEnd));
                }

                throw new Error('Không thể parse response từ Gemini. Response có vẻ bị cắt. Length: ' + jsonText.length + '. Error: ' + parseError.message);
            }
        }

        // Validate và normalize data
        if (!planData) {
            throw new Error('Response từ Gemini là null hoặc undefined');
        }

        if (!planData.days || !Array.isArray(planData.days)) {
            console.error('Invalid planData structure:', JSON.stringify(planData, null, 2));
            throw new Error('Response không đúng format: thiếu days array. PlanData: ' + JSON.stringify(planData).substring(0, 200));
        }

        if (planData.days.length === 0) {
            throw new Error('Response không có ngày nào trong plan');
        }

        // Normalize dates nếu chưa có hoặc không hợp lệ
        // For daily plans, use the target date from request
        planData.days = planData.days.map((day, index) => {
            if (!day.date) {
                // Use target date from request for daily plans
                if (period === 'daily') {
                    day.date = targetDate.toISOString().split('T')[0];
                } else {
                    // For weekly, calculate from target date
                    const date = new Date(targetDate);
                    date.setDate(date.getDate() + index);
                    day.date = date.toISOString().split('T')[0];
                }
            } else {
                // Validate date format
                const testDate = new Date(day.date);
                if (isNaN(testDate.getTime())) {
                    // Invalid date, use target date + index
                    if (period === 'daily') {
                        day.date = targetDate.toISOString().split('T')[0];
                    } else {
                        const date = new Date(targetDate);
                        date.setDate(date.getDate() + index);
                        day.date = date.toISOString().split('T')[0];
                    }
                } else {
                    // Ensure format is YYYY-MM-DD
                    const date = new Date(day.date);
                    day.date = date.toISOString().split('T')[0];
                }
            }
            return day;
        });

        // Validate và normalize meals
        planData.days.forEach(day => {
            if (!day.meals || !Array.isArray(day.meals)) {
                day.meals = [];
            }

            day.meals = day.meals.map((meal, idx) => {
                // Normalize ingredients - ensure array format with name field
                let normalizedIngredients = [];
                if (meal.ingredients) {
                    if (Array.isArray(meal.ingredients)) {
                        normalizedIngredients = meal.ingredients
                            .filter(ing => ing !== null && ing !== undefined)
                            .map(ing => {
                                if (typeof ing === 'string') {
                                    return { name: ing };
                                }
                                if (typeof ing === 'object' && ing.name) {
                                    return {
                                        name: String(ing.name),
                                        amount: ing.amount ? Number(ing.amount) : undefined,
                                        unit: ing.unit ? String(ing.unit) : undefined,
                                        notes: ing.notes ? String(ing.notes) : undefined
                                    };
                                }
                                return null;
                            })
                            .filter(ing => ing !== null);
                    }
                }

                // Normalize instructions - ensure array of strings
                let normalizedInstructions = [];
                if (meal.instructions) {
                    if (Array.isArray(meal.instructions)) {
                        normalizedInstructions = meal.instructions
                            .filter(inst => inst !== null && inst !== undefined)
                            .map(inst => String(inst).trim())
                            .filter(inst => inst.length > 0);
                    } else if (typeof meal.instructions === 'string') {
                        normalizedInstructions = meal.instructions
                            .split(/[\n\.]/)
                            .map(inst => inst.trim())
                            .filter(inst => inst.length > 0);
                    }
                }

                // Đảm bảo tất cả fields cần thiết có giá trị (đầy đủ như seed data)
                return {
                    id: meal.id || `meal-${day.date}-${idx}`,
                    name: meal.name || 'Món ăn',
                    description: meal.description || '',
                    mealType: meal.mealType || 'Bữa trưa',
                    difficulty: meal.difficulty || 'Trung bình',
                    cookingTimeMinutes: meal.cookingTimeMinutes || 15,
                    healthScore: meal.healthScore || 80,
                    stepCount: meal.stepCount || 4,
                    caloriesKcal: meal.caloriesKcal || 400,
                    carbsGrams: meal.carbsGrams || 40,
                    proteinGrams: meal.proteinGrams || 30,
                    fatGrams: meal.fatGrams || 12,
                    fiberGrams: meal.fiberGrams || 0,
                    sugarGrams: meal.sugarGrams || 0,
                    sodiumMg: meal.sodiumMg || 0,
                    rating: meal.rating || 4.8,
                    ratingCount: meal.ratingCount || 100,
                    tags: Array.isArray(meal.tags) ? meal.tags : [],
                    cuisineType: meal.cuisineType || 'Vietnamese',
                    dietaryRestrictions: Array.isArray(meal.dietaryRestrictions) ? meal.dietaryRestrictions : [],
                    allergens: Array.isArray(meal.allergens) ? meal.allergens : [],
                    ingredients: normalizedIngredients,
                    instructions: normalizedInstructions,
                    cookingVideoUrl: meal.cookingVideoUrl || '',
                    isFeatured: meal.isFeatured || false,
                    isPopular: meal.isPopular || false,
                    isRecommended: meal.isRecommended || false
                };
            });
        });

        return {
            success: true,
            plan: planData,
            generatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error generating nutrition plan:', error);
        throw error;
    }
};

module.exports = {
    processChatMessage,
    processQuery,
    search,
    getUserContext,
    generateNutritionPlan
};
