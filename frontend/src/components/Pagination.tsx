import React from 'react';

interface PaginationProps {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  limit: number;
  setLimit: (limit: number) => void;
  options?: number[];
}

export default function Pagination({ page, setPage, totalPages, limit, setLimit, options = [10, 15, 20, 50, 100] }: PaginationProps) {
  const handlePageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    if (val < 1) val = 1;
    if (val > totalPages) val = totalPages;
    setPage(val);
  };

  if (totalPages <= 1 && page === 1) return null;

  return (
    <div className="pagination">
      <div className="pagination-left">
        <span className="pagination-label">Rows per page:</span>
        <select 
          className="form-select pagination-select" 
          value={limit} 
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1); // Reset to page 1 on limit change
          }}
        >
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="pagination-center">
        <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span className="pagination-info">
          Page 
          <input 
            type="number" 
            className="form-input pagination-input" 
            value={page} 
            onChange={handlePageChange}
            min={1}
            max={totalPages}
          /> 
          of {totalPages}
        </span>
        <button className="btn btn-sm btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
