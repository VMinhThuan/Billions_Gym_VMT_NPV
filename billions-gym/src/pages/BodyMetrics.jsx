import { useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import authUtils from '../utils/auth';
import { bodyMetricsAPI } from '../services/api';
import './BodyMetrics.css';

// Component mô hình 3D con người chi tiết cao
const HumanModel = ({ gender = 'male', height = 170, weight = 70, chest = 90, waist = 75, hips = 95 }) => {
    // Tính toán tỷ lệ dựa trên chiều cao và cân nặng
    const heightScale = height / 170;
    const weightScale = Math.pow(weight / 70, 0.33);
    const chestScale = chest / 90;
    const waistScale = waist / 75;
    const hipScale = hips / 95;

    const isFemale = gender === 'female';
    const isMale = !isFemale;
    const palette = useMemo(() => isFemale ? ({
        skin: '#f7d7c7',
        shirt: '#ff7eb3',
        pants: '#352e5a',
        shoes: '#130f2a',
        hair: '#3b2b2b',
        accent: '#ffc1d3'
    }) : ({
        skin: '#dbb192',
        shirt: '#45b8ff',
        pants: '#19233c',
        shoes: '#050608',
        hair: '#0b0b0b',
        accent: '#4cf0c3'
    }), [isFemale]);

    const proportions = useMemo(() => ({
        torsoWidth: isFemale ? 0.38 : 0.52,
        shoulderSphere: isFemale ? 0.1 : 0.13,
        waistMultiplier: isFemale ? 0.78 : 0.95,
        hipMultiplier: isFemale ? 1.18 : 0.9
    }), [isFemale]);

    const skinColor = palette.skin;
    const shirtColor = palette.shirt;
    const pantsColor = palette.pants;
    const shoesColor = palette.shoes;
    const hairColor = palette.hair;
    const beltColor = palette.accent;

    const adjustedWaist = waistScale * proportions.waistMultiplier;
    const adjustedHip = hipScale * proportions.hipMultiplier;

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

            {isFemale && (
                <>
                    <mesh position={[0, 1.62 * heightScale, -0.05 * weightScale]}>
                        <cylinderGeometry args={[0.06 * weightScale, 0.035 * weightScale, 0.3 * heightScale, 16]} />
                        <meshStandardMaterial color={hairColor} roughness={0.75} />
                    </mesh>
                    <mesh position={[0, 1.42 * heightScale, -0.06 * weightScale]}>
                        <boxGeometry args={[0.36 * chestScale * weightScale, 0.34 * heightScale, 0.06 * weightScale]} />
                        <meshStandardMaterial color={hairColor} roughness={0.85} opacity={0.95} transparent />
                    </mesh>
                    <mesh position={[0, 1.72 * heightScale, 0]}>
                        <torusGeometry args={[0.14 * weightScale, 0.014 * weightScale, 12, 32]} />
                        <meshStandardMaterial color={palette.accent} roughness={0.45} />
                    </mesh>
                </>
            )}

            {isMale && (
                <mesh position={[0, 1.7 * heightScale, 0]}>
                    <torusGeometry args={[0.14 * weightScale, 0.015 * weightScale, 8, 32]} />
                    <meshStandardMaterial color={palette.accent} roughness={0.5} />
                </mesh>
            )}

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

            {isMale && (
                <>
                    <mesh position={[0, 1.3 * heightScale, 0.12 * chestScale * weightScale]}>
                        <boxGeometry args={[0.36 * chestScale * weightScale, 0.14 * heightScale, 0.12 * weightScale]} />
                        <meshStandardMaterial color={shirtColor} roughness={0.4} metalness={0.1} />
                    </mesh>
                    <mesh position={[0, 1.08 * heightScale, 0.13 * chestScale * weightScale]}>
                        <boxGeometry args={[0.22 * chestScale * weightScale, 0.18 * heightScale, 0.09 * weightScale]} />
                        <meshStandardMaterial color={shirtColor} roughness={0.35} metalness={0.05} />
                    </mesh>
                </>
            )}

            {isFemale && (
                <>
                    <mesh position={[0, 1.25 * heightScale, 0]}>
                        <cylinderGeometry args={[0.38 * chestScale * weightScale, 0.34 * chestScale * weightScale, 0.26 * heightScale, 24]} />
                        <meshStandardMaterial color={shirtColor} roughness={0.45} />
                    </mesh>
                    <mesh position={[0, 0.92 * heightScale, 0]}>
                        <cylinderGeometry args={[0.30 * adjustedHip * weightScale, 0.28 * adjustedHip * weightScale, 0.32 * heightScale, 28]} />
                        <meshStandardMaterial color={pantsColor} roughness={0.48} />
                    </mesh>
                </>
            )}

            {/* ===== THÂN GIỮA - BỤNG ===== */}
            <mesh position={[0, 1.0 * heightScale, 0]}>
                <cylinderGeometry args={[0.19 * adjustedWaist * weightScale, 0.21 * chestScale * weightScale, 0.28 * heightScale, 20]} />
                <meshStandardMaterial color={shirtColor} roughness={0.5} />
            </mesh>
            {isMale && (
                <>
                    <mesh position={[0, 1.25 * heightScale, 0.12 * chestScale * weightScale]}>
                        <boxGeometry args={[proportions.torsoWidth * chestScale * weightScale, 0.16 * heightScale, 0.26 * weightScale]} />
                        <meshStandardMaterial color={shirtColor} emissive="#1a6fd1" emissiveIntensity={0.18} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 1.03 * heightScale, 0.14 * chestScale * weightScale]}>
                        <boxGeometry args={[0.28 * chestScale * weightScale, 0.18 * heightScale, 0.12 * weightScale]} />
                        <meshStandardMaterial color="#111726" roughness={0.7} opacity={0.35} transparent />
                    </mesh>
                </>
            )}
            {isFemale && (
                <mesh position={[0, 0.95 * heightScale, 0]}>
                    <cylinderGeometry args={[0.24 * adjustedHip * weightScale, 0.24 * adjustedHip * weightScale, 0.05 * heightScale, 32]} />
                    <meshStandardMaterial color={palette.accent} roughness={0.35} />
                </mesh>
            )}

            {/* ===== THÂN DƯỚI - QUẦN ===== */}
            {/* Hông */}
            <mesh position={[0, 0.75 * heightScale, 0]}>
                <cylinderGeometry args={[0.23 * adjustedHip * weightScale, 0.2 * adjustedWaist * weightScale, 0.2 * heightScale, 20]} />
                <meshStandardMaterial color={pantsColor} roughness={0.6} />
            </mesh>

            {/* Thắt lưng */}
            <mesh position={[0, 0.85 * heightScale, 0]}>
                <cylinderGeometry args={[0.21 * adjustedWaist * weightScale, 0.21 * adjustedWaist * weightScale, 0.03 * heightScale, 20]} />
                <meshStandardMaterial color={beltColor} metalness={0.3} />
            </mesh>

            {/* Khóa thắt lưng */}
            <mesh position={[0, 0.85 * heightScale, 0.22 * adjustedWaist * weightScale]}>
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
                <cylinderGeometry args={[0.050 * weightScale * (isMale ? 1.2 : 0.9), 0.060 * weightScale * (isMale ? 1.15 : 0.9), 0.27 * heightScale, 16]} />
                <meshStandardMaterial color={shirtColor} roughness={0.5} />
            </mesh>

            {isMale && (
                <mesh position={[-0.35 * chestScale * weightScale, 1.09 * heightScale, 0]} rotation={[0, 0, 0.1]}>
                    <sphereGeometry args={[0.06 * weightScale, 16, 16]} />
                    <meshStandardMaterial color={shirtColor} roughness={0.45} />
                </mesh>
            )}

            {/* Khuỷu tay trái */}
            <mesh position={[-0.36 * chestScale * weightScale, 0.98 * heightScale, 0]}>
                <sphereGeometry args={[0.055 * weightScale, 16, 16]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* Cẳng tay trái */}
            <mesh position={[-0.40 * chestScale * weightScale, 0.75 * heightScale, 0]} rotation={[0, 0, 0.1]}>
                <cylinderGeometry args={[0.042 * weightScale * (isMale ? 1.15 : 0.9), 0.050 * weightScale * (isMale ? 1.1 : 0.9), 0.27 * heightScale, 16]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* Bàn tay trái */}
            <mesh position={[-0.43 * chestScale * weightScale, 0.59 * heightScale, 0]}>
                <sphereGeometry args={[0.048 * weightScale, 12, 12]} />
                <meshStandardMaterial color={skinColor} roughness={0.7} />
            </mesh>

            {/* Tạ tay trái */}
            <group position={[-0.43 * chestScale * weightScale, 0.55 * heightScale, 0]}>
                <mesh>
                    <boxGeometry args={[0.14 * weightScale, 0.02 * heightScale, 0.02 * weightScale]} />
                    <meshStandardMaterial color={palette.accent} roughness={0.4} />
                </mesh>
                <mesh position={[0.08 * weightScale, 0, 0]}>
                    <cylinderGeometry args={[0.045 * weightScale, 0.045 * weightScale, 0.06 * heightScale, 12]} />
                    <meshStandardMaterial color={shoesColor} roughness={0.5} />
                </mesh>
                <mesh position={[-0.08 * weightScale, 0, 0]}>
                    <cylinderGeometry args={[0.045 * weightScale, 0.045 * weightScale, 0.06 * heightScale, 12]} />
                    <meshStandardMaterial color={shoesColor} roughness={0.5} />
                </mesh>
            </group>

            {/* ===== TAY PHẢI ===== */}
            {/* Tay phải trên (áo) */}
            <mesh position={[0.32 * chestScale * weightScale, 1.15 * heightScale, 0]} rotation={[0, 0, -0.15]}>
                <cylinderGeometry args={[0.050 * weightScale, 0.060 * weightScale, 0.27 * heightScale, 16]} />
                <meshStandardMaterial color={shirtColor} roughness={0.5} />
            </mesh>

            {isMale && (
                <mesh position={[0.35 * chestScale * weightScale, 1.09 * heightScale, 0]} rotation={[0, 0, -0.1]}>
                    <sphereGeometry args={[0.06 * weightScale, 16, 16]} />
                    <meshStandardMaterial color={shirtColor} roughness={0.45} />
                </mesh>
            )}

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

            {/* Tạ tay phải */}
            <group position={[0.43 * chestScale * weightScale, 0.55 * heightScale, 0]}>
                <mesh>
                    <boxGeometry args={[0.14 * weightScale, 0.02 * heightScale, 0.02 * weightScale]} />
                    <meshStandardMaterial color={palette.accent} roughness={0.4} />
                </mesh>
                <mesh position={[0.08 * weightScale, 0, 0]}>
                    <cylinderGeometry args={[0.045 * weightScale, 0.045 * weightScale, 0.06 * heightScale, 12]} />
                    <meshStandardMaterial color={shoesColor} roughness={0.5} />
                </mesh>
                <mesh position={[-0.08 * weightScale, 0, 0]}>
                    <cylinderGeometry args={[0.045 * weightScale, 0.045 * weightScale, 0.06 * heightScale, 12]} />
                    <meshStandardMaterial color={shoesColor} roughness={0.5} />
                </mesh>
            </group>

            {/* ===== CHÂN TRÁI ===== */}
            {/* Đùi trái */}
            <mesh position={[-0.10 * hipScale * weightScale, 0.44 * heightScale, 0]}>
                <cylinderGeometry args={[0.075 * weightScale * (isMale ? 1.2 : 0.9), 0.095 * weightScale * (isMale ? 1.15 : 0.95), 0.38 * heightScale, 20]} />
                <meshStandardMaterial color={pantsColor} roughness={0.6} />
            </mesh>

            {/* Gối trái */}
            <mesh position={[-0.10 * hipScale * weightScale, 0.23 * heightScale, 0]}>
                <sphereGeometry args={[0.080 * weightScale, 16, 16]} />
                <meshStandardMaterial color={pantsColor} roughness={0.6} />
            </mesh>

            {/* Ống quần trái */}
            <mesh position={[-0.10 * hipScale * weightScale, -0.02 * heightScale, 0]}>
                <cylinderGeometry args={[0.070 * weightScale * (isMale ? 1.2 : 0.95), 0.075 * weightScale * (isMale ? 1.15 : 0.95), 0.36 * heightScale, 20]} />
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
    const userId = authUtils.getUserId();
    const userProfile = authUtils.getUser();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedGender, setSelectedGender] = useState(() => (userProfile?.gioiTinh?.toLowerCase() === 'nu' ? 'female' : 'male'));

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
            const response = await bodyMetricsAPI.getBodyMetrics(userId, 1);
            const data = response?.data || response;
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
            const response = await bodyMetricsAPI.getBodyMetrics(userId);
            const data = response?.data || response;
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
            fetchLatestMetrics();
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

                            <div className="gender-selector">
                                <span>Giới tính mô hình</span>
                                <div className="gender-buttons">
                                    <button
                                        className={selectedGender === 'male' ? 'active' : ''}
                                        onClick={() => setSelectedGender('male')}
                                        type="button"
                                    >
                                        💪 Nam
                                    </button>
                                    <button
                                        className={selectedGender === 'female' ? 'active' : ''}
                                        onClick={() => setSelectedGender('female')}
                                        type="button"
                                    >
                                        🧘‍♀️ Nữ
                                    </button>
                                </div>
                            </div>

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
                                            gender={selectedGender}
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

                            <div className="history-inline">
                                <div className="history-header">
                                    <h3>Lịch Sử Chỉ Số</h3>
                                    <button className="history-toggle" onClick={() => setShowHistory(!showHistory)}>
                                        {showHistory ? 'Ẩn lịch sử' : 'Xem lịch sử'}
                                    </button>
                                </div>
                                {showHistory && (
                                    <div className="history-list compact">
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
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default BodyMetrics;
