import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import ptService from '../../services/pt.service';

const PTStudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noteContent, setNoteContent] = useState('');
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        if (id) {
            loadStudentDetail();
        }
    }, [id]);

    const loadStudentDetail = async () => {
        try {
            setLoading(true);
            const response = await ptService.getStudentDetail(id);
            if (response.success) {
                setStudentData(response.data);
            }
        } catch (error) {
            console.error('Error loading student detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!noteContent.trim()) return;

        try {
            const response = await ptService.addStudentNote(id, noteContent);
            if (response.success) {
                setNoteContent('');
                loadStudentDetail();
            }
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    const tabs = [
        { id: 'info', label: 'Thông tin' },
        { id: 'metrics', label: 'Chỉ số cơ thể' },
        { id: 'history', label: 'Lịch sử tập' },
        { id: 'notes', label: 'Ghi chú' },
        { id: 'exercises', label: 'Bài tập' }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`ml-0 ${mainMarginLeft} mt-16 sm:mt-20 p-4 sm:p-6 transition-all duration-300`}>
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/pt/students')}
                        className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 cursor-pointer hover:underline"
                    >
                        ← Quay lại
                    </button>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Chi tiết học viên</h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128]"></div>
                        </div>
                    ) : studentData ? (
                        <div className="space-y-6">
                            {/* Student Info Card */}
                            <div className="bg-[#1a1a1a] p-4 sm:p-6 rounded-lg border border-[#2a2a2a]">
                                <div className="flex items-center gap-4 mb-4">
                                    {studentData.hoiVien?.anhDaiDien ? (
                                        <img
                                            src={studentData.hoiVien.anhDaiDien}
                                            alt={studentData.hoiVien.hoTen}
                                            className="w-20 h-20 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-[#da2128] flex items-center justify-center text-white font-bold text-2xl">
                                            {studentData.hoiVien?.hoTen?.charAt(0)?.toUpperCase() || 'H'}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-white font-semibold text-xl">{studentData.hoiVien?.hoTen}</h3>
                                        <p className="text-gray-400">{studentData.hoiVien?.sdt}</p>
                                        {studentData.hoiVien?.email && (
                                            <p className="text-gray-400 text-sm">{studentData.hoiVien.email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                                <div className="flex border-b border-[#2a2a2a] overflow-x-auto">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-4 py-3 font-medium transition-colors whitespace-nowrap cursor-pointer ${activeTab === tab.id
                                                ? 'text-[#da2128] border-b-2 border-[#da2128]'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4 sm:p-6">
                                    {activeTab === 'info' && (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-gray-400 text-sm">Ngày tham gia</p>
                                                <p className="text-white">
                                                    {studentData.hoiVien?.ngayThamGia
                                                        ? new Date(studentData.hoiVien.ngayThamGia).toLocaleDateString('vi-VN')
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                            {studentData.hoiVien?.hangHoiVien && (
                                                <div>
                                                    <p className="text-gray-400 text-sm">Hạng hội viên</p>
                                                    <p className="text-white">{studentData.hoiVien.hangHoiVien.tenHang || 'N/A'}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'metrics' && (
                                        <div className="space-y-4">
                                            {studentData.chiSoCoThe && studentData.chiSoCoThe.length > 0 ? (
                                                studentData.chiSoCoThe.map((metric, idx) => (
                                                    <div key={idx} className="bg-[#0a0a0a] p-4 rounded border border-[#2a2a2a]">
                                                        <p className="text-gray-400 text-sm mb-2">
                                                            {new Date(metric.ngayDo).toLocaleDateString('vi-VN')}
                                                        </p>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            {metric.canNang && (
                                                                <div>
                                                                    <p className="text-gray-400 text-xs">Cân nặng</p>
                                                                    <p className="text-white font-semibold">{metric.canNang} kg</p>
                                                                </div>
                                                            )}
                                                            {metric.chieuCao && (
                                                                <div>
                                                                    <p className="text-gray-400 text-xs">Chiều cao</p>
                                                                    <p className="text-white font-semibold">{metric.chieuCao} cm</p>
                                                                </div>
                                                            )}
                                                            {metric.bmi && (
                                                                <div>
                                                                    <p className="text-gray-400 text-xs">BMI</p>
                                                                    <p className="text-white font-semibold">{metric.bmi}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-400">Chưa có chỉ số cơ thể</p>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'history' && (
                                        <div className="space-y-4">
                                            {studentData.lichSuTap && studentData.lichSuTap.length > 0 ? (
                                                studentData.lichSuTap.map((history, idx) => (
                                                    <div key={idx} className="bg-[#0a0a0a] p-4 rounded border border-[#2a2a2a]">
                                                        <p className="text-white font-semibold">{history.buoiTap?.tenBuoiTap || 'N/A'}</p>
                                                        <p className="text-gray-400 text-sm">
                                                            {new Date(history.ngayTap).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-400">Chưa có lịch sử tập</p>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'notes' && (
                                        <div className="space-y-4">
                                            <form onSubmit={handleAddNote} className="mb-6">
                                                <textarea
                                                    value={noteContent}
                                                    onChange={(e) => setNoteContent(e.target.value)}
                                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 text-white mb-4 focus:outline-none focus:border-[#da2128]"
                                                    rows="4"
                                                    placeholder="Nhập ghi chú..."
                                                />
                                                <button
                                                    type="submit"
                                                    className="bg-[#da2128] text-white px-6 py-2 rounded-lg hover:bg-[#b31a20] transition"
                                                >
                                                    Thêm ghi chú
                                                </button>
                                            </form>
                                            <p className="text-gray-400">Ghi chú sẽ được hiển thị ở đây</p>
                                        </div>
                                    )}

                                    {activeTab === 'exercises' && (
                                        <div>
                                            <p className="text-gray-400">Danh sách bài tập đã gán sẽ được hiển thị ở đây</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-400">Không tìm thấy học viên</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PTStudentDetail;

