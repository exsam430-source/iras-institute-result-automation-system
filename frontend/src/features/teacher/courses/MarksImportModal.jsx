import { useState } from 'react';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import FileUpload from '../../../components/ui/FileUpload';
import toast from 'react-hot-toast';

const PHASE_OPTIONS = [
  { value: 'midterm', label: 'Mid-Term Marks Only' },
  { value: 'finals', label: 'Internal & Final Term Only' },
  { value: 'all', label: 'All Marks (Mid + Internal + Final)' },
];

const MarksImportModal = ({ isOpen, onClose, assignmentId, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [phase, setPhase] = useState('all');
  const [overwrite, setOverwrite] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get(
        `/course-assignments/${assignmentId}/award-list/export`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'award-list-template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Award list downloaded - fill in marks and re-upload');
    } catch {
      toast.error('Failed to download');
    }
  };

  const handleImport = async () => {
    if (!file) { toast.error('Please select a file'); return; }

    setImporting(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('phase', phase);
      formData.append('overwriteExisting', String(overwrite));

      const res = await api.post(
        `/marks/assignment/${assignmentId}/import`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setResults(res.data.data.results);
      const imported = res.data.data.results.imported?.length || 0;
      toast.success(`Import complete: ${imported} records imported`);
      if (imported > 0) onSuccess?.();
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
    setPhase('all');
    setOverwrite(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Marks from Excel"
      description="Upload the filled award list Excel to import marks"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={importing}>Cancel</Button>
          {!results && (
            <Button onClick={handleImport} isLoading={importing} disabled={!file}>
              Import Marks
            </Button>
          )}
          {results && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Download First */}
        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg">
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Step 1:</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Download the award list, fill in marks, then upload</p>
          </div>
          <Button variant="secondary" size="sm" icon={HiOutlineArrowDownTray} onClick={handleDownloadTemplate}>
            Download
          </Button>
        </div>

        {/* Phase Selection */}
        <Select
          label="Import Phase"
          options={PHASE_OPTIONS}
          value={phase}
          onChange={(e) => setPhase(e.target.value)}
        />

        {/* Overwrite checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-dark-surface dark:border-dark-border"
          />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Overwrite existing marks</p>
            <p className="text-xs text-gray-400">If unchecked, already-entered marks will be preserved</p>
          </div>
        </label>

        {/* File Upload */}
        <FileUpload
          label="Excel File with Marks"
          accept=".xlsx,.xls,.csv"
          maxSize={10}
          helperText="Upload filled award list (.xlsx, .xls)"
          selectedFile={file}
          onFileSelect={(f, err) => { setFile(f); setFileError(err || ''); }}
          onClear={() => setFile(null)}
          error={fileError}
        />

        {/* Results */}
        {results && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600">{results.imported?.length || 0}</p>
              <p className="text-xs text-emerald-600">Imported</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{results.failed?.length || 0}</p>
              <p className="text-xs text-red-600">Failed</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{results.total || 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MarksImportModal;