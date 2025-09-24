import React from 'react';

interface SortableHeaderProps {
    children: React.ReactNode;
    sortKey: string;
    currentSort: { key: string; direction: 'asc' | 'desc' } | null;
    onSort: (key: string) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
    children,
    sortKey,
    currentSort,
    onSort
}) => {
    const isActive = currentSort?.key === sortKey;
    const direction = isActive ? currentSort.direction : null;

    return (
        <th
            className="sortable-header"
            onClick={() => onSort(sortKey)}
        >
            <span>{children}</span>
            <div className="sort-icons">
                <div
                    className={`sort-icon up ${isActive && direction === 'asc' ? 'active' : 'inactive'}`}
                />
                <div
                    className={`sort-icon down ${isActive && direction === 'desc' ? 'active' : 'inactive'}`}
                />
            </div>
        </th>
    );
};

export default SortableHeader;
