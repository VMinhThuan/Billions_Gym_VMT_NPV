import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

const RoleTestScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { userRole, userInfo, login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const testRoles = [
        {
            role: 'HoiVien',
            name: 'Hội viên',
            description: 'Người dùng thông thường - có thể đặt lịch, xem bài tập, dinh dưỡng',
            icon: 'person'
        },
        {
            role: 'PT',
            name: 'Personal Trainer',
            description: 'Huấn luyện viên - quản lý lịch hẹn, học viên, doanh thu',
            icon: 'fitness-center'
        },
        {
            role: 'OngChu',
            name: 'Ông chủ',
            description: 'Quản trị viên - quản lý toàn bộ hệ thống, báo cáo, thành viên',
            icon: 'admin-panel-settings'
        }
    ];

    const handleRoleSwitch = async (role) => {
        try {
            setIsLoading(true);

            // Create mock user data for testing
            const mockUser = {
                _id: 'test-user-id',
                hoTen: `Test ${role}`,
                sdt: '0123456789',
                email: `test${role.toLowerCase()}@example.com`,
                vaiTro: role,
                gioiTinh: 'Nam',
                ngaySinh: '1990-01-01',
                diaChi: 'Test Address'
            };

            const mockToken = 'test-token-' + role.toLowerCase();

            await login(mockToken, mockUser);

            Alert.alert(
                'Thành công',
                `Đã chuyển sang vai trò ${testRoles.find(r => r.role === role)?.name}`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Main')
                    }
                ]
            );
        } catch (error) {
            console.error('Error switching role:', error);
            Alert.alert('Lỗi', 'Không thể chuyển đổi vai trò');
        } finally {
            setIsLoading(false);
        }
    };

    const renderRoleCard = (roleData) => (
        <TouchableOpacity
            key={roleData.role}
            style={[
                styles.roleCard,
                {
                    backgroundColor: colors.surface,
                    borderColor: userRole === roleData.role ? colors.primary : colors.border
                }
            ]}
            onPress={() => handleRoleSwitch(roleData.role)}
            disabled={isLoading}
        >
            <View style={styles.roleHeader}>
                <View style={[styles.roleIcon, { backgroundColor: colors.primary + '20' }]}>
                    <MaterialIcons
                        name={roleData.icon}
                        size={32}
                        color={colors.primary}
                    />
                </View>
                <View style={styles.roleInfo}>
                    <Text style={[styles.roleName, { color: colors.text }]}>
                        {roleData.name}
                    </Text>
                    <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>
                        {roleData.description}
                    </Text>
                </View>
            </View>

            {userRole === roleData.role && (
                <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                    <MaterialIcons name="check" size={16} color="white" />
                    <Text style={styles.activeText}>Đang hoạt động</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Test Vai trò</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Current Role Info */}
            <View style={[styles.currentRoleCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.currentRoleTitle, { color: colors.text }]}>
                    Vai trò hiện tại
                </Text>
                <Text style={[styles.currentRoleName, { color: colors.primary }]}>
                    {userRole ? testRoles.find(r => r.role === userRole)?.name : 'Chưa đăng nhập'}
                </Text>
                {userInfo && (
                    <Text style={[styles.currentUserInfo, { color: colors.textSecondary }]}>
                        {userInfo.hoTen} • {userInfo.sdt}
                    </Text>
                )}
            </View>

            {/* Instructions */}
            <View style={[styles.instructionsCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="info" size={24} color={colors.primary} />
                <Text style={[styles.instructionsText, { color: colors.text }]}>
                    Chọn vai trò để test các màn hình tương ứng. Mỗi vai trò sẽ có giao diện và chức năng khác nhau.
                </Text>
            </View>

            {/* Role Selection */}
            <View style={styles.rolesContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Chọn vai trò để test
                </Text>
                {testRoles.map(renderRoleCard)}
            </View>

            {/* Warning */}
            <View style={[styles.warningCard, { backgroundColor: '#FFF3CD', borderColor: '#FFEAA7' }]}>
                <MaterialIcons name="warning" size={20} color="#856404" />
                <Text style={[styles.warningText, { color: '#856404' }]}>
                    Đây là màn hình test. Trong ứng dụng thực tế, vai trò sẽ được xác định từ thông tin đăng nhập.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    placeholder: {
        width: 40,
    },
    currentRoleCard: {
        margin: 16,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    currentRoleTitle: {
        fontSize: 16,
        marginBottom: 8,
    },
    currentRoleName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    currentUserInfo: {
        fontSize: 14,
    },
    instructionsCard: {
        flexDirection: 'row',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    instructionsText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        lineHeight: 20,
    },
    rolesContainer: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    roleCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    roleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    roleInfo: {
        flex: 1,
    },
    roleName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    roleDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 12,
    },
    activeText: {
        color: 'white',
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '500',
    },
    warningCard: {
        flexDirection: 'row',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    warningText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        lineHeight: 20,
    },
});

export default RoleTestScreen;
