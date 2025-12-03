import React, { useState, useEffect } from 'react';
import { MessageCircle, Star, Award } from 'lucide-react';
import api from '../../services/api';
import chatService from '../../services/chat.service';
import ChatWindow from './ChatWindow';

const FeaturedTrainers = () => {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [chatRoom, setChatRoom] = useState(null);
    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
        fetchTrainers();

        // Connect to WebSocket for real-time PT status updates
        chatService.connect();

        // Listen for PT status changes
        const handlePTStatusChanged = ({ ptId, isOnline }) => {
            console.log('[FeaturedTrainers] PT status changed:', ptId, isOnline);
            setTrainers(prevTrainers =>
                prevTrainers.map(trainer =>
                    trainer._id === ptId
                        ? { ...trainer, isOnline }
                        : trainer
                )
            );
        };

        chatService.on('pt-status-changed', handlePTStatusChanged);

        return () => {
            chatService.off('pt-status-changed', handlePTStatusChanged);
        };
    }, []);

    const fetchTrainers = async () => {
        try {
            setLoading(true);
            const response = await api.api.get('/pt/list');

            let data = [];
            if (Array.isArray(response)) {
                data = response;
            } else if (response.data && Array.isArray(response.data)) {
                data = response.data;
            }

            // Lấy top 4 PT
            setTrainers(data.slice(0, 4));
        } catch (error) {
            console.error('Error fetching trainers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChatWithTrainer = async (trainer) => {
        try {
            console.log('[FeaturedTrainers] Opening chat with trainer:', trainer);
            setSelectedTrainer(trainer);

            // Kết nối WebSocket nếu chưa
            if (!chatService.isConnected) {
                console.log('[FeaturedTrainers] Connecting to WebSocket...');
                chatService.connect();
            }

            // Tạo hoặc lấy room chat
            console.log('[FeaturedTrainers] Getting or creating room for trainer:', trainer._id);
            const response = await chatService.getOrCreateRoom(trainer._id);
            console.log('[FeaturedTrainers] Room response:', response);

            if (response.success) {
                setChatRoom(response.data);
                setShowChat(true);
                console.log('[FeaturedTrainers] Chat opened successfully');
            } else {
                console.error('[FeaturedTrainers] Failed to get room:', response);
                alert('Không thể mở chat. Vui lòng thử lại!');
            }
        } catch (error) {
            console.error('[FeaturedTrainers] Error opening chat:', error);
            alert('Không thể mở chat. Vui lòng thử lại!');
        }
    };

    const handleCloseChat = () => {
        setShowChat(false);
        setSelectedTrainer(null);
        setChatRoom(null);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-[22px] p-6 shadow-lg">
                <h3 className="text-[#1D1617] font-semibold text-lg mb-4">Huấn luyện viên nổi bật</h3>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#92A3FD]"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-[22px] p-6 shadow-lg">
                <h3 className="text-[#1D1617] font-semibold text-lg mb-4">Huấn luyện viên nổi bật</h3>

                <div className="space-y-4">
                    {trainers.map((trainer) => (
                        <div
                            key={trainer._id}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                        >
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#92A3FD] to-[#9DCEFF] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                                    {trainer.anhDaiDien ? (
                                        <img
                                            src={trainer.anhDaiDien}
                                            alt={trainer.hoTen}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        trainer.hoTen.charAt(0).toUpperCase()
                                    )}
                                </div>
                                {/* Online/Offline Status */}
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${trainer.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[#1D1617] font-semibold text-sm truncate">
                                    {trainer.hoTen}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    {trainer.chuyenMon && trainer.chuyenMon.length > 0 && (
                                        <p className="text-xs text-gray-500 truncate">
                                            {trainer.chuyenMon[0]}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span className="text-xs text-gray-600">
                                        {trainer.danhGiaTrungBinh?.toFixed(1) || '5.0'}
                                    </span>
                                </div>
                            </div>

                            {/* Chat Button */}
                            <button
                                onClick={() => handleChatWithTrainer(trainer)}
                                className="bg-gradient-to-r from-[#92A3FD] to-[#9DCEFF] text-white p-2 rounded-full hover:shadow-lg transition-all flex-shrink-0"
                                title="Chat với PT"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {trainers.length === 0 && (
                    <div className="text-center py-8">
                        <Award className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Chưa có huấn luyện viên</p>
                    </div>
                )}
            </div>

            {/* Chat Window */}
            {showChat && selectedTrainer && chatRoom && (
                <ChatWindow
                    roomId={chatRoom._id}
                    recipient={selectedTrainer}
                    onClose={handleCloseChat}
                />
            )}
        </>
    );
};

export default FeaturedTrainers;
