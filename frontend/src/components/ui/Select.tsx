import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  placeholder = 'Selecione uma opção',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 text-left relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}
      
      {/* Botão de Controle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-lg border bg-white px-4 py-2.5 text-sm text-slate-900 transition-all duration-200 outline-none cursor-pointer focus:border-gov-blue focus:ring-1 focus:ring-gov-blue ${
          isOpen ? 'border-gov-blue ring-1 ring-gov-blue' : 'border-slate-200'
        } ${error ? 'border-red-500 focus:border-red-500' : ''}`}
      >
        <div className="flex items-center gap-3">
          {selectedOption?.icon && (
            <span className="text-slate-400 flex items-center justify-center shrink-0">
              {selectedOption.icon}
            </span>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-gov-blue' : ''}`}
        />
      </button>

      {/* Menu Dropdown Suspenso */}
      {isOpen && (
        <div className="absolute top-[102%] left-0 right-0 z-40 bg-white border border-slate-100 rounded-lg shadow-xl py-1.5 max-h-60 overflow-y-auto animate-scale-up">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 text-center">Nenhuma opção disponível</div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 hover:bg-slate-50/80 ${
                    isSelected ? 'bg-slate-50 font-semibold text-gov-blue' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && (
                      <span className={`shrink-0 ${isSelected ? 'text-gov-blue' : 'text-slate-400'}`}>
                        {option.icon}
                      </span>
                    )}
                    <div className="flex flex-col text-left">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-[10px] text-slate-400 font-normal mt-0.5">{option.description}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-gov-blue shrink-0" />}
                </div>
              );
            })
          )}
        </div>
      )}

      {error && (
        <span className="text-xs text-red-600 font-medium mt-0.5 animate-fade-in">
          {error}
        </span>
      )}
    </div>
  );
};
export default Select;
