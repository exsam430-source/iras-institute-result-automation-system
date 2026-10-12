import { cn } from '../../utils/helpers';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

const Table = ({ children, className, isLoading, isEmpty, emptyProps }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isEmpty) {
    return <EmptyState {...emptyProps} />;
  }

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-gray-100 dark:border-dark-border', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
};

const Thead = ({ children, className }) => (
  <thead className={cn('bg-gray-50 dark:bg-dark-card border-b border-gray-100 dark:border-dark-border', className)}>
    {children}
  </thead>
);

const Tbody = ({ children, className }) => (
  <tbody className={cn('divide-y divide-gray-50 dark:divide-dark-border/50', className)}>
    {children}
  </tbody>
);

const Tr = ({ children, className, onClick, isSelected }) => (
  <tr
    onClick={onClick}
    className={cn(
      'transition-colors',
      onClick && 'cursor-pointer',
      isSelected
        ? 'bg-primary-50 dark:bg-primary-900/10'
        : 'hover:bg-gray-50/70 dark:hover:bg-dark-card/50',
      className
    )}
  >
    {children}
  </tr>
);

const Th = ({ children, className, align = 'left', sortable, sorted, sortDir, onSort }) => (
  <th
    onClick={sortable ? onSort : undefined}
    className={cn(
      'px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap',
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
      sortable && 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none',
      className
    )}
  >
    <span className="inline-flex items-center gap-1">
      {children}
      {sorted && (
        <span className="text-primary-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
      )}
    </span>
  </th>
);

const Td = ({ children, className, align = 'left' }) => (
  <td
    className={cn(
      'px-4 py-3.5 text-gray-700 dark:text-gray-300 whitespace-nowrap',
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
      className
    )}
  >
    {children}
  </td>
);

Table.Head = Thead;
Table.Body = Tbody;
Table.Row = Tr;
Table.Th = Th;
Table.Td = Td;

export default Table;