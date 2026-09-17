import React from 'react';
import { HiArrowSmDown, HiArrowSmUp, HiSelector } from 'react-icons/hi';

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  style?: React.CSSProperties;
}

export default function SortableHeader({
  label,
  field,
  currentSortBy,
  currentSortOrder,
  onSort,
  style,
}: SortableHeaderProps) {
  const isActive = currentSortBy === field;

  return (
    <th 
      style={{ cursor: 'pointer', userSelect: 'none', ...style }} 
      onClick={() => onSort(field)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span>{label}</span>
        <span style={{ display: 'flex', color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
          {isActive ? (
            currentSortOrder === 'asc' ? <HiArrowSmUp size={16} /> : <HiArrowSmDown size={16} />
          ) : (
            <HiSelector size={16} style={{ opacity: 0.6 }} />
          )}
        </span>
      </div>
    </th>
  );
}
