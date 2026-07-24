import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  label?: React.ReactNode;
  value: string; // string value matching option name
  onChange: (value: string, id: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  loading?: boolean;
  id?: string;
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Pilih opsi...",
  disabled = false,
  required = false,
  loading = false,
  id
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync value to search query when not active
  useEffect(() => {
    setSearchQuery(value || '');
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query to actual selected value on blur
        setSearchQuery(value || '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  // Filtered options based on query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const valTrimmed = (value || '').toLowerCase().trim();
    if (!q || q === valTrimmed) {
      return options;
    }
    
    const filtered = options.filter(opt => opt.name.toLowerCase().includes(q));
    
    // Check if there is an exact case-insensitive match in the original options
    const hasExactMatch = options.some(opt => opt.name.toLowerCase() === q);
    
    // If not exact match and there's query text, append a virtual option for the typed text
    if (searchQuery.trim() && !hasExactMatch) {
      return [
        ...filtered,
        { id: searchQuery.trim(), name: searchQuery.trim() }
      ];
    }
    
    return filtered;
  }, [options, searchQuery, value]);

  // Handle input focus
  const handleFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    setActiveIndex(-1);
    // Select all text so user can immediately type to replace
    setTimeout(() => {
      inputRef.current?.select();
    }, 50);
  };

  const handleSelectOption = (opt: Option) => {
    onChange(opt.name, opt.id);
    setSearchQuery(opt.name);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => {
          const next = prev + 1 >= filteredOptions.length ? 0 : prev + 1;
          scrollActiveIntoView(next);
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => {
          const next = prev - 1 < 0 ? filteredOptions.length - 1 : prev - 1;
          scrollActiveIntoView(next);
          return next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[activeIndex]);
        } else if (filteredOptions.length > 0) {
          // Select the first option if none is highlighted but user presses Enter
          handleSelectOption(filteredOptions[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery(value || '');
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery(value || '');
        break;
    }
  };

  const scrollActiveIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.children;
    if (items[index]) {
      (items[index] as HTMLElement).scrollIntoView({
        block: 'nearest'
      });
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '');
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full text-left" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={`relative flex items-center justify-between w-full bg-white border rounded-xl text-sm transition-all focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 cursor-text ${
          isOpen ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-sm' : 'border-slate-200'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="text"
          id={id}
          disabled={disabled}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={loading ? "Memuat data..." : placeholder}
          className="select-all w-full px-4 py-3 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 disabled:text-slate-400"
        />

        {/* Buttons on the right side */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
          {loading ? (
            <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          ) : (
            <>
              {value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 hover:bg-slate-100 rounded-full hover:text-slate-600 transition-colors cursor-pointer"
                  title="Hapus pilihan"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!disabled) {
                    if (isOpen) {
                      setIsOpen(false);
                      setSearchQuery(value || '');
                    } else {
                      inputRef.current?.focus();
                    }
                  }
                }}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isOpen ? 'text-emerald-500' : 'hover:bg-slate-50'
                }`}
              >
                <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Floating Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <ul 
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1 text-slate-700 divide-y divide-slate-50"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.name === value;
                const isActive = index === activeIndex;
                
                return (
                  <li
                    key={opt.id + '-' + index}
                    onClick={() => handleSelectOption(opt)}
                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected 
                        ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                        : isActive
                        ? 'bg-slate-50 text-slate-900 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{opt.name}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-3 text-sm text-slate-400 text-center italic">
                Tidak ada hasil yang cocok
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
