import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Format date
export const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    return format(parseISO(date), 'dd MMM yyyy');
  } catch {
    try {
      return format(new Date(date), 'dd MMM yyyy');
    } catch {
      return 'N/A';
    }
  }
};

// Format date with time
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  try {
    return format(parseISO(date), 'dd MMM yyyy, hh:mm a');
  } catch {
    try {
      return format(new Date(date), 'dd MMM yyyy, hh:mm a');
    } catch {
      return 'N/A';
    }
  }
};

// Relative time (e.g., "2 hours ago")
export const timeAgo = (date) => {
  if (!date) return '';
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '';
    }
  }
};

// Full name from user object
export const getFullName = (user) => {
  if (!user) return 'Unknown';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Truncate text
export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

// Format number with commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString();
};

// Format GPA to 2 decimal places
export const formatGPA = (gpa) => {
  if (gpa === null || gpa === undefined || isNaN(gpa)) return '0.00';
  return parseFloat(gpa).toFixed(2);
};

// Calculate percentage
export const calcPercentage = (obtained, total) => {
  if (!total || total === 0) return 0;
  return Math.round((obtained / total) * 100 * 100) / 100;
};

// Class names helper (replaces clsx/cn)
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Get grade color class
export const getGradeColor = (grade) => {
  const colors = {
    A: 'text-emerald-600',
    'A-': 'text-emerald-600',
    'B+': 'text-blue-600',
    B: 'text-blue-600',
    'B-': 'text-blue-600',
    'C+': 'text-amber-600',
    C: 'text-amber-600',
    'C-': 'text-amber-600',
    D: 'text-orange-600',
    F: 'text-red-600',
  };
  return colors[grade] || 'text-gray-600';
};

// Debounce function
export const debounce = (func, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Local storage helpers (safe)
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item);
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

// Generate pagination meta info
export const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

// Parse sort string to object
export const parseSortString = (sortStr) => {
  if (!sortStr) return { createdAt: -1 };
  const sortObj = {};
  const fields = sortStr.split(',');
  fields.forEach((field) => {
    const trimmed = field.trim();
    if (trimmed.startsWith('-')) {
      sortObj[trimmed.slice(1)] = -1;
    } else {
      sortObj[trimmed] = 1;
    }
  });
  return sortObj;
};

// Check if value is a valid MongoDB ObjectId
export const isObjectId = (str) => {
  return /^[0-9a-fA-F]{24}$/.test(str);
};

// Safe JSON parse
export const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Get enrollment status color
export const getEnrollmentColor = (status) => {
  const colors = {
    active: 'success',
    suspended: 'danger',
    graduated: 'info',
    dropped: 'danger',
    'awaiting-graduation': 'purple',
  };
  return colors[status] || 'default';
};