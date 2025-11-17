import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { authUtils } from '../utils/auth';
import './BubbleChat.css';

const BubbleChat = ({ isAuthenticated: propIsAuthenticated }) => {
    // Use prop or check auth directly
    const isAuthenticated = propIsAuthenticated !== undefined
        ? propIsAuthenticated
        : authUtils.isAuthenticated();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Xin chào! 👋 Tôi là AI trợ lý của Billions Fitness & Gym. Tôi có thể giúp bạn về gói tập, lịch tập, bài tập, thanh toán, dinh dưỡng và nhiều hơn nữa. Bạn cần hỗ trợ gì hôm nay?',
            timestamp: new Date().toISOString()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const bubbleRef = useRef(null);

    // Restore position from localStorage
    useEffect(() => {
        const savedPosition = localStorage.getItem('bubbleChatPosition');
        if (savedPosition) {
            try {
                const pos = JSON.parse(savedPosition);
                const bubbleSize = 60;
                const margin = 20;
                const maxX = Math.max(margin, window.innerWidth - bubbleSize - margin);
                const maxY = Math.max(margin, window.innerHeight - bubbleSize - margin);

                const validatedX = Math.max(margin, Math.min(pos.x || margin, maxX));
                const validatedY = Math.max(margin, Math.min(pos.y || margin, maxY));

                setPosition({ x: validatedX, y: validatedY });
            } catch (e) {
                console.error('Error parsing saved position:', e);
                setPosition({ x: 20, y: 20 });
            }
        } else {
            setPosition({ x: 20, y: 20 });
        }

        // Handle window resize
        const handleResize = () => {
            setPosition(prev => {
                const bubbleSize = 60;
                const margin = 20;
                const maxX = Math.max(margin, window.innerWidth - bubbleSize - margin);
                const maxY = Math.max(margin, window.innerHeight - bubbleSize - margin);

                return {
                    x: Math.max(margin, Math.min(prev.x, maxX)),
                    y: Math.max(margin, Math.min(prev.y, maxY))
                };
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Save position to localStorage
    const savePosition = (pos) => {
        localStorage.setItem('bubbleChatPosition', JSON.stringify(pos));
    };

    // Keyboard shortcut Ctrl+/
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle drag start
    const handleBubbleMouseDown = (e) => {
        if (isOpen) return;

        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        const rect = bubbleRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    // Handle drag
    useEffect(() => {
        if (!isDragging) return;

        let animationFrameId = null;
        let lastX = position.x;
        let lastY = position.y;

        const handleMouseMove = (e) => {
            if (!bubbleRef.current) return;

            const bubbleWidth = bubbleRef.current.offsetWidth || 60;
            const bubbleHeight = bubbleRef.current.offsetHeight || 60;

            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            const maxX = window.innerWidth - bubbleWidth;
            const maxY = window.innerHeight - bubbleHeight;

            const minMargin = 20;
            const constrainedX = Math.max(minMargin, Math.min(newX, maxX - minMargin));
            const constrainedY = Math.max(minMargin, Math.min(newY, maxY - minMargin));

            const threshold = 2;
            if (Math.abs(constrainedX - lastX) > threshold || Math.abs(constrainedY - lastY) > threshold) {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }

                animationFrameId = requestAnimationFrame(() => {
                    lastX = constrainedX;
                    lastY = constrainedY;
                    setPosition({ x: constrainedX, y: constrainedY });
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            savePosition(position);
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isDragging, dragOffset, position]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || isLoading || !isAuthenticated) return;

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
            const conversationHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await aiService.chat(messageToSend, conversationHistory);

            const responseData = response?.data || {};

            const assistantMessage = {
                role: 'assistant',
                content: responseData.response || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
                actions: responseData.actions || [],
                timestamp: responseData.timestamp || new Date().toISOString()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
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

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleActionClick = async (action) => {
        if (action.type === 'link' && action.href) {
            // Navigate to internal route
            if (window.location.hash) {
                window.location.hash = action.href;
            } else {
                window.location.pathname = action.href;
            }
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

    const renderMarkdown = (text) => {
        if (!text) return null;

        const lines = text.split('\n');
        const elements = [];

        lines.forEach((line, index) => {
            // Headers
            if (line.startsWith('## ')) {
                elements.push(<h3 key={index} className="markdown-h3">{line.substring(3)}</h3>);
            } else if (line.startsWith('# ')) {
                elements.push(<h2 key={index} className="markdown-h2">{line.substring(2)}</h2>);
            }
            // Bold
            else if (line.includes('**')) {
                const parts = line.split(/(\*\*[^\*]+\*\*)/g);
                elements.push(
                    <p key={index}>
                        {parts.map((part, i) =>
                            part.startsWith('**') && part.endsWith('**')
                                ? <strong key={i}>{part.slice(2, -2)}</strong>
                                : part
                        )}
                    </p>
                );
            }
            // List items
            else if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                elements.push(<li key={index} className="markdown-li">{line.trim().substring(2)}</li>);
            }
            // Code blocks
            else if (line.includes('```')) {
                elements.push(<pre key={index} className="markdown-code">{line}</pre>);
            }
            // Regular text
            else if (line.trim()) {
                elements.push(<p key={index} className="markdown-p">{line}</p>);
            } else {
                elements.push(<br key={index} />);
            }
        });

        return <div className="markdown-content">{elements}</div>;
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            {/* Bubble Button */}
            <div
                ref={bubbleRef}
                className={`bubble-chat-button ${isOpen ? 'hidden' : ''}`}
                style={{
                    position: 'fixed',
                    bottom: position.y || 20,
                    right: position.x || 20,
                    zIndex: 9999,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none'
                }}
                onMouseDown={handleBubbleMouseDown}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDragging) {
                        setIsOpen(true);
                    }
                }}
                title="Chat với AI (Ctrl+/)"
            >
                <div className="bubble-icon">💬</div>
                <div className="bubble-pulse"></div>
            </div>

            {/* Chat Window */}
            {isOpen && (() => {
                const windowWidth = 380;
                const windowHeight = 600;
                const margin = 20;

                let chatRight = position.x || margin;
                let chatBottom = position.y || margin;

                if (chatRight + windowWidth > window.innerWidth - margin) {
                    chatRight = Math.max(margin, position.x - windowWidth - 10);
                    if (chatRight + windowWidth > window.innerWidth - margin) {
                        chatRight = window.innerWidth - windowWidth - margin;
                    }
                }

                if (chatBottom + windowHeight > window.innerHeight - margin) {
                    chatBottom = Math.max(margin, window.innerHeight - windowHeight - margin);
                }

                return (
                    <div
                        ref={chatContainerRef}
                        className="bubble-chat-window"
                        style={{
                            position: 'fixed',
                            bottom: chatBottom,
                            right: chatRight,
                            zIndex: 9999
                        }}
                    >
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="chat-avatar">🤖</div>
                                <div>
                                    <div className="chat-title">AI Trợ lý</div>
                                    <div className="chat-subtitle">Billions Fitness & Gym</div>
                                </div>
                            </div>
                            <button
                                className="chat-close-btn"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsOpen(false);
                                }}
                                title="Đóng (Ctrl+/)"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="chat-messages">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
                                >
                                    <div className="message-content">
                                        {message.role === 'assistant'
                                            ? renderMarkdown(message.content)
                                            : <p>{message.content}</p>
                                        }
                                    </div>
                                    {message.actions && message.actions.length > 0 && (
                                        <div className="message-actions">
                                            {message.actions.map((action, actionIndex) => (
                                                <button
                                                    key={actionIndex}
                                                    className="action-button"
                                                    onClick={() => handleActionClick(action)}
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {message.timestamp && (
                                        <div className="message-time">
                                            {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="message bot-message">
                                    <div className="message-content">
                                        <div className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {messages.length === 1 && (
                            <div className="quick-chips">
                                {quickChips.map((chip, index) => (
                                    <button
                                        key={index}
                                        className="quick-chip"
                                        onClick={() => {
                                            setInputText(chip.query);
                                            setTimeout(() => handleSendMessage(), 100);
                                        }}
                                    >
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="chat-input-container">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Nhập câu hỏi của bạn..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isLoading}
                            />
                            <button
                                className="chat-send-btn"
                                onClick={handleSendMessage}
                                disabled={!inputText.trim() || isLoading}
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                );
            })()}
        </>
    );
};

export default BubbleChat;

