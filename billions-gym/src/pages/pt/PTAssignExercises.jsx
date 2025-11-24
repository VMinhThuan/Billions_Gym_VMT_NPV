import React, { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import ptService from '../../services/pt.service';
import { api } from '../../services/api';

const PTAssignExercises = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [students, setStudents] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedExercise, setSelectedExercise] = useState('');
    const [deadline, setDeadline] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        loadStudents();
        loadExercises();
    }, []);

    const loadStudents = async () => {
        try {
            const response = await ptService.getMyStudents();
            if (response.success) {
                setStudents(response.data.hoiViens || []);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadExercises = async () => {
        try {
            const response = await api.get('/baitap');
            if (response && response.data) {
                setExercises(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error) {
            console.error('Error loading exercises:', error);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !selectedExercise) return;

        try {
            const response = await ptService.assignExerciseToStudent(selectedStudent, {
                baiTapId: selectedExercise,
                hanHoanThanh: deadline || null,
                ghiChu: note || ''
            });
            if (response.success) {
                alert('Gán bài tập thành công!');
                setSelectedStudent('');
                setSelectedExercise('');
                setDeadline('');
                setNote('');
            }
        } catch (error) {
            console.error('Error assigning exercise:', error);
            alert('Có lỗi xảy ra khi gán bài tập');
        }
    };

    const mainMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80';

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className={`ml-0 ${mainMarginLeft} mt-16 sm:mt-20 p-4 sm:p-6 transition-all duration-300`}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Gán bài tập</h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#da2128]"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Form gán bài tập */}
                            <div className="bg-[#1a1a1a] p-4 sm:p-6 rounded-lg border border-[#2a2a2a]">
                                <h3 className="text-white font-semibold text-lg mb-4">Gán bài tập mới</h3>
                                <form onSubmit={handleAssign} className="space-y-4">
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Chọn học viên</label>
                                        <select
                                            value={selectedStudent}
                                            onChange={(e) => setSelectedStudent(e.target.value)}
                                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-[#da2128]"
                                            required
                                        >
                                            <option value="">-- Chọn học viên --</option>
                                            {students.map(student => (
                                                <option key={student._id} value={student._id}>
                                                    {student.hoTen}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Chọn bài tập</label>
                                        <select
                                            value={selectedExercise}
                                            onChange={(e) => setSelectedExercise(e.target.value)}
                                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-[#da2128]"
                                            required
                                        >
                                            <option value="">-- Chọn bài tập --</option>
                                            {exercises.map(exercise => (
                                                <option key={exercise._id} value={exercise._id}>
                                                    {exercise.tenBaiTap}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Hạn hoàn thành (tùy chọn)</label>
                                        <input
                                            type="date"
                                            value={deadline}
                                            onChange={(e) => setDeadline(e.target.value)}
                                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-[#da2128]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Ghi chú (tùy chọn)</label>
                                        <textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-[#da2128]"
                                            rows="3"
                                            placeholder="Nhập ghi chú..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-[#da2128] text-white px-6 py-3 rounded-lg hover:bg-[#b31a20] transition font-semibold"
                                    >
                                        Gán bài tập
                                    </button>
                                </form>
                            </div>

                            {/* Danh sách học viên */}
                            <div className="bg-[#1a1a1a] p-4 sm:p-6 rounded-lg border border-[#2a2a2a]">
                                <h3 className="text-white font-semibold text-lg mb-4">Danh sách học viên</h3>
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    {students.map(student => (
                                        <div
                                            key={student._id}
                                            className="bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a] hover:border-[#da2128] transition"
                                        >
                                            <p className="text-white font-medium">{student.hoTen}</p>
                                            <p className="text-gray-400 text-sm">{student.sdt}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PTAssignExercises;

