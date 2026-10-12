import { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

const Select = forwardRef(
  (
    {
      label,
      error,
      options = [],
      placeholder = 'Select option',
      className,
      containerClassName,
      required,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full rounded-lg border bg-white dark:bg-dark-surface text-gray-900 dark:text-white',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500',
            error
              ? 'border-red-300 dark:border-red-500/50'
              : 'border-gray-300 dark:border-dark-border',
            'px-3.5 py-2.5 text-sm',
            'appearance-none bg-no-repeat bg-right',
            className
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundSize: '1.5em 1.5em',
            backgroundPosition: 'right 0.5rem center',
            paddingRight: '2.5rem',
          }}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;