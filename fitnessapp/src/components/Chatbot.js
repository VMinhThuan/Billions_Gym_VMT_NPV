import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    Image,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, DEFAULT_THEME } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import ApiService from '../api/apiService';
import { Animated } from 'react-native';

// Typing indicator dot component with animation
const TypingDot = ({ delay, color }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animate = () => {
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start(() => animate());
        };
        animate();
    }, [delay, opacity]);

    return (
        <Animated.View
            style={[
                styles.typingDot,
                { backgroundColor: color, opacity }
            ]}
        />
    );
};

const Chatbot = () => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [dragEnabled, setDragEnabled] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Xin chào! 👋 Tôi là AI trợ lý của Billions Fitness & Gym. Tôi có thể giúp bạn về gói tập, lịch tập, bài tập, thanh toán, dinh dưỡng và nhiều hơn nữa. Bạn cần hỗ trợ gì hôm nay?',
            timestamp: new Date().toISOString()
        }
    ]);
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
            if (response.success && response.data && response.data.messages) {
                // Convert backend messages to frontend format
                const formattedMessages = response.data.messages.map(msg => ({
                    role: msg.role || (msg.type === 'user' ? 'user' : 'assistant'),
                    content: msg.content || msg.message || msg.text || '',
                    timestamp: msg.timestamp || new Date().toISOString(),
                    actions: msg.actions || []
                }));
                setMessages(formattedMessages.length > 0 ? formattedMessages : messages);
                setSessionId(response.data.sessionId);
            }
        } catch (error) {
            console.error('Lỗi tải lịch sử chat:', error);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        const messageToSend = inputText.trim();

        const userMessage = {
            role: 'user',
            content: messageToSend,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            // Build conversation history for context
            const conversationHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await ApiService.sendChatbotMessage(messageToSend, conversationHistory);

            console.log('[Chatbot] Response:', JSON.stringify(response, null, 2));

            // Handle response - check both success field and data field
            if (response) {
                // If response has success field, check it
                if (response.success === false) {
                    throw new Error(response.message || response.data?.message || 'Có lỗi xảy ra');
                }

                // Extract response data
                const responseData = response.data || response;

                // Check if we have a valid response
                if (responseData && (responseData.response || responseData.message || responseData.text)) {
                    const assistantMessage = {
                        role: 'assistant',
                        content: responseData.response || responseData.message || responseData.text,
                        actions: responseData.actions || [],
                        timestamp: responseData.timestamp || new Date().toISOString()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                    if (responseData.sessionId) {
                        setSessionId(responseData.sessionId);
                    }
                } else {
                    // If no valid response, use error message or default
                    throw new Error(response.message || responseData?.message || 'Không nhận được phản hồi từ server');
                }
            } else {
                throw new Error('Không nhận được phản hồi từ server');
            }
        } catch (error) {
            console.error('Lỗi gửi tin nhắn:', error);
            const errorMessage = {
                role: 'assistant',
                content: 'Xin lỗi, đã có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        if (scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const renderMarkdown = (text) => {
        if (!text) return null;

        const lines = text.split('\n');
        const elements = [];

        lines.forEach((line, index) => {
            // Headers
            if (line.startsWith('## ')) {
                elements.push(
                    <Text key={index} style={styles.markdownH3}>
                        {line.substring(3)}
                    </Text>
                );
            } else if (line.startsWith('# ')) {
                elements.push(
                    <Text key={index} style={styles.markdownH2}>
                        {line.substring(2)}
                    </Text>
                );
            }
            // Bold
            else if (line.includes('**')) {
                const parts = line.split(/(\*\*[^\*]+\*\*)/g);
                elements.push(
                    <Text key={index} style={{ color: '#1A1A1A' }}>
                        {parts.map((part, i) =>
                            part.startsWith('**') && part.endsWith('**')
                                ? <Text key={i} style={styles.markdownBold}>{part.slice(2, -2)}</Text>
                                : <Text key={i} style={{ color: '#1A1A1A' }}>{part}</Text>
                        )}
                    </Text>
                );
            }
            // List items
            else if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                elements.push(
                    <Text key={index} style={styles.markdownLi}>
                        • {line.trim().substring(2)}
                    </Text>
                );
            }
            // Code blocks
            else if (line.includes('```')) {
                elements.push(
                    <Text key={index} style={styles.markdownCode}>{line}</Text>
                );
            }
            // Regular text
            else if (line.trim()) {
                elements.push(
                    <Text key={index} style={styles.markdownP}>{line}</Text>
                );
            } else {
                elements.push(<Text key={index}>{'\n'}</Text>);
            }
        });

        return <View style={styles.markdownContent}>{elements}</View>;
    };

    const renderMessage = (message, index) => {
        const isUser = message.role === 'user';
        const isBot = message.role === 'assistant';

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
                        isBot && { backgroundColor: '#F5F5F5' } // Light gray background for bot messages
                    ]}
                >
                    {isBot ? renderMarkdown(message.content) : (
                        <Text
                            style={[
                                styles.messageText,
                                isUser && { color: '#FFFFFF' }, // White text for user messages
                                isBot && { color: '#1A1A1A' } // Dark text for bot messages
                            ]}
                        >
                            {message.content}
                        </Text>
                    )}
                    {isBot && message.actions && message.actions.length > 0 && (
                        <View style={styles.actionsContainer}>
                            {message.actions.map((action, actionIndex) => (
                                <TouchableOpacity
                                    key={actionIndex}
                                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                    onPress={() => handleActionClick(action)}
                                >
                                    <Text style={styles.actionButtonText}>{action.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    {message.timestamp && (
                        <Text style={[
                            styles.messageTime,
                            isUser ? { color: 'rgba(255, 255, 255, 0.7)' } : { color: '#666666' }
                        ]}>
                            {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const handleActionClick = async (action) => {
        if (action.type === 'link' && action.href) {
            // Navigate to internal route - you can implement navigation here
            Alert.alert('Thông báo', `Điều hướng đến: ${action.href}`);
            setIsOpen(false);
        } else if (action.type === 'run_query' && action.endpoint && action.payload) {
            try {
                setIsLoading(true);
                // Handle query actions if needed
                const resultMessage = {
                    role: 'assistant',
                    content: 'Tính năng này đang được phát triển. Vui lòng thử lại sau.',
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, resultMessage]);
            } catch (error) {
                console.error('Error running query:', error);
                const errorMessage = {
                    role: 'assistant',
                    content: 'Xin lỗi, không thể thực hiện truy vấn này.',
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const quickChips = [
        { label: 'Gói của tôi', query: 'Gói hội viên của tôi còn bao lâu?' },
        { label: 'Lịch hôm nay', query: 'Lịch tập của tôi hôm nay như thế nào?' },
        { label: 'Bài tập', query: 'Cho tôi xem các bài tập có sẵn' },
        { label: 'Thanh toán', query: 'Cho tôi xem lịch sử thanh toán' }
    ];

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
                        <Text style={styles.chatbotIcon}>💬</Text>
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
                                <Text style={styles.headerIcon}>🤖</Text>
                                <View>
                                    <Text style={styles.headerTitle}>AI Trợ lý</Text>
                                    <Text style={styles.headerSubtitle}>Billions Fitness & Gym</Text>
                                </View>
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
                            contentContainerStyle={styles.messagesContent}
                        >
                            {messages.map((message, index) => renderMessage(message, index))}

                            {isLoading && (
                                <View style={styles.loadingContainer}>
                                    <View style={[styles.messageBubble, { backgroundColor: '#F5F5F5' }]}>
                                        <View style={styles.typingIndicator}>
                                            <TypingDot delay={0} color="#666666" />
                                            <TypingDot delay={200} color="#666666" />
                                            <TypingDot delay={400} color="#666666" />
                                        </View>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* Quick Chips - only show when there's only the welcome message */}
                        {messages.length === 1 && (
                            <View style={styles.quickChipsContainer}>
                                {quickChips.map((chip, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.quickChip, { backgroundColor: colors.card }]}
                                        onPress={() => {
                                            setInputText(chip.query);
                                            setTimeout(() => sendMessage(), 100);
                                        }}
                                    >
                                        <Text style={[styles.quickChipText, { color: '#1A1A1A' }]}>
                                            {chip.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Input */}
                        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
                            <TextInput
                                style={[styles.textInput, { color: colors.text, borderColor: colors.textSecondary }]}
                                placeholder="Nhập câu hỏi của bạn..."
                                placeholderTextColor={colors.textSecondary}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxLength={500}
                                onSubmitEditing={sendMessage}
                                returnKeyType="send"
                                editable={!isLoading}
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        backgroundColor: 'transparent'
    },
    chatbotInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    chatbotIcon: {
        fontSize: 24,
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
    headerIcon: {
        fontSize: 28,
        marginRight: 10,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
    },
    closeButton: {
        padding: 5,
    },
    messagesContainer: {
        flex: 1,
        paddingHorizontal: 15,
    },
    messagesContent: {
        paddingVertical: 10,
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
    messageTime: {
        fontSize: 10,
        marginTop: 5,
        fontStyle: 'italic',
    },
    markdownContent: {
        flexDirection: 'column',
    },
    markdownH2: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1A1A1A', // Dark text for headers
    },
    markdownH3: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 6,
        color: '#1A1A1A', // Dark text for headers
    },
    markdownBold: {
        fontWeight: 'bold',
        color: '#1A1A1A', // Dark text for bold
    },
    markdownLi: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 4,
        color: '#1A1A1A', // Dark text for list items
    },
    markdownCode: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        backgroundColor: '#E0E0E0',
        color: '#1A1A1A', // Dark text for code
        padding: 8,
        borderRadius: 4,
        marginVertical: 4,
    },
    markdownP: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 4,
        color: '#1A1A1A', // Dark text for paragraphs
    },
    actionsContainer: {
        marginTop: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginRight: 8,
        marginBottom: 4,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    loadingContainer: {
        marginVertical: 5,
        alignItems: 'flex-start',
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 2,
    },
    quickChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        paddingVertical: 10,
        gap: 8,
    },
    quickChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 4,
        backgroundColor: '#F5F5F5', // Light background for chips
    },
    quickChipText: {
        fontSize: 14,
        fontWeight: '500',
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
