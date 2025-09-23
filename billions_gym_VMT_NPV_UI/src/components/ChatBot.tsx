import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

interface Message {
    id: string;
    text: string;
    isBot: boolean;
    timestamp: Date;
}

interface ChatBotProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Xin chào! Tôi là AI Assistant của Billions Fitness & Yoga. Tôi có thể giúp bạn tìm hiểu về các dịch vụ và gói tập của chúng tôi. Bạn muốn biết gì?',
            isBot: true,
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const predefinedResponses: { [key: string]: string } = {
        'gói tập': 'Billions có nhiều gói tập phù hợp:\n\n🏋️ **Gói Basic**: Tập gym cơ bản, sử dụng thiết bị\n💪 **Gói Premium**: Gym + Group X + Yoga + Bể bơi\n⭐ **Gói VIP**: Tất cả dịch vụ + PT cá nhân + Spa\n🎯 **Gói Student**: Ưu đãi đặc biệt cho sinh viên\n\nBạn muốn tìm hiểu gói nào cụ thể?',
        
        'giá cả': 'Bảng giá gói tập tại Billions:\n\n💰 **Gói Basic**: 899.000đ/tháng\n💎 **Gói Premium**: 1.299.000đ/tháng\n👑 **Gói VIP**: 1.899.000đ/tháng\n🎓 **Gói Student**: 699.000đ/tháng\n\n✨ Đăng ký 6 tháng giảm 15%\n🎉 Đăng ký 12 tháng giảm 25%\n\nLiên hệ 1800 6995 để được tư vấn chi tiết!',
        
        'dịch vụ': 'Billions cung cấp đa dạng dịch vụ:\n\n🏋️ **Gym & Fitness**: Thiết bị hiện đại, khu vực riêng biệt\n🧘 **Yoga**: Đa dạng lớp từ cơ bản đến nâng cao\n💃 **Group X**: 50+ lớp tập nhóm (Zumba, Aerobic, Dance)\n🥊 **Kickfit & MMA**: Lớp võ thuật chuyên nghiệp\n🏊 **Bể bơi**: Bể bơi trong nhà, Jacuzzi\n👨‍⚕️ **Personal Training**: Huấn luyện viên cá nhân\n🧖‍♀️ **Spa & Massage**: Thư giãn sau tập luyện',
        
        'địa chỉ': 'Billions có 37+ câu lạc bộ trên toàn quốc:\n\n🏢 **Trụ sở chính**: 126 Hùng Vương, P.12, Q.5, TP.HCM\n📍 **TP.HCM**: 15 chi nhánh\n📍 **Hà Nội**: 8 chi nhánh\n📍 **Đà Nẵng**: 4 chi nhánh\n📍 **Các tỉnh khác**: 10+ chi nhánh\n\nGọi 1800 6995 để tìm câu lạc bộ gần bạn nhất!',
        
        'giờ mở cửa': 'Giờ hoạt động của Billions:\n\n⏰ **Thứ 2 - Thứ 6**: 5:30 - 22:30\n⏰ **Thứ 7 - Chủ nhật**: 6:00 - 22:00\n⏰ **Lễ Tết**: 7:00 - 20:00\n\n🎯 Lớp Group X: 6:00 - 21:00\n🧘 Lớp Yoga: 6:30 - 21:30\n🏊 Bể bơi: 6:00 - 22:00',
        
        'đăng ký': 'Cách đăng ký thành viên Billions:\n\n📝 **Bước 1**: Đến trực tiếp câu lạc bộ gần nhất\n📋 **Bước 2**: Tư vấn và chọn gói phù hợp\n💳 **Bước 3**: Thanh toán và làm thẻ thành viên\n🎁 **Bước 4**: Nhận quà tặng chào mừng\n\n🆓 **Ưu đãi hiện tại**: Tặng 7 ngày trải nghiệm miễn phí!\n\nLiên hệ ngay: 1800 6995',
        
        'personal trainer': 'Dịch vụ Personal Trainer tại Billions:\n\n👨‍🏫 **Huấn luyện viên chứng nhận NASM quốc tế**\n📊 **Đánh giá thể trạng và lập kế hoạch cá nhân**\n🎯 **Hướng dẫn 1-1 chuyên sâu**\n📈 **Theo dõi tiến độ và điều chỉnh**\n🍎 **Tư vấn dinh dưỡng**\n\n💰 **Giá**: 500.000đ - 800.000đ/buổi\n⏱️ **Thời gian**: 60-90 phút/buổi',
        
        'yoga': 'Chương trình Yoga tại Billions:\n\n🧘‍♀️ **Hatha Yoga**: Cơ bản, phù hợp người mới\n🔥 **Hot Yoga**: Tập trong phòng nóng 38-40°C\n⚡ **Vinyasa Flow**: Động tác liên tục, năng động\n🌅 **Yin Yoga**: Thư giãn, giãn cơ sâu\n👶 **Prenatal Yoga**: Dành cho mẹ bầu\n\n👨‍🏫 **Giảng viên từ Ấn Độ và được chứng nhận quốc tế**',
        
        'group x': 'Lớp Group X đa dạng tại Billions:\n\n💃 **Dance**: Zumba, K-Pop Dance, Sexy Dance\n🥊 **Combat**: Body Combat, Kickboxing\n🚴 **Cardio**: Spinning, RPM, Step Aerobic\n💪 **Strength**: Body Pump, Functional Training\n🎵 **Độc quyền**: BillionsDrumfit, BillionsStep\n\n📅 **50+ lớp/tuần**, cập nhật hàng tháng\n⏰ **Đa dạng khung giờ** phù hợp mọi lịch trình'
    };

    const getResponse = (userMessage: string): string => {
        const message = userMessage.toLowerCase();
        
        for (const [key, response] of Object.entries(predefinedResponses)) {
            if (message.includes(key)) {
                return response;
            }
        }
        
        // Default responses for common greetings
        if (message.includes('xin chào') || message.includes('hello') || message.includes('hi')) {
            return 'Xin chào! Tôi có thể giúp bạn tìm hiểu về:\n\n🏋️ Các gói tập và giá cả\n🎯 Dịch vụ tại Billions\n📍 Địa chỉ các câu lạc bộ\n⏰ Giờ hoạt động\n📝 Cách đăng ký thành viên\n\nBạn muốn biết thông tin gì?';
        }
        
        if (message.includes('cảm ơn') || message.includes('thank')) {
            return 'Rất vui được hỗ trợ bạn! Nếu có thêm câu hỏi nào khác về Billions Fitness & Yoga, đừng ngần ngại hỏi tôi nhé! 😊\n\nHoặc liên hệ trực tiếp: 1800 6995';
        }
        
        // Default response
        return 'Tôi hiểu bạn đang quan tâm đến thông tin này. Để được tư vấn chi tiết và chính xác nhất, bạn có thể:\n\n📞 **Gọi hotline**: 1800 6995\n🏢 **Đến trực tiếp**: Câu lạc bộ Billions gần nhất\n💬 **Hỏi tôi về**: Gói tập, dịch vụ, giá cả, địa chỉ\n\nTôi sẵn sàng hỗ trợ bạn! 😊';
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            isBot: false,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        // Simulate typing delay
        setTimeout(() => {
            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: getResponse(inputText),
                isBot: true,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 1000 + Math.random() * 1000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const quickQuestions = [
        'Gói tập có gì?',
        'Giá cả như thế nào?',
        'Địa chỉ ở đâu?',
        'Giờ mở cửa?'
    ];

    if (!isOpen) return null;

    return (
        <div className="chatbot-overlay">
            <div className="chatbot-container">
                <div className="chatbot-header">
                    <div className="chatbot-avatar">
                        <span>🤖</span>
                    </div>
                    <div className="chatbot-info">
                        <h3>Billions AI Assistant</h3>
                        <span className="status">● Online</span>
                    </div>
                    <button className="chatbot-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="chatbot-messages">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message ${message.isBot ? 'bot-message' : 'user-message'}`}
                        >
                            <div className="message-content">
                                {message.text.split('\n').map((line, index) => (
                                    <div key={index}>{line}</div>
                                ))}
                            </div>
                            <div className="message-time">
                                {message.timestamp.toLocaleTimeString('vi-VN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </div>
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className="message bot-message">
                            <div className="message-content typing">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {messages.length === 1 && (
                    <div className="quick-questions">
                        <p>Câu hỏi thường gặp:</p>
                        <div className="quick-buttons">
                            {quickQuestions.map((question, index) => (
                                <button
                                    key={index}
                                    className="quick-button"
                                    onClick={() => {
                                        setInputText(question);
                                        setTimeout(() => handleSendMessage(), 100);
                                    }}
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="chatbot-input">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập câu hỏi của bạn..."
                        className="message-input"
                    />
                    <button 
                        onClick={handleSendMessage}
                        className="send-button"
                        disabled={!inputText.trim()}
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
