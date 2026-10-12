import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { HiOutlineCog6Tooth, HiOutlineAcademicCap } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/ui/Spinner';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const { register, handleSubmit, reset } = useForm();
  const {
    register: regTranscript,
    handleSubmit: handleTranscript,
    reset: resetTranscript,
  } = useForm();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/settings');
        const s = res.data.data.settings;
        reset({
          universityName: s.universityName || '',
          universityShortName: s.universityShortName || '',
          universityAddress: s.universityAddress || '',
          universityPhone: s.universityPhone || '',
          universityEmail: s.universityEmail || '',
          universityWebsite: s.universityWebsite || '',
          currentAcademicYear: s.currentAcademicYear || '',
        });
        resetTranscript({
          headerText: s.transcriptSettings?.headerText || '',
          footerText: s.transcriptSettings?.footerText || '',
          controllerExamName: s.transcriptSettings?.controllerExamName || '',
          registrarName: s.transcriptSettings?.registrarName || '',
        });
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [reset, resetTranscript]);

  const onSaveGeneral = async (data) => {
    setSaving(true);
    try {
      await api.patch('/settings', data);
      toast.success('Settings updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const onSaveTranscript = async (data) => {
    setSaving(true);
    try {
      await api.patch('/settings/transcript', {
        transcriptSettings: {
          headerText: data.headerText,
          footerText: data.footerText,
          controllerExamName: data.controllerExamName,
          registrarName: data.registrarName,
          showGradingScale: true,
          showCGPA: true,
        },
      });
      toast.success('Transcript settings updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { key: 'general', label: 'General', icon: HiOutlineCog6Tooth },
    { key: 'transcript', label: 'Transcript', icon: HiOutlineAcademicCap },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        System Settings
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-dark-card p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === tab.key
                ? 'bg-white dark:bg-dark-surface shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <Card>
          <Card.Header>
            <Card.Title>University Information</Card.Title>
          </Card.Header>
          <form onSubmit={handleSubmit(onSaveGeneral)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="University Name"
                {...register('universityName')}
                containerClassName="sm:col-span-2"
              />
              <Input
                label="Short Name"
                {...register('universityShortName')}
              />
              <Input
                label="Academic Year"
                {...register('currentAcademicYear')}
              />
              <Input
                label="Email"
                type="email"
                {...register('universityEmail')}
              />
              <Input label="Phone" {...register('universityPhone')} />
              <Input
                label="Website"
                {...register('universityWebsite')}
                containerClassName="sm:col-span-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Address
              </label>
              <textarea
                {...register('universityAddress')}
                rows={2}
                className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 placeholder:text-gray-400"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" isLoading={saving}>
                Save Settings
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Transcript Tab */}
      {activeTab === 'transcript' && (
        <Card>
          <Card.Header>
            <Card.Title>Transcript Settings</Card.Title>
            <Card.Description>
              Configure transcript header, footer and signature names
            </Card.Description>
          </Card.Header>
          <form
            onSubmit={handleTranscript(onSaveTranscript)}
            className="space-y-4"
          >
            <Input
              label="Header Text"
              {...regTranscript('headerText')}
              placeholder="OFFICIAL TRANSCRIPT OF ACADEMIC RECORD"
            />
            <Input
              label="Controller of Examinations Name"
              {...regTranscript('controllerExamName')}
            />
            <Input
              label="Registrar Name"
              {...regTranscript('registrarName')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Footer Text
              </label>
              <textarea
                {...regTranscript('footerText')}
                rows={2}
                className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 placeholder:text-gray-400"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" isLoading={saving}>
                Save Transcript Settings
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;