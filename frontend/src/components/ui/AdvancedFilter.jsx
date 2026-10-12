import { useState } from 'react';
import {
  HiOutlineFunnel,
  HiOutlineXMark,
  HiOutlineChevronDown,
} from 'react-icons/hi2';
import { cn } from '../../utils/helpers';
import Button from './Button';

const AdvancedFilter = ({ filters, values, onChange, onReset, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = Object.values(values).filter((v) => v && v !== '').length;

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium transition-all',
          activeCount > 0
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
            : 'border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-700 dark:text-gray-300 hover:border-gray-400'
        )}
      >
        <HiOutlineFunnel className="w-4 h-4" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="w-5 h-5 bg-primary-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
        <HiOutlineChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-dark-surface rounded-xl shadow-modal border border-gray-100 dark:border-dark-border z-30 animate-[scale-in_0.15s_ease-out] origin-top-left">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-border">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Advanced Filters</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {filter.label}
                </label>
                {filter.type === 'select' ? (
                  <select
                    value={values[filter.key] || ''}
                    onChange={(e) => onChange(filter.key, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    <option value="">{filter.placeholder || 'All'}</option>
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    value={values[filter.key] || ''}
                    onChange={(e) => onChange(filter.key, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={filter.placeholder}
                    value={values[filter.key] || ''}
                    onChange={(e) => onChange(filter.key, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-dark-border">
            <button
              onClick={() => { onReset(); setIsOpen(false); }}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Reset All
            </button>
            <Button size="xs" onClick={() => setIsOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Overlay to close */}
      {isOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default AdvancedFilter;