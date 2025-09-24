import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    Image,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';

const EditAvatarScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();

    const [avatarUrl, setAvatarUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!avatarUrl.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập URL ảnh đại diện');
            return;
        }

        try {
            setSaving(true);

            // Validate URL
            try {
                new URL(avatarUrl);
            } catch {
                Alert.alert('Lỗi', 'URL không hợp lệ');
                return;
            }

            // Here you would typically save the avatar URL to the backend
            // For now, we'll just show success message
            Alert.alert(
                'Thành công',
                'Cập nhật ảnh đại diện thành công',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const handleTakePhoto = () => {
        Alert.alert(
            'Chụp ảnh',
            'Chức năng chụp ảnh sẽ được phát triển trong phiên bản tiếp theo',
            [{ text: 'OK' }]
        );
    };

    const handleChooseFromGallery = () => {
        Alert.alert(
            'Chọn ảnh',
            'Chức năng chọn ảnh từ thư viện sẽ được phát triển trong phiên bản tiếp theo',
            [{ text: 'OK' }]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Ảnh đại diện</Text>
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Lưu</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Current Avatar */}
                <View style={styles.avatarSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Ảnh hiện tại</Text>
                    <View style={styles.avatarContainer}>
                        {avatarUrl ? (
                            <Image
                                source={{ uri: avatarUrl }}
                                style={styles.avatar}
                                onError={() => setLoading(false)}
                                onLoadStart={() => setLoading(true)}
                                onLoadEnd={() => setLoading(false)}
                            />
                        ) : (
                            <View style={[styles.placeholderAvatar, { backgroundColor: colors.primary }]}>
                                <MaterialIcons name="person" size={60} color="#fff" />
                            </View>
                        )}
                        {loading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="small" color="#fff" />
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Cập nhật ảnh</Text>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={handleTakePhoto}
                    >
                        <MaterialIcons name="camera-alt" size={24} color={colors.primary} />
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Chụp ảnh mới</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={handleChooseFromGallery}
                    >
                        <MaterialIcons name="photo-library" size={24} color={colors.primary} />
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Chọn từ thư viện</Text>
                    </TouchableOpacity>
                </View>

                {/* URL Input */}
                <View style={styles.urlSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Hoặc nhập URL ảnh</Text>
                    <TextInput
                        style={[
                            styles.urlInput,
                            {
                                backgroundColor: colors.card,
                                color: colors.text,
                                borderColor: colors.border
                            }
                        ]}
                        value={avatarUrl}
                        onChangeText={setAvatarUrl}
                        placeholder="https://example.com/avatar.jpg"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                    <Text style={[styles.urlHint, { color: colors.textMuted }]}>
                        Nhập URL của ảnh đại diện từ internet
                    </Text>
                </View>
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
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 60,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    placeholderAvatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionSection: {
        marginBottom: 32,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    actionButtonText: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    urlSection: {
        marginBottom: 20,
    },
    urlInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 8,
    },
    urlHint: {
        fontSize: 12,
        fontStyle: 'italic',
    },
});

export default EditAvatarScreen;
