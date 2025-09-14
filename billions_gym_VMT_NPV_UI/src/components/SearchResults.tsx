import React from 'react';
import './SearchResults.css';

interface SearchResult {
    id: string;
    title: string;
    description: string;
    type: 'service' | 'class' | 'trainer' | 'club' | 'article';
    image?: string;
    url: string;
}

interface SearchResultsProps {
    query: string;
    results: SearchResult[];
    isVisible: boolean;
    onClose: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ query, results, isVisible, onClose }) => {
    if (!isVisible) return null;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'service':
                return '💪';
            case 'class':
                return '🏃‍♀️';
            case 'trainer':
                return '👨‍🏫';
            case 'club':
                return '🏢';
            case 'article':
                return '📄';
            default:
                return '🔍';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'service':
                return 'Dịch vụ';
            case 'class':
                return 'Lớp tập';
            case 'trainer':
                return 'Huấn luyện viên';
            case 'club':
                return 'Câu lạc bộ';
            case 'article':
                return 'Bài viết';
            default:
                return 'Kết quả';
        }
    };

    return (
        <div className="search-results-overlay" onClick={onClose}>
            <div className="search-results" onClick={(e) => e.stopPropagation()}>
                <div className="search-results-header">
                    <h3>Kết quả tìm kiếm cho "{query}"</h3>
                    <button className="search-results-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {results.length === 0 ? (
                    <div className="search-results-empty">
                        <div className="empty-icon">🔍</div>
                        <p>Không tìm thấy kết quả nào cho "{query}"</p>
                        <p className="empty-suggestion">Thử tìm kiếm với từ khóa khác</p>
                    </div>
                ) : (
                    <div className="search-results-list">
                        {results.map((result) => (
                            <div key={result.id} className="search-result-item">
                                <div className="result-icon">
                                    {getTypeIcon(result.type)}
                                </div>
                                <div className="result-content">
                                    <div className="result-header">
                                        <h4 className="result-title">{result.title}</h4>
                                        <span className="result-type">{getTypeLabel(result.type)}</span>
                                    </div>
                                    <p className="result-description">{result.description}</p>
                                </div>
                                <div className="result-actions">
                                    <a href={result.url} className="result-link">
                                        Xem chi tiết →
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="search-results-footer">
                    <p>Hiển thị {results.length} kết quả</p>
                </div>
            </div>
        </div>
    );
};

export default SearchResults;
