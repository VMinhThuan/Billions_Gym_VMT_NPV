import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Plus,
    X,
    GripVertical,
    Clock,
    Flame,
    Target,
    Trash2,
    Save,
    Send,
    ChevronDown,
    User,
    Calendar,
    Dumbbell,
    Play,
    AlertCircle,
    CheckCircle2,
    Eye,
    TrendingUp,
    ArrowLeft
} from 'lucide-react';
import PTSidebar from '../../components/pt/PTSidebar';
import Header from '../../components/layout/Header';
import ptService from '../../services/pt.service';
import { api } from '../../services/api';

const PTAssignExercises = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            return localStorage.getItem('sidebarCollapsed') === 'true';
        } catch (e) {
            return false;
        }
    });

    // States for student selection
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showStudentSelector, setShowStudentSelector] = useState(true);

    // States for exercises
    const [exercises, setExercises] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [filterMuscleGroup, setFilterMuscleGroup] = useState('all');
    const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
    const [showMuscleGroupDropdown, setShowMuscleGroupDropdown] = useState(false);
    const [showGoalDropdown, setShowGoalDropdown] = useState(false);

    // States for workout plan
    const [workoutPlan, setWorkoutPlan] = useState({
        warmUp: [],
        mainSets: [[], [], []],
        coolDown: []
    });

    // States for assignment details
    const [assignmentDetails, setAssignmentDetails] = useState({
        startDate: '',
        frequency: 3,
        duration: 4,
        goal: 'muscle_gain',
        note: ''
    });

    // States for preview
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudents();
        loadExercises();
    }, []);

    const handleToggleSidebar = () => {
        const newCollapsedState = !sidebarCollapsed;
        setSidebarCollapsed(newCollapsedState);
        try {
            localStorage.setItem('sidebarCollapsed', newCollapsedState);
        } catch (e) {
            console.error("Failed to save sidebar state to localStorage", e);
        }
    };

    const loadStudents = async () => {
        try {
            const response = await ptService.getMyStudents();
            if (response.success) {
                const studentsData = response.data.hoiViens || [];
                setStudents(studentsData);
            }
        } catch (error) {
            console.error('Error loading students:', error);
            // Mock data for development
            setStudents([
                {
                    _id: '1',
                    hoTen: 'Nguyễn Văn A',
                    anhDaiDien: 'https://i.pravatar.cc/150?img=1',
                    tuoi: 25,
                    mucTieu: 'Tăng cơ',
                    canNang: 70,
                    chieuCao: 175,
                    tienDo: 60
                },
                {
                    _id: '2',
                    hoTen: 'Trần Thị B',
                    anhDaiDien: 'https://i.pravatar.cc/150?img=5',
                    tuoi: 28,
                    mucTieu: 'Giảm cân',
                    canNang: 65,
                    chieuCao: 165,
                    tienDo: 45
                },
                {
                    _id: '3',
                    hoTen: 'Lê Văn C',
                    anhDaiDien: 'https://i.pravatar.cc/150?img=3',
                    tuoi: 30,
                    mucTieu: 'Tăng sức bền',
                    canNang: 75,
                    chieuCao: 180,
                    tienDo: 70
                }
            ]);
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
            // Mock data for development
            setExercises([
                {
                    _id: 'ex1',
                    tenBaiTap: 'Squat',
                    nhomCo: 'Chân',
                    mucDoKho: 'TRUNG_BINH',
                    thoiGian: 15,
                    hinhAnh: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
                    moTa: 'Bài tập squat cơ bản cho chân',
                    calo: 150
                },
                {
                    _id: 'ex2',
                    tenBaiTap: 'Bench Press',
                    nhomCo: 'Ngực',
                    mucDoKho: 'KHO',
                    thoiGian: 20,
                    hinhAnh: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
                    moTa: 'Bài tập ngực với tạ đòn',
                    calo: 200
                },
                {
                    _id: 'ex3',
                    tenBaiTap: 'Pull Up',
                    nhomCo: 'Lưng',
                    mucDoKho: 'KHO',
                    thoiGian: 10,
                    hinhAnh: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
                    moTa: 'Bài tập kéo xà đơn',
                    calo: 120
                },
                {
                    _id: 'ex4',
                    tenBaiTap: 'Plank',
                    nhomCo: 'Bụng',
                    mucDoKho: 'DE',
                    thoiGian: 5,
                    hinhAnh: 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=400',
                    moTa: 'Bài tập plank cho bụng',
                    calo: 80
                },
                {
                    _id: 'ex5',
                    tenBaiTap: 'Deadlift',
                    nhomCo: 'Lưng',
                    mucDoKho: 'KHO',
                    thoiGian: 25,
                    hinhAnh: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400',
                    moTa: 'Bài tập nâng tạ từ sàn',
                    calo: 250
                },
                {
                    _id: 'ex6',
                    tenBaiTap: 'Shoulder Press',
                    nhomCo: 'Vai',
                    mucDoKho: 'TRUNG_BINH',
                    thoiGian: 15,
                    hinhAnh: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
                    moTa: 'Bài tập đẩy vai',
                    calo: 180
                },
                {
                    _id: 'ex7',
                    tenBaiTap: 'Lunges',
                    nhomCo: 'Chân',
                    mucDoKho: 'DE',
                    thoiGian: 12,
                    hinhAnh: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
                    moTa: 'Bài tập chùng chân',
                    calo: 140
                },
                {
                    _id: 'ex8',
                    tenBaiTap: 'Bicep Curl',
                    nhomCo: 'Tay',
                    mucDoKho: 'DE',
                    thoiGian: 10,
                    hinhAnh: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400',
                    moTa: 'Bài tập cơ tay trước',
                    calo: 100
                }
            ]);
        }
    };

    const filteredExercises = exercises.filter(exercise => {
        const matchesSearch = exercise.tenBaiTap?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDifficulty = filterDifficulty === 'all' || exercise.mucDoKho === filterDifficulty;
        const matchesMuscleGroup = filterMuscleGroup === 'all' || exercise.nhomCo === filterMuscleGroup;
        return matchesSearch && matchesDifficulty && matchesMuscleGroup;
    });

    const getMuscleGroups = () => {
        const groups = new Set(exercises.map(ex => ex.nhomCo).filter(Boolean));
        return Array.from(groups);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'DE': return 'bg-green-500/20 text-green-400';
            case 'TRUNG_BINH': return 'bg-yellow-500/20 text-yellow-400';
            case 'KHO': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getDifficultyLabel = (difficulty) => {
        switch (difficulty) {
            case 'DE': return 'Dễ';
            case 'TRUNG_BINH': return 'Trung bình';
            case 'KHO': return 'Khó';
            default: return 'N/A';
        }
    };

    const addExerciseToPlan = (exercise, section) => {
        setWorkoutPlan(prev => {
            const newPlan = { ...prev };
            if (section === 'warmUp' || section === 'coolDown') {
                newPlan[section] = [...newPlan[section], { ...exercise, sets: 1, reps: 10, rest: 30 }];
            } else {
                const setIndex = parseInt(section.replace('mainSet', '')) - 1;
                newPlan.mainSets[setIndex] = [...newPlan.mainSets[setIndex], { ...exercise, sets: 3, reps: 12, rest: 60 }];
            }
            return newPlan;
        });
    };

    const removeExerciseFromPlan = (section, exerciseId) => {
        setWorkoutPlan(prev => {
            const newPlan = { ...prev };
            if (section === 'warmUp' || section === 'coolDown') {
                newPlan[section] = newPlan[section].filter(ex => ex._id !== exerciseId);
            } else {
                const setIndex = parseInt(section.replace('mainSet', '')) - 1;
                newPlan.mainSets[setIndex] = newPlan.mainSets[setIndex].filter(ex => ex._id !== exerciseId);
            }
            return newPlan;
        });
    };

    const updateExerciseParams = (section, exerciseId, field, value) => {
        setWorkoutPlan(prev => {
            const newPlan = { ...prev };
            if (section === 'warmUp' || section === 'coolDown') {
                const exercise = newPlan[section].find(ex => ex._id === exerciseId);
                if (exercise) exercise[field] = value;
            } else {
                const setIndex = parseInt(section.replace('mainSet', '')) - 1;
                const exercise = newPlan.mainSets[setIndex].find(ex => ex._id === exerciseId);
                if (exercise) exercise[field] = value;
            }
            return newPlan;
        });
    };

    const calculateTotalStats = () => {
        let totalTime = 0;
        let totalCalories = 0;
        let totalExercises = 0;

        // Warm up
        workoutPlan.warmUp.forEach(ex => {
            totalTime += ex.thoiGian || 5;
            totalCalories += (ex.calo || 50) * (ex.sets || 1);
            totalExercises++;
        });

        // Main sets
        workoutPlan.mainSets.forEach(set => {
            set.forEach(ex => {
                totalTime += (ex.thoiGian || 10) * (ex.sets || 3);
                totalCalories += (ex.calo || 100) * (ex.sets || 3);
                totalExercises++;
            });
        });

        // Cool down
        workoutPlan.coolDown.forEach(ex => {
            totalTime += ex.thoiGian || 5;
            totalCalories += (ex.calo || 30) * (ex.sets || 1);
            totalExercises++;
        });

        return { totalTime, totalCalories, totalExercises };
    };

    const handleSendPlan = async () => {
        if (!selectedStudent) {
            alert('Vui lòng chọn học viên');
            return;
        }

        const stats = calculateTotalStats();
        if (stats.totalExercises === 0) {
            alert('Vui lòng thêm ít nhất 1 bài tập vào kế hoạch');
            return;
        }

        try {
            // Collect all exercises from the plan
            const allExercises = [
                ...workoutPlan.warmUp,
                ...workoutPlan.mainSets.flat(),
                ...workoutPlan.coolDown
            ];

            // Send each exercise assignment
            for (const exercise of allExercises) {
                await ptService.assignExerciseToStudent(selectedStudent._id, {
                    baiTapId: exercise._id,
                    hanHoanThanh: assignmentDetails.startDate || null,
                    ghiChu: assignmentDetails.note || `${exercise.sets} sets x ${exercise.reps} reps, nghỉ ${exercise.rest}s`
                });
            }

            alert('Gửi kế hoạch tập thành công!');
            // Reset form
            setWorkoutPlan({ warmUp: [], mainSets: [[], [], []], coolDown: [] });
            setAssignmentDetails({ startDate: '', frequency: 3, duration: 4, goal: 'muscle_gain', note: '' });
            setSelectedStudent(null);
            setShowStudentSelector(true);
        } catch (error) {
            console.error('Error sending plan:', error);
            alert('Có lỗi xảy ra khi gửi kế hoạch tập');
        }
    };

    const stats = calculateTotalStats();

    if (showStudentSelector) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white">
                <PTSidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    collapsed={sidebarCollapsed}
                    onToggle={handleToggleSidebar}
                />

                <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'}`}>
                    <Header />

                    <div className="pt-16" style={{ minHeight: 'calc(100vh - 4rem)' }}>
                        <div className="p-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Gán Bài Tập Cho Học Viên</h1>
                            <p className="text-gray-400 mb-8">Chọn học viên để tạo kế hoạch tập luyện</p>

                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 "></div>
                                </div>
                            ) : students.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <User size={64} className="mb-4 opacity-50" />
                                    <p className="text-lg">Chưa có học viên nào</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {students.map((student) => (
                                        <div
                                            key={student._id}
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setShowStudentSelector(false);
                                            }}
                                            className="bg-[#141414] rounded-xl border border-[#141414] p-6 hover:bg-[#2a2a2a] transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4 mb-4">
                                                <img
                                                    src={student.anhDaiDien || 'https://i.pravatar.cc/150'}
                                                    alt={student.hoTen}
                                                    className="w-16 h-16 rounded-full object-cover"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="text-white font-bold text-lg group-hover:text-[#da2128] transition-colors">
                                                        {student.hoTen}
                                                    </h3>
                                                    <p className="text-sm text-gray-400">{student.tuoi} tuổi</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-400">Mục tiêu:</span>
                                                    <span className="text-white font-medium">{student.mucTieu}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-400">Cân nặng:</span>
                                                    <span className="text-white font-medium">{student.canNang} kg</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-400">Tiến độ:</span>
                                                    <span className="text-[#da2128] font-medium">{student.tienDo}%</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                                                <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                                                    <div
                                                        className="bg-[#da2128] h-2 rounded-full transition-all"
                                                        style={{ width: `${student.tienDo}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <PTSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggle={handleToggleSidebar}
            />

            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'}`}>
                <Header />

                <div className="pt-16 pb-24 w-full" style={{ minHeight: 'calc(100vh - 4rem)' }}>
                    {/* Header with student info */}
                    <div className="bg-[#141414] border-b border-[#2a2a2a] px-6 py-4 w-full">
                        <div>
                            <button
                                onClick={() => setShowStudentSelector(true)}
                                className="flex items-center gap-2 text-gray-400 hover:text-white hover:underline mb-4 transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={20} />
                                <span>Chọn học viên khác</span>
                            </button>

                            <div className="flex items-center gap-6">
                                <img
                                    src={selectedStudent?.anhDaiDien || 'https://i.pravatar.cc/150'}
                                    alt={selectedStudent?.hoTen}
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-white mb-1">
                                        Gán Bài Tập Cho {selectedStudent?.hoTen}
                                    </h1>
                                    <div className="flex items-center gap-6 text-sm text-gray-400">
                                        <span>Mục tiêu: {selectedStudent?.mucTieu}</span>
                                        <span>•</span>
                                        <span>Cân nặng: {selectedStudent?.canNang} kg</span>
                                        <span>•</span>
                                        <span>Tiến độ: {selectedStudent?.tienDo}%</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowGoalDropdown(!showGoalDropdown)}
                                            className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors flex items-center gap-2 cursor-pointer min-w-[160px] justify-between"
                                        >
                                            <span className="text-sm">
                                                {assignmentDetails.goal === 'muscle_gain' ? 'Tăng cơ' :
                                                    assignmentDetails.goal === 'weight_loss' ? 'Giảm cân' :
                                                        assignmentDetails.goal === 'endurance' ? 'Tăng sức bền' : 'Tăng sức mạnh'}
                                            </span>
                                            <ChevronDown className="w-4 h-4" />
                                        </button>

                                        {showGoalDropdown && (
                                            <div className="absolute right-0 top-12 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-10">
                                                <div className="p-2">
                                                    <button
                                                        onClick={() => { setAssignmentDetails({ ...assignmentDetails, goal: 'muscle_gain' }); setShowGoalDropdown(false); }}
                                                        className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${assignmentDetails.goal === 'muscle_gain' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                            }`}
                                                    >
                                                        Tăng cơ
                                                    </button>
                                                    <button
                                                        onClick={() => { setAssignmentDetails({ ...assignmentDetails, goal: 'weight_loss' }); setShowGoalDropdown(false); }}
                                                        className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${assignmentDetails.goal === 'weight_loss' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                            }`}
                                                    >
                                                        Giảm cân
                                                    </button>
                                                    <button
                                                        onClick={() => { setAssignmentDetails({ ...assignmentDetails, goal: 'endurance' }); setShowGoalDropdown(false); }}
                                                        className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${assignmentDetails.goal === 'endurance' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                            }`}
                                                    >
                                                        Tăng sức bền
                                                    </button>
                                                    <button
                                                        onClick={() => { setAssignmentDetails({ ...assignmentDetails, goal: 'strength' }); setShowGoalDropdown(false); }}
                                                        className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${assignmentDetails.goal === 'strength' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                            }`}
                                                    >
                                                        Tăng sức mạnh
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="px-4 py-6">
                        <div className="grid grid-cols-12 gap-4">
                            {/* Left: Exercise Library */}
                            <div className="col-span-5 space-y-4">
                                <div className="bg-[#141414] rounded-xl p-4">
                                    <h2 className="text-xl font-bold text-white mb-4">Thư Viện Bài Tập</h2>

                                    {/* Search & Filters */}
                                    <div className="space-y-3 mb-4">
                                        <div className="relative">
                                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Tìm kiếm bài tập..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a] focus:outline-none text-sm"
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            {/* Difficulty Filter */}
                                            <div className="relative flex-1">
                                                <button
                                                    onClick={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
                                                    className="w-full px-3 py-2 bg-[#1a1a1a] text-white rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors flex items-center justify-between cursor-pointer"
                                                >
                                                    <span className="text-sm">
                                                        {filterDifficulty === 'all' ? 'Tất cả độ khó' :
                                                            filterDifficulty === 'DE' ? 'Dễ' :
                                                                filterDifficulty === 'TRUNG_BINH' ? 'Trung bình' : 'Khó'}
                                                    </span>
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>

                                                {showDifficultyDropdown && (
                                                    <div className="absolute left-0 top-12 w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-10">
                                                        <div className="p-2">
                                                            <button
                                                                onClick={() => { setFilterDifficulty('all'); setShowDifficultyDropdown(false); }}
                                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${filterDifficulty === 'all' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                                    }`}
                                                            >
                                                                Tất cả độ khó
                                                            </button>
                                                            <button
                                                                onClick={() => { setFilterDifficulty('DE'); setShowDifficultyDropdown(false); }}
                                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${filterDifficulty === 'DE' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                                    }`}
                                                            >
                                                                Dễ
                                                            </button>
                                                            <button
                                                                onClick={() => { setFilterDifficulty('TRUNG_BINH'); setShowDifficultyDropdown(false); }}
                                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${filterDifficulty === 'TRUNG_BINH' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                                    }`}
                                                            >
                                                                Trung bình
                                                            </button>
                                                            <button
                                                                onClick={() => { setFilterDifficulty('KHO'); setShowDifficultyDropdown(false); }}
                                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${filterDifficulty === 'KHO' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                                    }`}
                                                            >
                                                                Khó
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Muscle Group Filter */}
                                            <div className="relative flex-1">
                                                <button
                                                    onClick={() => setShowMuscleGroupDropdown(!showMuscleGroupDropdown)}
                                                    className="w-full px-3 py-2 bg-[#1a1a1a] text-white rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors flex items-center justify-between cursor-pointer"
                                                >
                                                    <span className="text-sm">
                                                        {filterMuscleGroup === 'all' ? 'Tất cả nhóm cơ' : filterMuscleGroup}
                                                    </span>
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>

                                                {showMuscleGroupDropdown && (
                                                    <div className="absolute left-0 top-12 w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-10">
                                                        <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                                                            <button
                                                                onClick={() => { setFilterMuscleGroup('all'); setShowMuscleGroupDropdown(false); }}
                                                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${filterMuscleGroup === 'all' ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                                    }`}
                                                            >
                                                                Tất cả nhóm cơ
                                                            </button>
                                                            {getMuscleGroups().map(group => (
                                                                <button
                                                                    key={group}
                                                                    onClick={() => { setFilterMuscleGroup(group); setShowMuscleGroupDropdown(false); }}
                                                                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${filterMuscleGroup === group ? 'bg-[#da2128] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                                        }`}
                                                                >
                                                                    {group}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exercise List */}
                                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredExercises.map((exercise) => (
                                            <div
                                                key={exercise._id}
                                                className="group bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a] hover:border-[#da2128] transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={exercise.hinhAnh}
                                                        alt={exercise.tenBaiTap}
                                                        className="w-16 h-16 object-cover rounded-md"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-white font-medium text-sm mb-1 truncate">
                                                            {exercise.tenBaiTap}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <span className={`px-2 py-0.5 rounded ${getDifficultyColor(exercise.mucDoKho)}`}>
                                                                {getDifficultyLabel(exercise.mucDoKho)}
                                                            </span>
                                                            <span>{exercise.nhomCo}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            onClick={() => addExerciseToPlan(exercise, 'warmUp')}
                                                            className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 transition-colors"
                                                            title="Thêm vào Warm-up"
                                                        >
                                                            W
                                                        </button>
                                                        <button
                                                            onClick={() => addExerciseToPlan(exercise, 'mainSet1')}
                                                            className="px-2 py-1 bg-[#da2128]/20 text-[#da2128] text-xs rounded hover:bg-[#da2128]/30 transition-colors"
                                                            title="Thêm vào Main Set"
                                                        >
                                                            M
                                                        </button>
                                                        <button
                                                            onClick={() => addExerciseToPlan(exercise, 'coolDown')}
                                                            className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded hover:bg-green-500/30 transition-colors"
                                                            title="Thêm vào Cool-down"
                                                        >
                                                            C
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Plan Builder */}
                            <div className="col-span-7 space-y-4">
                                {/* Warm Up */}
                                <div className="bg-[#141414] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                            Warm-up
                                        </h3>
                                        <span className="text-xs text-gray-400">{workoutPlan.warmUp.length} bài tập</span>
                                    </div>
                                    <div className="space-y-2 min-h-[80px]">
                                        {workoutPlan.warmUp.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 text-sm">
                                                Kéo thả bài tập vào đây hoặc nhấn nút W
                                            </div>
                                        ) : (
                                            workoutPlan.warmUp.map((exercise) => (
                                                <ExerciseCard
                                                    key={exercise._id}
                                                    exercise={exercise}
                                                    section="warmUp"
                                                    onRemove={removeExerciseFromPlan}
                                                    onUpdate={updateExerciseParams}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Main Sets */}
                                {[1, 2, 3].map((setNum) => (
                                    <div key={setNum} className="bg-[#141414] rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-white font-bold flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#da2128]"></div>
                                                Main Set {setNum}
                                            </h3>
                                            <span className="text-xs text-gray-400">
                                                {workoutPlan.mainSets[setNum - 1].length} bài tập
                                            </span>
                                        </div>
                                        <div className="space-y-2 min-h-[80px]">
                                            {workoutPlan.mainSets[setNum - 1].length === 0 ? (
                                                <div className="text-center py-8 text-gray-500 text-sm">
                                                    Kéo thả bài tập vào đây hoặc nhấn nút M
                                                </div>
                                            ) : (
                                                workoutPlan.mainSets[setNum - 1].map((exercise) => (
                                                    <ExerciseCard
                                                        key={exercise._id}
                                                        exercise={exercise}
                                                        section={`mainSet${setNum}`}
                                                        onRemove={removeExerciseFromPlan}
                                                        onUpdate={updateExerciseParams}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Cool Down */}
                                <div className="bg-[#141414] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                            Cool-down
                                        </h3>
                                        <span className="text-xs text-gray-400">{workoutPlan.coolDown.length} bài tập</span>
                                    </div>
                                    <div className="space-y-2 min-h-[80px]">
                                        {workoutPlan.coolDown.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500 text-sm">
                                                Kéo thả bài tập vào đây hoặc nhấn nút C
                                            </div>
                                        ) : (
                                            workoutPlan.coolDown.map((exercise) => (
                                                <ExerciseCard
                                                    key={exercise._id}
                                                    exercise={exercise}
                                                    section="coolDown"
                                                    onRemove={removeExerciseFromPlan}
                                                    onUpdate={updateExerciseParams}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Bottom Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-[#2a2a2a] py-3 z-40">
                    <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'} px-4`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-gray-400" />
                                    <div>
                                        <div className="text-xs text-gray-400">Tổng thời gian</div>
                                        <div className="text-white font-bold">{stats.totalTime} phút</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Flame size={18} className="text-orange-400" />
                                    <div>
                                        <div className="text-xs text-gray-400">Calo ước tính</div>
                                        <div className="text-white font-bold">{stats.totalCalories} kcal</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Dumbbell size={18} className="text-[#da2128]" />
                                    <div>
                                        <div className="text-xs text-gray-400">Số bài tập</div>
                                        <div className="text-white font-bold">{stats.totalExercises}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="date"
                                    value={assignmentDetails.startDate}
                                    onChange={(e) => setAssignmentDetails({ ...assignmentDetails, startDate: e.target.value })}
                                    className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg border border-[#2a2a2a] focus:outline-none cursor-pointer"
                                />
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className="px-6 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <Eye size={18} />
                                    Preview
                                </button>
                                <button
                                    onClick={handleSendPlan}
                                    disabled={stats.totalExercises === 0}
                                    className="px-6 py-2 bg-[#da2128] text-white rounded-lg hover:bg-[#c01d24] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <Send size={18} />
                                    Gửi Kế Hoạch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Modal */}
                {showPreview && (
                    <PreviewModal
                        student={selectedStudent}
                        workoutPlan={workoutPlan}
                        stats={stats}
                        onClose={() => setShowPreview(false)}
                    />
                )}
            </div>
        </div>
    );
};

// Exercise Card Component
const ExerciseCard = ({ exercise, section, onRemove, onUpdate }) => {
    return (
        <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a] hover:border-[#da2128] transition-all">
            <div className="flex items-center gap-3">
                <GripVertical size={16} className="text-gray-600 cursor-move" />
                <img
                    src={exercise.hinhAnh}
                    alt={exercise.tenBaiTap}
                    className="w-12 h-12 object-cover rounded-md"
                />
                <div className="flex-1">
                    <h4 className="text-white font-medium text-sm mb-1">{exercise.tenBaiTap}</h4>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400">Sets:</span>
                            <input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => onUpdate(section, exercise._id, 'sets', parseInt(e.target.value) || 1)}
                                className="w-12 px-1 py-0.5 bg-[#1a1a1a] text-white rounded border border-[#2a2a2a] focus:border-[#da2128] focus:outline-none text-center"
                                min="1"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400">Reps:</span>
                            <input
                                type="number"
                                value={exercise.reps}
                                onChange={(e) => onUpdate(section, exercise._id, 'reps', parseInt(e.target.value) || 1)}
                                className="w-12 px-1 py-0.5 bg-[#1a1a1a] text-white rounded border border-[#2a2a2a] focus:border-[#da2128] focus:outline-none text-center"
                                min="1"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400">Rest:</span>
                            <input
                                type="number"
                                value={exercise.rest}
                                onChange={(e) => onUpdate(section, exercise._id, 'rest', parseInt(e.target.value) || 30)}
                                className="w-12 px-1 py-0.5 bg-[#1a1a1a] text-white rounded border border-[#2a2a2a] focus:border-[#da2128] focus:outline-none text-center"
                                min="0"
                                step="10"
                            />
                            <span className="text-gray-400">s</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => onRemove(section, exercise._id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

// Preview Modal Component
const PreviewModal = ({ student, workoutPlan, stats, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-[#141414] rounded-xl border border-[#2a2a2a] w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="sticky top-0 bg-[#141414] border-b border-[#2a2a2a] p-6 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-white">Xem Trước Kế Hoạch</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-all cursor-pointer"
                    >
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Student Info */}
                    <div className="bg-[#1a1a1a] rounded-lg p-4 flex items-center gap-4">
                        <img
                            src={student?.anhDaiDien || 'https://i.pravatar.cc/150'}
                            alt={student?.hoTen}
                            className="w-16 h-16 rounded-full object-cover "
                        />
                        <div>
                            <h3 className="text-white font-bold text-lg">{student?.hoTen}</h3>
                            <p className="text-gray-400 text-sm">Mục tiêu: {student?.mucTieu}</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
                            <Clock size={24} className="mx-auto mb-2 text-gray-400" />
                            <div className="text-2xl font-bold text-white">{stats.totalTime}</div>
                            <div className="text-xs text-gray-400">Phút</div>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
                            <Flame size={24} className="mx-auto mb-2 text-orange-400" />
                            <div className="text-2xl font-bold text-white">{stats.totalCalories}</div>
                            <div className="text-xs text-gray-400">Calo</div>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
                            <Dumbbell size={24} className="mx-auto mb-2 text-[#da2128]" />
                            <div className="text-2xl font-bold text-white">{stats.totalExercises}</div>
                            <div className="text-xs text-gray-400">Bài tập</div>
                        </div>
                    </div>

                    {/* Workout Sections */}
                    {workoutPlan.warmUp.length > 0 && (
                        <div>
                            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                Warm-up
                            </h3>
                            <div className="space-y-2">
                                {workoutPlan.warmUp.map((ex, idx) => (
                                    <PreviewExerciseCard key={idx} exercise={ex} />
                                ))}
                            </div>
                        </div>
                    )}

                    {workoutPlan.mainSets.map((set, setIdx) => (
                        set.length > 0 && (
                            <div key={setIdx}>
                                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#da2128]"></div>
                                    Main Set {setIdx + 1}
                                </h3>
                                <div className="space-y-2">
                                    {set.map((ex, idx) => (
                                        <PreviewExerciseCard key={idx} exercise={ex} />
                                    ))}
                                </div>
                            </div>
                        )
                    ))}

                    {workoutPlan.coolDown.length > 0 && (
                        <div>
                            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                Cool-down
                            </h3>
                            <div className="space-y-2">
                                {workoutPlan.coolDown.map((ex, idx) => (
                                    <PreviewExerciseCard key={idx} exercise={ex} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PreviewExerciseCard = ({ exercise }) => {
    return (
        <div className="bg-[#0a0a0a] rounded-lg p-3 flex items-center gap-3">
            <img
                src={exercise.hinhAnh}
                alt={exercise.tenBaiTap}
                className="w-16 h-16 object-cover rounded-md"
            />
            <div className="flex-1">
                <h4 className="text-white font-medium mb-1">{exercise.tenBaiTap}</h4>
                <p className="text-sm text-gray-400">
                    {exercise.sets} sets × {exercise.reps} reps • {exercise.rest}s nghỉ
                </p>
            </div>
        </div>
    );
};

export default PTAssignExercises;

