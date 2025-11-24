import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import ptService from '../../services/pt.service';

const PTStudents = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        loadStudents();
    }, [searchQuery]);

    const loadStudents = async () => {
        try {
            setLoading(true);
            const response = await ptService.getMyStudents({ search: searchQuery });
            if (response.success) {
                setStudents(response.data.hoiViens || []);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    };

    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`ml-0 ${mainMarginLeft} mt-16 sm:mt-20 p-4 sm:p-6 transition-all duration-300`}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Học viên của tôi</h2>

                    <div className="mb-6">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm học viên..."
                            className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-[#da2128]"
                        />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128]"></div>
                        </div>
                    ) : students.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {students.map(student => (
                                <div
                                    key={student._id}
                                    onClick={() => navigate(`/pt/students/${student._id}`)}
                                    className="bg-[#1a1a1a] p-4 sm:p-6 rounded-lg border border-[#2a2a2a] cursor-pointer hover:border-[#da2128] transition-all hover:shadow-lg"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        {student.anhDaiDien ? (
                                            <img
                                                src={student.anhDaiDien}
                                                alt={student.hoTen}
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-[#da2128] flex items-center justify-center text-white font-bold text-xl">
                                                {student.hoTen?.charAt(0)?.toUpperCase() || 'H'}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-white font-semibold text-lg">{student.hoTen}</h3>
                                            <p className="text-gray-400 text-sm">{student.sdt}</p>
                                        </div>
                                    </div>
                                    {student.email && (
                                        <p className="text-gray-400 text-sm">{student.email}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-400">Không tìm thấy học viên nào</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PTStudents;

