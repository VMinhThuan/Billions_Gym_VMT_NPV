import { api } from './api';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    actions?: ChatAction[];
}

export interface ChatAction {
    type: 'link' | 'run_query';
    label: string;
    href?: string;
    endpoint?: string;
    payload?: any;
}

export interface ChatResponse {
    success: boolean;
    data: {
        response: string;
        actions?: ChatAction[];
        timestamp: string;
    };
}

export interface SearchResponse {
    success: boolean;
    data: {
        query: string;
        results: {
            goitap?: any[];
            chitietgoitap?: any[];
            lichtap?: any[];
            lichsutap?: any[];
        };
    };
}

export interface QueryResponse {
    success: boolean;
    data: {
        success: boolean;
        data: any[];
        total: number;
        limit: number;
        skip: number;
    };
}

export const aiService = {
    /**
     * Gửi tin nhắn chat đến AI
     */
    chat: async (message: string, conversationHistory: ChatMessage[] = []): Promise<ChatResponse> => {
        return await api.post<ChatResponse>('/api/ai/chat', {
            message,
            conversationHistory
        });
    },

    /**
     * Tìm kiếm full-text
     */
    search: async (query: string): Promise<SearchResponse> => {
        return await api.get<SearchResponse>('/api/ai/search', { q: query });
    },

    /**
     * Truy vấn có cấu trúc
     */
    query: async (payload: {
        resource: string;
        filters?: any;
        sort?: any;
        limit?: number;
        skip?: number;
    }): Promise<QueryResponse> => {
        return await api.post<QueryResponse>('/api/ai/query', payload);
    },

    /**
     * Thực hiện action
     */
    action: async (name: string, payload?: any): Promise<any> => {
        return await api.post(`/api/ai/action/${name}`, payload || {});
    }
};
