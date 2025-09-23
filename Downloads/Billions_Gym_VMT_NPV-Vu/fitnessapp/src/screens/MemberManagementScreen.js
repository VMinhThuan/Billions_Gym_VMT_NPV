import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Modal,
    Alert,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const MemberManagementScreen = () => {
    const navigation = useNavigation();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, new, returning, expired
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            // TODO: Call API to fetch members
            // const response = await fetch('/api/hoivien');
            // const data = await response.json();

            // Mock data for now
            const mockData = [
                {
                    id: '1',
                    hoTen: 'Nguyễn Văn A',
                    sdt: '0123456789',
                    email: 'nguyenvana@email.com',
                    ngayDangKy: '2024-01-15',
                    trangThai: 'HOAT_DONG',
                    goiTap: 'Gói 3 tháng',
                    ngayHetHan: '2024-04-15',
                    isNewMember: false
                },
                {
                    id: '2',
                    hoTen: 'Trần Thị B',
                    sdt: '0987654321',
                    email: 'tranthib@email.com',
                    ngayDangKy: '2024-03-01',
                    trangThai: 'HOAT_DONG',
                    goiTap: 'Gói 6 tháng',
                    ngayHetHan: '2024-09-01',
                    isNewMember: true
                },
                {
                    id: '3',
                    hoTen: 'Lê Văn C',
                    sdt: '0111222333',
                    email: 'levanc@email.com',
                    ngayDangKy: '2023-12-01',
                    trangThai: 'HET_HAN',
                    goiTap: 'Gói 1 tháng',
                    ngayHetHan: '2024-01-01',
                    isNewMember: false
                }
            ];
            setMembers(mockData);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải danh sách thành viên');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMembers();
        setRefreshing(false);
    };

    const getStatusColor = (trangThai) => {
        switch (trangThai) {
            case 'HOAT_DONG': return '#4CAF50';
            case 'HET_HAN': return '#FF5722';
            case 'TAM_DUNG': return '#FF9800';
            default: return '#666';
        }
    };

    const getStatusText = (trangThai) => {
        switch (trangThai) {
            case 'HOAT_DONG': return 'Hoạt động';
            case 'HET_HAN': return 'Hết hạn';
            case 'TAM_DUNG': return 'Tạm dừng';
            default: return 'Không xác định';
        }
    };

    const filteredMembers = members.filter(member => {
        const matchesSearch = member.hoTen.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.sdt.includes(searchQuery);

        const matchesFilter = (() => {
            switch (filterType) {
                case 'new': return member.isNewMember;
                case 'returning': return !member.isNewMember && member.trangThai === 'HOAT_DONG';
                case 'expired': return member.trangThai === 'HET_HAN';
                default: return true;
            }
        })();

        return matchesSearch && matchesFilter;
    });

    const handleMemberPress = (member) => {
        setSelectedMember(member);
        setModalVisible(true);
    };

    const handleAddNewMember = () => {
        navigation.navigate('AddMember');
    };

    const handleExtendMembership = (member) => {
        Alert.alert(
            'Gia hạn thành viên',
            `Bạn có muốn gia hạn thành viên cho ${member.hoTen}?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Gia hạn',
                    onPress: () => {
                        // TODO: Navigate to package selection screen
                        navigation.navigate('PackageSelection', { memberId: member.id, memberName: member.hoTen });
                    }
                }
            ]
        );
    };

    const renderFilterButton = (type, title) => (
        <TouchableOpacity
            style={[styles.filterButton, filterType === type && styles.activeFilter]}
            onPress={() => setFilterType(type)}
        >
            <Text style={[styles.filterText, filterType === type && styles.activeFilterText]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    const renderMemberItem = ({ item }) => (
        <TouchableOpacity style={styles.memberCard} onPress={() => handleMemberPress(item)}>
            <View style={styles.memberHeader}>
                <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.hoTen}</Text>
                    <Text style={styles.memberPhone}>{item.sdt}</Text>
                </View>
                <View style={styles.memberStatus}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.trangThai) }]}>
                        <Text style={styles.statusText}>{getStatusText(item.trangThai)}</Text>
                    </View>
                    {item.isNewMember && (
                        <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>MỚI</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.memberDetails}>
                <View style={styles.detailRow}>
                    <MaterialIcons name="card-membership" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.goiTap}</Text>
                </View>
                <View style={styles.detailRow}>
                    <MaterialIcons name="schedule" size={16} color="#666" />
                    <Text style={styles.detailText}>Hết hạn: {item.ngayHetHan}</Text>
                </View>
            </View>

            {item.trangThai === 'HET_HAN' && (
                <TouchableOpacity
                    style={styles.extendButton}
                    onPress={() => handleExtendMembership(item)}
                >
                    <MaterialIcons name="refresh" size={16} color="white" />
                    <Text style={styles.extendButtonText}>Gia hạn</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    const renderMemberDetailModal = () => (
        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Thông tin thành viên</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <MaterialIcons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {selectedMember && (
                        <View style={styles.modalBody}>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Họ tên:</Text>
                                <Text style={styles.modalValue}>{selectedMember.hoTen}</Text>
                            </View>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Số điện thoại:</Text>
                                <Text style={styles.modalValue}>{selectedMember.sdt}</Text>
                            </View>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Email:</Text>
                                <Text style={styles.modalValue}>{selectedMember.email}</Text>
                            </View>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Ngày đăng ký:</Text>
                                <Text style={styles.modalValue}>{selectedMember.ngayDangKy}</Text>
                            </View>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Gói tập:</Text>
                                <Text style={styles.modalValue}>{selectedMember.goiTap}</Text>
                            </View>
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>Ngày hết hạn:</Text>
                                <Text style={styles.modalValue}>{selectedMember.ngayHetHan}</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                setModalVisible(false);
                                navigation.navigate('MemberEdit', { member: selectedMember });
                            }}
                        >
                            <Text style={styles.modalButtonText}>Chỉnh sửa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.primaryButton]}
                            onPress={() => {
                                setModalVisible(false);
                                navigation.navigate('MemberDetail', { member: selectedMember });
                            }}
                        >
                            <Text style={[styles.modalButtonText, { color: 'white' }]}>
                                Xem chi tiết
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quản lý thành viên</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddNewMember}
                >
                    <MaterialIcons name="person-add" size={24} color="#DA2128" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <MaterialIcons name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                {renderFilterButton('all', 'Tất cả')}
                {renderFilterButton('new', 'Thành viên mới')}
                {renderFilterButton('returning', 'Quay lại')}
                {renderFilterButton('expired', 'Hết hạn')}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{members.length}</Text>
                    <Text style={styles.statLabel}>Tổng số</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                        {members.filter(m => m.isNewMember).length}
                    </Text>
                    <Text style={styles.statLabel}>Thành viên mới</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: '#FF5722' }]}>
                        {members.filter(m => m.trangThai === 'HET_HAN').length}
                    </Text>
                    <Text style={styles.statLabel}>Hết hạn</Text>
                </View>
            </View>

            {/* Member List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#DA2128" />
                </View>
            ) : (
                <FlatList
                    data={filteredMembers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMemberItem}
                    style={styles.memberList}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="people-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Không có thành viên nào</Text>
                        </View>
                    }
                />
            )}

            {renderMemberDetailModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    addButton: {
        padding: 5,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 10,
    },
    activeFilter: {
        backgroundColor: '#DA2128',
    },
    filterText: {
        fontSize: 14,
        color: '#666',
    },
    activeFilterText: {
        color: 'white',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 15,
        marginBottom: 10,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    memberList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    memberCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    memberHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    memberPhone: {
        fontSize: 14,
        color: '#666',
    },
    memberStatus: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '500',
    },
    newBadge: {
        backgroundColor: '#FF9800',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    newBadgeText: {
        fontSize: 10,
        color: 'white',
        fontWeight: 'bold',
    },
    memberDetails: {
        marginTop: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    extendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginTop: 10,
    },
    extendButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalBody: {
        marginBottom: 20,
    },
    modalRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    modalLabel: {
        fontSize: 14,
        color: '#666',
        width: 120,
    },
    modalValue: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DA2128',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    primaryButton: {
        backgroundColor: '#DA2128',
    },
    modalButtonText: {
        fontSize: 16,
        color: '#DA2128',
        fontWeight: '500',
    },
});

export default MemberManagementScreen;
