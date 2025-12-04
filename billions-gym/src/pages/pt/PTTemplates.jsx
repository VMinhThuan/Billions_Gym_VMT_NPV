import { useState, useEffect } from 'react';
import {
    Search, Plus, Edit2, Trash2, X,
    Dumbbell, Clock, Target, ChevronDown,
    Save, Filter, Loader, CheckCircle2,
    AlertCircle, Image as ImageIcon, Grid3x3,
    List, Eye
} from 'lucide-react';
import Header from '../../components/layout/Header';
import PTSidebar from '../../components/pt/PTSidebar';
import { ptService } from '../../services/pt.service';
import { API_CONFIG } from '../../constants/api';

const PTTemplates = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    });

    // States
    const [templates, setTemplates] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // grid or list

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        ten: '',
        moTa: '',
        loai: '',
        doKho: 'TRUNG_BINH',
        baiTap: [],
        hinhAnh: ''
    });

    useEffect(() => {
        fetchTemplates();
        fetchExercises();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await ptService.getTemplates({ limit: 100 });
            if (response.success) {
                setTemplates(response.data.templates || []);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExercises = async () => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/baitap?limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setExercises(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching exercises:', error);
        }
    };

    const handleCreateTemplate = async () => {
        try {
            const response = await ptService.createTemplate(formData);
            if (response.success) {
                fetchTemplates();
                setShowCreateModal(false);
                resetForm();
                // Show success message if you have a toast notification system
            }
        } catch (error) {
            console.error('Error creating template:', error);
            alert('Có lỗi khi tạo template. Vui lòng thử lại.');
        }
    };

    const handleUpdateTemplate = async () => {
        try {
            const response = await ptService.updateTemplate(selectedTemplate._id, formData);
            if (response.success) {
                fetchTemplates();
                setShowEditModal(false);
                resetForm();
                // Show success message if you have a toast notification system
            }
        } catch (error) {
            console.error('Error updating template:', error);
            alert('Có lỗi khi cập nhật template. Vui lòng thử lại.');
        }
    };

    const handleDeleteTemplate = async () => {
        try {
            const response = await ptService.deleteTemplate(selectedTemplate._id);
            if (response.success) {
                fetchTemplates();
                setShowDeleteModal(false);
                setSelectedTemplate(null);
                // Show success message if you have a toast notification system
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Có lỗi khi xóa template. Vui lòng thử lại.');
        }
    };

    const handleAddExerciseToTemplate = (exerciseId) => {
        if (!formData.baiTap.includes(exerciseId)) {
            setFormData({ ...formData, baiTap: [...formData.baiTap, exerciseId] });
        }
    };

    const handleRemoveExerciseFromTemplate = (exerciseId) => {
        setFormData({ ...formData, baiTap: formData.baiTap.filter(id => id !== exerciseId) });
    };

    const resetForm = () => {
        setFormData({
            ten: '',
            moTa: '',
            loai: '',
            doKho: 'TRUNG_BINH',
            baiTap: [],
            hinhAnh: ''
        });
        setSelectedTemplate(null);
    };

    const openEditModal = (template) => {
        setSelectedTemplate(template);
        setFormData({
            ten: template.ten,
            moTa: template.moTa,
            loai: template.loai,
            doKho: template.doKho,
            baiTap: template.baiTap.map(ex => ex._id || ex),
            hinhAnh: template.hinhAnh || ''
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (template) => {
        setSelectedTemplate(template);
        setShowDeleteModal(true);
    };

    const getDifficultyColor = (doKho) => {
        switch (doKho) {
            case 'DE': return 'text-green-400 bg-green-500/20';
            case 'TRUNG_BINH': return 'text-yellow-400 bg-yellow-500/20';
            case 'KHO': return 'text-red-400 bg-red-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const getDifficultyLabel = (doKho) => {
        switch (doKho) {
            case 'DE': return 'Dễ';
            case 'TRUNG_BINH': return 'Trung bình';
            case 'KHO': return 'Khó';
            default: return 'Không xác định';
        }
    };

    const filteredTemplates = templates.filter(template => {
        const matchSearch = template.ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.moTa.toLowerCase().includes(searchTerm.toLowerCase());
        const matchDifficulty = filterDifficulty === 'all' || template.doKho === filterDifficulty;
        return matchSearch && matchDifficulty;
    });

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <PTSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'}`}>
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <div className="pt-16" style={{ minHeight: 'calc(100vh - 4rem)' }}>
                    <div className="p-8">
                        {/* Page Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Quản lý Template Buổi Tập</h1>
                                <p className="text-gray-400">Tạo và quản lý các template buổi tập để sử dụng cho học viên</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 bg-[#da2128] text-white rounded-lg hover:bg-[#c01d24] transition-all flex items-center gap-2 font-medium cursor-pointer"
                            >
                                <Plus size={20} />
                                Tạo Template Mới
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="bg-[#141414] rounded-xl p-5 mb-6">
                            <div className="flex items-center gap-4 flex-wrap">
                                {/* Search */}
                                <div className="flex-1 min-w-[300px]">
                                    <div className="relative">
                                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Tìm kiếm template..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a] focus:border-[#2a2a2a] focus:outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Difficulty Filter */}
                                <div className="relative">
                                    <select
                                        value={filterDifficulty}
                                        onChange={(e) => setFilterDifficulty(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg border border-[#2a2a2a] focus:outline-none text-sm cursor-pointer transition-all hover:border-[#3a3a3a]"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23999' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                            backgroundPosition: 'right 0.5rem center',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundSize: '1.5em 1.5em',
                                            paddingRight: '2.5rem',
                                            appearance: 'none'
                                        }}
                                    >
                                        <option value="all" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Tất cả độ khó</option>
                                        <option value="DE" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Dễ</option>
                                        <option value="TRUNG_BINH" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Trung bình</option>
                                        <option value="KHO" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Khó</option>
                                    </select>
                                </div>

                                {/* View Mode Toggle */}
                                <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-1 border border-[#2a2a2a]">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-all cursor-pointer ${viewMode === 'grid'
                                            ? 'bg-[#da2128] text-white'
                                            : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        <Grid3x3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-all cursor-pointer ${viewMode === 'list'
                                            ? 'bg-[#da2128] text-white'
                                            : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        <List size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Templates Grid/List */}
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader className="animate-spin text-[#da2128]" size={40} />
                            </div>
                        ) : filteredTemplates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Target size={64} className="mb-4 opacity-50" />
                                <p className="text-lg">Chưa có template nào</p>
                                <p className="text-sm mt-2">Tạo template mới để bắt đầu</p>
                            </div>
                        ) : (
                            <div className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                                    : 'space-y-4'
                            }>
                                {filteredTemplates.map((template) => {
                                    // Lấy hình ảnh từ bài tập đầu tiên nếu có
                                    const templateImage = template.baiTap?.[0]?.hinhAnh || template.baiTap?.[0]?.hinhAnhMinhHoa?.[0] || template.hinhAnh || null;

                                    return (
                                        <div
                                            key={template._id}
                                            className="bg-[#141414] rounded-xl border border-[#141414] overflow-hidden hover:bg-[#2a2a2a] transition-all cursor-pointer group"
                                        >
                                            {/* Template Image with Overlay */}
                                            {templateImage ? (
                                                <div className="relative h-48 overflow-hidden">
                                                    <img
                                                        src={templateImage}
                                                        alt={template.ten}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                    {/* Dark overlay */}
                                                    <div className="absolute inset-0 bg-black/40" />
                                                    {/* Gradient overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                                    {/* Difficulty Badge - Top Right */}
                                                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getDifficultyColor(template.doKho)}`}>
                                                        {getDifficultyLabel(template.doKho)}
                                                    </div>

                                                    {/* Title - Bottom with overlay */}
                                                    <div className="absolute inset-x-0 bottom-0 p-5">
                                                        <h3 className="text-white font-bold text-2xl group-hover:text-[#da2128] transition-colors line-clamp-2 drop-shadow-lg mb-2">
                                                            {template.ten}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-sm text-white/80">
                                                            <span>{template.baiTap?.length || 0} bài tập</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative h-48 bg-gradient-to-br from-[#da2128]/20 to-[#1a1a1a] flex items-center justify-center">
                                                    <Dumbbell size={64} className="text-[#da2128] opacity-50" />

                                                    {/* Difficulty Badge */}
                                                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.doKho)}`}>
                                                        {getDifficultyLabel(template.doKho)}
                                                    </div>

                                                    {/* Title for no image */}
                                                    <div className="absolute inset-x-0 bottom-0 p-5">
                                                        <h3 className="text-white/80 font-bold text-2xl group-hover:text-[#da2128] transition-colors line-clamp-2">
                                                            {template.ten}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                                                            <span>{template.baiTap?.length || 0} bài tập</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Template Content */}
                                            <div className="p-5">
                                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                                    {template.moTa || 'Chưa có mô tả'}
                                                </p>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(template)}
                                                        className="flex-1 px-4 py-2 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#0a0a0a] border border-[#2a2a2a] transition-all text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                                                    >
                                                        <Edit2 size={16} />
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(template)}
                                                        className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 border border-red-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                                                    >
                                                        <Trash2 size={16} />
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
                    <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-[#141414] border-b border-[#2a2a2a] p-6 flex items-center justify-between z-10">
                            <h2 className="text-2xl font-bold text-white">
                                {showCreateModal ? 'Tạo Template Mới' : 'Chỉnh Sửa Template'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setShowEditModal(false);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-all cursor-pointer"
                            >
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Template Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tên Template <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.ten}
                                    onChange={(e) => setFormData({ ...formData, ten: e.target.value })}
                                    placeholder="VD: Tập ngực - Vai - Tay sau"
                                    className="w-full px-4 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a] focus:border-[#3a3a3a] focus:outline-none transition-all"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Mô Tả</label>
                                <textarea
                                    value={formData.moTa}
                                    onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                                    placeholder="Mô tả chi tiết về buổi tập..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a] focus:border-[#3a3a3a] focus:outline-none resize-none transition-all"
                                />
                            </div>

                            {/* Type & Difficulty */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Loại Buổi Tập</label>
                                    <input
                                        type="text"
                                        value={formData.loai}
                                        onChange={(e) => setFormData({ ...formData, loai: e.target.value })}
                                        placeholder="VD: Strength Training, Cardio"
                                        className="w-full px-4 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a] focus:border-[#3a3a3a] focus:outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Độ Khó</label>
                                    <select
                                        value={formData.doKho}
                                        onChange={(e) => setFormData({ ...formData, doKho: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#1a1a1a] text-white rounded-lg border border-[#2a2a2a] focus:border-[#3a3a3a] focus:outline-none cursor-pointer transition-all hover:border-[#3a3a3a]"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23999' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                            backgroundPosition: 'right 0.5rem center',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundSize: '1.5em 1.5em',
                                            paddingRight: '2.5rem',
                                            appearance: 'none'
                                        }}
                                    >
                                        <option value="DE" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Dễ</option>
                                        <option value="TRUNG_BINH" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Trung bình</option>
                                        <option value="KHO" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>Khó</option>
                                    </select>
                                </div>
                            </div>

                            {/* Exercises Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Bài Tập ({formData.baiTap.length})
                                    </label>
                                    <button
                                        onClick={() => setShowExerciseModal(true)}
                                        className="px-4 py-2 bg-[#da2128] text-white rounded-lg hover:bg-[#c01d24] transition-all text-sm font-medium flex items-center gap-2 cursor-pointer"
                                    >
                                        <Plus size={16} />
                                        Thêm Bài Tập
                                    </button>
                                </div>

                                {/* Selected Exercises */}
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {formData.baiTap.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <Dumbbell size={48} className="mx-auto mb-2 opacity-50" />
                                            <p>Chưa có bài tập nào</p>
                                            <p className="text-sm mt-1">Nhấn "Thêm Bài Tập" để bắt đầu</p>
                                        </div>
                                    ) : (
                                        formData.baiTap.map((exerciseId, index) => {
                                            const exercise = exercises.find(e => e._id === exerciseId);
                                            if (!exercise) return null;

                                            return (
                                                <div
                                                    key={exerciseId}
                                                    className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]"
                                                >
                                                    <div className="flex items-center justify-center w-8 h-8 bg-[#da2128]/20 rounded-lg text-[#da2128] font-semibold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-white font-medium">{exercise.tenBaiTap}</p>
                                                        <p className="text-xs text-gray-400">{exercise.moTa}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveExerciseFromTemplate(exerciseId)}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer"
                                                    >
                                                        <Trash2 size={16} className="text-red-400" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-[#141414] border-t border-[#2a2a2a] p-6 flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setShowEditModal(false);
                                    resetForm();
                                }}
                                className="px-6 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-all font-medium cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={showCreateModal ? handleCreateTemplate : handleUpdateTemplate}
                                disabled={!formData.ten}
                                className="px-6 py-3 bg-[#da2128] text-white rounded-lg hover:bg-[#c01d24] transition-all font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={20} />
                                {showCreateModal ? 'Tạo Template' : 'Lưu Thay Đổi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Exercise Selection Modal */}
            {showExerciseModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
                    <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] w-full max-w-3xl max-h-[80vh] overflow-y-auto custom-scrollbar">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-[#141414] border-b border-[#2a2a2a] p-6 flex items-center justify-between z-10">
                            <h2 className="text-xl font-bold text-white">Chọn Bài Tập</h2>
                            <button
                                onClick={() => setShowExerciseModal(false)}
                                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-all cursor-pointer"
                            >
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <div className="space-y-2">
                                {exercises.map((exercise) => {
                                    const isSelected = formData.baiTap.includes(exercise._id);

                                    return (
                                        <div
                                            key={exercise._id}
                                            onClick={() => {
                                                if (isSelected) {
                                                    handleRemoveExerciseFromTemplate(exercise._id);
                                                } else {
                                                    handleAddExerciseToTemplate(exercise._id);
                                                }
                                            }}
                                            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${isSelected
                                                ? 'bg-[#da2128]/10 border-[#da2128]'
                                                : 'bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#0a0a0a]'
                                                }`}
                                        >
                                            <div className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-all ${isSelected
                                                ? 'bg-[#da2128] border-[#da2128]'
                                                : 'border-[#2a2a2a]'
                                                }`}>
                                                {isSelected && <CheckCircle2 size={16} className="text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{exercise.tenBaiTap}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-gray-400">{exercise.moTa}</span>
                                                    {exercise.nhomCo && (
                                                        <span className="px-2 py-0.5 bg-[#2a2a2a] text-gray-300 rounded text-xs">
                                                            {exercise.nhomCo}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-[#141414] border-t border-[#2a2a2a] p-6 flex items-center justify-end">
                            <button
                                onClick={() => setShowExerciseModal(false)}
                                className="px-6 py-3 bg-[#da2128] text-white rounded-lg hover:bg-[#c01d24] transition-all font-medium cursor-pointer"
                            >
                                Xong
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedTemplate && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
                    <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <AlertCircle size={24} className="text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Xác nhận xóa</h3>
                                    <p className="text-sm text-gray-400 mt-1">Thao tác này không thể hoàn tác</p>
                                </div>
                            </div>

                            <p className="text-gray-300 mb-6">
                                Bạn có chắc chắn muốn xóa template <strong className="text-white">"{selectedTemplate.ten}"</strong>?
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#2a2a2a] border border-[#2a2a2a] transition-all font-medium cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDeleteTemplate}
                                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium cursor-pointer"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PTTemplates;
