import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';

const AIRecommendationsScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();

    const [activeTab, setActiveTab] = useState('nutrition');
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchRecommendations();
    }, [activeTab]);

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            let mockData = [];
            
            if (activeTab === 'nutrition') {
                mockData = [
                    {
                        id: '1',
                        type: 'nutrition',
                        title: 'Gợi ý dinh dưỡng cho Nguyễn Văn A',
                        memberName: 'Nguyễn Văn A',
                        target: 'Giảm cân',
                        aiScore: 92,
                        createdAt: '2024-03-15'
                    }
                ];
            } else if (activeTab === 'workout') {
                mockData = [
                    {
                        id: '2',
                        type: 'workout', 
                        title: 'Lịch tập cardio cho Nguyễn Văn A',
                        memberName: 'Nguyễn Văn A',
                        target: 'Giảm cân',
                        aiScore: 90,
                        createdAt: '2024-03-15'
                    }
                ];
            } else if (activeTab === 'package') {
                mockData = [
                    {
                        id: '3',
                        type: 'package',
                        title: 'Gói tập phù hợp cho Lê Văn C',
                        memberName: 'Lê Văn C',
                        target: 'Duy trì sức khỏe',
                        aiScore: 87,
                        createdAt: '2024-03-13'
                    }
                ];
            }
            
            setRecommendations(mockData);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải gợi ý từ AI');
        } finally {
            setLoading(false);
        }
    };

    const renderTabButton = (tab, title, icon) => (
        <TouchableOpacity
            style={[
                styles.tabButton, 
                activeTab === tab && { backgroundColor: colors.background }
            ]}
            onPress={() => setActiveTab(tab)}
        >
            <MaterialIcons
                name={icon}
                size={20}
                color={activeTab === tab ? colors.primary : colors.textSecondary}
            />
            <Text style={[
                styles.tabText, 
                { color: activeTab === tab ? colors.primary : colors.textSecondary }
            ]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    const renderRecommendationItem = ({ item }) => (
        <TouchableOpacity 
            style={[styles.recommendationCard, { backgroundColor: colors.surface }]}
            onPress={() => setModalVisible(true)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                    <MaterialIcons 
                        name={item.type === 'nutrition' ? 'restaurant' : 
                              item.type === 'workout' ? 'fitness-center' : 'card-membership'} 
                        size={20} 
                        color={colors.primary} 
                    />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                        {item.title}
                    </Text>
                </View>
                <View style={styles.aiScoreContainer}>
                    <FontAwesome5 name="brain" size={12} color="#FF9800" />
                    <Text style={styles.aiScore}>{item.aiScore}%</Text>
                </View>
            </View>
            <Text style={[styles.memberName, { color: colors.textSecondary }]}>
                Thành viên: {item.memberName}
            </Text>
            <Text style={[styles.target, { color: colors.text }]}>
                Mục tiêu: {item.target}
            </Text>
            <Text style={[styles.createdAt, { color: colors.textSecondary }]}>
                Tạo ngày: {item.createdAt}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Gợi ý từ AI
                </Text>
                <TouchableOpacity 
                    style={styles.generateButton}
                    onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
                >
                    <FontAwesome5 name="brain" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={[
                styles.tabContainer, 
                { 
                    backgroundColor: colors.surface, 
                    borderBottomColor: colors.border 
                }
            ]}>
                {renderTabButton('nutrition', 'Dinh dưỡng', 'restaurant')}
                {renderTabButton('workout', 'Tập luyện', 'fitness-center')}
                {renderTabButton('package', 'Gói tập', 'card-membership')}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        AI đang phân tích...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={recommendations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRecommendationItem}
                    style={styles.recommendationsList}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <FontAwesome5 name="brain" size={64} color="#ccc" />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Chưa có gợi ý từ AI
                            </Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Chi tiết gợi ý AI
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                            Thông tin chi tiết về gợi ý từ AI sẽ được hiển thị tại đây.
                        </Text>
                    </View>
                </View>
            </Modal>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
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
    },
    generateButton: {
        padding: 5,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        marginHorizontal: 2,
    },
    tabText: {
        fontSize: 14,
        marginLeft: 5,
    },
    recommendationsList: {
        flex: 1,
    },
    listContent: {
        padding: 20,
    },
    recommendationCard: {
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    cardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
        flex: 1,
    },
    aiScoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    aiScore: {
        fontSize: 12,
        color: '#FF9800',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    memberName: {
        fontSize: 14,
        marginBottom: 4,
    },
    target: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 10,
    },
    createdAt: {
        fontSize: 12,
        textAlign: 'right',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        marginTop: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 10,
        marginBottom: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 15,
        padding: 20,
        width: '90%',
        maxHeight: '70%',
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
    },
    modalText: {
        fontSize: 16,
        lineHeight: 24,
    },
});

export default AIRecommendationsScreen;