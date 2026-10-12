import { useState, useEffect } from 'react';
import {
  HiOutlineArrowDownTray,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import FileUpload from '../../../components/ui/FileUpload';
import Spinner from '../../../components/ui/Spinner';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = [
  { value: 'teacher', label: 'Teachers' },
  { value: 'hod', label: 'Heads of Department (HoD)' },
  { value: 'admin', label: 'Admins' },
];

const BulkUserImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [role, setRole] = useState('teacher');
  const [institutes, setInstitutes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/institutes?limit=100&isActive=true')
        .then((r) => setInstitutes((r.data.data.institutes || []).map((i) => ({ value: i._id, label: `${i.name} (${i.code})` }))))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedInstitute) {
      api.get(`/institutes/${selectedInstitute}/departments`)
        .then((r) => setDepartments((r.data.data.departments || []).map((d) => ({ value: d._id, label: `${d.name} (${d.code})` }))))
        .catch(() => {});
    } else {
      setDepartments([]);
    }
  }, [selectedInstitute]);

  const handleDownloadTemplate = () => {
    // Generate a simple CSV template
    const headers = ['first_name', 'last_name', 'email', 'password', 'phone', 'gender', 'cnic'];
    const sample = ['Ahmad', 'Khan', 'ahmad.khan@uswat.edu.pk', 'Teacher@123', '03001234567', 'male', '12345-1234567-1'];

    const csv = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${role}_import_template.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const handleImport = async () => {
    if (!file) { toast.error('Please select a file'); return; }
    if (!selectedInstitute) { toast.error('Please select an institute'); return; }

    setImporting(true);
    setResults(null);

    try {
      // Parse CSV
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
      });

      const success = [];
      const failed = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.first_name || !row.last_name || !row.email || !row.password) {
          failed.push({ row: i + 2, reason: 'Missing required fields (first_name, last_name, email, password)' });
          continue;
        }

        try {
          await api.post('/users', {
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email.toLowerCase(),
            password: row.password,
            role: role,
            institute: selectedInstitute || null,
            department: selectedDept || null,
            phone: row.phone || null,
            gender: ['male', 'female'].includes(row.gender?.toLowerCase()) ? row.gender.toLowerCase() : null,
            cnic: row.cnic || null,
          });
          success.push({ row: i + 2, email: row.email, name: `${row.first_name} ${row.last_name}` });
        } catch (err) {
          failed.push({ row: i + 2, email: row.email, reason: err.response?.data?.message || 'Unknown error' });
        }
      }

      setResults({ success, failed, total: rows.length });
      toast.success(`Import complete: ${success.length} created, ${failed.length} failed`);
      if (success.length > 0) onSuccess?.();
    } catch (err) {
      toast.error('Failed to parse file: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setFileError('');
    setResults(null);
    setRole('teacher');
    setSelectedInstitute('');
    setSelectedDept('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Users"
      description="Import multiple teachers, HoDs, or admins from CSV"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={importing}>Cancel</Button>
          {!results && (
            <Button onClick={handleImport} isLoading={importing} disabled={!file}>
              Import Users
            </Button>
          )}
          {results && <Button onClick={handleClose}>Done</Button>}
        </>
      }
    >
      <div className="space-y-4">
        {/* Template */}
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Download template, fill data, then upload CSV
          </p>
          <Button variant="secondary" size="sm" icon={HiOutlineArrowDownTray} onClick={handleDownloadTemplate}>
            Template
          </Button>
        </div>

        {/* Role + Institute */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="User Role"
            required
            options={ROLE_OPTIONS}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <Select
            label="Institute"
            required
            options={institutes}
            value={selectedInstitute}
            onChange={(e) => { setSelectedInstitute(e.target.value); setSelectedDept(''); }}
            placeholder="Select Institute"
          />
          <Select
            label="Department (optional)"
            options={departments}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            placeholder="Select Department"
            disabled={!selectedInstitute}
          />
        </div>

        {/* Required columns info */}
        <div className="p-3 bg-gray-50 dark:bg-dark-card rounded-lg text-xs text-gray-600 dark:text-gray-400">
          <p className="font-medium mb-1">Required CSV columns:</p>
          <p className="font-mono">first_name, last_name, email, password</p>
          <p className="mt-1">Optional: phone, gender (male/female), cnic</p>
        </div>

        {/* File Upload */}
        <FileUpload
          label="CSV File"
          accept=".csv,.xlsx,.xls"
          maxSize={5}
          helperText="CSV or Excel format"
          selectedFile={file}
          onFileSelect={(f, err) => { setFile(f); setFileError(err || ''); }}
          onClear={() => setFile(null)}
          error={fileError}
        />

        {/* Loading */}
        {importing && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            <Spinner size="sm" />
            <p className="text-sm text-blue-700 dark:text-blue-300">Importing users...</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{results.success.length}</p>
                <p className="text-xs text-emerald-600">Created</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{results.failed.length}</p>
                <p className="text-xs text-red-600">Failed</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{results.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>

            {results.success.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-600 mb-1 flex items-center gap-1">
                  <HiOutlineCheckCircle className="w-4 h-4" /> Created ({results.success.length})
                </p>
                <div className="max-h-28 overflow-y-auto space-y-0.5">
                  {results.success.slice(0, 8).map((s, i) => (
                    <p key={i} className="text-xs text-gray-600 dark:text-gray-400">✓ {s.name} — {s.email}</p>
                  ))}
                  {results.success.length > 8 && <p className="text-xs text-gray-400">... and {results.success.length - 8} more</p>}
                </div>
              </div>
            )}

            {results.failed.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
                  <HiOutlineXCircle className="w-4 h-4" /> Failed ({results.failed.length})
                </p>
                <div className="max-h-28 overflow-y-auto space-y-0.5">
                  {results.failed.map((f, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400">Row {f.row}: {f.reason}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BulkUserImportModal;