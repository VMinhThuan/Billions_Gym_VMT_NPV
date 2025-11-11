import { chatbotAPI } from './api';

/**
 * AI Service wrapper for user-facing chat
 * Handles conversation with chatbot API and formats responses
 */
export const aiService = {
    /**
     * Send a message to the chatbot
     * @param {string} message - User's message
     * @param {Array} conversationHistory - Previous messages in the conversation
     * @returns {Promise<Object>} Response from chatbot
     */
    chat: async (message, conversationHistory = []) => {
        try {
            // Send message with conversation history for context
            const response = await chatbotAPI.sendMessage(message, conversationHistory);

            // Format response to match expected structure
            if (response && response.success !== false) {
                // Handle different response formats
                const responseData = response.data || response;

                return {
                    success: true,
                    data: {
                        response: responseData.response || responseData.message || responseData.text || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
                        actions: responseData.actions || [],
                        timestamp: responseData.timestamp || new Date().toISOString()
                    }
                };
            } else {
                // Handle error response
                return {
                    success: false,
                    data: {
                        response: response?.message || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
                        actions: [],
                        timestamp: new Date().toISOString()
                    }
                };
            }
        } catch (error) {
            console.error('Error in aiService.chat:', error);
            return {
                success: false,
                data: {
                    response: error.message || 'Xin lỗi, đã có lỗi xảy ra khi kết nối với server. Vui lòng thử lại sau.',
                    actions: [],
                    timestamp: new Date().toISOString()
                }
            };
        }
    },

    /**
     * Get chat history
     * @param {number} limit - Number of messages to retrieve
     * @returns {Promise<Array>} Chat history
     */
    getHistory: async (limit = 50) => {
        try {
            const response = await chatbotAPI.getChatHistory(limit);
            return response?.data || response || [];
        } catch (error) {
            console.error('Error getting chat history:', error);
            return [];
        }
    }
};

export default aiService;

