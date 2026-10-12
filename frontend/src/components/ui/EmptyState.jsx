import { cn } from '../../utils/helpers';
import { HiOutlineInboxStack } from 'react-icons/hi2';
import Button from './Button';

const EmptyState = ({
  icon: Icon = HiOutlineInboxStack,
  title = 'No data found',
  description = 'There are no records to display.',
  action,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4',
        className
      )}
    >
      <div className="w-16 h-16 bg-gray-100 dark:bg-dark-card rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
        {description}
      </p>
      {(action || onAction) && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel || action || 'Create New'}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;