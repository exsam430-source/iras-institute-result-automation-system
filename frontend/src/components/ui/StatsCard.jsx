import { cn, formatNumber } from '../../utils/helpers';

const colorSchemes = {
  primary: {
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    icon: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
    text: 'text-primary-600 dark:text-primary-400',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    text: 'text-red-600 dark:text-red-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    text: 'text-purple-600 dark:text-purple-400',
  },
  gold: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 text-amber-600 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
  },
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  change,
  changeType,
  subtitle,
  className,
  onClick,
}) => {
  const scheme = colorSchemes[color] || colorSchemes.primary;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-dark-border p-5',
        'shadow-card hover:shadow-card-hover transition-all duration-300',
        onClick && 'cursor-pointer hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-semibold',
                  changeType === 'increase'
                    ? 'text-emerald-600'
                    : changeType === 'decrease'
                    ? 'text-red-600'
                    : 'text-gray-500'
                )}
              >
                {changeType === 'increase' ? '↑' : changeType === 'decrease' ? '↓' : ''}
                {change}
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
              scheme.icon
            )}
          >
            <Icon className="w-5.5 h-5.5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;