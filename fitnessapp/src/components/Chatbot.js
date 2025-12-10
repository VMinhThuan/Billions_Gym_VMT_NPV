import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Alert,
    PanResponder,
    Dimensions,
    Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import ApiService from '../api/apiService';

const Chatbot = () => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [dragEnabled, setDragEnabled] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const scrollViewRef = useRef(null);
    const startRef = useRef({ x: 0, y: 0 });
    const { width, height } = Dimensions.get('window');
    const [position, setPosition] = useState({
        x: Math.max(10, width - 86),
        y: Math.max(10, height - 150)
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => dragEnabled,
            onMoveShouldSetPanResponder: () => dragEnabled,
            onStartShouldSetPanResponderCapture: () => dragEnabled,
            onMoveShouldSetPanResponderCapture: () => dragEnabled,
            onPanResponderGrant: () => {
                startRef.current = { x: position.x, y: position.y };
            },
            onPanResponderMove: (_, gesture) => {
                const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
                const nextX = clamp(startRef.current.x + gesture.dx, 10, width - 66);
                const nextY = clamp(startRef.current.y + gesture.dy, 10, height - 66);
                setPosition({ x: nextX, y: nextY });
            },
            onPanResponderRelease: () => {
                setDragEnabled(false);
            },
            onResponderTerminationRequest: () => false,
            onPanResponderTerminate: () => {
                setDragEnabled(false);
            }
        })
    ).current;

    useEffect(() => {
        if (isOpen && user) {
            loadChatHistory();
        }
    }, [isOpen, user]);

    const loadChatHistory = async () => {
        try {
            const response = await ApiService.getChatHistory();
            if (response.success) {
                setMessages(response.data.messages || []);
                setSessionId(response.data.sessionId);
            }
        } catch (error) {
            console.error('Lỗi tải lịch sử chat:', error);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage = {
            type: 'user',
            content: inputText.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await ApiService.sendChatbotMessage(inputText.trim());

            if (response.success) {
                const botMessage = {
                    type: 'bot',
                    content: response.data.response,
                    timestamp: new Date(),
                    context: response.data.context
                };
                setMessages(prev => [...prev, botMessage]);
                setSessionId(response.data.sessionId);
            } else {
                throw new Error(response.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Lỗi gửi tin nhắn:', error);
            Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    const scrollToBottom = () => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const renderMessage = (message, index) => {
        const isUser = message.type === 'user';
        const isBot = message.type === 'bot';

        return (
            <View
                key={index}
                style={[
                    styles.messageContainer,
                    isUser && styles.userMessageContainer,
                    isBot && styles.botMessageContainer
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        isUser && { backgroundColor: colors.primary },
                        isBot && { backgroundColor: colors.card }
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            isUser && { color: 'white' },
                            isBot && { color: colors.text }
                        ]}
                    >
                        {message.content}
                    </Text>
                    {isBot && message.context && (
                        <Text style={[styles.contextText, { color: colors.textSecondary }]}>
                            {getContextLabel(message.context)}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const getContextLabel = (context) => {
        const contextLabels = {
            nutrition: '🍎 Dinh dưỡng',
            workout: '💪 Tập luyện',
            membership: '💳 Gói tập',
            booking: '📅 Đặt lịch',
            feedback: '📝 Phản hồi',
            general: '💬 Hỗ trợ'
        };
        return contextLabels[context] || '💬 Hỗ trợ';
    };

    const getQuickActions = () => {
        return [
            { text: '🍎 Tư vấn dinh dưỡng', context: 'nutrition' },
            { text: '💪 Gợi ý bài tập', context: 'workout' },
            { text: '💳 Gói tập', context: 'membership' },
            { text: '📅 Đặt lịch', context: 'booking' }
        ];
    };

    const handleQuickAction = (action) => {
        setInputText(action.text);
    };

    return (
        <>
            {/* Draggable Chatbot Button (long-press to drag) */}
            <View
                style={[styles.draggableContainer, { top: position.y, left: position.x }]}
                {...panResponder.panHandlers}
                pointerEvents={isOpen ? 'none' : 'auto'}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => { if (!dragEnabled) { setIsOpen(true); } }}
                    onLongPress={() => setDragEnabled(true)}
                    onPressIn={() => setDragEnabled(false)}
                    onPressOut={() => setDragEnabled(false)}
                    delayLongPress={200}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Mở trợ lý AI"
                    style={styles.chatbotButton}
                >
                    <LinearGradient
                        colors={['#ffffff', '#ffffff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.chatbotInner}
                    >
                        <Image source={require('../../assets/images/icons/machine-learning.png')} style={styles.chatbotImage} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Chatbot Modal */}
            <Modal
                visible={isOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsOpen(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={[styles.chatbotContainer, { backgroundColor: colors.background }]}>
                        {/* Header */}
                        <View style={[styles.header, { backgroundColor: colors.primary }]}>
                            <View style={styles.headerContent}>
                                <Image source={require('../../assets/images/icons/chatbot.png')} style={styles.chatbotImage} />
                                <Text style={styles.headerTitle}>AI Trợ lý</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setIsOpen(false)}
                                style={styles.closeButton}
                            >
                                <MaterialIcons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Messages */}
                        <ScrollView
                            ref={scrollViewRef}
                            style={styles.messagesContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            {messages.length === 0 ? (
                                <View style={styles.welcomeContainer}>
                                    <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                                        <Image source={require('../../assets/images/icons/hello-chatbot.png')} style={styles.chatbotImage} /> Xin chào!
                                    </Text>
                                    <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
                                        Tôi là AI trợ lý của Billions Gym. Tôi có thể giúp gì cho bạn!
                                    </Text>
                                    <View style={styles.quickActionsContainer}>
                                        {getQuickActions().map((action, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[styles.quickActionButton, { backgroundColor: colors.card }]}
                                                onPress={() => handleQuickAction(action)}
                                            >
                                                <Text style={[styles.quickActionText, { color: colors.text }]}>
                                                    {action.text}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                messages.map((message, index) => renderMessage(message, index))
                            )}

                            {isLoading && (
                                <View style={styles.loadingContainer}>
                                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                        AI đang suy nghĩ...
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Input */}
                        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
                            <TextInput
                                style={[styles.textInput, { color: colors.text }]}
                                placeholder="Nhập tin nhắn..."
                                placeholderTextColor={colors.textSecondary}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxLength={500}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    { backgroundColor: colors.primary },
                                    (!inputText.trim() || isLoading) && styles.sendButtonDisabled
                                ]}
                                onPress={sendMessage}
                                disabled={!inputText.trim() || isLoading}
                            >
                                <MaterialIcons
                                    name="send"
                                    size={20}
                                    color="white"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    draggableContainer: {
        position: 'absolute',
        zIndex: 1000,
    },
    chatbotButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        boxShadow: '0px 6px 6px rgba(0, 0, 0, 0.25)',
        backgroundColor: 'transparent'
    },
    chatbotInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E0E0E0'
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    chatbotContainer: {
        flex: 1,
        marginTop: 100,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    chatbotImage: {
        width: 26,
        height: 26,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    closeButton: {
        padding: 5,
    },
    messagesContainer: {
        flex: 1,
        paddingHorizontal: 15,
    },
    messageContainer: {
        marginVertical: 5,
    },
    userMessageContainer: {
        alignItems: 'flex-end',
    },
    botMessageContainer: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    contextText: {
        fontSize: 12,
        marginTop: 5,
        fontStyle: 'italic',
    },
    welcomeContainer: {
        padding: 20,
        alignItems: 'center',
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    welcomeText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    quickActionsContainer: {
        width: '100%',
    },
    quickActionButton: {
        padding: 15,
        borderRadius: 10,
        marginVertical: 5,
        alignItems: 'center',
    },
    quickActionText: {
        fontSize: 16,
        fontWeight: '500',
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100,
        fontSize: 16,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});

export default Chatbot;
