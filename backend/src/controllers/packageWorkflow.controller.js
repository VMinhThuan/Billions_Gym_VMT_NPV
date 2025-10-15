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
            .populate('maHoiVien');

        console.log('🔍 ChiTietGoiTap found:', chiTietGoiTap);

        if (!chiTietGoiTap) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin đăng ký gói tập' });
        }

        if (chiTietGoiTap.trangThaiThanhToan !== 'DA_THANH_TOAN') {
            return res.status(400).json({ message: 'Gói tập chưa được thanh toán' });
        }

        // Lấy tất cả PT đang hoạt động
        console.log('🔍 PT model:', typeof PT, PT);
        let allPTs = await PT.find({ trangThaiPT: 'DANG_HOAT_DONG' });
        console.log('🔍 Found PTs via discriminator:', allPTs.length);

        // Fallback: nếu dữ liệu cũ không dùng discriminator, tìm theo vaiTro từ collection NguoiDung
        if (!allPTs || allPTs.length === 0) {
            console.log('🔍 No PT found via discriminator. Falling back to NguoiDung.find({ vaiTro: "PT" })');
            allPTs = await NguoiDung.find({ vaiTro: 'PT' });
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

// Tạo lịch tập dựa trên gói tập và PT đã chọn
const generateWorkoutSchedule = async (req, res) => {
    try {
        const { chiTietGoiTapId } = req.params;
        const { cacNgayTap, khungGioTap } = req.body;

        // Lấy thông tin chi tiết gói tập
        const chiTietGoiTap = await ChiTietGoiTap.findById(chiTietGoiTapId)
            .populate('maGoiTap')
            .populate('ptDuocChon')
            .populate('maHoiVien');

        if (!chiTietGoiTap || chiTietGoiTap.trangThaiDangKy !== 'DA_CHON_PT') {
            return res.status(400).json({ message: 'Chưa chọn PT hoặc trạng thái không hợp lệ' });
        }

        const goiTap = chiTietGoiTap.maGoiTap;

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
        }

        console.log('🔍 Date calculation:', {
            ngayBatDau: ngayBatDau.toISOString(),
            ngayKetThuc: ngayKetThuc.toISOString(),
            thoiHan: goiTap.thoiHan,
            donViThoiHan: goiTap.donViThoiHan
        });

        // Tạo lịch tập
        const lichTap = new LichTap({
            hoiVien: chiTietGoiTap.maHoiVien._id,
            pt: chiTietGoiTap.ptDuocChon._id,
            ngayBatDau,
            ngayKetThuc,
            chiTietGoiTap: chiTietGoiTapId,
            soNgayTapTrongTuan: chiTietGoiTap.soNgayTapTrongTuan,
            cacNgayTap,
            khungGioTap,
            trangThaiLich: 'DANG_HOAT_DONG'
        });

        await lichTap.save();

        // Tạo các buổi tập dựa trên lịch
        const buoiTapList = await generateWorkoutSessions(lichTap, goiTap);

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
        console.error('Error generating workout schedule:', error);
        res.status(500).json({ message: 'Lỗi server khi tạo lịch tập' });
    }
};

// Hàm phụ trợ tạo các buổi tập
const generateWorkoutSessions = async (lichTap, goiTap) => {
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
                    ngayTap: new Date(currentDate),
                    hoiVien: lichTap.hoiVien,
                    pt: lichTap.pt,
                    lichTap: lichTap._id,
                    gioBatDauDuKien: khungGio.gioBatDau,
                    gioKetThucDuKien: khungGio.gioKetThuc,
                    trangThaiXacNhan: 'CHO_XAC_NHAN',
                    cacBaiTap: [] // Sẽ được PT thêm sau
                });

                await buoiTap.save();
                buoiTapList.push(buoiTap);
                buoiTapCount++;

                console.log('🔍 Created buoiTap:', {
                    ngayTap: buoiTap.ngayTap,
                    gioBatDauDuKien: buoiTap.gioBatDauDuKien,
                    gioKetThucDuKien: buoiTap.gioKetThucDuKien
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
            gioBatDauDuKien: bt.gioBatDauDuKien,
            gioKetThucDuKien: bt.gioKetThucDuKien
        }))
    });

    return buoiTapList;
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
        const { chiTietGoiTapId } = req.params;

        // Kiểm tra chi tiết gói tập
        const chiTietGoiTap = await ChiTietGoiTap.findById(chiTietGoiTapId);
        if (!chiTietGoiTap) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin đăng ký gói tập' });
        }

        // Kiểm tra xem đã hoàn thành đủ các bước chưa
        if (chiTietGoiTap.trangThaiDangKy !== 'DA_TAO_LICH') {
            return res.status(400).json({
                message: 'Chưa hoàn thành đủ các bước workflow. Cần hoàn thành: chọn PT, tạo lịch tập, và xem lịch tập'
            });
        }

        // Cập nhật trạng thái thành hoàn thành
        const updatedChiTiet = await ChiTietGoiTap.findByIdAndUpdate(
            chiTietGoiTapId,
            {
                trangThaiDangKy: 'HOAN_THANH'
            },
            { new: true }
        ).populate('ptDuocChon').populate('maGoiTap').populate('maHoiVien');

        res.json({
            success: true,
            message: 'Đã hoàn thành workflow gói tập thành công',
            data: updatedChiTiet
        });

    } catch (error) {
        console.error('Error completing workflow:', error);
        res.status(500).json({ message: 'Lỗi server khi hoàn thành workflow' });
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
    updateBranch
};
