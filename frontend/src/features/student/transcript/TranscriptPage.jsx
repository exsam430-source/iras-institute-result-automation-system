import { useState, useEffect, useRef } from 'react';
import { HiOutlineDocumentText, HiOutlineArrowDownTray, HiOutlinePrinter } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import { formatGPA, formatDate } from '../../../utils/helpers';
import { GRADE_COLORS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const TranscriptPage = () => {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [type, setType] = useState('complete');
  const printRef = useRef(null);

  useEffect(() => {
    fetchTranscript();
  }, [type]);

  const fetchTranscript = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'complete' ? '/transcripts/complete' : '/transcripts/current';
      const res = await api.get(endpoint);
      setTranscript(res.data.data.transcript);
    } catch (err) {
      if (err.response?.status === 404) {
        setTranscript(null);
      } else {
        toast.error('Failed to load transcript');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/transcripts/download?type=${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `transcript-${type}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Transcript PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transcript</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Official academic transcript</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            options={[
              { value: 'complete', label: 'Complete Transcript' },
              { value: 'current', label: 'Current Semester' },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value)}
            containerClassName="w-48"
          />
          {transcript && (
            <>
              <Button variant="secondary" size="sm" icon={HiOutlinePrinter} onClick={handlePrint}>Print</Button>
              <Button size="sm" icon={HiOutlineArrowDownTray} isLoading={downloading} onClick={handleDownloadPDF}>Download PDF</Button>
            </>
          )}
        </div>
      </div>

      {!transcript ? (
        <EmptyState icon={HiOutlineDocumentText} title="No Transcript Available" description="Your transcript will be available after your semester results are published." />
      ) : (
        <div ref={printRef} className="print:p-0">
          <TranscriptPreview data={transcript} />
        </div>
      )}
    </div>
  );
};

// Transcript Preview Component
const TranscriptPreview = ({ data }) => {
  return (
    <Card className="print:shadow-none print:border-0 print:p-0">
      {/* University Header */}
      <div className="text-center border-b-2 border-primary-600 pb-4 mb-6">
        <h2 className="text-xl font-bold text-primary-600 uppercase tracking-wide">{data.university?.name}</h2>
        <p className="text-xs text-gray-500 mt-1">{data.university?.address}</p>
        <div className="mt-3 bg-primary-600 text-white py-1.5 px-4 inline-block rounded">
          <span className="text-sm font-semibold tracking-wider">{data.transcriptSettings?.headerText || 'OFFICIAL TRANSCRIPT'}</span>
        </div>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-6 p-4 bg-gray-50 dark:bg-dark-card rounded-lg">
        <InfoRow label="Student Name" value={data.student?.fullName} />
        <InfoRow label="Roll Number" value={data.student?.rollNumber} />
        <InfoRow label="Father's Name" value={data.student?.fatherName} />
        <InfoRow label="Registration No." value={data.student?.registrationNumber} />
        <InfoRow label="Program" value={`${data.academic?.degreeType || ''} ${data.academic?.program || ''}`} />
        <InfoRow label="Department" value={data.academic?.department} />
        <InfoRow label="Institute" value={data.academic?.institute} />
        <InfoRow label="Session" value={data.academic?.session} />
      </div>

      {/* Semester Results */}
      {data.semesters?.map((sem) => (
        <div key={sem.semester} className="mb-6">
          <div className="bg-primary-600 text-white px-4 py-2 rounded-t-lg">
            <span className="text-sm font-semibold">SEMESTER {sem.semester} — {sem.session || 'N/A'}</span>
          </div>
          <div className="overflow-x-auto border border-t-0 border-gray-200 dark:border-dark-border rounded-b-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-dark-card">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Course Title</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Cr.H</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Grade</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">G.Pts</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Qual.Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border/50">
                {sem.courses?.map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono text-xs">{c.code}</td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{c.name}</td>
                    <td className="px-3 py-2 text-center">{c.creditHours}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-bold ${c.isPassed === false ? 'text-red-600' : ''}`}>{c.grade}</span>
                    </td>
                    <td className="px-3 py-2 text-center">{c.gradePoints?.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">{c.qualityPoints?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-6 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/10 border border-t-0 border-blue-200 dark:border-blue-800/30 rounded-b-lg text-xs font-medium">
            <span>Credits: Attempted <strong>{sem.totalCreditHoursAttempted}</strong> | Earned <strong>{sem.totalCreditHoursEarned}</strong></span>
            <span>Semester GPA: <strong className="text-primary-600">{formatGPA(sem.semesterGPA)}</strong></span>
            <span>CGPA: <strong className="text-primary-600">{formatGPA(sem.cumulativeGPA)}</strong></span>
          </div>
        </div>
      ))}

      {/* Cumulative Summary */}
      <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800/30 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-primary-700 dark:text-primary-300 mb-3 text-sm uppercase">Cumulative Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{data.academic?.totalCreditHoursAttempted || 0}</p><p className="text-xs text-gray-500">Credits Attempted</p></div>
          <div><p className="text-2xl font-bold text-emerald-600">{data.academic?.totalCreditHoursEarned || 0}</p><p className="text-xs text-gray-500">Credits Earned</p></div>
          <div><p className="text-2xl font-bold text-primary-600">{formatGPA(data.academic?.cumulativeGPA)}</p><p className="text-xs text-gray-500">CGPA (out of 4.00)</p></div>
          <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{data.student?.enrollmentStatus?.toUpperCase()}</p><p className="text-xs text-gray-500">Status</p></div>
        </div>
      </div>

      {/* Grading Scale */}
      {data.gradingScale?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-xs uppercase">Grading Scale</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {data.gradingScale.map((g) => (
              <div key={g.grade} className="text-center p-1.5 rounded bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border">
                <p className="text-xs font-bold text-gray-900 dark:text-white">{g.grade}</p>
                <p className="text-[9px] text-gray-400">{g.gradePoints?.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-dark-border pt-4 mt-4">
        <div className="flex justify-between items-end text-xs text-gray-500">
          <div>
            <p>Date of Issue: {formatDate(data.issuedAt || new Date())}</p>
            <p>Transcript No: {data.transcriptNumber}</p>
          </div>
          <div className="text-right flex gap-12">
            <div className="text-center">
              <div className="w-32 border-b border-gray-400 mb-1" />
              <p className="font-medium">{data.transcriptSettings?.controllerExamName || 'Controller of Examinations'}</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-gray-400 mb-1" />
              <p className="font-medium">{data.transcriptSettings?.registrarName || 'Registrar'}</p>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-4 italic">
          {data.transcriptSettings?.footerText || 'This is an official document. Any alteration renders it invalid.'}
        </p>
      </div>
    </Card>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex">
    <span className="text-gray-500 dark:text-gray-400 w-32 shrink-0 text-xs font-medium">{label}:</span>
    <span className="font-semibold text-gray-900 dark:text-white text-xs">{value || 'N/A'}</span>
  </div>
);

export default TranscriptPage;