import React, { useState, useEffect } from "react";
import api from '../services/api';
import './Workout.css';
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";

const Workout = () => {
    const [workoutData, setWorkoutData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [templates, setTemplates] = useState([]); // playlists / templates
    const [banners, setBanners] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [pts, setPts] = useState([]);

    const VISIBLE_COUNT = 4;

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };

        window.addEventListener('sidebar:toggle', handleSidebarToggle);

        return () => {
            window.removeEventListener('sidebar:toggle', handleSidebarToggle);
        };
    }, []);

    useEffect(() => {
        const load = async () => {
            // Try to render cached data immediately while we fetch fresh data
            try {
                const cachedTpl = localStorage.getItem('workout_templates');
                const cachedPts = localStorage.getItem('workout_trainers');
                if (cachedTpl) {
                    try { const parsed = JSON.parse(cachedTpl); if (Array.isArray(parsed)) { setTemplates(parsed); setBanners(parsed.slice(0, 2)); } } catch (e) { /* ignore parse errors */ }
                }
                if (cachedPts) {
                    try { const parsedPts = JSON.parse(cachedPts); if (Array.isArray(parsedPts)) setPts(parsedPts.slice(0, 6)); } catch (e) { /* ignore parse errors */ }
                }
            } catch (e) {
                // ignore localStorage errors
            }

            setLoading(true);
            try {
                // Fetch templates and trainers in parallel to reduce total wait time
                const [tpl, trainers] = await Promise.all([
                    api.api.get('/session-templates/public'),
                    api.api.get('/user/pt')
                ]);

                if (Array.isArray(tpl)) {
                    setTemplates(tpl);
                    setBanners(tpl.slice(0, 2));
                    try { localStorage.setItem('workout_templates', JSON.stringify(tpl)); } catch (e) {/* ignore */ }
                }
                if (Array.isArray(trainers)) {
                    setPts(trainers.slice(0, 6));
                    try { localStorage.setItem('workout_trainers', JSON.stringify(trainers)); } catch (e) {/* ignore */ }
                }
            } catch (e) {
                console.error('Load workout page data failed', e);
                setError(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`min-h-screen bg-[#0a0a0a] workout-page ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} pb-10`}>
                {/* Loading state: show spinner until data loads */}
                {loading ? (
                    <div className="w-full flex items-center justify-center py-24">
                        <div role="status" className="flex flex-col items-center">
                            <svg className="animate-spin h-6 w-6" style={{ color: '#da2128' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#da2128" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="#da2128" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                            <span className="mt-3 text-[#da2128] text-sm">Đang tải dữ liệu...</span>
                        </div>
                    </div>
                ) : null}
                {/* Use a flex-based card so image is a flex item and won't be clipped. On small screens it stacks column-wise. */}
                {/* Top banners row (two banners horizontally) */}
                <div className="w-full flex gap-4 pl-8 pr-6 mt-12">
                    {banners.length ? banners.map((b, idx) => (
                        <div key={b._id || idx} className="flex-1 rounded-lg overflow-hidden relative h-36 md:h-40 lg:h-56 bg-[#0b0b0b]">
                            <img loading="eager" fetchpriority="high" src={b.hinhAnh || 'https://images.unsplash.com/photo-1517964100711-0a3b6f5a3f5f'} alt={b.ten} className="w-full h-full object-cover" />
                            <div className="absolute left-4 top-4 text-white font-semibold">{b.ten}</div>
                        </div>
                    )) : (
                        <div className="flex-1 rounded-lg overflow-hidden relative h-36 md:h-40 lg:h-56 bg-[#0a0a0a] animate-pulse"></div>
                    )}
                </div>

                {/* Playlists horizontal list */}
                <div className="w-full pl-8 pr-6 mt-6 pt-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-white text-xl mb-2">Các khóa học và bài tập phổ biến</h2>
                        <a className="text-sm text-[#da2128]" href="/courses">Xem tất cả</a>
                    </div>

                    <div className="mt-3">
                        <div className="flex gap-4 flex-wrap md:flex-nowrap py-2 w-full">
                            {templates.slice(0, VISIBLE_COUNT).map(t => (
                                <div key={t._id} className="rounded-lg overflow-hidden shadow-sm cursor-pointer flex-none w-56 sm:w-60 md:flex-1 md:min-w-0" onClick={async () => {
                                    try {
                                        const detail = await api.api.get(`/session-templates/public/${t._id}`);
                                        setSelectedTemplate(detail);
                                    } catch (e) { console.error(e); }
                                }}>
                                    <div className="h-36 sm:h-40 md:h-44 lg:h-48 overflow-hidden relative bg-[#0b0b0b]">
                                        <img loading="lazy" src={t.hinhAnh || ''} alt={t.ten} className="w-full h-full object-cover min-w-0" />
                                        {/* play icon centered over image with circular background for contrast (responsive sizes) */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="rounded-full w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-black bg-opacity-50 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 384" className="w-4 h-4 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white fill-current" aria-hidden="true">
                                                    <path d="m0 43l235 149L0 341V43z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="absolute left-2 bottom-2 bg-black bg-opacity-40 text-white text-xs md:text-sm px-2 py-1 rounded">{(t.baiTap && t.baiTap.length) || 0} videos</div>
                                    </div>
                                    <div className="p-3 bg-[#141414]">
                                        <div className="font-medium text-white text-sm">{t.ten}</div>
                                        <div className="text-sm text-gray-500">{t.moTa || ''}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Expanded playlist detail */}
                    {selectedTemplate && (
                        <div className="mt-6 bg-white rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">{selectedTemplate.ten}</h3>
                                <button className="text-sm text-blue-600" onClick={() => setSelectedTemplate(null)}>Close</button>
                            </div>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(selectedTemplate.baiTap || []).map(bt => (
                                    <div key={bt._id} className="flex items-center gap-3 p-2 border rounded">
                                        <img loading="lazy" src={bt.hinhAnh || bt.hinhAnhMinhHoa?.[0] || 'https://images.unsplash.com/photo-1517964100711-0a3b6f5a3f5f'} alt={bt.tenBaiTap} className="w-16 h-16 object-cover rounded" />
                                        <div>
                                            <div className="font-medium">{bt.tenBaiTap}</div>
                                            <div className="text-sm text-gray-500">{bt.thoiGian ? `${bt.thoiGian} min` : ''}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* PT list */}
                <div className="w-full pl-8 pr-6 mt-8 pt-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-white text-xl">Huấn Luyện Viên Nổi Bật</h2>
                        <a className="text-sm text-[#da2128]" href="/trainers">Xem tất cả</a>
                    </div>
                    <div className="mt-4">
                        <div className="flex flex-wrap gap-6 items-stretch">
                            {pts.slice(0, VISIBLE_COUNT).map(pt => (
                                <div key={pt._id} className="bg-[#141414] rounded-lg p-3 flex-none w-full sm:w-1/2 md:flex-1">
                                    <div className="flex items-center gap-3">
                                        <img loading="lazy" src={pt.anhDaiDien || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'} alt={pt.hoTen} className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-md object-cover border border-[#141414]" />
                                        <div>
                                            <div className="font-medium text-white">{pt.hoTen}</div>
                                            <div className="text-xs text-[#f2f2f2]">{pt.chuyenMon || 'Gym Trainer'}</div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end items-center gap-2">
                                        <button className="px-3 py-1.5 border border-[#da2128] rounded text-sm text-[#da2128] cursor-pointer hover:bg-[#da2128] hover:text-white hover:border-[#da2128] transition">Xem hồ sơ</button>
                                        <button aria-label={`Message ${pt.hoTen}`} className="px-2 py-1.5 cursor-pointer border rounded text-sm flex items-center justify-center bg-[#da2128] bg-opacity-5">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="w-4 h-4 text-white" fill="#ffffff" aria-hidden="true">
                                                <path d="M10 0c5.342 0 10 4.41 10 9.5c0 5.004-4.553 8.942-10 8.942a11.01 11.01 0 0 1-3.43-.546c-.464.45-.623.603-1.608 1.553c-.71.536-1.378.718-1.975.38c-.602-.34-.783-1.002-.66-1.874l.4-2.319C.99 14.002 0 11.842 0 9.5C0 4.41 4.657 0 10 0Zm0 1.4c-4.586 0-8.6 3.8-8.6 8.1c0 2.045.912 3.928 2.52 5.33l.02.017l.297.258l-.067.39l-.138.804l-.037.214l-.285 1.658a2.79 2.79 0 0 0-.03.337v.095c0 .005-.001.007-.002.008c.007-.01.143-.053.376-.223l2.17-2.106l.414.156a9.589 9.589 0 0 0 3.362.605c4.716 0 8.6-3.36 8.6-7.543c0-4.299-4.014-8.1-8.6-8.1ZM5.227 7.813a1.5 1.5 0 1 1 0 2.998a1.5 1.5 0 0 1 0-2.998Zm4.998 0a1.5 1.5 0 1 1 0 2.998a1.5 1.5 0 0 1 0-2.998Zm4.997 0 a1.5 1.5 0 1 1 0 2.998a1.5 1.5 0 0 1 0-2.998Z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Workout;