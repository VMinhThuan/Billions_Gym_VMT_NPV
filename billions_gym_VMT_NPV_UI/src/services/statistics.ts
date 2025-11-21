import { api } from './api';

export interface MemberStatsByBranch {
    chiNhanh: {
        _id: string;
        tenChiNhanh: string;
        diaChi: string;
    };
    tongSoHoiVien: number;
    dangHoatDong: number;
    tamNgung: number;
    hetHan: number;
    tyLe: {
        dangHoatDong: string;
        tamNgung: string;
        hetHan: string;
    };
}

export interface NewMemberStats {
    homNay: {
        soLuong: number;
        soSanh: number;
        thayDoi: string;
        trend: 'up' | 'down';
    };
    tuanNay: {
        soLuong: number;
        soSanh: number;
        thayDoi: string;
        trend: 'up' | 'down';
    };
    thangNay: {
        soLuong: number;
        soSanh: number;
        thayDoi: string;
        trend: 'up' | 'down';
    };
    namNay: {
        soLuong: number;
        soSanh: number;
        thayDoi: string;
        trend: 'up' | 'down';
    };
}

export interface ExpiringPackage {
    _id: string;
    nguoiDungId: {
        _id: string;
        hoTen: string;
        sdt: string;
        email?: string;
    };
    goiTapId: {
        _id: string;
        tenGoiTap: string;
    };
    branchId: {
        _id: string;
        tenChiNhanh: string;
    };
    ngayKetThuc: string;
}

export interface ExpiringPackages {
    trong7Ngay: {
        soLuong: number;
        danhSach: ExpiringPackage[];
    };
    trong15Ngay: {
        soLuong: number;
        danhSach: ExpiringPackage[];
    };
    trong30Ngay: {
        soLuong: number;
        danhSach: ExpiringPackage[];
    };
}

export interface RecentRegistration {
    _id: string;
    hoTen: string;
    goiTap: string;
    chiNhanh?: string;
    ptPhuTrach?: string;
    thoiGianDangKy: string;
}

export interface RealtimeCheckIn {
    _id: string;
    hoiVien: {
        _id: string;
        hoTen: string;
    };
    buoiTap?: {
        _id: string;
        tenBuoiTap?: string;
    };
    chiNhanh?: {
        _id: string;
        tenChiNhanh?: string;
    };
    checkInTime: string;
    checkOutTime?: string;
}

export interface PTScheduleEntry {
    _id: string;
    pt: {
        _id: string;
        hoTen: string;
    };
    hoiVien: {
        _id: string;
        hoTen: string;
    };
    goiTap?: {
        _id: string;
        tenGoiTap?: string;
    };
    thoiGianBatDau: string;
    thoiGianKetThuc: string;
    trangThai?: string;
}

export interface RevenueHeatmapEntry {
    id: string;
    label: string;
    subLabel?: string;
    value: number;
    changePercent?: number;
}

export interface RevenueStats {
    hienTai: {
        doanhThu: number;
        soLuong: number;
    };
    kyTruoc: {
        doanhThu: number;
        soLuong: number;
    };
    thayDoi: number;
    trend: 'up' | 'down';
    theoChiNhanh: Array<{
        _id: string;
        tenChiNhanh: string;
        total: number;
        count: number;
    }>;
}

export interface PackageStats {
    tongSoDangKy: number;
    theoGoiTap: Array<{
        _id: string;
        goiTap: {
            _id: string;
            tenGoiTap: string;
            donGia: number;
        };
        soLuongDangKy: number;
        doanhThu: number;
        tyLe: string;
    }>;
    goiPhobienNhat: any;
}

export interface PTStats {
    tongSoPT: number;
    dangHoatDong: number;
    tamNgung: number;
    topPT: Array<{
        pt: string;
        ptInfo: {
            _id: string;
            hoTen: string;
        };
        soLuongHocVien: number;
    }>;
}

export interface CheckInStats {
    thangNay: {
        soLuongCheckIn: number;
        soHoiVien: number;
        tyLeThamGia: number;
        trungBinhMoiHoiVien: number;
    };
    thangTruoc: {
        soLuongCheckIn: number;
    };
    thayDoi: string;
    theoChiNhanh: Array<{
        _id: string;
        tenChiNhanh: string;
        soLuongCheckIn: number;
        soLuongHoiVien: number;
    }>;
}

export interface MemberStatusStats {
    tongSo: number;
    chiTiet: Array<{
        trangThai: string;
        tenTrangThai: string;
        soLuong: number;
        tyLe: string;
    }>;
}

export interface BranchRegistrationStat {
    branchId: string;
    branchName: string;
    total: number;
    previousTotal: number;
    changePercent: number;
    trend: 'up' | 'down' | 'flat';
}

export interface RenewPackageStat {
    packageId: string;
    packageName: string;
    renewCount: number;
    previousCount: number;
    changePercent: number;
    trend: 'up' | 'down' | 'flat';
}

export interface ConversionStatsData {
    totalTrials: number;
    converted: number;
    conversionRate: number;
    previousRate: number;
    changePercent: number;
    trend: 'up' | 'down' | 'flat';
}

export interface AgeDistributionEntry {
    group: string;
    count: number;
    percentage: number;
}

export interface PackageDurationRevenueEntry {
    duration: string;
    revenue: number;
    registrations: number;
}

export interface PeakHourEntry {
    hour: number;
    label: string;
    count: number;
}

export interface OverallStats {
    hoiVienTheoChiNhanh: MemberStatsByBranch[];
    hoiVienMoi: NewMemberStats;
    goiSapHetHan: ExpiringPackages;
    doanhThu: RevenueStats;
    goiTap: PackageStats;
    pt: PTStats;
    checkIn: CheckInStats;
    trangThaiHoiVien: MemberStatusStats;
    branchRegistrations: BranchRegistrationStat[];
    renewPackages: RenewPackageStat[];
    conversionStats: ConversionStatsData;
    ageDistribution: AgeDistributionEntry[];
    packageDurationRevenue: PackageDurationRevenueEntry[];
    peakHours: PeakHourEntry[];
    recentRegistrations?: RecentRegistration[];
    recentCheckIns?: RealtimeCheckIn[];
    ptSchedulesToday?: PTScheduleEntry[];
    revenueHeatmap?: RevenueHeatmapEntry[];
    checkInTimeline?: Array<{ label: string; value: number }>;
}

// API functions
export const statisticsApi = {
    // Lấy tổng hợp tất cả thống kê
    getOverallStats: async (): Promise<OverallStats> => {
        const response = await api.get('/api/statistics/overall');
        return response.data;
    },

    // Thống kê hội viên theo chi nhánh
    getMemberStatsByBranch: async (): Promise<MemberStatsByBranch[]> => {
        const response = await api.get('/api/statistics/members/by-branch');
        return response.data;
    },

    // Thống kê hội viên mới
    getNewMemberStats: async (): Promise<NewMemberStats> => {
        const response = await api.get('/api/statistics/members/new');
        return response.data;
    },

    // Thống kê hội viên sắp hết hạn
    getExpiringPackages: async (): Promise<ExpiringPackages> => {
        const response = await api.get('/api/statistics/members/expiring');
        return response.data;
    },

    // Thống kê trạng thái hội viên
    getMemberStatusStats: async (): Promise<MemberStatusStats> => {
        const response = await api.get('/api/statistics/members/status');
        return response.data;
    },

    // Thống kê doanh thu
    getRevenueStats: async (period: 'day' | 'week' | 'month' | 'year' = 'month', branchId?: string): Promise<RevenueStats> => {
        const params = new URLSearchParams({ period });
        if (branchId) params.append('branchId', branchId);
        const response = await api.get(`/api/statistics/revenue?${params.toString()}`);
        return response.data;
    },

    // Thống kê gói tập
    getPackageStats: async (): Promise<PackageStats> => {
        const response = await api.get('/api/statistics/packages');
        return response.data;
    },

    // Thống kê PT
    getPTStats: async (): Promise<PTStats> => {
        const response = await api.get('/api/statistics/pt');
        return response.data;
    },

    // Thống kê check-in
    getCheckInStats: async (): Promise<CheckInStats> => {
        const response = await api.get('/api/statistics/checkin');
        return response.data;
    }
};

// Interface cho mục tiêu năm
export interface YearlyGoals {
    _id?: string;
    nam: number;
    hoiVienMoi: number;
    doanhThu: number;
    checkIn: number;
    goiTap: number;
    hoiVienDangHoatDong: number;
    tyLeGiaHan: number;
    nguoiTao?: string;
    nguoiCapNhat?: string;
    createdAt?: string;
    updatedAt?: string;
}

// API cho mục tiêu năm
export const yearlyGoalsApi = {
    // Lấy mục tiêu năm hiện tại
    getCurrentYearGoals: async (): Promise<YearlyGoals> => {
        const response = await api.get('/api/yearly-goals/current');
        return response.data;
    },

    // Cập nhật mục tiêu năm hiện tại
    updateYearlyGoals: async (goals: Partial<YearlyGoals>): Promise<YearlyGoals> => {
        const response = await api.put('/api/yearly-goals/current', goals);
        // Backend trả về { message, goals }
        return response.data.goals || response.data;
    },

    // Lấy tất cả mục tiêu các năm
    getAllYearlyGoals: async (): Promise<YearlyGoals[]> => {
        const response = await api.get('/api/yearly-goals/all');
        return response.data;
    }
};

