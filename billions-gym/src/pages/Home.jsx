import React from 'react';
import Layout from '../components/layout/Layout';
import Sidebar from '../components/layout/Sidebar';
import { authUtils } from '../utils/auth';
import { userAPI } from '../services/api';
import { useEffect, useState } from 'react';
import { getRankLabelVi } from '../utils/rankMap';
import RankBadge from '../components/ui/RankBadge';
import { packageAPI } from '../services/api';
import { formatDateToDDMMYYYY } from '../utils/formatDate';
import UserActions from '../components/UserActions';

const Home = ({ onNavigateToLogin, onNavigateToRegister }) => {
    const isAuthenticated = authUtils.isAuthenticated();
    const storedUser = authUtils.getUser();
    const [user, setUser] = useState(storedUser || {});
    const [loadingRank, setLoadingRank] = useState(false);
    const [activePackage, setActivePackage] = useState(null);
    const [loadingPackage, setLoadingPackage] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        let mounted = true;
        const fetchRank = async () => {
            if (!isAuthenticated) return;
            const id = authUtils.getUserId();
            if (!id) return;
            try {
                setLoadingRank(true);
                const res = await userAPI.getUserWithRank(id);
                const payload = res && res.data ? res.data : res;
                if (mounted && payload) {
                    setUser(prev => ({ ...prev, ...payload }));
                    try {
                        localStorage.setItem('user', JSON.stringify({ ...storedUser, ...payload }));
                    } catch (e) {
                        console.error('Could not update localStorage user', e);
                    }
                }
            } catch (err) {
                console.error('Could not fetch user rank', err);
            } finally {
                setLoadingRank(false);
            }
        };
        fetchRank();
        // fetch active package
        const fetchActivePackage = async () => {
            if (!isAuthenticated) return;
            const id = authUtils.getUserId();
            console.log('🔍 User ID from authUtils:', id);
            console.log('🔍 isAuthenticated:', isAuthenticated);
            if (!id) return;
            try {
                setLoadingPackage(true);
                const res = await packageAPI.getActivePackage(id);
                const data = res && res.data ? res.data : res;
                console.log('🔍 Active package raw response:', res);
                console.log('🔍 Active package data:', data);
                console.log('🔍 ngayKetThuc value:', data?.ngayKetThuc);
                console.log('🔍 ngayKetThuc type:', typeof data?.ngayKetThuc);
                if (mounted && data) {
                    // Calculate ngayKetThuc if not available
                    let calculatedNgayKetThuc = data.ngayKetThuc;
                    if (!calculatedNgayKetThuc && data.ngayBatDau && data.goiTapId?.thoiHan) {
                        const startDate = new Date(data.ngayBatDau);
                        const durationDays = data.goiTapId.thoiHan;
                        const endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + durationDays);
                        calculatedNgayKetThuc = endDate.toISOString();
                        console.log('🔍 Calculated ngayKetThuc from ngayBatDau + thoiHan:', calculatedNgayKetThuc);
                    }

                    // Format the data for display
                    // Helper to format date as DD/MM/YYYY with leading zeros
                    const formatDateDDMMYYYY = (isoString) => {
                        try {
                            const d = new Date(isoString);
                            if (isNaN(d)) return 'N/A';
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            return `${day}/${month}/${year}`;
                        } catch (e) {
                            return 'N/A';
                        }
                    };

                    const formattedData = {
                        ...data,
                        tenGoiTap: data.maGoiTap?.tenGoiTap || data.goiTapId?.tenGoiTap || 'N/A',
                        formattedAmount: data.thongTinThanhToan?.amount
                            ? `${data.thongTinThanhToan.amount.toLocaleString('vi-VN')}₫`
                            : data.maGoiTap?.donGia
                                ? `${data.maGoiTap.donGia.toLocaleString('vi-VN')}₫`
                                : data.goiTapId?.donGia
                                    ? `${data.goiTapId.donGia.toLocaleString('vi-VN')}₫`
                                    : 'N/A',
                        formattedExpiry: calculatedNgayKetThuc
                            ? formatDateDDMMYYYY(calculatedNgayKetThuc)
                            : 'N/A'
                    };
                    console.log('🔍 Formatted data:', formattedData);
                    console.log('🔍 formattedExpiry:', formattedData.formattedExpiry);
                    setActivePackage(formattedData);
                }
            } catch (err) {
                console.debug('No active package or failed to fetch', err);
                setActivePackage(null);
            } finally {
                setLoadingPackage(false);
            }
        };
        fetchActivePackage();
        return () => { mounted = false };
    }, [isAuthenticated]);

    return (
        <Layout onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister}>
            {isAuthenticated && (
                <div className="flex min-h-screen bg-[#070606]">
                    {/* Sidebar */}
                    <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                    {/* Main Content - Only this area should scroll */}
                    <div className="flex-1 pl-0 lg:pl-80">
                        {/* Mobile Sidebar Toggle */}
                        <div className="lg:hidden p-4 bg-[#1a1a1a] border-b border-[#2a2a2a]">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="flex items-center space-x-2 text-white hover:text-[#da2128] transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <span>Menu</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-4 sm:px-6 py-4 sm:py-6 lg:py-8 max-w-full mx-auto">
                            {/* User Actions Dashboard */}
                            <UserActions
                                user={user}
                                activePackage={activePackage}
                                nextSessions={[]}
                                notifications={[]}
                                loadingPackage={loadingPackage}
                            />
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Home;
