import Modal from './Modal';
import Button from './Button';
import { HiOutlineExclamationTriangle, HiOutlineTrash } from 'react-icons/hi2';
import { cn } from '../../utils/helpers';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const iconColors = {
    danger: 'bg-red-100 dark:bg-red-900/20 text-red-600',
    warning: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600',
    info: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600',
  };

  const buttonVariants = {
    danger: 'danger',
    warning: 'warning',
    info: 'primary',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center pt-2">
        <div
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4',
            iconColors[variant]
          )}
        >
          {variant === 'danger' ? (
            <HiOutlineTrash className="w-6 h-6" />
          ) : (
            <HiOutlineExclamationTriangle className="w-6 h-6" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          {message}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={buttonVariants[variant]}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;