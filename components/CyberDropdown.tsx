
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from './icons';

interface Option {
    label: string;
    value: string;
}

interface CyberDropdownProps {
    label?: string;
    value: string;
    options: (string | Option)[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    icon?: React.FC<{ className?: string }>;
}

const CyberDropdown: React.FC<CyberDropdownProps> = ({
    label, value, options, onChange, placeholder = 'Select...', disabled = false, icon: Icon
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Normalize options to Option objects
    const normalizedOptions: Option[] = options.map(opt => 
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full group" ref={dropdownRef}>
            {label && (
                 <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2 transition-colors group-hover:text-cyan-600">{label}</label>
            )}
            
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-white border-4 border-black transition-all duration-300 px-4 py-3 text-xs font-black uppercase outline-none shadow-neo-sm
                    ${isOpen 
                        ? 'bg-yellow-50 shadow-neo translate-x-[-2px] translate-y-[-2px]' 
                        : 'hover:bg-yellow-50 hover:shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px]'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'cursor-pointer'}
                `}
                disabled={disabled}
            >
                <div className="flex items-center gap-2 truncate text-black">
                    {Icon && <Icon className={`w-4 h-4 ${isOpen ? 'text-black' : 'text-black/40'}`} />}
                    <span className={`truncate ${!selectedOption ? 'text-black/40' : ''}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-black transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto custom-scrollbar bg-white border-4 border-black shadow-neo-lg z-50 animate-fade-in origin-top">
                    <div className="p-1">
                        {normalizedOptions.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full text-left px-3 py-3 text-xs font-black uppercase transition-all duration-150 flex items-center justify-between group/item border-b-2 border-black last:border-b-0
                                        ${isSelected 
                                            ? 'bg-cyan-400 text-black' 
                                            : 'text-black hover:bg-yellow-400'
                                        }
                                    `}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {isSelected && <CheckIcon className="w-4 h-4 text-black" />}
                                    {!isSelected && <div className="w-2 h-2 bg-black opacity-0 group-hover/item:opacity-100 transition-opacity" />}
                                </button>
                            );
                        })}
                        {normalizedOptions.length === 0 && (
                             <div className="px-3 py-3 text-xs text-center text-black/40 font-bold italic">No options available</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CyberDropdown;
