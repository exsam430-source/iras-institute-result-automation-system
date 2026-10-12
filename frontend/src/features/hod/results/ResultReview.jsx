import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import StatsCard from '../../../components/ui/StatsCard';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Spinner from '../../../components/ui/Spinner';
import { getFullName, formatGPA } from '../../../utils/helpers';
import { GRADE_COLORS, ASSIGNMENT_STATUS_LABELS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const ResultReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [awardList, setAwardList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/course-assignments/${id}/award-list`);
        setAwardList(res.data.data.awardList);
      } catch {
        toast.error('Failed to load award list');
        navigate('/hod/results');
      } finally { setLoading(false); }
    };
    fetch();
  }, [id, navigate]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.post(`/course-assignments/${id}/approve`);
      toast.success('Result approved! Students have been notified.');
      navigate('/hod/results');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setApproving(false); }
  };

  const handleReject = async () => {
    if (rejectionReason.length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }
    setRejecting(true);
    try {
      await api.post(`/course-assignments/${id}/reject`, { rejectionReason });
      toast.success('Result returned to teacher for correction.');
      navigate('/hod/results');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setRejecting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!awardList) return null;

  const { assignment, entries, statistics } = awardList;
  const isSubmitted = assignment.status === 'submitted';

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/hod/results')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500">
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{assignment.course?.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{assignment.course?.code} • Semester {assignment.semester} • {assignment.session?.name}</p>
          </div>
        </div>
        {isSubmitted && (
          <div className="flex items-center gap-2">
            <Button variant="danger" icon={HiOutlineXCircle} onClick={() => setRejectModal(true)}>Reject</Button>
            <Button variant="success" icon={HiOutlineCheckCircle} isLoading={approving} onClick={handleApprove}>Approve Result</Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatsCard title="Total Students" value={statistics?.totalStudents || 0} color="primary" />
        <StatsCard title="Passed" value={statistics?.passedStudents || 0} color="success" />
        <StatsCard title="Failed" value={statistics?.failedStudents || 0} color="danger" />
        <StatsCard title="Pass Rate" value={`${statistics?.passRate || 0}%`} color="info" />
        <StatsCard title="Average" value={statistics?.averageMarks?.toFixed(1) || '0'} color="warning" />
        <StatsCard title="Highest" value={statistics?.highestMarks || 0} color="gold" />
      </div>

      {/* Award List Table */}
      <Card padding={false}>
        <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
          <h3 className="font-semibold text-gray-900 dark:text-white">Award List</h3>
          <p className="text-xs text-gray-400">Teacher: {getFullName(assignment.teacher)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-card">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">S#</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Roll No</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Student Name</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Father Name</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Mid /20</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Int /20</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Final /60</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Total /100</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">%</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Grade</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border/50">
              {entries.map((entry, i) => (
                <tr key={entry.studentId || i} className="hover:bg-gray-50/50 dark:hover:bg-dark-card/30">
                  <td className="px-3 py-2.5 text-gray-500">{entry.serialNo}</td>
                  <td className="px-3 py-2.5 font-mono text-xs font-medium text-primary-600 dark:text-primary-400">{entry.rollNumber}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{entry.studentName}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{entry.fatherName}</td>
                  <td className="px-3 py-2.5 text-center font-medium">{entry.midTermMarks ?? '—'}</td>
                  <td className="px-3 py-2.5 text-center font-medium">{entry.internalMarks ?? '—'}</td>
                  <td className="px-3 py-2.5 text-center font-medium">{entry.finalTermMarks ?? '—'}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-gray-900 dark:text-white">{entry.totalMarks ?? '—'}</td>
                  <td className="px-3 py-2.5 text-center">{entry.percentage != null ? `${entry.percentage}%` : '—'}</td>
                  <td className="px-3 py-2.5 text-center">
                    {entry.grade ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${GRADE_COLORS[entry.grade] || ''}`}>{entry.grade}</span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-xs font-semibold ${entry.isPassed === true ? 'text-emerald-600' : entry.isPassed === false ? 'text-red-600' : 'text-gray-400'}`}>
                      {entry.remarks || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Rejection Reason */}
      {assignment.rejectionReason && (
        <Card className="border-l-4 border-l-red-500">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Previous Rejection Reason:</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{assignment.rejectionReason}</p>
        </Card>
      )}

      {/* Reject Modal */}
      <Modal isOpen={rejectModal} onClose={() => { setRejectModal(false); setRejectionReason(''); }} title="Reject Result" description="Provide a reason for returning this result to the teacher." size="md"
        footer={<><Button variant="secondary" onClick={() => { setRejectModal(false); setRejectionReason(''); }}>Cancel</Button><Button variant="danger" isLoading={rejecting} onClick={handleReject}>Reject & Return</Button></>}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rejection Reason <span className="text-red-500">*</span></label>
          <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={4} placeholder="Explain what needs to be corrected (min 10 characters)..." className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 placeholder:text-gray-400" />
          <p className="text-xs text-gray-400 mt-1">{rejectionReason.length}/500 characters</p>
        </div>
      </Modal>
    </div>
  );
};

export default ResultReview;