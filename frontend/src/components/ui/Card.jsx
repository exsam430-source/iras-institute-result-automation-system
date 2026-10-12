import { cn } from '../../utils/helpers';

const Card = ({ children, className, padding = true, hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border',
        'shadow-card',
        hover && 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 cursor-pointer',
        padding && 'p-5 lg:p-6',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className, action }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between mb-4',
        className
      )}
    >
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
};

const CardTitle = ({ children, className }) => {
  return (
    <h3 className={cn('text-base font-semibold text-gray-900 dark:text-white', className)}>
      {children}
    </h3>
  );
};

const CardDescription = ({ children, className }) => {
  return (
    <p className={cn('text-sm text-gray-500 dark:text-gray-400 mt-0.5', className)}>
      {children}
    </p>
  );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;

export default Card;