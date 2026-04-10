import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Logic to show a limited number of page buttons if there are many pages
  const getVisiblePages = () => {
    if (totalPages <= 7) return pages;
    
    if (currentPage <= 4) return [...pages.slice(0, 5), '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', ...pages.slice(totalPages - 5)];
    
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="rounded-xl border-none shadow-sm bg-white dark:bg-slate-800 hover:text-primary transition-all cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-1">
        {getVisiblePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 text-slate-400">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={cn(
                  "w-10 h-10 rounded-xl font-bold transition-all cursor-pointer",
                  currentPage === page 
                    ? "bg-primary text-white shadow-md hover:bg-primary/90" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary"
                )}
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="rounded-xl border-none shadow-sm bg-white dark:bg-slate-800 hover:text-primary transition-all cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
