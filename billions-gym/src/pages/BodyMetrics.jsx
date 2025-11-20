import { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import authUtils from '../utils/auth';
import { bodyMetricsAPI } from '../services/api';
import './BodyMetrics.css';

// Component mô hình 3D con người chi tiết cao
const HumanModel = ({ height = 170, weight = 70, chest = 90, waist = 75, hips = 95 }) => {
    // Tính toán tỷ lệ dựa trên chiều cao và cân nặng
    const heightScale = height / 170;
    const weightScale = Math.pow(weight / 70, 0.33);
    const chestScale = chest / 90;
    const waistScale = waist / 75;
    const hipScale = hips / 95;

    // Màu sắc thực tế
    const skinColor = "#d4a574"; // Màu da tự nhiên
    const shirtColor = "#5b9bd5"; // Màu áo xanh dương
    const pantsColor = "#c19a6b"; // Màu quần kaki
    const shoesColor = "#4a4a4a"; // Màu giày xám đen
    const hairColor = "#2c2c2c"; // Màu tóc đen
    const beltColor = "#3d3d3d"; // Màu thắt lưng

    return (
        <group>
            {/* ===== ĐẦU VÀ MẶT ===== */}
            {/* Đầu chính */}
            <mesh position={[0, 1.65 * heightScale, 0]}>
                <sphereGeometry args={[0.13 * weightScale, 32, 32]} />
                <meshStandardMaterial
                    color={skinColor}
                    roughness={0.7}
                    metalness={0.1}
                />
            </mesh>

            {/* Tóc */}
            <mesh position={[0, 1.72 * heightScale, 0]}>
                <sphereGeometry args={[0.135 * weightScale, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial
                    color={hairColor}
                    roughness={0.8}
                />
            </mesh>

            {/* Mắt trái */}
            <mesh position={[-0.045 * weightScale, 1.67 * heightScale, 0.115 * weightScale]}>
                <sphereGeometry args={[0.02 * weightScale, 16, 16]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>

            {/* Mắt phải */}
            <mesh position={[0.045 * weightScale, 1.67 * heightScale, 0.115 * weightScale]}>
                <sphereGeometry args={[0.02 * weightScale, 16, 16]} />
                <meshStandardMaterial color="#1a1a1a" />
            </mesh>

            {/* Mũi */}
            <mesh position={[0, 1.64 * heightScale, 0.13 * weightScale]}>
                <cylinderGeometry args={[0.015 * weightScale, 0.02 * weightScale, 0.035 * heightScale, 8]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* Miệng */}
            <mesh position={[0, 1.60 * heightScale, 0.12 * weightScale]}>
                <boxGeometry args={[0.05 * weightScale, 0.008 * heightScale, 0.01]} />
                <meshStandardMaterial color="#c97a6f" roughness={0.5} />
            </mesh>

            {/* Tai trái */}
            <mesh position={[-0.13 * weightScale, 1.65 * heightScale, 0]}>
                <sphereGeometry args={[0.03 * weightScale, 16, 16]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* Tai phải */}
            <mesh position={[0.13 * weightScale, 1.65 * heightScale, 0]}>
                <sphereGeometry args={[0.03 * weightScale, 16, 16]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* Cổ */}
            <mesh position={[0, 1.50 * heightScale, 0]}>
                <cylinderGeometry args={[0.065 * weightScale, 0.07 * weightScale, 0.1 * heightScale, 16]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* ===== THÂN TRÊN - ÁO ===== */}
            {/* Áo sơ mi thân trên */}
            <mesh position={[0, 1.27 * heightScale, 0]}>
                <boxGeometry args={[0.42 * chestScale * weightScale, 0.30 * heightScale, 0.20 * chestScale * weightScale]} />
                <meshStandardMaterial
                    color={shirtColor}
                    roughness={0.5}
                />
            </mesh>

            {/* Cổ áo */}
            <mesh position={[0, 1.44 * heightScale, 0]}>
                <cylinderGeometry args={[0.075 * weightScale, 0.085 * weightScale, 0.06 * heightScale, 16]} />
                <meshStandardMaterial color={shirtColor} roughness={0.5} />
            </mesh>

            {/* Túi áo bên trái */}
            <mesh position={[-0.09 * chestScale * weightScale, 1.22 * heightScale, 0.105 * chestScale * weightScale]}>
                <boxGeometry args={[0.055, 0.06, 0.008]} />
                <meshStandardMaterial color="#4a8bc2" roughness={0.4} />
            </mesh>

            {/* ===== THÂN GIỮA - BỤNG ===== */}
            <mesh position={[0, 1.0 * heightScale, 0]}>
                <cylinderGeometry args={[0.19 * waistScale * weightScale, 0.21 * chestScale * weightScale, 0.28 * heightScale, 20]} />
                <meshStandardMaterial color={shirtColor} roughness={0.5} />
            </mesh>

            {/* ===== THÂN DƯỚI - QUẦN ===== */}
            {/* Hông */}
            <mesh position={[0, 0.75 * heightScale, 0]}>
                <cylinderGeometry args={[0.23 * hipScale * weightScale, 0.2 * waistScale * weightScale, 0.2 * heightScale, 20]} />
                <meshStandardMaterial color={pantsColor} roughness={0.6} />
            </mesh>

            {/* Thắt lưng */}
            <mesh position={[0, 0.85 * heightScale, 0]}>
                <cylinderGeometry args={[0.21 * waistScale * weightScale, 0.21 * waistScale * weightScale, 0.03 * heightScale, 20]} />
                <meshStandardMaterial color={beltColor} metalness={0.3} />
            </mesh>

            {/* Khóa thắt lưng */}
            <mesh position={[0, 0.85 * heightScale, 0.22 * waistScale * weightScale]}>
                <boxGeometry args={[0.05, 0.04, 0.01]} />
                <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* ===== VAI ===== */}
            {/* Vai trái */}
            <mesh position={[-0.26 * chestScale * weightScale, 1.38 * heightScale, 0]}>
                <sphereGeometry args={[0.09 * weightScale, 16, 16]} />
                <meshStandardMaterial color={shirtColor} roughness={0.5} />
            </mesh>

            {/* Vai phải */}
            <mesh position={[0.26 * chestScale * weightScale, 1.38 * heightScale, 0]}>
                <sphereGeometry args={[0.09 * weightScale, 16, 16]} />
                <meshStandardMaterial color={shirtColor} roughness={0.5} />
            </mesh>

            {/* ===== TAY TRÁI ===== */}
            {/* Tay trái trên (áo) */}
            <mesh position={[-0.32 * chestScale * weightScale, 1.15 * heightScale, 0]} rotation={[0, 0, 0.15]}>
                <cylinderGeometry args={[0.050 * weightScale, 0.060 * weightScale, 0.27 * heightScale, 16]} />
                <meshStandardMaterial color={shirtColor} roughness={0.5} />
            </mesh>

            {/* Khuỷu tay trái */}
            <mesh position={[-0.36 * chestScale * weightScale, 0.98 * heightScale, 0]}>
                <sphereGeometry args={[0.055 * weightScale, 16, 16]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* Cẳng tay trái */}
            <mesh position={[-0.40 * chestScale * weightScale, 0.75 * heightScale, 0]} rotation={[0, 0, 0.1]}>
                <cylinderGeometry args={[0.042 * weightScale, 0.050 * weightScale, 0.27 * heightScale, 16]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* Bàn tay trái */}
            <mesh position={[-0.43 * chestScale * weightScale, 0.59 * heightScale, 0]}>
                <sphereGeometry args={[0.048 * weightScale, 12, 12]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* ===== TAY PHẢI ===== */}
            {/* Tay phải trên (áo) */}
            <mesh position={[0.32 * chestScale * weightScale, 1.15 * heightScale, 0]} rotation={[0, 0, -0.15]}>
                <cylinderGeometry args={[0.050 * weightScale, 0.060 * weightScale, 0.27 * heightScale, 16]} />
                <meshStandardMaterial color={shirtColor} roughness={0.5} />
            </mesh>

            {/* Khuỷu tay phải */}
            <mesh position={[0.36 * chestScale * weightScale, 0.98 * heightScale, 0]}>
                <sphereGeometry args={[0.055 * weightScale, 16, 16]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* Cẳng tay phải */}
            <mesh position={[0.40 * chestScale * weightScale, 0.75 * heightScale, 0]} rotation={[0, 0, -0.1]}>
                <cylinderGeometry args={[0.042 * weightScale, 0.050 * weightScale, 0.27 * heightScale, 16]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* Bàn tay phải */}
            <mesh position={[0.43 * chestScale * weightScale, 0.59 * heightScale, 0]}>
                <sphereGeometry args={[0.048 * weightScale, 12, 12]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* ===== CHÂN TRÁI ===== */}
            {/* Đùi trái */}
            <mesh position={[-0.10 * hipScale * weightScale, 0.44 * heightScale, 0]}>
                <cylinderGeometry args={[0.075 * weightScale, 0.095 * weightScale, 0.38 * heightScale, 20]} />
                <meshStandardMaterial color={pantsColor} roughness={0.6} />
            </mesh>

            {/* Gối trái */}
            <mesh position={[-0.10 * hipScale * weightScale, 0.23 * heightScale, 0]}>
                <sphereGeometry args={[0.080 * weightScale, 16, 16]} />
                <meshStandardMaterial color={pantsColor} roughness={0.6} />
            </mesh>

            {/* Ống quần trái */}
            <mesh position={[-0.10 * hipScale * weightScale, -0.02 * heightScale, 0]}>
                <cylinderGeometry args={[0.070 * weightScale, 0.075 * weightScale, 0.36 * heightScale, 20]} />
                <meshStandardMaterial color={pantsColor} roughness={0.6} />
            </mesh>

            {/* Cổ chân trái */}
            <mesh position={[-0.10 * hipScale * weightScale, -0.22 * heightScale, 0]}>
                <cylinderGeometry args={[0.063 * weightScale, 0.070 * weightScale, 0.08 * heightScale, 16]} />
                <meshStandardMaterial color={pantsColor} roughness={0.6} />
            </mesh>

            {/* ===== CHÂN PHẢI ===== */}
            {/* Đùi phải */}
            <mesh position={[0.10 * hipScale * weightScale, 0.44 * heightScale, 0]}>
                <cylinderGeometry args={[0.075 * weightScale, 0.095 * weightScale, 0.38 * heightScale, 20]} />
                <meshStandardMaterial color={pantsColor} roughness={0.6} />
            </mesh>

            {/* Gối phải */}
            <mesh position={[0.10 * hipScale * weightScale, 0.23 * heightScale, 0]}>
                <sphereGeometry args={[0.080 * weightScale, 16, 16]} />
                <meshStandardMaterial color={pantsColor} roughness={0.6} />
            </mesh>

            {/* Ống quần phải */}
            <mesh position={[0.10 * hipScale * weightScale, -0.02 * heightScale, 0]}>
                <cylinderGeometry args={[0.070 * weightScale, 0.075 * weightScale, 0.36 * heightScale, 20]} />
                <meshStandardMaterial color={pantsColor} roughness={0.6} />
            </mesh>

            {/* Cổ chân phải */}
            <mesh position={[0.10 * hipScale * weightScale, -0.22 * heightScale, 0]}>
                <cylinderGeometry args={[0.063 * weightScale, 0.070 * weightScale, 0.08 * heightScale, 16]} />
                <meshStandardMaterial color={pantsColor} roughness={0.6} />
            </mesh>

            {/* ===== GIÀY TRÁI ===== */}
            {/* Thân giày trái */}
            <mesh position={[-0.10 * hipScale * weightScale, -0.30 * heightScale, 0]}>
                <boxGeometry args={[0.105 * weightScale, 0.075 * heightScale, 0.11 * weightScale]} />
                <meshStandardMaterial color={shoesColor} roughness={0.4} metalness={0.1} />
            </mesh>

            {/* Mũi giày trái */}
            <mesh position={[-0.10 * hipScale * weightScale, -0.315 * heightScale, 0.075 * weightScale]}>
                <sphereGeometry args={[0.052 * weightScale, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={shoesColor} roughness={0.4} />
            </mesh>

            {/* Đế giày trái */}
            <mesh position={[-0.10 * hipScale * weightScale, -0.345 * heightScale, 0.02]}>
                <boxGeometry args={[0.115 * weightScale, 0.018, 0.17 * weightScale]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
            </mesh>

            {/* Sọc giày trái */}
            <mesh position={[-0.10 * hipScale * weightScale, -0.30 * heightScale, 0.058 * weightScale]}>
                <boxGeometry args={[0.107 * weightScale, 0.013, 0.002]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>

            {/* ===== GIÀY PHẢI ===== */}
            {/* Thân giày phải */}
            <mesh position={[0.10 * hipScale * weightScale, -0.30 * heightScale, 0]}>
                <boxGeometry args={[0.105 * weightScale, 0.075 * heightScale, 0.11 * weightScale]} />
                <meshStandardMaterial color={shoesColor} roughness={0.4} metalness={0.1} />
            </mesh>

            {/* Mũi giày phải */}
            <mesh position={[0.10 * hipScale * weightScale, -0.315 * heightScale, 0.075 * weightScale]}>
                <sphereGeometry args={[0.052 * weightScale, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={shoesColor} roughness={0.4} />
            </mesh>

            {/* Đế giày phải */}
            <mesh position={[0.10 * hipScale * weightScale, -0.345 * heightScale, 0.02]}>
                <boxGeometry args={[0.115 * weightScale, 0.018, 0.17 * weightScale]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
            </mesh>

            {/* Sọc giày phải */}
            <mesh position={[0.10 * hipScale * weightScale, -0.30 * heightScale, 0.058 * weightScale]}>
                <boxGeometry args={[0.107 * weightScale, 0.013, 0.002]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
        </group>
    );
};

const BodyMetrics = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    const userId = authUtils.getUserId();

    // Các chỉ số cơ thể
    const [metrics, setMetrics] = useState({
        chieuCao: 170,
        canNang: 70,
        vongNguc: 90,
        vongEo: 75,
        vongMong: 95,
        bmi: 0,
        tyLeMoCoThe: 0,
        tyLeCoBap: 0,
        nhipTim: 72,
        tinhTrangSuckhoe: ''
    });

    useEffect(() => {
        const handleSidebarToggle = (event) => {
            setSidebarCollapsed(event.detail.collapsed);
        };
        window.addEventListener('sidebar:toggle', handleSidebarToggle);
        return () => window.removeEventListener('sidebar:toggle', handleSidebarToggle);
    }, []);

    useEffect(() => {
        if (userId) {
            fetchLatestMetrics();
            fetchHistory();
        }
    }, [userId]);

    // Tự động tính BMI khi thay đổi chiều cao hoặc cân nặng
    useEffect(() => {
        if (metrics.chieuCao > 0 && metrics.canNang > 0) {
            const heightInMeters = metrics.chieuCao / 100;
            const bmi = (metrics.canNang / (heightInMeters * heightInMeters)).toFixed(1);

            // Tính tỷ lệ mỡ cơ thể ước tính (công thức Deurenberg)
            const age = 25; // Giả sử tuổi 25, có thể lấy từ profile
            const gender = 1; // 1 = nam, 0 = nữ
            const bodyFat = (1.20 * bmi) + (0.23 * age) - (10.8 * gender) - 5.4;

            // Tính tỷ lệ cơ bắp ước tính
            const muscleMass = 100 - bodyFat;

            setMetrics(prev => ({
                ...prev,
                bmi: parseFloat(bmi),
                tyLeMoCoThe: Math.max(5, Math.min(50, bodyFat.toFixed(1))),
                tyLeCoBap: Math.max(30, Math.min(60, muscleMass.toFixed(1))),
                tinhTrangSuckhoe: getBMIStatus(bmi)
            }));
        }
    }, [metrics.chieuCao, metrics.canNang]);

    const getBMIStatus = (bmi) => {
        if (bmi < 18.5) return 'Thiếu cân';
        if (bmi < 25) return 'Bình thường';
        if (bmi < 30) return 'Thừa cân';
        return 'Béo phì';
    };

    const getBMIColor = (bmi) => {
        if (bmi < 18.5) return '#3498db';
        if (bmi < 25) return '#27ae60';
        if (bmi < 30) return '#f39c12';
        return '#e74c3c';
    };

    const fetchLatestMetrics = async () => {
        try {
            setLoading(true);
            const data = await bodyMetricsAPI.getBodyMetrics(userId, 1);
            if (data && Array.isArray(data) && data.length > 0) {
                const latest = data[0];
                setMetrics({
                    chieuCao: latest.chieuCao || 170,
                    canNang: latest.canNang || 70,
                    vongNguc: latest.vongNguc || 90,
                    vongEo: latest.vongEo || 75,
                    vongMong: latest.vongMong || 95,
                    bmi: latest.bmi || 0,
                    tyLeMoCoThe: latest.tyLeMoCoThe || 0,
                    tyLeCoBap: latest.tyLeCoBap || 0,
                    nhipTim: latest.nhipTim || 72,
                    tinhTrangSuckhoe: latest.tinhTrangSuckhoe || ''
                });
            }
        } catch (error) {
            console.error('Error fetching metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const data = await bodyMetricsAPI.getBodyMetrics(userId);
            if (data && Array.isArray(data)) {
                setHistory(data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setMetrics(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const metricsData = {
                hoiVien: userId,
                chieuCao: metrics.chieuCao,
                canNang: metrics.canNang,
                vongNguc: metrics.vongNguc,
                vongEo: metrics.vongEo,
                vongMong: metrics.vongMong,
                bmi: metrics.bmi,
                tyLeMoCoThe: metrics.tyLeMoCoThe,
                tyLeCoBap: metrics.tyLeCoBap,
                nhipTim: metrics.nhipTim,
                tinhTrangSuckhoe: metrics.tinhTrangSuckhoe
            };
            await bodyMetricsAPI.createBodyMetrics(metricsData);
            alert('Lưu chỉ số cơ thể thành công!');
            fetchHistory();
        } catch (error) {
            console.error('Error saving metrics:', error);
            alert('Lỗi khi lưu chỉ số cơ thể!');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={`body-metrics-container ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                <div className="body-metrics-wrapper">
                    <div className="metrics-header">
                        <h1>Chỉ Số Cơ Thể</h1>
                        <p>Nhập các chỉ số để xem mô hình 3D của bạn</p>
                    </div>

                    <div className="metrics-content">
                        {/* Bảng nhập liệu */}
                        <div className="metrics-input-panel">
                            <h2>Thông Tin Cơ Thể</h2>

                            <div className="input-group">
                                <label>
                                    <span className="label-icon">📏</span>
                                    Chiều cao (cm)
                                </label>
                                <input
                                    type="number"
                                    value={metrics.chieuCao}
                                    onChange={(e) => handleInputChange('chieuCao', e.target.value)}
                                    min="100"
                                    max="250"
                                />
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        value={metrics.chieuCao}
                                        onChange={(e) => handleInputChange('chieuCao', e.target.value)}
                                        min="100"
                                        max="250"
                                        className="slider"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>
                                    <span className="label-icon">⚖️</span>
                                    Cân nặng (kg)
                                </label>
                                <input
                                    type="number"
                                    value={metrics.canNang}
                                    onChange={(e) => handleInputChange('canNang', e.target.value)}
                                    min="30"
                                    max="200"
                                />
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        value={metrics.canNang}
                                        onChange={(e) => handleInputChange('canNang', e.target.value)}
                                        min="30"
                                        max="200"
                                        className="slider"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>
                                    <span className="label-icon">💪</span>
                                    Vòng ngực (cm)
                                </label>
                                <input
                                    type="number"
                                    value={metrics.vongNguc}
                                    onChange={(e) => handleInputChange('vongNguc', e.target.value)}
                                    min="60"
                                    max="150"
                                />
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        value={metrics.vongNguc}
                                        onChange={(e) => handleInputChange('vongNguc', e.target.value)}
                                        min="60"
                                        max="150"
                                        className="slider"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>
                                    <span className="label-icon">⭕</span>
                                    Vòng eo (cm)
                                </label>
                                <input
                                    type="number"
                                    value={metrics.vongEo}
                                    onChange={(e) => handleInputChange('vongEo', e.target.value)}
                                    min="50"
                                    max="150"
                                />
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        value={metrics.vongEo}
                                        onChange={(e) => handleInputChange('vongEo', e.target.value)}
                                        min="50"
                                        max="150"
                                        className="slider"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>
                                    <span className="label-icon">🍑</span>
                                    Vòng mông (cm)
                                </label>
                                <input
                                    type="number"
                                    value={metrics.vongMong}
                                    onChange={(e) => handleInputChange('vongMong', e.target.value)}
                                    min="70"
                                    max="180"
                                />
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        value={metrics.vongMong}
                                        onChange={(e) => handleInputChange('vongMong', e.target.value)}
                                        min="70"
                                        max="180"
                                        className="slider"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>
                                    <span className="label-icon">❤️</span>
                                    Nhịp tim (bpm)
                                </label>
                                <input
                                    type="number"
                                    value={metrics.nhipTim}
                                    onChange={(e) => handleInputChange('nhipTim', e.target.value)}
                                    min="40"
                                    max="200"
                                />
                            </div>

                            <div className="calculated-metrics">
                                <h3>Chỉ Số Tự Động</h3>

                                <div className="metric-card" style={{ borderColor: getBMIColor(metrics.bmi) }}>
                                    <div className="metric-label">BMI</div>
                                    <div className="metric-value" style={{ color: getBMIColor(metrics.bmi) }}>
                                        {metrics.bmi || 0}
                                    </div>
                                    <div className="metric-status">{metrics.tinhTrangSuckhoe}</div>
                                </div>

                                <div className="metric-card">
                                    <div className="metric-label">Tỷ lệ mỡ cơ thể</div>
                                    <div className="metric-value">{metrics.tyLeMoCoThe || 0}%</div>
                                </div>

                                <div className="metric-card">
                                    <div className="metric-label">Tỷ lệ cơ bắp</div>
                                    <div className="metric-value">{metrics.tyLeCoBap || 0}%</div>
                                </div>
                            </div>

                            <div className="action-buttons">
                                <button className="btn-save" onClick={handleSave} disabled={saving}>
                                    {saving ? '💾 Đang lưu...' : '💾 Lưu chỉ số'}
                                </button>
                                <button className="btn-history" onClick={() => setShowHistory(!showHistory)}>
                                    📊 {showHistory ? 'Ẩn lịch sử' : 'Xem lịch sử'}
                                </button>
                            </div>
                        </div>

                        {/* Mô hình 3D */}
                        <div className="model-3d-panel">
                            <h2>Mô Hình 3D</h2>
                            <div className="model-3d-container">
                                <Canvas>
                                    <PerspectiveCamera makeDefault position={[0, 1, 3]} />
                                    <ambientLight intensity={0.5} />
                                    <directionalLight position={[10, 10, 5]} intensity={1} />
                                    <directionalLight position={[-10, -10, -5]} intensity={0.3} />

                                    <Suspense fallback={null}>
                                        <HumanModel
                                            height={metrics.chieuCao}
                                            weight={metrics.canNang}
                                            chest={metrics.vongNguc}
                                            waist={metrics.vongEo}
                                            hips={metrics.vongMong}
                                        />
                                        <Environment preset="sunset" />
                                    </Suspense>

                                    <OrbitControls
                                        enablePan={false}
                                        enableZoom={true}
                                        minDistance={2}
                                        maxDistance={5}
                                        maxPolarAngle={Math.PI / 1.5}
                                    />
                                </Canvas>
                                <div className="model-hint">
                                    🖱️ Kéo để xoay • Cuộn để zoom
                                </div>
                            </div>

                            <div className="body-info">
                                <div className="info-item">
                                    <span className="info-label">Chiều cao:</span>
                                    <span className="info-value">{metrics.chieuCao} cm</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Cân nặng:</span>
                                    <span className="info-value">{metrics.canNang} kg</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">BMI:</span>
                                    <span className="info-value" style={{ color: getBMIColor(metrics.bmi) }}>
                                        {metrics.bmi} - {metrics.tinhTrangSuckhoe}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lịch sử */}
                    {showHistory && (
                        <div className="history-panel">
                            <h2>Lịch Sử Chỉ Số</h2>
                            <div className="history-list">
                                {history.length === 0 ? (
                                    <p className="no-history">Chưa có lịch sử chỉ số</p>
                                ) : (
                                    history.map((item, index) => (
                                        <div key={index} className="history-item">
                                            <div className="history-date">
                                                {new Date(item.ngayDo).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div className="history-metrics">
                                                <span>Cao: {item.chieuCao}cm</span>
                                                <span>Nặng: {item.canNang}kg</span>
                                                <span>BMI: {item.bmi}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default BodyMetrics;
