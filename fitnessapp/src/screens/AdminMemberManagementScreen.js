import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    TextInput,
    Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import apiService from '../api/apiService';

const AdminMemberManagementScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showFilterModal, setShowFilterModal] = useState(false);

    useEffect(() => {
        loadMembers();
    }, []);

    useEffect(() => {
        filterMembers();
    }, [members, searchQuery, selectedStatus]);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const data = await apiService.getAllMembers();
            // Ensure we have an array to work with
            setMembers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading members:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách thành viên');
            setMembers([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMembers();
        setRefreshing(false);
    };

    const filterMembers = () => {
        // Ensure we have an array to work with
        let filtered = Array.isArray(members) ? members : [];

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(member =>
                member.hoTen.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.sdt.includes(searchQuery) ||
                member.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by status
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(member => member.trangThaiHoiVien === selectedStatus);
        }

        setFilteredMembers(filtered);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'DANG_HOAT_DONG': return '#4CAF50';
            case 'TAM_NGUNG': return '#FF9800';
            case 'HET_HAN': return '#F44336';
            default: return colors.text;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'DANG_HOAT_DONG': return 'Hoạt động';
            case 'TAM_NGUNG': return 'Tạm ngưng';
            case 'HET_HAN': return 'Hết hạn';
            default: return status;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const handleMemberPress = (member) => {
        navigation.navigate('MemberDetail', { memberId: member._id });
    };

    const handleStatusChange = async (memberId, newStatus) => {
        try {
            await apiService.updateMemberStatus(memberId, newStatus);
            Alert.alert('Thành công', 'Đã cập nhật trạng thái thành viên');
            loadMembers();
        } catch (error) {
            console.error('Error updating member status:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
        }
    };

    const handleExtendMembership = (member) => {
        navigation.navigate('ExtendMembership', { memberId: member._id });
    };

    const handleDeleteMember = (memberId) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa thành viên này?',
            [
                { text: 'Không', style: 'cancel' },
                {
                    text: 'Có',
                    onPress: async () => {
                        try {
                            await apiService.deleteMember(memberId);
                            Alert.alert('Thành công', 'Đã xóa thành viên');
                            loadMembers();
                        } catch (error) {
                            console.error('Error deleting member:', error);
                            Alert.alert('Lỗi', 'Không thể xóa thành viên');
                        }
                    }
                }
            ]
        );
    };

    const renderStatusFilter = () => (
        <Modal
            visible={showFilterModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowFilterModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Lọc theo trạng thái</Text>
                    {['all', 'DANG_HOAT_DONG', 'TAM_NGUNG', 'HET_HAN'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterOption,
                                { backgroundColor: selectedStatus === status ? colors.primary : 'transparent' }
                            ]}
                            onPress={() => {
                                setSelectedStatus(status);
                                setShowFilterModal(false);
                            }}
                        >
                            <Text style={[
                                styles.filterOptionText,
                                { color: selectedStatus === status ? 'white' : colors.text }
                            ]}>
                                {status === 'all' ? 'Tất cả' : getStatusText(status)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );

    const renderMemberItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.memberCard, { backgroundColor: colors.surface }]}
            onPress={() => handleMemberPress(item)}
        >
            <View style={styles.memberHeader}>
                <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                        {item.hoTen}
                    </Text>
                    <Text style={[styles.memberContact, { color: colors.textSecondary }]}>
                        {item.sdt} • {item.email || 'Chưa có email'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.trangThaiHoiVien) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.trangThaiHoiVien)}</Text>
                </View>
            </View>

            <View style={styles.memberDetails}>
                <View style={styles.detailRow}>
                    <MaterialIcons name="person" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {item.gioiTinh === 'Nam' ? 'Nam' : 'Nữ'} • {item.ngaySinh ? formatDate(item.ngaySinh) : 'Chưa cập nhật'}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <MaterialIcons name="event" size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        Tham gia: {formatDate(item.ngayThamGia)}
                    </Text>
                </View>
                {item.ngayHetHan && (
                    <View style={styles.detailRow}>
                        <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            Hết hạn: {formatDate(item.ngayHetHan)}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.memberActions}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleMemberPress(item)}
                >
                    <MaterialIcons name="visibility" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Xem</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                    onPress={() => handleExtendMembership(item)}
                >
                    <MaterialIcons name="schedule" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Gia hạn</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                    onPress={() => handleDeleteMember(item._id)}
                >
                    <MaterialIcons name="delete" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Xóa</Text>
                </TouchableOpacity>
            </View>
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
                <Text style={styles.headerTitle}>Quản lý thành viên</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddMember')}
                >
                    <MaterialIcons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Search and Filter */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.searchBar}>
                    <MaterialIcons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Tìm kiếm thành viên..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilterModal(true)}
                >
                    <MaterialIcons name="filter-list" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{members.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tổng thành viên</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                        {members.filter(m => m.trangThaiHoiVien === 'DANG_HOAT_DONG').length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đang hoạt động</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.statValue, { color: '#FF9800' }]}>
                        {members.filter(m => m.trangThaiHoiVien === 'TAM_NGUNG').length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tạm ngưng</Text>
                </View>
            </View>

            {/* Members List */}
            <FlatList
                data={filteredMembers}
                keyExtractor={(item) => item._id}
                renderItem={renderMemberItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialIcons name="people" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {loading ? 'Đang tải...' : 'Không có thành viên nào'}
                        </Text>
                    </View>
                }
            />

            {renderStatusFilter()}
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
    addButton: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    filterButton: {
        padding: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 4,
        borderRadius: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    listContainer: {
        padding: 16,
    },
    memberCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    memberHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    memberContact: {
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    memberDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
    },
    memberActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    actionButtonText: {
        color: 'white',
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    filterOption: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    filterOptionText: {
        fontSize: 16,
        textAlign: 'center',
    },
});

export default AdminMemberManagementScreen;
