const ChiTietGoiTap = require('../models/ChiTietGoiTap');
const { HoiVien } = require('../models/NguoiDung');
const GoiTap = require('../models/GoiTap');

// Đăng ký gói tập mới
const dangKyGoiTap = async (req, res) => {
    try {
        const {
            maHoiVien,
            maGoiTap,
            ngayBatDau,
            soTienThanhToan,
            trangThaiThanhToan,
            ghiChu,
            giaGoiTapGoc,
            soTienBu,
            isUpgrade
        } = req.body;

        console.log('🔍 Backend - Received registration data:', req.body);

        // Kiểm tra hội viên tồn tại
        const hoiVien = await HoiVien.findById(maHoiVien);
        if (!hoiVien) {
            return res.status(404).json({ message: 'Không tìm thấy hội viên' });
        }

        // Kiểm tra gói tập tồn tại
        const goiTap = await GoiTap.findById(maGoiTap);
        if (!goiTap) {
            return res.status(404).json({ message: 'Không tìm thấy gói tập' });
        }

        // Kiểm tra hội viên có gói tập đang hoạt động không
        const existingActivePackage = await ChiTietGoiTap.findOne({
            maHoiVien: maHoiVien,
            $or: [
                { trangThai: { $in: ['DANG_HOAT_DONG', 'CHO_CHON_PT', 'DANG_KICH_HOAT', 'DANG_SU_DUNG'] } },
                { trangThaiDangKy: { $in: ['CHO_CHON_PT', 'DA_CHON_PT', 'DA_TAO_LICH', 'HOAN_THANH'] } }
            ],
            ngayKetThuc: { $gte: new Date() }, // Chưa hết hạn
            trangThai: { $ne: 'DA_NANG_CAP' }, // Chưa bị nâng cấp
            trangThaiDangKy: { $ne: 'DA_NANG_CAP' } // Chưa bị nâng cấp
        });

        console.log('🔍 Existing active package check:', existingActivePackage ? 'Found active package' : 'No active package');

        // Nếu có gói đang hoạt động và không phải nâng cấp
        if (existingActivePackage && !isUpgrade) {
            return res.status(400).json({
                message: 'Hội viên đã có gói tập đang hoạt động. Vui lòng nâng cấp gói tập thay vì đăng ký mới.',
                existingPackage: {
                    tenGoiTap: existingActivePackage.maGoiTap?.tenGoiTap || 'N/A',
                    ngayBatDau: existingActivePackage.ngayBatDau,
                    ngayKetThuc: existingActivePackage.ngayKetThuc,
                    trangThai: existingActivePackage.trangThai
                }
            });
        }

        // Tính ngày kết thúc dựa trên thời hạn gói tập
        const ngayKetThuc = new Date(ngayBatDau);
        if (goiTap.donViThoiHan === 'Ngày') {
            ngayKetThuc.setDate(ngayKetThuc.getDate() + goiTap.thoiHan);
        } else if (goiTap.donViThoiHan === 'Tháng') {
            ngayKetThuc.setMonth(ngayKetThuc.getMonth() + goiTap.thoiHan);
        } else if (goiTap.donViThoiHan === 'Năm') {
            ngayKetThuc.setFullYear(ngayKetThuc.getFullYear() + goiTap.thoiHan);
        }

        // Tạo đăng ký mới
        const dangKyMoi = new ChiTietGoiTap({
            maHoiVien,
            maGoiTap,
            ngayBatDau: new Date(ngayBatDau),
            ngayKetThuc,
            soTienThanhToan: soTienThanhToan || goiTap.donGia,
            trangThaiThanhToan,
            ghiChu,
            giaGoiTapGoc: giaGoiTapGoc || goiTap.donGia,
            soTienBu: soTienBu || 0,
            isUpgrade: isUpgrade || false
        });

        await dangKyMoi.save();

        // Nếu là gói nâng cấp, cập nhật trạng thái gói cũ
        if (isUpgrade) {
            try {
                // Tìm TẤT CẢ gói của hội viên (trừ gói vừa tạo) và chưa được nâng cấp
                const activePackages = await ChiTietGoiTap.find({
                    maHoiVien: maHoiVien,
                    _id: { $ne: dangKyMoi._id }, // Loại trừ gói vừa tạo
                    trangThai: { $ne: 'DA_NANG_CAP' }, // Chưa được nâng cấp
                    trangThaiDangKy: { $ne: 'DA_NANG_CAP' } // Chưa được nâng cấp
                }).sort({ ngayDangKy: -1 }); // Sắp xếp theo ngày đăng ký mới nhất

                console.log(`🔍 Found ${activePackages.length} packages to update for member ${maHoiVien}`);

                // Cập nhật tất cả gói cũ thành trạng thái đã nâng cấp
                for (const oldPackage of activePackages) {
                    oldPackage.trangThai = 'DA_NANG_CAP';
                    oldPackage.trangThaiDangKy = 'DA_NANG_CAP';
                    oldPackage.ngayKetThuc = new Date(); // Kết thúc gói cũ vào ngày hiện tại
                    oldPackage.ngayTamDung = new Date(); // Ngày tạm dừng
                    oldPackage.lyDoTamDung = 'Nâng cấp gói tập';
                    oldPackage.ghiChu = `Đã nâng cấp lên gói ${goiTap.tenGoiTap} vào ngày ${new Date().toLocaleDateString('vi-VN')}. Số tiền bù: ${soTienBu.toLocaleString('vi-VN')}₫`;

                    await oldPackage.save();
                    console.log(`🔄 Old package ${oldPackage._id} marked as upgraded`);
                }

                if (activePackages.length > 0) {
                    console.log(`✅ Successfully updated ${activePackages.length} old packages to DA_NANG_CAP status`);
                }
            } catch (upgradeError) {
                console.error('❌ Error updating old package status:', upgradeError);
                // Không throw error vì gói mới đã được tạo thành công
            }
        }

        // Populate thông tin chi tiết
        const result = await ChiTietGoiTap.findById(dangKyMoi._id)
            .populate('maHoiVien', 'hoTen email sdt')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan');

        const successMessage = isUpgrade
            ? `Nâng cấp gói tập thành công! Số tiền cần thanh toán: ${soTienBu.toLocaleString('vi-VN')}₫`
            : 'Đăng ký gói tập thành công!';

        res.status(201).json({
            message: successMessage,
            data: result
        });
    } catch (error) {
        console.error('Error in dangKyGoiTap:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy danh sách đăng ký gói tập của hội viên
const getDangKyByHoiVien = async (req, res) => {
    try {
        const { maHoiVien } = req.params;
        const { trangThai, tenHoiVien } = req.query;

        console.log('🔍 Backend - Fetching packages for member:', maHoiVien);
        console.log('🔍 Backend - Query params:', { trangThai, tenHoiVien });

        let filter = {};

        // Nếu có tenHoiVien, tìm member ID trước
        if (tenHoiVien) {
            console.log('🔍 Backend - Searching by member name:', tenHoiVien);
            const foundMembers = await HoiVien.find({
                hoTen: { $regex: tenHoiVien, $options: 'i' }
            }).limit(5);

            if (foundMembers.length === 0) {
                console.log('❌ No members found with name:', tenHoiVien);
                return res.json({
                    message: 'Không tìm thấy hội viên',
                    data: []
                });
            }

            const memberIds = foundMembers.map(m => m._id);
            console.log('🔍 Backend - Found member IDs:', memberIds);

            filter.maHoiVien = { $in: memberIds };
        } else {
            // Sử dụng trực tiếp member ID
            filter.maHoiVien = maHoiVien;
        }

        if (trangThai) {
            filter.trangThai = trangThai;
        }

        console.log('🔍 Backend - MongoDB filter:', filter);

        const dangKyList = await ChiTietGoiTap.find(filter)
            .populate('maHoiVien', 'hoTen email sdt ngayThamGia trangThaiHoiVien')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan moTa')
            .populate('ptDuocChon', 'hoTen chuyenMon danhGia')
            .sort({ thuTuUuTien: -1, createdAt: -1 });

        console.log('🔍 Backend - Found packages:', dangKyList.length);
        console.log('🔍 Backend - Package details:', dangKyList);

        res.json({
            message: 'Lấy danh sách đăng ký thành công',
            data: dangKyList
        });
    } catch (error) {
        console.error('Error in getDangKyByHoiVien:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy danh sách hội viên của gói tập
const getHoiVienByGoiTap = async (req, res) => {
    try {
        const { maGoiTap } = req.params;
        const { trangThai } = req.query;

        let filter = { maGoiTap };

        // Nếu có query trangThai thì filter theo trangThai, nếu không thì lấy tất cả
        if (trangThai) {
            filter.$or = [
                { trangThai: trangThai },
                { trangThaiDangKy: trangThai }
            ];
        }
        // Không filter theo trạng thái, lấy tất cả để hiển thị đầy đủ

        console.log('🔍 Filter for package members:', JSON.stringify(filter, null, 2));

        const hoiVienList = await ChiTietGoiTap.find(filter)
            .populate('maHoiVien', 'hoTen email sdt ngayThamGia trangThaiHoiVien')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan')
            .populate('ptDuocChon', 'hoTen chuyenMon')
            .sort({ ngayDangKy: -1 });

        console.log(`📊 Found ${hoiVienList.length} members for package ${maGoiTap}`);

        res.json({
            message: 'Lấy danh sách hội viên thành công',
            data: hoiVienList
        });
    } catch (error) {
        console.error('Error in getHoiVienByGoiTap:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy gói tập đang hoạt động của hội viên
const getActivePackage = async (req, res) => {
    try {
        const { maHoiVien } = req.params;

        console.log('🔍 getActivePackage - Looking for active package for member:', maHoiVien);

        // Tìm gói tập đang hoạt động
        const activePackage = await ChiTietGoiTap.findOne({
            $or: [
                { maHoiVien: maHoiVien },
                { nguoiDungId: maHoiVien }
            ],
            $and: [
                {
                    $or: [
                        { trangThaiSuDung: { $in: ['DANG_HOAT_DONG', 'DANG_SU_DUNG', 'CHO_CHON_PT', 'DANG_KICH_HOAT'] } },
                        { trangThaiDangKy: { $in: ['CHO_CHON_PT', 'DA_CHON_PT', 'DA_TAO_LICH', 'HOAN_THANH'] } }
                    ]
                },
                {
                    $or: [
                        { ngayKetThuc: { $gte: new Date() } },
                        { ngayKetThuc: { $exists: false } }
                    ]
                },
                {
                    trangThaiSuDung: { $ne: 'DA_NANG_CAP' },
                    trangThaiDangKy: { $ne: 'DA_NANG_CAP' }
                }
            ]
        })
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan')
            .populate('goiTapId', 'tenGoiTap donGia thoiHan donViThoiHan')
            .sort({ ngayDangKy: -1, thoiGianDangKy: -1 }); // Lấy gói mới nhất

        console.log('🔍 getActivePackage - Found package:', activePackage ? 'Yes' : 'No');

        if (!activePackage) {
            return res.status(404).json({ message: 'Không có gói tập đang hoạt động' });
        }

        res.json(activePackage);
    } catch (error) {
        console.error('Error in getActivePackage:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Kích hoạt lại gói tập
const kichHoatLaiGoiTap = async (req, res) => {
    try {
        const { id } = req.params;

        const dangKy = await ChiTietGoiTap.findById(id);
        if (!dangKy) {
            return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        }

        // Kiểm tra xem có gói nào đang hoạt động không
        const activePackage = await ChiTietGoiTap.findOne({
            maHoiVien: dangKy.maHoiVien,
            trangThai: 'DANG_HOAT_DONG',
            _id: { $ne: id }
        });

        if (activePackage) {
            return res.status(400).json({
                message: 'Không thể kích hoạt vì đã có gói tập khác đang hoạt động'
            });
        }

        const result = await dangKy.kichHoatLai();

        res.json({
            message: 'Kích hoạt lại gói tập thành công',
            data: result
        });
    } catch (error) {
        console.error('Error in kichHoatLaiGoiTap:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Cập nhật trạng thái thanh toán
const capNhatThanhToan = async (req, res) => {
    try {
        const { id } = req.params;
        const { trangThaiThanhToan, maThanhToan } = req.body;

        const dangKy = await ChiTietGoiTap.findById(id);
        if (!dangKy) {
            return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        }

        dangKy.trangThaiThanhToan = trangThaiThanhToan;
        if (maThanhToan) {
            dangKy.maThanhToan = maThanhToan;
        }

        await dangKy.save();

        const result = await ChiTietGoiTap.findById(id)
            .populate('maHoiVien', 'hoTen email sdt')
            .populate('maGoiTap', 'tenGoiTap donGia');

        res.json({
            message: 'Cập nhật trạng thái thanh toán thành công',
            data: result
        });
    } catch (error) {
        console.error('Error in capNhatThanhToan:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Hủy đăng ký gói tập
const huyDangKy = async (req, res) => {
    try {
        const { id } = req.params;
        const { lyDo } = req.body;

        const dangKy = await ChiTietGoiTap.findById(id);
        if (!dangKy) {
            return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        }

        if (dangKy.trangThaiThanhToan === 'DA_THANH_TOAN') {
            return res.status(400).json({
                message: 'Không thể hủy gói tập đã thanh toán'
            });
        }

        dangKy.trangThai = 'DA_HUY';
        dangKy.ghiChu = lyDo || 'Hủy đăng ký';

        await dangKy.save();

        res.json({
            message: 'Hủy đăng ký gói tập thành công',
            data: dangKy
        });
    } catch (error) {
        console.error('Error in huyDangKy:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Đánh dấu gói đã nâng cấp
const nangCapGoiTap = async (req, res) => {
    try {
        const { id } = req.params;
        const { ghiChu } = req.body;

        const dangKy = await ChiTietGoiTap.findById(id);
        if (!dangKy) {
            return res.status(404).json({ message: 'Không tìm thấy đăng ký gói tập' });
        }

        // Cập nhật trạng thái gói cũ
        dangKy.trangThai = 'DA_NANG_CAP';
        dangKy.trangThaiDangKy = 'DA_NANG_CAP';
        dangKy.ngayKetThuc = new Date(); // Kết thúc gói cũ vào ngày hiện tại
        dangKy.ngayTamDung = new Date(); // Ngày tạm dừng
        dangKy.lyDoTamDung = 'Nâng cấp gói tập';
        dangKy.ghiChu = ghiChu || 'Đã nâng cấp gói tập';

        await dangKy.save();

        res.json({
            message: 'Đánh dấu gói đã nâng cấp thành công',
            data: dangKy
        });
    } catch (error) {
        console.error('Error in nangCapGoiTap:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Thống kê gói tập
const thongKeGoiTap = async (req, res) => {
    try {
        console.log('📊 Bắt đầu tính toán thống kê gói tập...');

        // Debug: Kiểm tra dữ liệu gốc
        const totalRegistrations = await ChiTietGoiTap.countDocuments();
        console.log('📊 Tổng số đăng ký trong DB:', totalRegistrations);

        const sampleRegistrations = await ChiTietGoiTap.find().limit(5).populate('maGoiTap', 'tenGoiTap donGia');
        console.log('📊 Sample registrations:', JSON.stringify(sampleRegistrations, null, 2));

        // Debug: Kiểm tra tất cả đăng ký có maGoiTap
        const registrationsWithPackage = await ChiTietGoiTap.find({ maGoiTap: { $exists: true, $ne: null } });
        console.log('📊 Registrations with maGoiTap:', registrationsWithPackage.length);

        // Debug: Kiểm tra tất cả gói tập
        const GoiTap = require('../models/GoiTap');
        const allPackages = await GoiTap.find();
        console.log('📊 All packages in DB:', JSON.stringify(allPackages, null, 2));

        // Debug: Kiểm tra ObjectId types
        if (registrationsWithPackage.length > 0) {
            console.log('📊 First registration maGoiTap type:', typeof registrationsWithPackage[0].maGoiTap);
            console.log('📊 First registration maGoiTap value:', registrationsWithPackage[0].maGoiTap);
            console.log('📊 First registration maGoiTap toString:', registrationsWithPackage[0].maGoiTap.toString());
        }

        if (allPackages.length > 0) {
            console.log('📊 First package _id type:', typeof allPackages[0]._id);
            console.log('📊 First package _id value:', allPackages[0]._id);
            console.log('📊 First package _id toString:', allPackages[0]._id.toString());
        }

        // 1. Thống kê tổng quan
        const tongQuan = await ChiTietGoiTap.aggregate([
            {
                $group: {
                    _id: null,
                    tongSoDangKy: { $sum: 1 },
                    tongSoHoiVienDaThanhToan: {
                        $sum: { $cond: [{ $eq: ['$trangThaiThanhToan', 'DA_THANH_TOAN'] }, 1, 0] }
                    },
                    tongSoHoiVienChuaThanhToan: {
                        $sum: { $cond: [{ $eq: ['$trangThaiThanhToan', 'CHUA_THANH_TOAN'] }, 1, 0] }
                    },
                    soDangKyDangHoatDong: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ['$trangThai', 'HET_HAN'] },
                                        { $ne: ['$trangThai', 'DA_HUY'] },
                                        { $ne: ['$trangThai', 'DA_NANG_CAP'] },
                                        { $gte: ['$ngayKetThuc', new Date()] }
                                    ]
                                }, 1, 0
                            ]
                        }
                    },
                    soDangKyHetHan: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ['$trangThai', 'HET_HAN'] },
                                        { $lt: ['$ngayKetThuc', new Date()] }
                                    ]
                                }, 1, 0
                            ]
                        }
                    },
                    tongDoanhThu: {
                        $sum: {
                            $cond: [
                                { $eq: ['$trangThaiThanhToan', 'DA_THANH_TOAN'] },
                                {
                                    // Tổng doanh thu = soTienThanhToan (tiền thực tế khách đã trả)
                                    // Bao gồm cả tiền bù nâng cấp
                                    $cond: [
                                        { $and: [{ $ne: ['$soTienThanhToan', null] }, { $ne: ['$soTienThanhToan', 0] }] },
                                        '$soTienThanhToan',
                                        // Nếu không có soTienThanhToan, dùng giaGoiTapGoc (giá gói đã nâng cấp)
                                        {
                                            $cond: [
                                                { $and: [{ $ne: ['$giaGoiTapGoc', null] }, { $ne: ['$giaGoiTapGoc', 0] }] },
                                                '$giaGoiTapGoc',
                                                0 // Nếu không có dữ liệu nào thì = 0
                                            ]
                                        }
                                    ]
                                },
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // 2. Thống kê theo gói tập - Sử dụng cách đơn giản hơn
        const theoGoiTap = await ChiTietGoiTap.aggregate([
            {
                $match: {
                    maGoiTap: { $exists: true, $ne: null } // Chỉ lấy các đăng ký có maGoiTap
                }
            },
            {
                $lookup: {
                    from: 'goitaps',
                    localField: 'maGoiTap',
                    foreignField: '_id',
                    as: 'goiTapInfo'
                }
            },
            {
                $match: {
                    'goiTapInfo.0': { $exists: true } // Đảm bảo có thông tin gói tập
                }
            },
            {
                $addFields: {
                    goiTap: { $arrayElemAt: ['$goiTapInfo', 0] }
                }
            },
            {
                $group: {
                    _id: {
                        maGoiTap: '$maGoiTap',
                        tenGoiTap: '$goiTap.tenGoiTap',
                        donGia: '$goiTap.donGia'
                    },
                    soLuongDangKy: { $sum: 1 },
                    doanhThu: {
                        $sum: {
                            $cond: [
                                { $eq: ['$trangThaiThanhToan', 'DA_THANH_TOAN'] },
                                {
                                    // Doanh thu thực tế = soTienThanhToan (tiền thực tế khách đã trả)
                                    $cond: [
                                        { $and: [{ $ne: ['$soTienThanhToan', null] }, { $ne: ['$soTienThanhToan', 0] }] },
                                        '$soTienThanhToan',
                                        // Nếu không có soTienThanhToan, dùng giaGoiTapGoc (giá gói đã nâng cấp)
                                        {
                                            $cond: [
                                                { $and: [{ $ne: ['$giaGoiTapGoc', null] }, { $ne: ['$giaGoiTapGoc', 0] }] },
                                                '$giaGoiTapGoc',
                                                '$goiTap.donGia' // Fallback cuối cùng
                                            ]
                                        }
                                    ]
                                },
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { soLuongDangKy: -1 }
            }
        ]);

        console.log('🔍 Debug theoGoiTap aggregation result:', JSON.stringify(theoGoiTap, null, 2));

        // Fallback: Nếu aggregation không hoạt động, sử dụng populate
        if (theoGoiTap.length === 0) {
            console.log('⚠️ Aggregation returned empty, using populate fallback...');
            const allRegistrations = await ChiTietGoiTap.find({
                maGoiTap: { $exists: true, $ne: null }
            }).populate('maGoiTap', 'tenGoiTap donGia');

            console.log('📊 All registrations with populated packages:', JSON.stringify(allRegistrations, null, 2));

            // Group manually
            const packageMap = new Map();
            allRegistrations.forEach(reg => {
                const packageId = reg.maGoiTap._id.toString();
                const packageName = reg.maGoiTap.tenGoiTap;
                const packagePrice = reg.maGoiTap.donGia;

                if (!packageMap.has(packageId)) {
                    packageMap.set(packageId, {
                        _id: {
                            maGoiTap: reg.maGoiTap._id,
                            tenGoiTap: packageName,
                            donGia: packagePrice
                        },
                        soLuongDangKy: 0,
                        doanhThu: 0
                    });
                }

                const packageData = packageMap.get(packageId);
                packageData.soLuongDangKy++;

                if (reg.trangThaiThanhToan === 'DA_THANH_TOAN') {
                    let revenue = 0;
                    if (reg.soTienThanhToan && reg.soTienThanhToan !== 0) {
                        revenue = reg.soTienThanhToan;
                    } else if (reg.giaGoiTapGoc && reg.giaGoiTapGoc !== 0) {
                        revenue = reg.giaGoiTapGoc;
                    } else {
                        revenue = packagePrice;
                    }
                    packageData.doanhThu += revenue;
                }
            });

            const manualTheoGoiTap = Array.from(packageMap.values());
            console.log('📊 Manual theoGoiTap result:', JSON.stringify(manualTheoGoiTap, null, 2));

            // Tính tỷ lệ phần trăm
            const totalRegistrations = manualTheoGoiTap.reduce((sum, item) => sum + item.soLuongDangKy, 0);
            const theoGoiTapWithPercentage = manualTheoGoiTap.map(item => ({
                ...item,
                tyLe: totalRegistrations > 0 ? ((item.soLuongDangKy / totalRegistrations) * 100).toFixed(1) : '0.0'
            }));

            // Override theoGoiTap với kết quả manual
            theoGoiTap.length = 0;
            theoGoiTap.push(...theoGoiTapWithPercentage);
        }

        // 3. Thống kê theo trạng thái
        const theoTrangThai = await ChiTietGoiTap.aggregate([
            {
                $group: {
                    _id: '$trangThaiDangKy',
                    soLuong: { $sum: 1 }
                }
            },
            {
                $sort: { soLuong: -1 }
            }
        ]);

        // 4. Thống kê theo thời gian (theo tháng)
        const theoThang = await ChiTietGoiTap.aggregate([
            {
                $group: {
                    _id: {
                        nam: { $year: '$ngayDangKy' },
                        thang: { $month: '$ngayDangKy' }
                    },
                    soDangKyMoi: { $sum: 1 },
                    doanhThu: {
                        $sum: {
                            $cond: [
                                { $eq: ['$trangThaiThanhToan', 'DA_THANH_TOAN'] },
                                {
                                    // Doanh thu thực tế = soTienThanhToan (tiền thực tế khách đã trả)
                                    $cond: [
                                        { $and: [{ $ne: ['$soTienThanhToan', null] }, { $ne: ['$soTienThanhToan', 0] }] },
                                        '$soTienThanhToan',
                                        // Nếu không có soTienThanhToan, dùng giaGoiTapGoc (giá gói đã nâng cấp)
                                        {
                                            $cond: [
                                                { $and: [{ $ne: ['$giaGoiTapGoc', null] }, { $ne: ['$giaGoiTapGoc', 0] }] },
                                                '$giaGoiTapGoc',
                                                '$goiTapInfo.donGia' // Fallback cuối cùng
                                            ]
                                        }
                                    ]
                                },
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { '_id.nam': -1, '_id.thang': -1 }
            },
            {
                $limit: 12 // Lấy 12 tháng gần nhất
            }
        ]);

        // Tính tỷ lệ phần trăm cho từng gói tập
        const tongSoDangKy = tongQuan[0]?.tongSoDangKy || 1;
        const theoGoiTapVoiTyLe = theoGoiTap.map(item => ({
            ...item,
            tyLe: ((item.soLuongDangKy / tongSoDangKy) * 100).toFixed(1)
        }));

        // Tính tỷ lệ phần trăm cho trạng thái
        const theoTrangThaiVoiTyLe = theoTrangThai.map(item => ({
            ...item,
            tyLe: ((item.soLuong / tongSoDangKy) * 100).toFixed(1)
        }));

        const result = {
            tongQuan: tongQuan[0] || {
                tongSoDangKy: 0,
                tongSoHoiVienDaThanhToan: 0,
                tongSoHoiVienChuaThanhToan: 0,
                soDangKyDangHoatDong: 0,
                soDangKyHetHan: 0,
                tongDoanhThu: 0
            },
            theoGoiTap: theoGoiTapVoiTyLe,
            theoTrangThai: theoTrangThaiVoiTyLe,
            theoThang: theoThang
        };

        console.log('📊 Thống kê hoàn thành:', JSON.stringify(result, null, 2));

        // Debug: Kiểm tra tất cả đăng ký đã thanh toán để tính doanh thu thực tế
        const allPaidRegistrations = await ChiTietGoiTap.find({ trangThaiThanhToan: 'DA_THANH_TOAN' })
            .populate('maGoiTap', 'tenGoiTap donGia')
            .sort({ ngayDangKy: -1 });

        console.log('🔍 Tất cả đăng ký đã thanh toán:');
        let totalRevenueManual = 0;
        allPaidRegistrations.forEach((reg, index) => {
            // Logic tính revenue giống như trong aggregation
            let revenue = 0;
            if (reg.soTienThanhToan && reg.soTienThanhToan !== 0) {
                revenue = reg.soTienThanhToan;
            } else if (reg.giaGoiTapGoc && reg.giaGoiTapGoc !== 0) {
                revenue = reg.giaGoiTapGoc;
            } else if (reg.maGoiTap?.donGia) {
                revenue = reg.maGoiTap.donGia;
            }

            totalRevenueManual += revenue;
            console.log(`${index + 1}. ${reg.maGoiTap?.tenGoiTap}:`);
            console.log(`   - soTienThanhToan: ${reg.soTienThanhToan || 'null/undefined'}`);
            console.log(`   - giaGoiTapGoc: ${reg.giaGoiTapGoc || 'null/undefined'}`);
            console.log(`   - donGia (gốc): ${reg.maGoiTap?.donGia || 'null/undefined'}`);
            console.log(`   - Revenue used: ${revenue.toLocaleString('vi-VN')}₫`);
            console.log(`   - isUpgrade: ${reg.isUpgrade || false}`);
            console.log(`   - soTienBu: ${reg.soTienBu || 0}`);
            console.log('---');
        });

        console.log(`💰 Tổng doanh thu tính bằng tay: ${totalRevenueManual.toLocaleString('vi-VN')}₫`);
        console.log(`📊 Tổng doanh thu từ aggregation: ${result.tongQuan.tongDoanhThu.toLocaleString('vi-VN')}₫`);

        res.json({
            message: 'Lấy thống kê thành công',
            data: result
        });
    } catch (error) {
        console.error('❌ Error in thongKeGoiTap:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy tất cả đăng ký (cho admin)
const getAllDangKy = async (req, res) => {
    try {
        const { page = 1, limit = 100, trangThai, search } = req.query;
        const skip = (page - 1) * limit;

        console.log('🔍 Backend - getAllDangKy params:', { page, limit, trangThai, search });

        let filter = {};
        if (trangThai) {
            filter.trangThai = trangThai;
        }

        // Nếu không có search và không có filter đặc biệt, trả về tất cả mà không phân trang
        if (!search && !trangThai) {
            console.log('🔍 Backend - Returning all registrations without pagination');
            const allRegistrations = await ChiTietGoiTap.find(filter)
                .populate('maHoiVien', 'hoTen email sdt')
                .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan')
                .populate('ptDuocChon', 'hoTen chuyenMon')
                .sort({ createdAt: -1 });

            return res.json({
                message: 'Lấy danh sách đăng ký thành công',
                data: allRegistrations,
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: allRegistrations.length,
                    itemsPerPage: allRegistrations.length
                }
            });
        }

        // Xử lý tìm kiếm
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            const hoiVienIds = await HoiVien.find({ hoTen: searchRegex }).distinct('_id');
            const goiTapIds = await GoiTap.find({ tenGoiTap: searchRegex }).distinct('_id');

            filter.$or = [
                { maHoiVien: { $in: hoiVienIds } },
                { maGoiTap: { $in: goiTapIds } }
            ];
        }

        const dangKyList = await ChiTietGoiTap.find(filter)
            .populate('maHoiVien', 'hoTen email sdt')
            .populate('maGoiTap', 'tenGoiTap donGia thoiHan donViThoiHan')
            .populate('ptDuocChon', 'hoTen chuyenMon')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await ChiTietGoiTap.countDocuments(filter);

        console.log('🔍 Backend - Returning paginated results:', {
            total,
            returned: dangKyList.length,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            message: 'Lấy danh sách đăng ký thành công',
            data: dangKyList,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error in getAllDangKy:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = {
    dangKyGoiTap,
    getDangKyByHoiVien,
    getHoiVienByGoiTap,
    getActivePackage,
    kichHoatLaiGoiTap,
    capNhatThanhToan,
    huyDangKy,
    nangCapGoiTap,
    thongKeGoiTap,
    getAllDangKy
};
