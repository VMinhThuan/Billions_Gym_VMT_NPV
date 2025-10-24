import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../services/api';

const getLastName = (fullName) => {
    if (!fullName) return 'Hội viên';
    const parts = fullName.trim().split(' ');
    return parts[parts.length - 1];
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
};

export default function UserActions({
    user = {},
    activePackage = null,
    nextSessions = [],
    notifications = [],
    loadingPackage = false
}) {
    const navigate = useNavigate();
    const [bodyMetrics, setBodyMetrics] = useState(null);
    const [activityData, setActivityData] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [trainerTransparentMap, setTrainerTransparentMap] = useState({});
    const [recommendedActivities, setRecommendedActivities] = useState([]);
    const [nutritionData, setNutritionData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch body metrics (latest)
                const metricsRes = await fetch(getApiUrl('/chisocothe/my/latest'), {
                    headers: getAuthHeaders(true)
                });
                if (metricsRes.ok) {
                    const metricsData = await metricsRes.json();
                    setBodyMetrics(metricsData.data || metricsData);
                }

                // Fetch activity stats (monthly)
                const statsRes = await fetch(getApiUrl('/chisocothe/my/thongke'), {
                    headers: getAuthHeaders(true)
                });
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setActivityData(statsData.data || []);
                }

                // Fetch all trainers (PT list)
                const trainersRes = await fetch(getApiUrl('/user/pt'), {
                    headers: getAuthHeaders(true)
                });
                if (trainersRes.ok) {
                    const trainersData = await trainersRes.json();
                    console.log('🔍 Trainers data:', trainersData);
                    setTrainers(trainersData.data || trainersData || []);
                }

                // Fetch recommended activities (upcoming sessions)
                const activitiesRes = await fetch(getApiUrl('/lichtap'), {
                    headers: getAuthHeaders(true)
                });
                if (activitiesRes.ok) {
                    const activitiesData = await activitiesRes.json();
                    setRecommendedActivities(activitiesData.data || []);
                }

                // Fetch nutrition recommendations
                if (user._id) {
                    const nutritionRes = await fetch(getApiUrl(`/dinhduong/goi-y/${user._id}`), {
                        headers: getAuthHeaders(true)
                    });
                    if (nutritionRes.ok) {
                        const nutritionResData = await nutritionRes.json();
                        setNutritionData(nutritionResData.data || []);
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user?._id) {
            fetchDashboardData();
        }
    }, [user?._id]);

    const handleAction = (action) => {
        switch (action) {
            case 'subscribe':
                navigate('/packages');
                break;
            case 'book-pt':
                navigate('/booking');
                break;
            case 'my-schedule':
                navigate('/schedule');
                break;
            case 'body-metrics':
                navigate('/body-metrics');
                break;
            case 'nutrition':
                navigate('/nutrition');
                break;
            default:
                break;
        }
    };

    // Mock monthly activity data (can be replaced with real API data later)
    // TODO: Replace with real API endpoint when available (e.g., /lichsutap/thongke/monthly)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const activityPercentages = [30, 70, 50, 60, 9, 12, 11, 10]; // Mock data matching design

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#000000] p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <p className="text-gray-400 text-sm mb-1">{getGreeting()}</p>
                    <h1 className="text-4xl font-bold text-white">Chào mừng trở lại!</h1>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Activity & Output & Heart Rate */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Activity Chart - Custom Design */}
                    <div className="bg-[#1a1a1a] rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-white text-lg font-semibold">Hoạt động</h2>
                            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-end justify-between h-64 gap-4 px-2">
                            {months.map((month, idx) => {
                                const percentage = activityPercentages[idx];
                                return (
                                    <div key={month} className="flex-1 flex flex-col items-center justify-end h-full max-w-[70px]">
                                        {/* Bar Container */}
                                        <div className="relative w-full h-full flex items-end mb-3">
                                            {/* Background bar (full height, darker) */}
                                            <div className="absolute bottom-0 bg-black left-0 right-0 h-full bg-b rounded-2xl"></div>

                                            {/* Active bar (percentage height, lighter) */}
                                            <div
                                                className="relative w-full bg-[#4a4a4a] rounded-2xl transition-all duration-500 ease-out flex items-center justify-center"
                                                style={{ height: `${percentage}%` }}
                                            >
                                                {/* Percentage label inside bar */}
                                                <span className="text-white text-xs font-bold z-10">
                                                    {percentage < 10 ? `0${percentage}` : percentage}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Month label */}
                                        <span className="text-xs text-gray-400 font-medium">{month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Output & Heart Rate Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Output */}
                        <div className="bg-[#1a1a1a] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="#ffffff" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="26" cy="26" r="4"></circle>
                                        <rect x="9.9999" y="13" width="2" height="2"></rect>
                                        <rect x="9.9999" y="18" width="2" height="2"></rect>
                                        <rect x="9.9999" y="23" width="2" height="2"></rect>
                                        <rect x="13.9999" y="13" width="8" height="2"></rect>
                                        <rect x="13.9999" y="18" width="8" height="2"></rect>
                                        <rect x="13.9999" y="23" width="4.0001" height="2"></rect>
                                        <path d="M7,28V7h3v3H22V7h3V18h2V7a2,2,0,0,0-2-2H22V4a2,2,0,0,0-2-2H12a2,2,0,0,0-2,2V5H7A2,2,0,0,0,5,7V28a2,2,0,0,0,2,2H18V28ZM12,4h8V8H12Z" transform="translate(0 0)"></path>
                                    </svg>
                                    <h2 className="text-white text-lg font-semibold">Kết quả</h2>
                                </div>
                                <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                            <div className="space-y-4">
                                {/* Calorie Loss */}
                                <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">Calorie tiêu thụ</p>
                                            <p className="text-2xl text-white font-bold">{bodyMetrics?.caloriesBurned || 1230} <span className="text-sm text-gray-400">kcal</span></p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-2 bg-orange-500/20 rounded-full inline-flex items-center gap-1">
                                        <svg
                                            viewBox="-33 0 255 255"
                                            xmlns="http://www.w3.org/2000/svg"
                                            preserveAspectRatio="xMidYMid"
                                            className="w-4 h-4"
                                        >
                                            <defs>
                                                <linearGradient id="linear-gradient-1" gradientUnits="userSpaceOnUse" x1="94.141" y1="255" x2="94.141" y2="0.188">
                                                    <stop offset="0" stopColor="#ff4c0d" />
                                                    <stop offset="1" stopColor="#fc9502" />
                                                </linearGradient>
                                            </defs>
                                            <g id="fire">
                                                <path
                                                    d="M187.899,164.809 C185.803,214.868 144.574,254.812 94.000,254.812 C42.085,254.812 -0.000,211.312 -0.000,160.812 C-0.000,154.062 -0.121,140.572 10.000,117.812 C16.057,104.191 19.856,95.634 22.000,87.812 C23.178,83.513 25.469,76.683 32.000,87.812 C35.851,94.374 36.000,103.812 36.000,103.812 C36.000,103.812 50.328,92.817 60.000,71.812 C74.179,41.019 62.866,22.612 59.000,9.812 C57.662,5.384 56.822,-2.574 66.000,0.812 C75.352,4.263 100.076,21.570 113.000,39.812 C131.445,65.847 138.000,90.812 138.000,90.812 C138.000,90.812 143.906,83.482 146.000,75.812 C148.365,67.151 148.400,58.573 155.999,67.813 C163.226,76.600 173.959,93.113 180.000,108.812 C190.969,137.321 187.899,164.809 187.899,164.809 Z"
                                                    fill="url(#linear-gradient-1)"
                                                />
                                                <path
                                                    d="M94.000,254.812 C58.101,254.812 29.000,225.711 29.000,189.812 C29.000,168.151 37.729,155.000 55.896,137.166 C67.528,125.747 78.415,111.722 83.042,102.172 C83.953,100.292 86.026,90.495 94.019,101.966 C98.212,107.982 104.785,118.681 109.000,127.812 C116.266,143.555 118.000,158.812 118.000,158.812 C118.000,158.812 125.121,154.616 130.000,143.812 C131.573,140.330 134.753,127.148 143.643,140.328 C150.166,150.000 159.127,167.390 159.000,189.812 C159.000,225.711 129.898,254.812 94.000,254.812 Z"
                                                    fill="#fc9502"
                                                />
                                                <path
                                                    d="M95.000,183.812 C104.250,183.812 104.250,200.941 116.000,223.812 C123.824,239.041 112.121,254.812 95.000,254.812 C77.879,254.812 69.000,240.933 69.000,223.812 C69.000,206.692 85.750,183.812 95.000,183.812 Z"
                                                    fill="#fce202"
                                                />
                                            </g>
                                        </svg>

                                        <span className="text-orange-400 text-xs font-semibold">WOW</span>
                                    </div>

                                </div>

                                {/* Weight Loss */}
                                <div className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                            {/* <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                            </svg> */}
                                            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>chart-line-down</title> <path d="M11.079 17.942c0.12 0.264 0.381 0.444 0.685 0.444 0.087 0 0.17-0.015 0.248-0.042l-0.005 0.002 4.326-1.479 6.934 7.384h-2.811c-0.414 0-0.75 0.336-0.75 0.75s0.336 0.75 0.75 0.75v0h4.545c0.191-0.002 0.365-0.076 0.495-0.196l-0 0 0.019-0.008 0.004-0.008c0.131-0.127 0.215-0.302 0.225-0.497l0-0.002 0.005-0.024 0.003-0.017v-4.545c0-0.414-0.336-0.75-0.75-0.75s-0.75 0.336-0.75 0.75v0 2.65l-7.155-7.619c-0.138-0.146-0.332-0.236-0.548-0.236-0.086 0-0.169 0.015-0.247 0.041l0.005-0.002-4.137 1.415-4.484-10.012c-0.12-0.263-0.381-0.442-0.684-0.442-0.414 0-0.75 0.336-0.75 0.75 0 0.111 0.024 0.216 0.067 0.31l-0.002-0.005zM30 29.25h-27.25v-27.25c0-0.414-0.336-0.75-0.75-0.75s-0.75 0.336-0.75 0.75v0 28c0 0.414 0.336 0.75 0.75 0.75h28c0.414 0 0.75-0.336 0.75-0.75s-0.336-0.75-0.75-0.75v0z"></path> </g></svg>
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">Giảm cân</p>
                                            <p className="text-2xl text-white font-bold">{bodyMetrics?.weightLoss || 1.23} <span className="text-sm text-gray-400">kg</span></p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-green-500/20 rounded-full">
                                        <span className="text-green-400 text-xs font-semibold">👍 Tuyệt</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Heart Rate */}
                        <div className="bg-[#1a1a1a] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-2">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fillRule="evenodd" clipRule="evenodd" d="M8.96173 19.3707C6.01943 16.9714 2 13.0079 2 9.26044C2 3.3495 7.50016 0.662637 12 5.49877C16.4998 0.662637 22 3.34931 22 9.2604C22 13.008 17.9806 16.9714 15.0383 19.3707C13.7063 20.4569 13.0403 21 12 21C10.9597 21 10.2937 20.4569 8.96173 19.3707ZM10.0932 10.7463C10.1827 10.6184 10.2571 10.5122 10.3233 10.4213C10.3793 10.5188 10.4418 10.6324 10.517 10.7692L12.2273 13.8787C12.3933 14.1808 12.5562 14.4771 12.7197 14.6921C12.8947 14.9221 13.2023 15.2374 13.6954 15.2466C14.1884 15.2559 14.5077 14.9524 14.6912 14.7291C14.8627 14.5204 15.0365 14.2305 15.2138 13.9349L15.2692 13.8425C15.49 13.4745 15.629 13.2444 15.752 13.0782C15.8654 12.9251 15.9309 12.8751 15.9798 12.8475C16.0286 12.8198 16.1052 12.7894 16.2948 12.7709C16.5006 12.7509 16.7694 12.7501 17.1986 12.7501H18C18.4142 12.7501 18.75 12.4143 18.75 12.0001C18.75 11.5859 18.4142 11.2501 18 11.2501L17.1662 11.2501C16.7791 11.2501 16.4367 11.2501 16.1497 11.278C15.8385 11.3082 15.5357 11.3751 15.2407 11.5422C14.9457 11.7092 14.7325 11.9344 14.5465 12.1857C14.3749 12.4174 14.1988 12.711 13.9996 13.043L13.9521 13.1222C13.8654 13.2668 13.793 13.3872 13.7284 13.4906C13.6676 13.3849 13.5999 13.2618 13.5186 13.1141L11.8092 10.006C11.6551 9.7256 11.5015 9.44626 11.3458 9.24147C11.1756 9.01775 10.8839 8.72194 10.4164 8.6967C9.94887 8.67146 9.62698 8.93414 9.43373 9.13823C9.25683 9.32506 9.0741 9.58625 8.89069 9.84841L8.58131 10.2904C8.35416 10.6149 8.21175 10.8171 8.08848 10.9629C7.975 11.0971 7.91193 11.1411 7.86538 11.1653C7.81882 11.1896 7.74663 11.216 7.57159 11.232C7.38144 11.2494 7.13413 11.2501 6.73803 11.2501H6C5.58579 11.2501 5.25 11.5859 5.25 12.0001C5.25 12.4143 5.58579 12.7501 6 12.7501L6.76812 12.7501C7.12509 12.7501 7.44153 12.7501 7.70801 12.7258C7.99707 12.6994 8.27904 12.6411 8.55809 12.4958C8.83714 12.3505 9.04661 12.153 9.234 11.9313C9.40676 11.7269 9.58821 11.4677 9.79291 11.1752L10.0932 10.7463Z" fill="#da2128"></path> </g></svg>
                                    <h2 className="text-white text-lg font-semibold">Nhịp tim</h2>
                                </div>
                            </div>
                            <div className="relative h-40">
                                {/* Heart Rate Graph - Simplified Line */}
                                <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="heartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d="M0,40 Q20,20 40,35 T80,30 T120,40 T160,35 T200,30"
                                        fill="none"
                                        stroke="#ef4444"
                                        strokeWidth="2"
                                    />
                                    <path
                                        d="M0,40 Q20,20 40,35 T80,30 T120,40 T160,35 T200,30 L200,80 L0,80 Z"
                                        fill="url(#heartGradient)"
                                    />
                                </svg>

                                {/* Heart Rate Values */}
                                <div className="absolute top-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-400">
                                    <span>90b</span>
                                    <span className="text-lg text-white font-bold">{bodyMetrics?.nhipTim || 70} beats/m</span>
                                    <span>90b</span>
                                </div>

                                {/* Days Labels */}
                                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-400">
                                    <span>Sun</span>
                                    <span>Mon</span>
                                    <span>Tue</span>
                                    <span>Wed</span>
                                    <span>Thu</span>
                                    <span>Fri</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recommended Activity */}
                    <div className="bg-[#1a1a1a] rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-white text-lg font-semibold">Hoạt động đề xuất</h2>
                            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-3">
                            {recommendedActivities.slice(0, 3).map((activity, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-xl hover:bg-[#3a3a3a] transition-colors cursor-pointer">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{activity.tenBuoiTap || 'Fitness for beginners'}</p>
                                            <p className="text-gray-400 text-sm">{activity.thoiGian || '10 jan, 2024 at 9:30 PM'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
                                            <img src={activity.ptAvatar || 'https://i.pravatar.cc/150?img=12'} alt="PT" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-gray-300 text-sm">{activity.ptName || 'Jane Cooper'}</span>
                                    </div>
                                </div>
                            ))}
                            {recommendedActivities.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    <p>Chưa có hoạt động được đề xuất</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Trainers & Recommended Food */}
                <div className="space-y-6">
                    {/* Trainer Section */}
                    <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(to right, #a8ff78, #78ffd6)' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[#141414] text-lg font-semibold">Huấn luyện viên</h2>
                            <button onClick={() => handleAction('book-pt')} className="text-[#141414] text-xs hover:underline font-medium">Xem tất cả</button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar-horizontal">
                            {trainers.map((trainer, idx) => {
                                const ptData = trainer.nguoiDung || trainer;
                                const hoTen = ptData.hoTen || trainer.hoTen || 'PT';
                                const anhDaiDien = ptData.anhDaiDien || trainer.anhDaiDien;
                                const chuyenMon = trainer.chuyenMon || 'Fitness Expert';

                                const setTransparentFor = (id, value) => {
                                    setTrainerTransparentMap(prev => ({ ...prev, [id]: value }));
                                };

                                const imgOnLoad = (e, id) => {
                                    const img = e.target;
                                    try {
                                        const canvas = document.createElement('canvas');
                                        canvas.width = img.naturalWidth || img.width;
                                        canvas.height = img.naturalHeight || img.height;
                                        const ctx = canvas.getContext('2d');
                                        ctx.drawImage(img, 0, 0);
                                        const samples = [
                                            [0, 0],
                                            [canvas.width - 1, 0],
                                            [0, canvas.height - 1],
                                            [canvas.width - 1, canvas.height - 1],
                                            [Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)]
                                        ];
                                        let hasTransparency = false;
                                        for (const [x, y] of samples) {
                                            const data = ctx.getImageData(x, y, 1, 1).data;
                                            if (data[3] < 250) {
                                                hasTransparency = true;
                                                break;
                                            }
                                        }
                                        setTransparentFor(id, hasTransparency);
                                    } catch (err) {
                                        setTransparentFor(id, false);
                                    }
                                };

                                const imgOnError = (e, id) => {
                                    setTransparentFor(id, false);
                                    e.target.style.display = 'none';
                                    const fallback = e.target.nextElementSibling;
                                    if (fallback) fallback.style.display = 'flex';
                                };

                                const containerIsTransparent = trainerTransparentMap[trainer._id];

                                return (
                                    <div key={trainer._id || idx} className="bg-white/40 backdrop-blur-sm rounded-xl p-4 relative overflow-hidden hover:bg-white/60 transition-all cursor-pointer group min-w-[160px] flex-shrink-0">
                                        <button
                                            onClick={() => navigate(`/pt-profile/${trainer._id}`)}
                                            className="absolute top-1.5 right-1.5 w-9 h-9 rounded-full bg-white flex items-center justify-center transition-all"
                                        >
                                            <svg className="w-4 h-4 text-[#141414]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 17L17 7M17 7H7M17 7v10" />
                                            </svg>
                                        </button>
                                        <div className="flex flex-col items-center">
                                            <div className={`w-24 h-24 rounded-2xl mb-3 overflow-hidden ${containerIsTransparent ? 'bg-transparent' : 'bg-white/40'}`}>
                                                {anhDaiDien ? (
                                                    <img
                                                        src={anhDaiDien}
                                                        alt={hoTen}
                                                        crossOrigin="anonymous"
                                                        className="w-full h-full object-cover"
                                                        onLoad={(e) => imgOnLoad(e, trainer._id)}
                                                        onError={(e) => imgOnError(e, trainer._id)}
                                                    />
                                                ) : null}
                                                <div
                                                    className={`w-full h-full ${anhDaiDien ? 'hidden' : 'flex'} items-center justify-center text-gray-800 font-bold text-2xl`}
                                                    style={anhDaiDien ? {} : { display: 'flex' }}
                                                >
                                                    {hoTen.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <h3 className="text-gray-800 font-bold text-sm text-center leading-tight">
                                                {hoTen}
                                            </h3>
                                            <p className="text-gray-700 text-xs text-center mt-1">
                                                {chuyenMon}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            {trainers.length === 0 && !loading && (
                                <div className="w-full text-center py-8 text-gray-700">
                                    <p>Chưa có huấn luyện viên</p>
                                </div>
                            )}
                            {loading && (
                                <div className="w-full text-center py-8 text-gray-700">
                                    <p>Đang tải...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recommended Food */}
                    <div className="bg-[#1a1a1a] rounded-2xl p-6">
                        <h2 className="text-white text-lg font-semibold mb-4">Thực đơn gợi ý</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { day: 'Day 1', name: 'Rau & Hummus', time: '7 Ngày chỉ ăn tối', color: 'from-gray-700 to-gray-800', img: '🥗' },
                                { day: 'Day 2', name: 'Salad trộn', time: '12 Ngày ăn trưa', color: 'from-gray-700 to-gray-800', img: '🥙' },
                                { day: 'Day 3', name: 'Rau xanh đa dạng', time: '13 Ngày chỉ sáng', color: 'from-cyan-500 to-cyan-600', img: '🥬' },
                                { day: 'Day 4', name: 'Trái cây tổng hợp', time: '9 Ngày ăn sáng', color: 'from-gray-700 to-gray-800', img: '🍇' },
                            ].map((food, idx) => (
                                <div key={idx} className={`bg-gradient-to-br ${food.color} rounded-xl p-4 relative overflow-hidden h-32 cursor-pointer hover:scale-105 transition-transform`}>
                                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                        <span className="text-xs font-bold text-gray-800">{idx + 1}</span>
                                    </div>
                                    <div className="absolute bottom-3 left-3">
                                        <p className="text-white text-xs font-semibold">{food.day}</p>
                                        <p className="text-white/90 text-sm font-bold leading-tight">{food.name}</p>
                                        <p className="text-white/70 text-xs mt-1">{food.time}</p>
                                    </div>
                                    <div className="absolute bottom-2 right-2 text-4xl opacity-50">
                                        {food.img}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
