import { useState, useRef, useEffect, useMemo } from 'react';
import { HiOutlineChevronDown, HiOutlineSearch } from 'react-icons/hi';

export interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearch(''); // Clear search on close
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lowerSearch));
  }, [options, search]);

  const selectedOption = options.find((o) => String(o.value) === String(value));

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="searchable-select" ref={containerRef}>
      <div 
        className={`searchable-select-trigger form-select ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
      >
        <span className="trigger-text">
          {selectedOption ? selectedOption.label : <span className="placeholder">{placeholder}</span>}
        </span>
        <HiOutlineChevronDown className={`trigger-icon ${isOpen ? 'open' : ''}`} />
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown fade-in">
          <div className="searchable-select-search-container">
            <HiOutlineSearch className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select-search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="searchable-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className={`searchable-select-option ${String(option.value) === String(value) ? 'selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="searchable-select-no-results">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
