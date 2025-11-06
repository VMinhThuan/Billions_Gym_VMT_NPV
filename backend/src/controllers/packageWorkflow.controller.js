const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const GoiTap = require('../models/GoiTap');
const { NguoiDung, PT } = require('../models/NguoiDung');
const LichTap = require('../models/LichTap');
const BuoiTap = require('../models/BuoiTap');
const LichLamViecPT = require('../models/LichLamViecPT');
const ChiNhanh = require('../models/ChiNhanh');
const mongoose = require('mongoose');

// Lấy danh sách PT phù hợp sau khi đăng ký gói tập thành công
const getAvailableTrainers = async (req, res) => {
    try {
        console.log('🔍 getAvailableTrainers called with:', req.params, req.body);
        const { chiTietGoiTapId } = req.params;
        const { gioTapUuTien, soNgayTapTrongTuan = 3 } = req.body;

        // Validate ID
        if (!mongoose.Types.ObjectId.isValid(chiTietGoiTapId)) {
            return res.status(400).json({ message: 'ID đăng ký gói tập không hợp lệ' });
        }

        // Kiểm tra chi tiết gói tập
        console.log('🔍 Finding ChiTietGoiTap with ID:', chiTietGoiTapId);
        const chiTietGoiTap = await ChiTietGoiTap.findById(chiTietGoiTapId)
            .populate('maGoiTap')
            .populate('maHoiVien')
            .populate('branchId');

        console.log('🔍 ChiTietGoiTap found:', chiTietGoiTap);

        if (!chiTietGoiTap) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin đăng ký gói tập' });
        }

        if (chiTietGoiTap.trangThaiThanhToan !== 'DA_THANH_TOAN') {
            return res.status(400).json({ message: 'Gói tập chưa được thanh toán' });
        }

        // Lấy tất cả PT đang hoạt động theo chi nhánh đã chọn
        console.log('🔍 PT model:', typeof PT, PT);
        let allPTs = await PT.find({ trangThaiPT: 'DANG_HOAT_DONG', chinhanh: chiTietGoiTap.branchId });
        console.log('🔍 Found PTs via discriminator:', allPTs.length);

        // Fallback: nếu dữ liệu cũ không dùng discriminator, tìm theo vaiTro từ collection NguoiDung
        if (!allPTs || allPTs.length === 0) {
            console.log('🔍 No PT found via discriminator. Falling back to NguoiDung.find({ vaiTro: "PT" })');
            allPTs = await NguoiDung.find({ vaiTro: 'PT', chinhanh: chiTietGoiTap.branchId });
            console.log('🔍 Found PTs via base model:', allPTs.length);
        }

        // Nếu có giờ tập ưu tiên, lọc PT có thời gian rảnh phù hợp
        let availablePTs = allPTs;

        if (gioTapUuTien && gioTapUuTien.length > 0) {
            const ptAvailability = await Promise.all(
                allPTs.map(async (pt) => {
                    const lichLamViec = await LichLamViecPT.find({ pt: pt._id });

                    // Kiểm tra xem PT có thời gian rảnh trong khung giờ ưu tiên không
                    const hasAvailableTime = lichLamViec.some(lich =>
                        lich.gioLamViec.some(gio =>
                            gio.trangThai === 'RANH' &&
                            gioTapUuTien.some(gioUuTien => {
                                const [gioStart, gioEnd] = gioUuTien.split('-');
                                return gio.gioBatDau <= gioStart && gio.gioKetThuc >= gioEnd;
                            })
                        )
                    );

                    return hasAvailableTime ? pt : null;
                })
            );

            availablePTs = ptAvailability.filter(pt => pt !== null);
        }

        // Sắp xếp PT theo đánh giá và kinh nghiệm
        availablePTs.sort((a, b) => {
            if (b.danhGia !== a.danhGia) {
                return (b.danhGia || 0) - (a.danhGia || 0);
            }
            return (b.kinhNghiem || 0) - (a.kinhNghiem || 0);
        });

        // Cập nhật thông tin ưu tiên của khách hàng
        await ChiTietGoiTap.findByIdAndUpdate(chiTietGoiTapId, {
            gioTapUuTien,
            soNgayTapTrongTuan
        });

        res.json({
            success: true,
            data: {
                availablePTs,
                chiTietGoiTap,
                recommendedPT: availablePTs[0] || null
            }
        });

    } catch (error) {
        console.error('Error getting available trainers:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách PT' });
    }
};

// Chọn PT cho gói tập
const selectTrainer = async (req, res) => {
    try {
        const { chiTietGoiTapId } = req.params;
        const { ptId, gioTapUuTien, soNgayTapTrongTuan } = req.body;

        // Kiểm tra chi tiết gói tập
        const chiTietGoiTap = await ChiTietGoiTap.findById(chiTietGoiTapId);
        if (!chiTietGoiTap) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin đăng ký gói tập' });
        }

        // Kiểm tra PT
        const pt = await PT.findOne({ _id: ptId, trangThaiPT: 'DANG_HOAT_DONG' });
        if (!pt) {
            return res.status(404).json({ message: 'PT không tồn tại hoặc không hoạt động' });
        }

        // Cập nhật thông tin chọn PT
        const updatedChiTiet = await ChiTietGoiTap.findByIdAndUpdate(
            chiTietGoiTapId,
            {
                ptDuocChon: ptId,
                ngayChonPT: new Date(),
                trangThaiDangKy: 'DA_CHON_PT',
                gioTapUuTien,
                soNgayTapTrongTuan
            },
            { new: true }
        ).populate('ptDuocChon').populate('maGoiTap');

        res.json({
            success: true,
            message: 'Đã chọn PT thành công',
            data: updatedChiTiet
        });

    } catch (error) {
        console.error('Error selecting trainer:', error);
        res.status(500).json({ message: 'Lỗi server khi chọn PT' });
    }
};

// Kiểm tra lịch tập có tồn tại không
const checkScheduleExists = async (req, res) => {
    try {
        const { registrationId } = req.params;

        // Kiểm tra trong LichTap collection
        const schedule = await LichTap.findOne({
            chiTietGoiTap: registrationId
        });

        // Kiểm tra trong ChiTietGoiTap
        const registration = await ChiTietGoiTap.findById(registrationId);

        return res.json({
            success: true,
            data: {
                exists: schedule !== null,
                hasSchedule: registration?.lichTapDuocTao === true,
                status: registration?.trangThaiDangKy
            }
        });
    } catch (error) {
        console.error('Error checking schedule existence:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể kiểm tra lịch tập'
        });
    }
};

// Tạo lịch tập dựa trên gói tập và PT đã chọn
const generateWorkoutSchedule = async (req, res) => {
    try {
        const { chiTietGoiTapId } = req.params;
        const { cacNgayTap, khungGioTap, selectedSessions } = req.body;

        console.log('📥 Received request body:', {
            cacNgayTap,
            khungGioTap,
            selectedSessions: selectedSessions?.length || 0
        });

        // Kiểm tra xem lịch tập đã tồn tại chưa
        const existingSchedule = await LichTap.findOne({
            chiTietGoiTap: chiTietGoiTapId
        });

        if (existingSchedule) {
            return res.json({
                success: true,
                message: 'Lịch tập đã được tạo trước đó',
                data: existingSchedule
            });
        }

        // Lấy thông tin chi tiết gói tập (hỗ trợ cả field mới và legacy)
        const chiTietGoiTap = await ChiTietGoiTap.findById(chiTietGoiTapId)
            .populate('goiTapId')
            .populate('maGoiTap') // Legacy
            .populate('ptDuocChon')
            .populate('nguoiDungId')
            .populate('maHoiVien'); // Legacy

        if (!chiTietGoiTap || !['DA_CHON_PT', 'DA_TAO_LICH'].includes(chiTietGoiTap.trangThaiDangKy)) {
            return res.status(400).json({ message: 'Chưa chọn PT hoặc trạng thái không hợp lệ' });
        }

        const goiTap = chiTietGoiTap.goiTapId || chiTietGoiTap.maGoiTap;

        // Kiểm tra xem goiTap có tồn tại không
        if (!goiTap) {
            console.error('❌ GoiTap not found for chiTietGoiTap:', chiTietGoiTapId);
            return res.status(400).json({ message: 'Không tìm thấy thông tin gói tập' });
        }

        // Kiểm tra các field bắt buộc (hỗ trợ cả field mới và legacy)
        const hoiVienId = chiTietGoiTap.nguoiDungId || chiTietGoiTap.maHoiVien;
        if (!hoiVienId) {
            console.error('❌ hoiVienId not found in chiTietGoiTap:', chiTietGoiTap);
            return res.status(400).json({ message: 'Không tìm thấy thông tin hội viên' });
        }

        if (!chiTietGoiTap.ptDuocChon) {
            console.error('❌ ptDuocChon not found in chiTietGoiTap:', chiTietGoiTap);
            return res.status(400).json({ message: 'Không tìm thấy thông tin PT được chọn' });
        }

        const branchId = chiTietGoiTap.branchId;
        if (!branchId) {
            console.error('❌ branchId not found in chiTietGoiTap:', chiTietGoiTap);
            return res.status(400).json({ message: 'Không tìm thấy thông tin chi nhánh' });
        }

        console.log('🔍 GoiTap info:', {
            tenGoiTap: goiTap.tenGoiTap,
            thoiHan: goiTap.thoiHan,
            donViThoiHan: goiTap.donViThoiHan
        });

        // Tính toán ngày bắt đầu và kết thúc dựa trên gói tập
        const ngayBatDau = new Date();
        // Tính ngày kết thúc dựa trên thời hạn gói tập
        const ngayKetThuc = new Date(ngayBatDau);

        // Tính toán dựa trên đơn vị thời hạn
        if (goiTap.donViThoiHan === 'Tháng') {
            ngayKetThuc.setMonth(ngayKetThuc.getMonth() + goiTap.thoiHan);
        } else if (goiTap.donViThoiHan === 'Ngày') {
            ngayKetThuc.setDate(ngayKetThuc.getDate() + goiTap.thoiHan);
        } else if (goiTap.donViThoiHan === 'Năm') {
            ngayKetThuc.setFullYear(ngayKetThuc.getFullYear() + goiTap.thoiHan);
        } else if (goiTap.donViThoiHan === 'Ngay') {
            // Xử lý trường hợp 'Ngay' thay vì 'Ngày'
            ngayKetThuc.setDate(ngayKetThuc.getDate() + goiTap.thoiHan);
        }

        console.log('🔍 Date calculation:', {
            ngayBatDau: ngayBatDau.toISOString(),
            ngayKetThuc: ngayKetThuc.toISOString(),
            thoiHan: goiTap.thoiHan,
            donViThoiHan: goiTap.donViThoiHan
        });

        // Tạo lịch tập với dữ liệu từ frontend (hỗ trợ cả field mới và legacy)
        const lichTap = new LichTap({
            hoiVien: hoiVienId._id || hoiVienId, // Hỗ trợ cả object và id
            pt: chiTietGoiTap.ptDuocChon._id || chiTietGoiTap.ptDuocChon,
            ngayBatDau,
            ngayKetThuc,
            chiTietGoiTap: chiTietGoiTapId,
            soNgayTapTrongTuan: chiTietGoiTap.soNgayTapTrongTuan,
            cacNgayTap: cacNgayTap || [],
            khungGioTap: khungGioTap || [],
            trangThaiLich: 'DANG_HOAT_DONG',
            goiTap: goiTap._id || goiTap,
            chiNhanh: branchId,
            tuanBatDau: ngayBatDau,
            tuanKetThuc: ngayKetThuc,
            gioTapUuTien: chiTietGoiTap.gioTapUuTien || [],
            danhSachBuoiTap: [],
            trangThai: 'DANG_HOAT_DONG'
        });

        await lichTap.save();

        // Tạo các buổi tập từ sessions đã chọn
        const buoiTapList = selectedSessions && selectedSessions.length > 0
            ? await createWorkoutSessionsFromSelected(lichTap, selectedSessions)
            : await createWorkoutSessionsFromFrontend(lichTap, khungGioTap);

        console.log('🔍 Generated buoiTapList:', buoiTapList.length);
        console.log('🔍 lichTap.cacBuoiTap after generation:', lichTap.cacBuoiTap);

        // Cập nhật chi tiết gói tập
        await ChiTietGoiTap.findByIdAndUpdate(chiTietGoiTapId, {
            lichTapDuocTao: lichTap._id,
            trangThaiDangKy: 'DA_TAO_LICH'
        });

        res.json({
            success: true,
            message: 'Đã tạo lịch tập thành công',
            data: {
                lichTap,
                soLuongBuoiTap: buoiTapList.length
            }
        });

    } catch (error) {
        console.error('❌ Error generating workout schedule:', error);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            code: error.code
        });
        res.status(500).json({
            message: 'Lỗi server khi tạo lịch tập',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Hàm tạo các buổi tập từ sessions đã được chọn (có sẵn _id)
const createWorkoutSessionsFromSelected = async (lichTap, selectedSessions) => {
    try {
        console.log('🔍 createWorkoutSessionsFromSelected called with:', {
            lichTapId: lichTap._id,
            selectedSessionsCount: selectedSessions?.length || 0
        });

        const buoiTapList = [];
        const danhSachBuoiTap = [];

        if (!selectedSessions || selectedSessions.length === 0) {
            console.log('⚠️ No selectedSessions provided, returning empty list');
            return buoiTapList;
        }

        // Lấy các sessions từ database (chúng đã tồn tại)
        for (const session of selectedSessions) {
            try {
                const existingBuoiTap = await BuoiTap.findById(session._id);

                if (!existingBuoiTap) {
                    console.log('⚠️ BuoiTap not found:', session._id);
                    continue;
                }

                // Đăng ký hội viên vào buổi tập
                const existingRegistration = existingBuoiTap.danhSachHoiVien?.find(
                    hoiVien => hoiVien.hoiVien?.toString() === lichTap.hoiVien.toString()
                );

                if (!existingRegistration) {
                    existingBuoiTap.danhSachHoiVien = existingBuoiTap.danhSachHoiVien || [];
                    existingBuoiTap.danhSachHoiVien.push({
                        hoiVien: lichTap.hoiVien,
                        ngayDangKy: new Date(),
                        trangThai: 'DA_DANG_KY'
                    });
                    existingBuoiTap.soLuongHienTai = (existingBuoiTap.soLuongHienTai || 0) + 1;

                    await existingBuoiTap.save();
                }

                buoiTapList.push(existingBuoiTap);

                // Thêm vào danh sách buổi tập của lịch
                danhSachBuoiTap.push({
                    buoiTap: existingBuoiTap._id,
                    ngayTap: existingBuoiTap.ngayTap,
                    gioBatDau: existingBuoiTap.gioBatDau,
                    gioKetThuc: existingBuoiTap.gioKetThuc,
                    ptPhuTrach: existingBuoiTap.ptPhuTrach || lichTap.pt,
                    trangThai: 'DA_DANG_KY',
                    ngayDangKy: new Date()
                });

                console.log('✅ Registered for buoiTap:', {
                    _id: existingBuoiTap._id,
                    tenBuoiTap: existingBuoiTap.tenBuoiTap,
                    ngayTap: existingBuoiTap.ngayTap,
                    gioBatDau: existingBuoiTap.gioBatDau,
                    gioKetThuc: existingBuoiTap.gioKetThuc
                });

            } catch (error) {
                console.error('❌ Error processing session:', error);
            }
        }

        // Cập nhật lịch tập với danh sách buổi tập
        lichTap.cacBuoiTap = buoiTapList.map(buoi => buoi._id);
        lichTap.danhSachBuoiTap = danhSachBuoiTap;
        await lichTap.save();

        console.log('✅ Registered for total buoiTap:', buoiTapList.length);
        return buoiTapList;

    } catch (error) {
        console.error('❌ Error in createWorkoutSessionsFromSelected:', error);
        throw error;
    }
};

// Hàm tạo các buổi tập từ dữ liệu frontend
const createWorkoutSessionsFromFrontend = async (lichTap, khungGioTap) => {
    try {
        console.log('🔍 createWorkoutSessionsFromFrontend called with:', {
            lichTapId: lichTap._id,
            khungGioTap: khungGioTap
        });

        const buoiTapList = [];
        const danhSachBuoiTap = [];

        if (!khungGioTap || khungGioTap.length === 0) {
            console.log('⚠️ No khungGioTap provided, returning empty list');
            return buoiTapList;
        }

        // Tạo buổi tập từ mỗi khung giờ được chọn
        for (const khungGio of khungGioTap) {
            try {
                // Tính ngày tập dựa trên ngày trong tuần
                const ngayTap = calculateWorkoutDate(lichTap.ngayBatDau, khungGio.ngayTrongTuan);

                const buoiTap = new BuoiTap({
                    tenBuoiTap: `Buổi tập ${khungGio.ngayTrongTuan}`,
                    chiNhanh: lichTap.chiNhanh,
                    ptPhuTrach: lichTap.pt,
                    ngayTap: ngayTap,
                    gioBatDau: khungGio.gioBatDau,
                    gioKetThuc: khungGio.gioKetThuc,
                    soLuongToiDa: 10,
                    soLuongHienTai: 1, // Hội viên đã đăng ký
                    trangThai: 'CHUAN_BI',
                    danhSachHoiVien: [{
                        hoiVien: lichTap.hoiVien,
                        ngayDangKy: new Date(),
                        trangThai: 'DA_DANG_KY'
                    }],
                    moTa: `Buổi tập được tạo từ lịch tập ${lichTap._id}`
                });

                await buoiTap.save();
                buoiTapList.push(buoiTap);

                // Thêm vào danh sách buổi tập của lịch
                danhSachBuoiTap.push({
                    buoiTap: buoiTap._id,
                    ngayTap: ngayTap,
                    gioBatDau: khungGio.gioBatDau,
                    gioKetThuc: khungGio.gioKetThuc,
                    ptPhuTrach: lichTap.pt,
                    trangThai: 'DA_DANG_KY',
                    ngayDangKy: new Date()
                });

                console.log('✅ Created buoiTap:', {
                    _id: buoiTap._id,
                    tenBuoiTap: buoiTap.tenBuoiTap,
                    ngayTap: buoiTap.ngayTap,
                    gioBatDau: buoiTap.gioBatDau,
                    gioKetThuc: buoiTap.gioKetThuc
                });

            } catch (error) {
                console.error('❌ Error creating individual buoiTap:', error);
            }
        }

        // Cập nhật lịch tập với danh sách buổi tập
        lichTap.cacBuoiTap = buoiTapList.map(buoi => buoi._id);
        lichTap.danhSachBuoiTap = danhSachBuoiTap;
        await lichTap.save();

        console.log('✅ Created total buoiTap:', buoiTapList.length);
        return buoiTapList;

    } catch (error) {
        console.error('❌ Error in createWorkoutSessionsFromFrontend:', error);
        throw error;
    }
};

// Hàm tính ngày tập dựa trên ngày trong tuần
const calculateWorkoutDate = (startDate, dayOfWeek) => {
    const start = new Date(startDate);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const vietnameseDays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    // Tìm index của ngày trong tuần
    let targetDayIndex = -1;

    // Thử tìm bằng tên tiếng Anh
    targetDayIndex = dayNames.findIndex(day => day.toLowerCase() === dayOfWeek.toLowerCase());

    // Nếu không tìm thấy, thử tìm bằng tên tiếng Việt
    if (targetDayIndex === -1) {
        targetDayIndex = vietnameseDays.findIndex(day => day.toLowerCase() === dayOfWeek.toLowerCase());
    }

    // Nếu vẫn không tìm thấy, sử dụng ngày hiện tại
    if (targetDayIndex === -1) {
        console.log('⚠️ Could not find day of week:', dayOfWeek);
        return start;
    }

    // Tính ngày tập
    const currentDay = start.getDay();
    const daysUntilTarget = (targetDayIndex - currentDay + 7) % 7;
    const workoutDate = new Date(start);
    workoutDate.setDate(start.getDate() + daysUntilTarget);

    return workoutDate;
};

// Hàm phụ trợ tạo các buổi tập (legacy - giữ lại để tương thích)
const generateWorkoutSessions = async (lichTap, goiTap) => {
    try {
        console.log('🔍 generateWorkoutSessions called with:', {
            lichTapId: lichTap._id,
            ngayBatDau: lichTap.ngayBatDau,
            ngayKetThuc: lichTap.ngayKetThuc,
            soNgayTapTrongTuan: lichTap.soNgayTapTrongTuan,
            cacNgayTap: lichTap.cacNgayTap,
            khungGioTap: lichTap.khungGioTap
        });

        const buoiTapList = [];
        const ngayBatDau = new Date(lichTap.ngayBatDau);
        const ngayKetThuc = new Date(lichTap.ngayKetThuc);

        // Tính tổng số ngày trong gói tập
        const totalDays = Math.ceil((ngayKetThuc - ngayBatDau) / (1000 * 60 * 60 * 24));

        // Tính số buổi tập dựa trên thời hạn gói và số ngày tập trong tuần
        const soTuanTap = Math.ceil(totalDays / 7);
        const soBuoiTapToiDa = soTuanTap * lichTap.soNgayTapTrongTuan;

        console.log('🔍 Schedule calculation:', {
            totalDays,
            soTuanTap,
            soBuoiTapToiDa
        });

        let currentDate = new Date(ngayBatDau);
        let buoiTapCount = 0;

        while (currentDate <= ngayKetThuc && buoiTapCount < soBuoiTapToiDa) {
            const dayOfWeek = getDayOfWeek(currentDate);

            console.log('🔍 Processing date:', {
                currentDate: currentDate.toISOString(),
                dayOfWeek,
                isInSchedule: lichTap.cacNgayTap.includes(dayOfWeek)
            });

            // Kiểm tra xem ngày này có trong lịch tập không
            if (lichTap.cacNgayTap.includes(dayOfWeek)) {
                // Tìm khung giờ tương ứng
                const khungGio = lichTap.khungGioTap.find(kg => kg.ngayTrongTuan === dayOfWeek);

                console.log('🔍 Found time slot:', khungGio);

                if (khungGio) {
                    const buoiTap = new BuoiTap({
                        tenBuoiTap: `Buổi tập ${dayOfWeek}`,
                        chiNhanh: lichTap.chiNhanh || lichTap.branchId,
                        ptPhuTrach: lichTap.pt,
                        ngayTap: new Date(currentDate),
                        gioBatDau: khungGio.gioBatDau,
                        gioKetThuc: khungGio.gioKetThuc,
                        soLuongToiDa: 10,
                        soLuongHienTai: 0,
                        trangThai: 'CHUAN_BI',
                        danhSachHoiVien: [{
                            hoiVien: lichTap.hoiVien,
                            ngayDangKy: new Date(),
                            trangThai: 'DA_DANG_KY'
                        }],
                        moTa: `Buổi tập được tạo tự động cho lịch tập ${lichTap._id}`
                    });

                    await buoiTap.save();
                    buoiTapList.push(buoiTap);
                    buoiTapCount++;

                    console.log('🔍 Created buoiTap:', {
                        ngayTap: buoiTap.ngayTap,
                        gioBatDau: buoiTap.gioBatDau,
                        gioKetThuc: buoiTap.gioKetThuc,
                        tenBuoiTap: buoiTap.tenBuoiTap
                    });
                }
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Cập nhật danh sách buổi tập vào lịch tập
        lichTap.cacBuoiTap = buoiTapList.map(bt => bt._id);
        await lichTap.save();

        console.log('🔍 generateWorkoutSessions result:', {
            totalSessions: buoiTapList.length,
            sessionDates: buoiTapList.map(bt => ({
                ngayTap: bt.ngayTap,
                gioBatDau: bt.gioBatDau,
                gioKetThuc: bt.gioKetThuc,
                tenBuoiTap: bt.tenBuoiTap
            }))
        });

        return buoiTapList;
    } catch (error) {
        console.error('Error generating workout sessions:', error);
        throw error;
    }
};

// Hàm phụ trợ lấy tên ngày trong tuần
const getDayOfWeek = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
};

// Lấy lịch tập của hội viên
const getMemberWorkoutSchedule = async (req, res) => {
    try {
        const { hoiVienId } = req.params;

        const lichTapList = await LichTap.find({ hoiVien: hoiVienId })
            .populate('pt', 'hoTen danhGia chuyenMon')
            .populate('chiTietGoiTap')
            .populate({
                path: 'cacBuoiTap',
                populate: {
                    path: 'cacBaiTap.baiTap',
                    select: 'tenBaiTap moTa nhomCo'
                }
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: lichTapList
        });

    } catch (error) {
        console.error('Error getting member workout schedule:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy lịch tập' });
    }
};

// Cập nhật lịch làm việc của PT
const updateTrainerSchedule = async (req, res) => {
    try {
        const { ptId } = req.params;
        const { lichLamViec } = req.body; // Array of schedule objects

        // Xóa lịch làm việc cũ
        await LichLamViecPT.deleteMany({ pt: ptId });

        // Tạo lịch làm việc mới
        const newSchedules = lichLamViec.map(lich => ({
            pt: ptId,
            thu: lich.thu,
            gioLamViec: lich.gioLamViec,
            ghiChu: lich.ghiChu
        }));

        await LichLamViecPT.insertMany(newSchedules);

        res.json({
            success: true,
            message: 'Đã cập nhật lịch làm việc thành công'
        });

    } catch (error) {
        console.error('Error updating trainer schedule:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật lịch làm việc' });
    }
};

// Lấy lịch làm việc của PT với thông tin buổi tập
const getTrainerSchedule = async (req, res) => {
    try {
        const { ptId } = req.params;

        // Kiểm tra ObjectId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(ptId)) {
            return res.status(400).json({
                success: false,
                message: 'ID PT không hợp lệ',
                receivedId: ptId
            });
        }

        // Kiểm tra PT có tồn tại không
        const pt = await PT.findOne({ _id: ptId });
        if (!pt) {
            return res.status(404).json({
                success: false,
                message: 'PT không tồn tại',
                searchedId: ptId
            });
        }

        // Lấy lịch làm việc cơ bản của PT
        const lichLamViec = await LichLamViecPT.find({ pt: ptId }).sort({ thu: 1 });

        // Lấy các buổi tập đã được lên lịch cho PT này
        const lichTapList = await LichTap.find({ pt: ptId })
            .populate('hoiVien', 'hoTen sdt')
            .populate({
                path: 'chiTietGoiTap',
                populate: {
                    path: 'maGoiTap',
                    select: 'tenGoiTap'
                }
            })
            .populate('cacBuoiTap')
            .sort({ createdAt: -1 });

        // Tạo cấu trúc dữ liệu kết hợp
        const scheduleWithSessions = {
            lichLamViec: lichLamViec || [],
            cacBuoiTapDaLenLich: lichTapList ? lichTapList.map(lichTap => ({
                _id: lichTap._id,
                hoiVien: lichTap.hoiVien,
                goiTap: lichTap.chiTietGoiTap?.maGoiTap,
                soLuongBuoiTap: lichTap.soLuongBuoiTap,
                trangThai: lichTap.trangThai,
                cacBuoiTap: lichTap.cacBuoiTap,
                ngayBatDau: lichTap.ngayBatDau,
                ngayKetThuc: lichTap.ngayKetThuc
            })) : []
        };

        res.json({
            success: true,
            data: scheduleWithSessions
        });

    } catch (error) {
        console.error('Error getting trainer schedule:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch làm việc: ' + error.message,
            error: error.stack
        });
    }
};

// Hoàn thành workflow gói tập
const completeWorkflow = async (req, res) => {
    try {
        console.log('🎯 completeWorkflow called with chiTietGoiTapId:', req.params.chiTietGoiTapId);
        const { chiTietGoiTapId } = req.params;

        // Kiểm tra chi tiết gói tập
        const chiTietGoiTap = await ChiTietGoiTap.findById(chiTietGoiTapId);
        console.log('🔍 Found chiTietGoiTap:', chiTietGoiTap);

        if (!chiTietGoiTap) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin đăng ký gói tập'
            });
        }

        // Không cho hoàn tất nếu gói đã bị nâng cấp/tạm dừng
        if (chiTietGoiTap.trangThaiDangKy === 'DA_NANG_CAP' || chiTietGoiTap.trangThaiSuDung === 'DA_NANG_CAP') {
            return res.status(400).json({
                success: false,
                message: 'Gói tập này đã được nâng cấp sang gói mới. Không thể hoàn tất workflow.'
            });
        }

        // Kiểm tra xem đã hoàn thành đủ các bước chưa
        // 1. Đã chọn PT
        if (!chiTietGoiTap.ptDuocChon) {
            console.log('❌ PT chưa được chọn');
            return res.status(400).json({
                success: false,
                message: 'Chưa hoàn thành đủ các bước workflow. Cần hoàn thành: chọn PT, tạo lịch tập, và xem lịch tập'
            });
        }

        // 2. Đã có lịch tập (kiểm tra trong LichTap collection)
        // Hỗ trợ cả field legacy và field mới
        const hoiVienId = chiTietGoiTap.nguoiDungId || chiTietGoiTap.maHoiVien;
        const goiTapId = chiTietGoiTap.goiTapId || chiTietGoiTap.maGoiTap;

        console.log('🔍 Looking for schedule with:', {
            hoiVienId,
            goiTapId,
            ptId: chiTietGoiTap.ptDuocChon,
            chiTietGoiTapId: chiTietGoiTap._id
        });

        // Tìm lịch tập theo nhiều cách (hỗ trợ cả legacy và new)
        let existingSchedule = await LichTap.findOne({
            chiTietGoiTap: chiTietGoiTapId
        });

        // Nếu không tìm thấy, thử tìm theo hoiVien, goiTap, pt
        if (!existingSchedule) {
            existingSchedule = await LichTap.findOne({
                hoiVien: hoiVienId,
                goiTap: goiTapId,
                pt: chiTietGoiTap.ptDuocChon
            });
        }

        // Nếu vẫn không tìm thấy, kiểm tra qua lichTapDuocTao
        if (!existingSchedule && chiTietGoiTap.lichTapDuocTao) {
            existingSchedule = await LichTap.findById(chiTietGoiTap.lichTapDuocTao);
        }

        console.log('🔍 Found existing schedule:', existingSchedule ? existingSchedule._id : 'None');

        if (!existingSchedule) {
            console.log('❌ Lịch tập chưa được tạo');
            console.log('❌ ChiTietGoiTap details:', {
                _id: chiTietGoiTap._id,
                nguoiDungId: chiTietGoiTap.nguoiDungId,
                maHoiVien: chiTietGoiTap.maHoiVien,
                goiTapId: chiTietGoiTap.goiTapId,
                maGoiTap: chiTietGoiTap.maGoiTap,
                ptDuocChon: chiTietGoiTap.ptDuocChon,
                lichTapDuocTao: chiTietGoiTap.lichTapDuocTao
            });
            return res.status(400).json({
                success: false,
                message: 'Chưa hoàn thành đủ các bước workflow. Cần hoàn thành: chọn PT, tạo lịch tập, và xem lịch tập'
            });
        }

        // Cập nhật trạng thái thành hoàn thành
        const updatedChiTiet = await ChiTietGoiTap.findByIdAndUpdate(
            chiTietGoiTapId,
            {
                trangThaiDangKy: 'HOAN_THANH',
                lichTapDuocTao: existingSchedule._id
            },
            { new: true }
        )
            .populate('ptDuocChon')
            .populate('goiTapId')
            .populate('maGoiTap') // Legacy
            .populate('nguoiDungId')
            .populate('maHoiVien') // Legacy
            .populate('branchId')
            .populate('lichTapDuocTao');

        console.log('✅ Workflow completed successfully');

        res.json({
            success: true,
            message: 'Đã hoàn thành workflow gói tập thành công',
            data: updatedChiTiet
        });

    } catch (error) {
        console.error('❌ Error completing workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi hoàn thành workflow: ' + error.message
        });
    }
};

// Lấy trạng thái workflow hiện tại
const getWorkflowStatus = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const userId = req.user.id;

        const registration = await ChiTietGoiTap.findById(registrationId)
            .populate('goiTapId')
            .populate('nguoiDungId')
            .populate('branchId')
            .populate('ptDuocChon')
            .populate('lichTapDuocTao');

        if (!registration) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin đăng ký' });
        }

        // Chặn truy cập nếu gói đã bị nâng cấp/tạm dừng
        if (registration.trangThaiDangKy === 'DA_NANG_CAP' || registration.trangThaiSuDung === 'DA_NANG_CAP') {
            return res.status(403).json({ message: 'Gói này đã được nâng cấp sang gói mới và không thể tiếp tục workflow.' });
        }

        // Kiểm tra quyền truy cập
        const isOwner = registration.nguoiDungId._id.toString() === userId;
        const isPartner = registration.thongTinKhachHang?.partnerInfo?.userId === userId;

        if (!isOwner && !isPartner) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }

        // Xác định các bước đã hoàn thành
        const workflowSteps = {
            selectBranch: {
                completed: !!registration.branchId,
                required: isOwner, // Chỉ người thanh toán mới cần chọn chi nhánh
                data: registration.branchId
            },
            selectTrainer: {
                completed: !!registration.ptDuocChon,
                required: true,
                data: registration.ptDuocChon
            },
            createSchedule: {
                completed: !!registration.lichTapDuocTao,
                required: true,
                data: registration.lichTapDuocTao
            }
        };

        res.json({
            success: true,
            data: {
                registration,
                workflowSteps,
                isOwner,
                isPartner,
                currentStep: getCurrentStep(workflowSteps, isOwner)
            }
        });

    } catch (error) {
        console.error('Error getting workflow status:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Xác định bước hiện tại
const getCurrentStep = (steps, isOwner) => {
    if (isOwner && !steps.selectBranch.completed) return 'selectBranch';
    if (!steps.selectTrainer.completed) return 'selectTrainer';
    if (!steps.createSchedule.completed) return 'createSchedule';
    return 'completed';
};

// Cập nhật chi nhánh
const updateBranch = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { branchId } = req.body;
        const userId = req.user.id;

        const registration = await ChiTietGoiTap.findById(registrationId);

        if (!registration) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin đăng ký' });
        }

        // Chỉ người thanh toán mới được chọn chi nhánh
        if (registration.nguoiDungId.toString() !== userId) {
            return res.status(403).json({ message: 'Chỉ người thanh toán mới được chọn chi nhánh' });
        }

        // Kiểm tra chi nhánh tồn tại
        const branch = await ChiNhanh.findById(branchId);
        if (!branch) {
            return res.status(404).json({ message: 'Không tìm thấy chi nhánh' });
        }

        registration.branchId = branchId;
        await registration.save();

        res.json({
            success: true,
            message: 'Đã cập nhật chi nhánh thành công',
            data: registration
        });

    } catch (error) {
        console.error('Error updating branch:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = {
    getAvailableTrainers,
    selectTrainer,
    generateWorkoutSchedule,
    getMemberWorkoutSchedule,
    updateTrainerSchedule,
    getTrainerSchedule,
    completeWorkflow,
    getWorkflowStatus,
    updateBranch,
    checkScheduleExists
};
