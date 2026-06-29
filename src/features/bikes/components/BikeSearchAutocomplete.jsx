'use client';
import { useState, useEffect, useRef } from 'react';
import { Bike, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchBikes } from '@/features/bikes/services/bikeService';

export default function BikeSearchAutocomplete({
  value = '',
  onChangeText,
  onSelectBike,
  placeholder = 'Rechercher un modèle...',
  inputClassName = '',
  iconPosition = 'right',
}) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);
  const cacheRef = useRef({});

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        if (cacheRef.current[searchQuery]) {
          setSuggestions(cacheRef.current[searchQuery]);
          setShowSuggestions(true);
          return;
        }

        setLoading(true);
        try {
          const result = await searchBikes(searchQuery, {
            signal: abortController.signal,
          });
          const bikes = result?.bikes || [];
          cacheRef.current[searchQuery] = bikes;
          
          if (!abortController.signal.aborted) {
            setSuggestions(bikes);
            setShowSuggestions(true);
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Bike Search Error:', error);
          }
        } finally {
          if (!abortController.signal.aborted) {
            setLoading(false);
          }
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  const handleInputChange = (event) => {
    const val = event.target.value;
    setSearchQuery(val);
    if (onChangeText) {
      onChangeText(val);
    }
  };

  const handleSelect = (bike) => {
    onSelectBike(bike);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative group">
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          className={`${inputClassName} ${
            iconPosition === 'left' ? 'pl-10' : iconPosition === 'right' ? 'pr-8' : ''
          }`}
        />
        {iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
        )}
        {iconPosition === 'right' && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-60 overflow-y-auto p-2">
          {suggestions.map((bike) => (
            <button
              key={bike.id}
              type="button"
              onClick={() => handleSelect(bike)}
              className="w-full p-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-3 transition-colors group"
            >
              {bike.thumb ? (
                <img src={bike.thumb} alt="" className="w-10 h-10 rounded-lg object-cover shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border">
                  <Bike className="w-5 h-5 text-slate-300" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold truncate group-hover:text-primary">{bike.title}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase">{bike.manufacturer_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
