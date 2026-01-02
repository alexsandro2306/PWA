import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange
}) => {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="pagination-container">
            <div className="pagination-controls">
                <button
                    className="page-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft size={18} />
                </button>

                {getPageNumbers().map((page, idx) => (
                    page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="ellipsis">...</span>
                    ) : (
                        <button
                            key={page}
                            className={`page-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    )
                ))}

                <button
                    className="page-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            <style>{`
                .pagination-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 1rem;
                    border-top: 1px solid var(--border-color);
                }

                .pagination-controls {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .page-btn {
                    min-width: 36px;
                    height: 36px;
                    padding: 0.5rem;
                    border: 1px solid var(--border-color);
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    border-radius: 0.5rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .page-btn:hover:not(:disabled) {
                    background: var(--accent-primary);
                    color: white;
                    border-color: var(--accent-primary);
                    transform: translateY(-2px);
                }

                .page-btn.active {
                    background: var(--accent-primary);
                    color: white;
                    border-color: var(--accent-primary);
                }

                .page-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .ellipsis {
                    padding: 0 0.5rem;
                    color: var(--text-secondary);
                }

                @media (max-width: 768px) {
                    .pagination-controls {
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default Pagination;