import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const MealDetailScreen = ({ route, navigation }) => {
    const { meal } = route.params;
    const [activeTab, setActiveTab] = useState('ingredients'); // ingredients, instructions, video

    const nutrition = meal.nutrition || {};

    // Convert YouTube URL to embed format
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;

        let videoId = null;

        // Format: https://www.youtube.com/watch?v=VIDEO_ID
        const watchMatch = url.match(/[?&]v=([^&]+)/);
        if (watchMatch) {
            videoId = watchMatch[1];
        }

        // Format: https://youtu.be/VIDEO_ID
        const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
        if (shortMatch) {
            videoId = shortMatch[1];
        }

        // Format: https://www.youtube.com/embed/VIDEO_ID
        const embedMatch = url.match(/embed\/([^?&]+)/);
        if (embedMatch) {
            videoId = embedMatch[1];
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }

        return null;
    };

    const renderTabContent = () => {
        if (activeTab === 'ingredients') {
            if (!meal.ingredients || meal.ingredients.length === 0) {
                return (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>Chưa có thông tin nguyên liệu</Text>
                    </View>
                );
            }

            return (
                <View style={styles.tabContent}>
                    {meal.ingredients.map((ingredient, index) => (
                        <View key={index} style={styles.ingredientItem}>
                            <View style={styles.ingredientBullet} />
                            <View style={styles.ingredientContent}>
                                <Text style={styles.ingredientName}>{ingredient.name || ingredient.tenNguyenLieu}</Text>
                                {(ingredient.amount || ingredient.soLuong) && (ingredient.unit || ingredient.donVi) && (
                                    <Text style={styles.ingredientAmount}>
                                        {ingredient.amount || ingredient.soLuong} {ingredient.unit || ingredient.donVi}
                                    </Text>
                                )}
                                {(ingredient.notes || ingredient.ghiChu) && (
                                    <Text style={styles.ingredientNotes}>{ingredient.notes || ingredient.ghiChu}</Text>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            );
        }

        if (activeTab === 'instructions') {
            const instructions = meal.instructions || meal.huongDanNau || [];
            
            if (instructions.length === 0) {
                return (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>Chưa có hướng dẫn nấu</Text>
                    </View>
                );
            }

            return (
                <View style={styles.tabContent}>
                    {instructions.map((instruction, index) => (
                        <View key={index} style={styles.instructionItem}>
                            <View style={styles.instructionNumber}>
                                <Text style={styles.instructionNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.instructionText}>{instruction}</Text>
                        </View>
                    ))}
                </View>
            );
        }

        if (activeTab === 'video') {
            const videoUrl = meal.cookingVideoUrl || meal.videoUrl;
            const embedUrl = getYouTubeEmbedUrl(videoUrl);

            if (!videoUrl) {
                return (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>Chưa có video hướng dẫn</Text>
                    </View>
                );
            }

            if (embedUrl) {
                return (
                    <View style={styles.tabContent}>
                        <View style={styles.videoContainer}>
                            <WebView
                                source={{ uri: embedUrl }}
                                style={styles.video}
                                allowsFullscreenVideo
                                mediaPlaybackRequiresUserAction={false}
                            />
                        </View>
                    </View>
                );
            } else {
                return (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>Video không khả dụng</Text>
                        {videoUrl && (
                            <TouchableOpacity 
                                onPress={() => {
                                    // Open external link
                                    Linking.openURL(videoUrl);
                                }}
                                style={styles.externalLinkButton}
                            >
                                <Text style={styles.externalLinkText}>Mở trên YouTube</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                );
            }
        }

        return null;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <MaterialIcons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Meal Image */}
                <Image
                    source={{ uri: meal.image || meal.anhMonAn || 'https://via.placeholder.com/400' }}
                    style={styles.mealImage}
                    resizeMode="cover"
                />

                {/* Meal Info */}
                <View style={styles.mealInfo}>
                    <Text style={styles.mealTitle}>{meal.name || meal.tenMonAn}</Text>
                    {(meal.description || meal.moTa) && (
                        <Text style={styles.mealDescription}>{meal.description || meal.moTa}</Text>
                    )}
                </View>

                {/* Tab Navigation */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'ingredients' && styles.activeTab]}
                        onPress={() => setActiveTab('ingredients')}
                    >
                        <Text style={[styles.tabText, activeTab === 'ingredients' && styles.activeTabText]}>
                            Nguyên liệu
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'instructions' && styles.activeTab]}
                        onPress={() => setActiveTab('instructions')}
                    >
                        <Text style={[styles.tabText, activeTab === 'instructions' && styles.activeTabText]}>
                            Hướng dẫn nấu
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === 'video' && styles.activeTab,
                            (!meal.cookingVideoUrl && !meal.videoUrl) && styles.disabledTab
                        ]}
                        onPress={() => setActiveTab('video')}
                        disabled={!meal.cookingVideoUrl && !meal.videoUrl}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === 'video' && styles.activeTabText,
                            (!meal.cookingVideoUrl && !meal.videoUrl) && styles.disabledTabText
                        ]}>
                            Video hướng dẫn
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                {renderTabContent()}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    mealImage: {
        width: '100%',
        height: 300,
    },
    mealInfo: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    mealTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
        lineHeight: 36,
    },
    mealDescription: {
        fontSize: 15,
        color: '#999',
        lineHeight: 24,
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
        paddingHorizontal: 24,
    },
    tab: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        marginBottom: -1,
    },
    activeTab: {
        borderBottomColor: '#667eea',
    },
    disabledTab: {
        opacity: 0.4,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#999',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    disabledTabText: {
        color: '#666',
    },
    tabContent: {
        padding: 24,
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        color: '#8A8C90',
        textAlign: 'center',
    },
    externalLinkButton: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#667eea',
        borderRadius: 8,
    },
    externalLinkText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    ingredientItem: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    ingredientBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#667eea',
        marginTop: 8,
        marginRight: 12,
    },
    ingredientContent: {
        flex: 1,
    },
    ingredientName: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 4,
        fontWeight: '500',
    },
    ingredientAmount: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
    ingredientNotes: {
        fontSize: 13,
        color: '#8A8C90',
        fontStyle: 'italic',
    },
    instructionItem: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    instructionNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        flexShrink: 0,
    },
    instructionNumberText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    instructionText: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
        lineHeight: 24,
        paddingTop: 4,
    },
    videoContainer: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    video: {
        flex: 1,
    },
});

export default MealDetailScreen;
