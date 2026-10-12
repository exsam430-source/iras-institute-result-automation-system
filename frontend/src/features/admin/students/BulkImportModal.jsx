import { useState } from 'react';
import { HiOutlineArrowDownTray, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import FileUpload from '../../../components/ui/FileUpload';
import Spinner from '../../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const BulkImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [institutes, setInstitutes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
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
    } else setDepartments([]);
  }, [selectedInstitute]);

  useEffect(() => {
    if (selectedDept) {
      api.get(`/programs?department=${selectedDept}&isActive=true&limit=100`)
        .then((r) => setPrograms((r.data.data.programs || []).map((p) => ({ value: p._id, label: `${p.name} (${p.code})` }))))
        .catch(() => {});
    } else setPrograms([]);
  }, [selectedDept]);

  useEffect(() => {
    if (selectedProgram) {
      api.get(`/sessions?program=${selectedProgram}&isActive=true&limit=100`)
        .then((r) => setSessions((r.data.data.sessions || []).map((s) => ({ value: s._id, label: s.name }))))
        .catch(() => {});
    } else setSessions([]);
  }, [selectedProgram]);

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/users/import-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student_import_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download template'); }
  };

  const handleImport = async () => {
    if (!file) { toast.error('Please select a file'); return; }
    if (!selectedInstitute || !selectedDept || !selectedProgram || !selectedSession) {
      toast.error('Please select Institute, Department, Program and Session');
      return;
    }

    setImporting(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('institute', selectedInstitute);
      formData.append('department', selectedDept);
      formData.append('program', selectedProgram);
      formData.append('session', selectedSession);

      const res = await api.post('/users/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResults(res.data.data.results);
      toast.success(`Import complete: ${res.data.data.results.success?.length || 0} students created`);
      if (res.data.data.results.success?.length > 0) onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setFileError('');
    setResults(null);
    setSelectedInstitute('');
    setSelectedDept('');
    setSelectedProgram('');
    setSelectedSession('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Students"
      description="Upload an Excel file to create multiple student accounts at once"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={importing}>Cancel</Button>
          {!results && (
            <Button onClick={handleImport} isLoading={importing} disabled={!file || importing}>
              Import Students
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Template Download */}
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Download the template first, fill in student data, then upload
          </p>
          <Button variant="secondary" size="sm" icon={HiOutlineArrowDownTray} onClick={handleDownloadTemplate}>
            Template
          </Button>
        </div>

        {/* Academic Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Institute" required options={institutes} value={selectedInstitute} onChange={(e) => { setSelectedInstitute(e.target.value); setSelectedDept(''); setSelectedProgram(''); setSelectedSession(''); }} placeholder="Select" />
          <Select label="Department" required options={departments} value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setSelectedProgram(''); setSelectedSession(''); }} placeholder="Select" disabled={!selectedInstitute} />
          <Select label="Program" required options={programs} value={selectedProgram} onChange={(e) => { setSelectedProgram(e.target.value); setSelectedSession(''); }} placeholder="Select" disabled={!selectedDept} />
          <Select label="Session" required options={sessions} value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} placeholder="Select" disabled={!selectedProgram} />
        </div>

        {/* File Upload */}
        <FileUpload
          label="Excel File"
          accept=".xlsx,.xls,.csv"
          maxSize={10}
          helperText="Excel (.xlsx, .xls) or CSV format"
          selectedFile={file}
          onFileSelect={(f, err) => { setFile(f); setFileError(err || ''); }}
          onClear={() => setFile(null)}
          error={fileError}
        />

        {/* Import Progress */}
        {importing && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            <Spinner size="sm" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Importing students... Please wait
            </p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{results.success?.length || 0}</p>
                <p className="text-xs text-emerald-600 mt-0.5">Created</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{results.failed?.length || 0}</p>
                <p className="text-xs text-red-600 mt-0.5">Failed</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{results.total || 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total</p>
              </div>
            </div>

            {/* Success List */}
            {results.success?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-600 mb-1 flex items-center gap-1">
                  <HiOutlineCheckCircle className="w-4 h-4" /> Successfully Created ({results.success.length})
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {results.success.slice(0, 10).map((s, i) => (
                    <div key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span className="text-emerald-500">✓</span>
                      <span>{s.email}</span>
                      <span className="font-mono text-primary-600">{s.rollNumber}</span>
                    </div>
                  ))}
                  {results.success.length > 10 && (
                    <p className="text-xs text-gray-400">... and {results.success.length - 10} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Failed List */}
            {results.failed?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
                  <HiOutlineXCircle className="w-4 h-4" /> Failed ({results.failed.length})
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {results.failed.map((f, i) => (
                    <div key={i} className="text-xs text-red-600 dark:text-red-400">
                      Row {f.row}: {f.reason}
                    </div>
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

export default BulkImportModal;