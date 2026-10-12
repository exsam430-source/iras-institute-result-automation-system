import { forwardRef } from 'react';
import { cn } from '../../utils/helpers';
import Spinner from './Spinner';

const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm active:bg-primary-800',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-dark-card dark:hover:bg-dark-hover dark:text-gray-200',
  danger: 'bg-danger-500 hover:bg-danger-600 text-white shadow-sm active:bg-danger-700',
  success: 'bg-success-500 hover:bg-success-600 text-white shadow-sm active:bg-success-700',
  warning: 'bg-warning-500 hover:bg-warning-600 text-white shadow-sm active:bg-warning-700',
  ghost: 'hover:bg-gray-100 text-gray-700 dark:hover:bg-dark-card dark:text-gray-300',
  outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-dark-border dark:hover:bg-dark-card dark:text-gray-300',
  gold: 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white shadow-sm',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
  xl: 'px-7 py-3 text-base gap-2.5',
};

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      icon: Icon,
      iconRight: IconRight,
      fullWidth = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Spinner size="sm" color="border-t-current" />
        ) : Icon ? (
          <Icon className="w-4 h-4 shrink-0" />
        ) : null}
        {children}
        {IconRight && !isLoading && (
          <IconRight className="w-4 h-4 shrink-0" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;