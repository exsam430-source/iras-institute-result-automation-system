import { useState, useEffect } from 'react';
import {
  HiOutlineBell,
  HiOutlineEnvelope,
  HiOutlineDevicePhoneMobile,
} from 'react-icons/hi2';
import api from '../../utils/axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const NOTIFICATION_SETTINGS = [
  {
    category: 'Marks & Results',
    items: [
      { key: 'midterm_marks', label: 'Mid-Term Marks Entered', description: 'When teacher enters your mid-term marks' },
      { key: 'finals_marks', label: 'Finals Marks Entered', description: 'When teacher enters internal and final marks' },
      { key: 'result_approved', label: 'Result Approved', description: 'When HoD approves your course result' },
      { key: 'result_rejected', label: 'Result Rejected', description: 'When HoD rejects a submitted result' },
    ],
  },
  {
    category: 'Course & Assignment',
    items: [
      { key: 'course_assigned', label: 'Course Assigned', description: 'When a new course is assigned to you' },
      { key: 'award_list_ready', label: 'Award List Ready', description: 'When award list is generated for your course' },
      { key: 'result_submitted', label: 'Result Submitted', description: 'When teacher submits result for review' },
    ],
  },
  {
    category: 'Academic',
    items: [
      { key: 'semester_promoted', label: 'Semester Promotion', description: 'When you are promoted to next semester' },
      { key: 'announcement', label: 'Announcements', description: 'General announcements from administration' },
    ],
  },
];

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-border'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const NotificationPreferences = () => {
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);

  useEffect(() => {
    // Initialize with all enabled
    const defaultPrefs = {};
    NOTIFICATION_SETTINGS.forEach((cat) => {
      cat.items.forEach((item) => {
        defaultPrefs[item.key] = { inApp: true, email: true };
      });
    });

    // Try to load from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('notificationPrefs') || '{}');
      setPrefs({ ...defaultPrefs, ...saved });
    } catch {
      setPrefs(defaultPrefs);
    }

    // Load global settings
    api.get('/settings')
      .then((res) => {
        setEmailEnabled(res.data.data.settings?.emailNotificationsEnabled ?? true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key, channel) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [channel]: !prev[key]?.[channel],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem('notificationPrefs', JSON.stringify(prefs));
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableAll = () => {
    const allEnabled = {};
    NOTIFICATION_SETTINGS.forEach((cat) => {
      cat.items.forEach((item) => {
        allEnabled[item.key] = { inApp: true, email: true };
      });
    });
    setPrefs(allEnabled);
  };

  const handleDisableAll = () => {
    const allDisabled = {};
    NOTIFICATION_SETTINGS.forEach((cat) => {
      cat.items.forEach((item) => {
        allDisabled[item.key] = { inApp: false, email: false };
      });
    });
    setPrefs(allDisabled);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notification Preferences
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose which notifications you want to receive
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleDisableAll}>
            Disable All
          </Button>
          <Button variant="secondary" size="sm" onClick={handleEnableAll}>
            Enable All
          </Button>
        </div>
      </div>

      {/* Global Status */}
      {!emailEnabled && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl text-sm text-amber-700 dark:text-amber-400">
          ⚠️ Email notifications are currently disabled system-wide by admin.
        </div>
      )}

      {/* Column Headers */}
      <Card padding={false} className="p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
          <span>Notification Type</span>
          <div className="flex items-center gap-8 pr-2">
            <div className="flex items-center gap-1.5">
              <HiOutlineBell className="w-3.5 h-3.5" />
              <span>In-App</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HiOutlineEnvelope className="w-3.5 h-3.5" />
              <span>Email</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Preference Categories */}
      {NOTIFICATION_SETTINGS.map((cat) => (
        <Card key={cat.category} padding={false}>
          <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-card/30">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              {cat.category}
            </h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-dark-border/50">
            {cat.items.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between px-4 py-3.5"
              >
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center gap-8 shrink-0">
                  <Toggle
                    checked={prefs[item.key]?.inApp ?? true}
                    onChange={() => handleToggle(item.key, 'inApp')}
                  />
                  <Toggle
                    checked={(prefs[item.key]?.email ?? true) && emailEnabled}
                    onChange={() => handleToggle(item.key, 'email')}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Save */}
      <div className="flex justify-end">
        <Button isLoading={saving} onClick={handleSave}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferences;