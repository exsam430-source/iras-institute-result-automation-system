import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2';
import useTheme from '../../hooks/useTheme';
import { cn } from '../../utils/helpers';

const ThemeToggle = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative p-2 rounded-lg transition-all duration-300',
        'hover:bg-gray-100 dark:hover:bg-dark-card',
        'text-gray-500 dark:text-gray-400',
        className
      )}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <HiOutlineSun
          className={cn(
            'w-5 h-5 absolute inset-0 transition-all duration-300',
            isDark
              ? 'opacity-0 rotate-90 scale-0'
              : 'opacity-100 rotate-0 scale-100'
          )}
        />
        <HiOutlineMoon
          className={cn(
            'w-5 h-5 absolute inset-0 transition-all duration-300',
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
          )}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;