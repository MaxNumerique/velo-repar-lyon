'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'

export function AdminToolbar({
  search = '',
  onSearchChange,
  filterValue = 'ALL',
  onFilterChange,
  filterOptions = {},
  filterIcon: FilterIcon = Search,
  filterType = 'filter',
  searchPlaceholder = 'Rechercher...',
  onSearchSubmit,
}) {
  const [activeTool, setActiveTool] = useState(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (onSearchSubmit) {
        onSearchSubmit()
      }
      setActiveTool(null)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(filterOptions).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => onFilterChange(val)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                filterValue === val
                  ? "bg-slate-900 text-white shadow-md scale-105"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9 h-11 bg-white dark:bg-slate-800 border-none shadow-sm rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 text-sm"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
      <div className="md:hidden flex flex-col gap-3">
        <div className="relative flex items-center justify-center pt-2 pb-2">
          <div className={cn(
            "flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 ease-out overflow-hidden",
            activeTool ? "w-full rounded-2xl h-12 px-3" : "w-32 rounded-full h-10 px-1"
          )}>
            {!activeTool ? (
              <div className="flex items-center justify-around w-full">
                <button
                  type="button"
                  onClick={() => setActiveTool('search')}
                  className="p-2 text-slate-500 hover:text-primary transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
                <div className="w-[1px] h-4 bg-slate-200" />
                <button
                  type="button"
                  onClick={() => setActiveTool(filterType)}
                  className="p-2 text-slate-500 hover:text-primary transition-colors relative"
                >
                  <FilterIcon className="w-5 h-5" />
                  {filterValue !== 'ALL' && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white dark:border-slate-900" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center w-full gap-2 animate-in fade-in zoom-in duration-200">
                {activeTool === 'search' && (
                  <div className="flex-1 flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary" />
                    <input
                      autoFocus
                      className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-400 text-slate-900 dark:text-white"
                      placeholder={searchPlaceholder}
                      value={search}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                )}
                {activeTool === filterType && (
                  <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <FilterIcon className="w-4 h-4 text-primary shrink-0" />
                    <Select
                      value={filterValue}
                      onValueChange={(val) => {
                        onFilterChange(val)
                        setActiveTool(null)
                      }}
                    >
                      <SelectTrigger className="border-none shadow-none h-8 p-0 bg-transparent focus:ring-0 text-sm font-bold text-slate-900 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(filterOptions).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTool(null)}
                  className="ml-auto w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <span className="text-lg font-bold">×</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
