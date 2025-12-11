import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    Dimensions,
    ActivityIndicator,
    Modal,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import apiService from '../api/apiService';

const { width, height } = Dimensions.get('window');

const AllPTScreen = ({ navigation }) => {
    const { colors } = useTheme();

    const [PTData, setPTData] = useState([]);
    const [filteredPTData, setFilteredPTData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [expandedPTId, setExpandedPTId] = useState(null);

    // Filter states
    const [selectedSpecialties, setSelectedSpecialties] = useState([]);
    const [sortBy, setSortBy] = useState('rating'); // 'rating', 'sessions', 'name'

    const specialties = [
        'Tăng cơ',
        'Giảm cân',
        'HIIT',
        'Yoga',
        'Cardio',
        'Strength Training',
        'Pilates',
        'CrossFit'
    ];

    useEffect(() => {
        fetchAllPT();
    }, []);

    useEffect(() => {
        filterAndSortPT();
    }, [searchQuery, selectedSpecialties, sortBy, PTData]);

    const fetchAllPT = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAllPT();

            if (response && Array.isArray(response)) {
                setPTData(response);
            } else if (response && response.data && Array.isArray(response.data)) {
                setPTData(response.data);
            }
        } catch (error) {
            console.error('Error fetching PT:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortPT = () => {
        let filtered = [...PTData];

        // Search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(pt =>
                pt.hoTen?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                pt.chuyenMon?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Specialty filter
        if (selectedSpecialties.length > 0) {
            filtered = filtered.filter(pt =>
                selectedSpecialties.some(specialty =>
                    pt.chuyenMon?.includes(specialty)
                )
            );
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'rating') {
                const ratingA = a.danhGia?.trungBinh || 0;
                const ratingB = b.danhGia?.trungBinh || 0;
                return ratingB - ratingA;
            } else if (sortBy === 'sessions') {
                const sessionsA = a.soBuoiDaDay || 0;
                const sessionsB = b.soBuoiDaDay || 0;
                return sessionsB - sessionsA;
            } else {
                return (a.hoTen || '').localeCompare(b.hoTen || '');
            }
        });

        setFilteredPTData(filtered);
    };

    const toggleSpecialty = (specialty) => {
        setSelectedSpecialties(prev =>
            prev.includes(specialty)
                ? prev.filter(s => s !== specialty)
                : [...prev, specialty]
        );
    };

    const toggleExpand = (ptId) => {
        setExpandedPTId(expandedPTId === ptId ? null : ptId);
    };

    const renderPTCard = ({ item: pt }) => {
        const isExpanded = expandedPTId === pt._id;
        const rating = pt.danhGia?.trungBinh || 0;
        const reviewCount = pt.danhGia?.soLuong || 0;
        const sessions = pt.soBuoiDaDay || 0;
        const price = pt.giaTheoGio || 500000;

        return (
            <TouchableOpacity
                style={[styles.ptCard, { backgroundColor: colors.card }]}
                onPress={() => toggleExpand(pt._id)}
                activeOpacity={0.8}
            >
                {/* Collapsed View */}
                <View style={styles.ptCardCollapsed}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        {pt.anhDaiDien ? (
                            <Image
                                source={{ uri: pt.anhDaiDien }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarText}>
                                    {pt.hoTen?.charAt(0).toUpperCase() || 'PT'}
                                </Text>
                            </View>
                        )}

                        {/* Online status badge */}
                        <View style={styles.onlineBadge} />
                    </View>

                    {/* Info Column */}
                    <View style={styles.infoColumn}>
                        {/* Name & Certification */}
                        <Text style={[styles.ptName, { color: colors.text }]} numberOfLines={1}>
                            {pt.hoTen || 'PT'}
                        </Text>
                        <Text style={[styles.ptSpecialty, { color: colors.textSecondary }]} numberOfLines={1}>
                            {pt.chuyenMon || 'Huấn luyện viên'}
                        </Text>

                        {/* Rating Row */}
                        <View style={styles.ratingRow}>
                            <View style={styles.starsContainer}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Ionicons
                                        key={star}
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={14}
                                        color="#FFD700"
                                    />
                                ))}
                            </View>
                            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                                {rating.toFixed(1)} ({reviewCount}+)
                            </Text>
                        </View>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Ionicons name="fitness" size={14} color={colors.primary} />
                                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                    {sessions}+ buổi
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="cash-outline" size={14} color={colors.primary} />
                                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                                    {(price / 1000).toFixed(0)}k/buổi
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Book Button */}
                    <TouchableOpacity
                        style={[styles.bookButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('PTSchedule', { ptId: pt._id })}
                    >
                        <Text style={styles.bookButtonText}>Book</Text>
                    </TouchableOpacity>
                </View>

                {/* Expanded Section */}
                {isExpanded && (
                    <View style={styles.ptCardExpanded}>
                        {/* Review Snippet */}
                        {pt.danhGia?.danhGiaMoiNhat && (
                            <View style={[styles.reviewSnippet, { backgroundColor: colors.cardSecondary }]}>
                                <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.primary} />
                                <Text style={[styles.reviewText, { color: colors.textSecondary }]} numberOfLines={2}>
                                    "{pt.danhGia.danhGiaMoiNhat}"
                                </Text>
                            </View>
                        )}

                        {/* Availability Mini Calendar */}
                        <View style={styles.availabilitySection}>
                            <Text style={[styles.availabilityTitle, { color: colors.text }]}>
                                Lịch rảnh:
                            </Text>
                            <View style={styles.availabilityChips}>
                                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => {
                                    const isAvailable = pt.lichRanh?.includes(idx + 2) || false;
                                    return (
                                        <View
                                            key={day}
                                            style={[
                                                styles.dayChip,
                                                {
                                                    backgroundColor: isAvailable ? colors.primary : colors.cardSecondary
                                                }
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.dayChipText,
                                                    { color: isAvailable ? '#fff' : colors.textSecondary }
                                                ]}
                                            >
                                                {day}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.cardSecondary }]}
                                onPress={() => navigation.navigate('PTProfile', { ptId: pt._id })}
                            >
                                <Ionicons name="person-outline" size={18} color={colors.primary} />
                                <Text style={[styles.actionButtonText, { color: colors.text }]}>
                                    Xem Profile
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.cardSecondary }]}
                            >
                                <Ionicons name="heart-outline" size={18} color={colors.primary} />
                                <Text style={[styles.actionButtonText, { color: colors.text }]}>
                                    Yêu thích
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderFilterModal = () => (
        <Modal
            visible={filterModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setFilterModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            Bộ Lọc & Sắp Xếp
                        </Text>
                        <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Sort Options */}
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                                Sắp xếp theo
                            </Text>
                            {[
                                { value: 'rating', label: 'Đánh giá cao nhất' },
                                { value: 'sessions', label: 'Số buổi dạy' },
                                { value: 'name', label: 'Tên A-Z' }
                            ].map(option => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.filterOption,
                                        sortBy === option.value && { backgroundColor: colors.primary + '20' }
                                    ]}
                                    onPress={() => setSortBy(option.value)}
                                >
                                    <Ionicons
                                        name={sortBy === option.value ? 'radio-button-on' : 'radio-button-off'}
                                        size={20}
                                        color={sortBy === option.value ? colors.primary : colors.textSecondary}
                                    />
                                    <Text style={[styles.filterOptionText, { color: colors.text }]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Specialty Filter */}
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                                Chuyên môn
                            </Text>
                            <View style={styles.specialtyChips}>
                                {specialties.map(specialty => (
                                    <TouchableOpacity
                                        key={specialty}
                                        style={[
                                            styles.specialtyChip,
                                            {
                                                backgroundColor: selectedSpecialties.includes(specialty)
                                                    ? colors.primary
                                                    : colors.cardSecondary
                                            }
                                        ]}
                                        onPress={() => toggleSpecialty(specialty)}
                                    >
                                        <Text
                                            style={[
                                                styles.specialtyChipText,
                                                {
                                                    color: selectedSpecialties.includes(specialty)
                                                        ? '#fff'
                                                        : colors.text
                                                }
                                            ]}
                                        >
                                            {specialty}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Reset Button */}
                        <TouchableOpacity
                            style={[styles.resetButton, { borderColor: colors.textSecondary }]}
                            onPress={() => {
                                setSelectedSpecialties([]);
                                setSortBy('rating');
                            }}
                        >
                            <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>
                                Đặt lại bộ lọc
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Apply Button */}
                    <TouchableOpacity
                        style={[styles.applyButton, { backgroundColor: colors.primary }]}
                        onPress={() => setFilterModalVisible(false)}
                    >
                        <Text style={styles.applyButtonText}>
                            Áp dụng
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Tất Cả PT
                </Text>

                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Ionicons name="filter" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Tìm PT theo tên hoặc chuyên môn..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Results Count */}
            <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                    Tìm thấy {filteredPTData.length} PT
                </Text>
                {selectedSpecialties.length > 0 && (
                    <Text style={[styles.activeFilters, { color: colors.primary }]}>
                        {selectedSpecialties.length} bộ lọc
                    </Text>
                )}
            </View>

            {/* PT List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Đang tải danh sách PT...
                    </Text>
                </View>
            ) : filteredPTData.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                        Không tìm thấy PT phù hợp
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                        Thử thay đổi bộ lọc hoặc tìm kiếm
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredPTData}
                    renderItem={renderPTCard}
                    keyExtractor={(item, index) => item._id || `pt-${index}`}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Filter Modal */}
            {renderFilterModal()}

            {/* Footer Insights */}
            <View style={[styles.footer, { backgroundColor: colors.card }]}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    💡 Tip: Đánh giá cao giúp bạn tìm PT phù hợp nhất
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Manrope',
    },
    filterButton: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginVertical: 15,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Manrope',
    },
    resultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    resultsCount: {
        fontSize: 14,
        fontFamily: 'Manrope',
    },
    activeFilters: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Manrope',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    ptCard: {
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    ptCardCollapsed: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        fontFamily: 'Manrope',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    infoColumn: {
        flex: 1,
    },
    ptName: {
        fontSize: 17,
        fontWeight: '700',
        fontFamily: 'Manrope',
        marginBottom: 4,
    },
    ptSpecialty: {
        fontSize: 13,
        fontFamily: 'Manrope',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 2,
    },
    ratingText: {
        fontSize: 13,
        fontFamily: 'Manrope',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        fontFamily: 'Manrope',
    },
    bookButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        marginLeft: 10,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Manrope',
    },
    ptCardExpanded: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    reviewSnippet: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        gap: 8,
    },
    reviewText: {
        flex: 1,
        fontSize: 13,
        fontStyle: 'italic',
        fontFamily: 'Manrope',
    },
    availabilitySection: {
        marginBottom: 12,
    },
    availabilityTitle: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Manrope',
        marginBottom: 8,
    },
    availabilityChips: {
        flexDirection: 'row',
        gap: 8,
    },
    dayChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    dayChipText: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Manrope',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Manrope',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
        maxHeight: height * 0.8,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Manrope',
    },
    filterSection: {
        marginBottom: 25,
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Manrope',
        marginBottom: 12,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 8,
        gap: 12,
    },
    filterOptionText: {
        fontSize: 15,
        fontFamily: 'Manrope',
    },
    specialtyChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    specialtyChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    specialtyChipText: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Manrope',
    },
    resetButton: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    resetButtonText: {
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Manrope',
    },
    applyButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Manrope',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15,
    },
    loadingText: {
        fontSize: 15,
        fontFamily: 'Manrope',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Manrope',
        marginTop: 15,
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: 'Manrope',
        textAlign: 'center',
    },
    footer: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    footerText: {
        fontSize: 13,
        fontFamily: 'Manrope',
        textAlign: 'center',
    },
});

export default AllPTScreen;
