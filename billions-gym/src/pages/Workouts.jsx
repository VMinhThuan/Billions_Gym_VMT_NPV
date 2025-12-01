import React, { useState, useEffect } from "react";
import api from '../services/api';
import './Workouts.css';
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import FeaturedTrainers from "../components/chat/FeaturedTrainers";

const Workouts = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('popular'); // 'popular' hoặc 'latest'

    // Filters
    const [selectedTypes, setSelectedTypes] = useState([]); // Workout Types: Cardio, Strength, Yoga, Cycling, Pilates, Kickboxing
    const [selectedDifficulty, setSelectedDifficulty] = useState(''); // '', 'Beginner', 'Intermediate', 'Advanced'
    const [selectedDuration, setSelectedDuration] = useState({ min: 15, max: 60 });
    const [selectedEquipment, setSelectedEquipment] = useState([]); // No Equipment, Resistance Bands, Dumbbells, Yoga Mat

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        fetchWorkouts();
    }, []);

    const fetchWorkouts = async () => {
        try {
            setLoading(true);
            const response = await api.api.get('/session-templates/public?populateExercises=true');
            let data = [];

            if (Array.isArray(response)) {
                data = response;
            } else if (response.data && Array.isArray(response.data)) {
                data = response.data;
            }

            setWorkouts(data);
        } catch (error) {
            console.error('Error fetching workouts:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mapping workout types từ backend
    const getWorkoutType = (workout) => {
        const loai = workout.loai?.toLowerCase() || '';
        const ten = workout.ten?.toLowerCase() || '';

        if (loai.includes('cardio') || ten.includes('cardio')) return 'Cardio';
        if (loai.includes('strength') || ten.includes('strength') || ten.includes('sức mạnh')) return 'Strength';
        if (loai.includes('yoga') || ten.includes('yoga')) return 'Yoga';
        if (loai.includes('cycling') || ten.includes('cycling') || ten.includes('đạp xe')) return 'Cycling';
        if (loai.includes('pilates') || ten.includes('pilates')) return 'Pilates';
        if (loai.includes('kickboxing') || ten.includes('kickboxing')) return 'Kickboxing';

        return 'Strength'; // Default
    };

    const getDifficultyLabel = (difficulty) => {
        const map = {
            'DE': 'Beginner',
            'TRUNG_BINH': 'Intermediate',
            'KHO': 'Advanced'
        };
        return map[difficulty] || 'Intermediate';
    };

    const getDifficultyColor = (difficulty) => {
        const map = {
            'DE': '#10b981',
            'TRUNG_BINH': '#f59e0b',
            'KHO': '#ef4444'
        };
        return map[difficulty] || '#f59e0b';
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '30 mins'; // Default
        const mins = Math.floor(seconds / 60);
        return `${mins} mins`;
    };

    const getTotalDuration = (workout) => {
        if (!workout.baiTap || workout.baiTap.length === 0) return 30 * 60; // Default 30 mins

        const total = workout.baiTap.reduce((sum, exercise) => {
            return sum + (exercise.thoiGian || 0);
        }, 0);

        return total || 30 * 60;
    };

    const getEquipmentTags = (workout) => {
        if (!workout.baiTap || workout.baiTap.length === 0) return ['No Equipment'];

        const equipmentSet = new Set();
        workout.baiTap.forEach(exercise => {
            const equipment = exercise.thietBiSuDung?.toLowerCase() || '';
            if (!equipment || equipment.includes('không') || equipment.includes('none')) {
                equipmentSet.add('No Equipment');
            } else if (equipment.includes('dumbbell') || equipment.includes('tạ')) {
                equipmentSet.add('Dumbbells');
            } else if (equipment.includes('yoga mat') || equipment.includes('thảm')) {
                equipmentSet.add('Yoga Mat');
            } else if (equipment.includes('resistance') || equipment.includes('dây')) {
                equipmentSet.add('Resistance Bands');
            }
        });

        return equipmentSet.size > 0 ? Array.from(equipmentSet) : ['No Equipment'];
    };

    const getRating = (workout) => {
        // Tạm thời return random rating, sau này có thể lấy từ reviews
        return (4.5 + Math.random() * 0.5).toFixed(1);
    };

    const getTrainerName = (workout) => {
        // Placeholder - backend chưa có field trainer
        const names = ['Mike Anderson', 'Emma Lee', 'Jason White', 'Sarah Johnson', 'David Clark', 'Lisa Brown'];
        return names[Math.floor(Math.random() * names.length)];
    };

    // Filter workouts
    const filteredWorkouts = workouts.filter(workout => {
        // Type filter
        if (selectedTypes.length > 0) {
            const workoutType = getWorkoutType(workout);
            if (!selectedTypes.includes(workoutType)) return false;
        }

        // Difficulty filter
        if (selectedDifficulty) {
            const difficulty = getDifficultyLabel(workout.doKho);
            if (difficulty !== selectedDifficulty) return false;
        }

        // Duration filter
        const duration = getTotalDuration(workout) / 60; // convert to minutes
        if (duration < selectedDuration.min || duration > selectedDuration.max) return false;

        // Equipment filter
        if (selectedEquipment.length > 0) {
            const equipment = getEquipmentTags(workout);
            const hasMatch = equipment.some(eq => selectedEquipment.includes(eq));
            if (!hasMatch) return false;
        }

        return true;
    });

    // Sort workouts
    const sortedWorkouts = [...filteredWorkouts].sort((a, b) => {
        if (sortBy === 'popular') {
            return parseFloat(getRating(b)) - parseFloat(getRating(a));
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const toggleWorkoutType = (type) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleEquipment = (equipment) => {
        setSelectedEquipment(prev =>
            prev.includes(equipment) ? prev.filter(e => e !== equipment) : [...prev, equipment]
        );
    };

    const workoutTypes = [
        { name: 'Cardio', count: workouts.filter(w => getWorkoutType(w) === 'Cardio').length },
        { name: 'Strength', count: workouts.filter(w => getWorkoutType(w) === 'Strength').length },
        { name: 'Yoga', count: workouts.filter(w => getWorkoutType(w) === 'Yoga').length },
        { name: 'Cycling', count: workouts.filter(w => getWorkoutType(w) === 'Cycling').length },
        { name: 'Pilates', count: workouts.filter(w => getWorkoutType(w) === 'Pilates').length },
        { name: 'Kickboxing', count: workouts.filter(w => getWorkoutType(w) === 'Kickboxing').length },
    ];

    const equipmentOptions = [
        { name: 'No Equipment', count: workouts.filter(w => getEquipmentTags(w).includes('No Equipment')).length },
        { name: 'Resistance Bands', count: workouts.filter(w => getEquipmentTags(w).includes('Resistance Bands')).length },
        { name: 'Dumbbells', count: workouts.filter(w => getEquipmentTags(w).includes('Dumbbells')).length },
        { name: 'Yoga Mat', count: workouts.filter(w => getEquipmentTags(w).includes('Yoga Mat')).length },
    ];

    return (
        <>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={`min-h-screen bg-[#1D1617] workout-page ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex gap-6">
                        {/* Filter Modal/Sidebar */}
                        <aside className="w-[270px] flex-shrink-0 hidden lg:block">
                            <div className="bg-white rounded-[22px] p-6 sticky top-8 shadow-lg">
                                {/* Workout Type */}
                                <div className="mb-8">
                                    <h3 className="text-[#1D1617] font-semibold text-base mb-5">Workout Type</h3>
                                    <div className="space-y-3.5">
                                        {workoutTypes.map(type => (
                                            <label key={type.name} className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTypes.includes(type.name)}
                                                            onChange={() => toggleWorkoutType(type.name)}
                                                            className="w-[18px] h-[18px] rounded border-2 border-[#DDDADA] text-[#92A3FD] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#92A3FD]"
                                                        />
                                                    </div>
                                                    <span className="text-[14px] text-[#7B6F72] group-hover:text-[#1D1617] transition-colors">
                                                        {type.name}
                                                    </span>
                                                </div>
                                                <span className="text-[14px] text-[#ADA4A5] font-normal">{type.count}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Difficulty Level */}
                                <div className="mb-8">
                                    <h3 className="text-[#1D1617] font-semibold text-base mb-5">Difficulty Level</h3>
                                    <div className="space-y-3.5">
                                        {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                                            <label key={level} className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        name="difficulty"
                                                        checked={selectedDifficulty === level}
                                                        onChange={() => setSelectedDifficulty(level)}
                                                        className="w-[18px] h-[18px] border-2 border-[#DDDADA] text-[#92A3FD] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#92A3FD]"
                                                    />
                                                </div>
                                                <span className="text-[14px] text-[#7B6F72] group-hover:text-[#1D1617] transition-colors">
                                                    {level}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Duration */}
                                <div className="mb-8">
                                    <h3 className="text-[#1D1617] font-semibold text-base mb-4">
                                        Duration <span className="text-[14px] text-[#ADA4A5] font-normal">mins</span>
                                    </h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <input
                                            type="number"
                                            value={selectedDuration.min}
                                            onChange={(e) => setSelectedDuration({ ...selectedDuration, min: parseInt(e.target.value) })}
                                            className="w-[68px] px-3 py-2 text-[14px] border border-[#DDDADA] rounded-[12px] text-[#1D1617] focus:outline-none focus:border-[#92A3FD] transition-colors text-center"
                                        />
                                        <span className="text-[#ADA4A5]">-</span>
                                        <input
                                            type="number"
                                            value={selectedDuration.max}
                                            onChange={(e) => setSelectedDuration({ ...selectedDuration, max: parseInt(e.target.value) })}
                                            className="w-[68px] px-3 py-2 text-[14px] border border-[#DDDADA] rounded-[12px] text-[#1D1617] focus:outline-none focus:border-[#92A3FD] transition-colors text-center"
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="range"
                                            min="15"
                                            max="60"
                                            value={selectedDuration.max}
                                            onChange={(e) => setSelectedDuration({ ...selectedDuration, max: parseInt(e.target.value) })}
                                            className="w-full h-1 bg-[#F7F8F8] rounded-full appearance-none cursor-pointer slider-thumb"
                                        />
                                    </div>
                                </div>

                                {/* Equipment */}
                                <div>
                                    <h3 className="text-[#1D1617] font-semibold text-base mb-5">Equipment</h3>
                                    <div className="space-y-3.5">
                                        {equipmentOptions.map(equipment => (
                                            <label key={equipment.name} className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEquipment.includes(equipment.name)}
                                                            onChange={() => toggleEquipment(equipment.name)}
                                                            className="w-[18px] h-[18px] rounded border-2 border-[#DDDADA] text-[#92A3FD] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#92A3FD]"
                                                        />
                                                    </div>
                                                    <span className="text-[14px] text-[#7B6F72] group-hover:text-[#1D1617] transition-colors">
                                                        {equipment.name}
                                                    </span>
                                                </div>
                                                <span className="text-[14px] text-[#ADA4A5] font-normal">{equipment.count}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Featured Trainers */}
                                <div className="mt-6">
                                    <FeaturedTrainers />
                                </div>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <h1 className="text-white text-2xl font-bold">
                                    {sortedWorkouts.length} workouts for you
                                </h1>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-2 bg-white border-0 rounded-lg text-sm text-[#7B6F72] focus:outline-none focus:ring-2 focus:ring-[#92A3FD]"
                                >
                                    <option value="popular">Most Popular</option>
                                    <option value="latest">Latest</option>
                                </select>
                            </div>

                            {/* Workouts Grid or Empty State */}
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#92A3FD]"></div>
                                </div>
                            ) : sortedWorkouts.length === 0 ? (
                                <div className="flex items-center justify-center h-64">
                                    <p className="text-[#7B6F72] text-lg">Không tìm thấy workout phù hợp với bộ lọc của bạn</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {sortedWorkouts.map(workout => (
                                        <div
                                            key={workout._id}
                                            className="bg-white rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                            onClick={() => window.location.href = `/exercises?template=${workout._id}`}
                                        >
                                            {/* Image */}
                                            <div className="relative h-[220px] overflow-hidden bg-gradient-to-br from-[#ff9a9e] via-[#fad0c4] to-[#fad0c4]">
                                                <img
                                                    src={workout.hinhAnh || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600'}
                                                    alt={workout.ten}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute top-3 left-3">
                                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#2E3033]">
                                                        {getDifficultyLabel(workout.doKho)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-4">
                                                <h3 className="text-[#2E3033] font-semibold text-base mb-2 line-clamp-2">
                                                    {workout.ten}
                                                </h3>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                                                    <span className="text-sm text-[#7B6F72]">{getTrainerName(workout)}</span>
                                                    <span className="text-sm text-[#7B6F72]">•</span>
                                                    <span className="text-sm text-[#7B6F72]">{formatDuration(getTotalDuration(workout))}</span>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap mb-3">
                                                    {getEquipmentTags(workout).slice(0, 2).map(tag => (
                                                        <span
                                                            key={tag}
                                                            className="px-2 py-1 bg-[#f0f4ff] text-[#92A3FD] text-xs rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-yellow-400 text-sm">⭐</span>
                                                        <span className="text-sm font-medium text-[#2E3033]">{getRating(workout)}</span>
                                                    </div>
                                                    <span className="text-xs text-[#7B6F72]">{getWorkoutType(workout)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {sortedWorkouts.length === 0 && !loading && (
                                <div className="text-center py-12">
                                    <p className="text-[#7B6F72] text-lg">Không tìm thấy workout phù hợp với bộ lọc của bạn</p>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Workouts;
