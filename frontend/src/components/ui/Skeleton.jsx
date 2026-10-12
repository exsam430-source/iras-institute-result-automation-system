import { cn } from '../../utils/helpers';

const Skeleton = ({ className, variant = 'rectangular', width, height }) => {
  const baseClasses = 'skeleton-shimmer animate-[shimmer_2s_infinite]';

  if (variant === 'circular') {
    return (
      <div
        className={cn(baseClasses, 'rounded-full', className)}
        style={{ width: width || 40, height: height || 40 }}
      />
    );
  }

  if (variant === 'text') {
    return (
      <div
        className={cn(baseClasses, 'rounded h-4', className)}
        style={{ width: width || '100%', height }}
      />
    );
  }

  return (
    <div
      className={cn(baseClasses, 'rounded-lg', className)}
      style={{ width: width || '100%', height: height || 20 }}
    />
  );
};

// Preset skeletons
Skeleton.Card = ({ className }) => (
  <div className={cn('bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border p-5', className)}>
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="text" width="40%" height={16} />
      <Skeleton variant="circular" width={40} height={40} />
    </div>
    <Skeleton variant="text" width="60%" height={28} className="mb-2" />
    <Skeleton variant="text" width="30%" height={12} />
  </div>
);

Skeleton.Table = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-2">
    <div className="flex gap-4 p-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="text" width={`${100 / cols}%`} height={14} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-3 border-t border-gray-100 dark:border-dark-border">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} variant="text" width={`${100 / cols}%`} height={14} />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;