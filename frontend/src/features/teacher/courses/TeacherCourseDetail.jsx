import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import StatsCard from '../../../components/ui/StatsCard';
import Spinner from '../../../components/ui/Spinner';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import MarksEntryTable from './MarksEntryTable';
import MarksImportModal from './MarksImportModal';
import { ASSIGNMENT_STATUS_LABELS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const phaseSteps = [
  { key: 'midterm', label: 'Mid-Term', num: 1 },
  { key: 'finals', label: 'Internal & Final', num: 2 },
  { key: 'submit', label: 'Submit to HoD', num: 3 },
];

const getActivePhase = (status) => {
  switch (status) {
    case 'assigned':
    case 'award-list-ready':
      return 'midterm';
    case 'midterm-saved':
    case 'rejected':
      return 'finals';
    case 'finals-saved':
      return 'submit';
    case 'submitted':
      return 'submitted';
    case 'approved':
      return 'approved';
    default:
      return 'midterm';
  }
};

const isPhaseComplete = (status, phase) => {
  const order = ['midterm', 'finals', 'submit'];
  const statusPhaseMap = {
    assigned: -1,
    'award-list-ready': -1,
    'midterm-saved': 0,
    rejected: 0,
    'finals-saved': 1,
    submitted: 2,
    approved: 2,
  };
  const current = statusPhaseMap[status] ?? -1;
  const phaseIdx = order.indexOf(phase);
  return current >= phaseIdx;
};

const TeacherCourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [awardList, setAwardList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitModal, setSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importModal, setImportModal] = useState(false);

  // ✅ KEY FIX: Force new object reference on every fetch
  const fetchAwardList = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) setRefreshing(true);
      try {
        const res = await api.get(`/course-assignments/${id}/award-list`);
        const newData = res.data.data.awardList;
        // Spread to create new reference and force React to re-render
        setAwardList({ ...newData });
        return newData;
      } catch {
        toast.error('Failed to load award list');
        navigate('/teacher/courses');
        return null;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, navigate]
  );

  useEffect(() => {
    fetchAwardList();
  }, [fetchAwardList]);

  const handleExport = async () => {
    try {
      const res = await api.get(
        `/course-assignments/${id}/award-list/export`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `award-list-${
        awardList?.assignment?.course?.code || 'export'
      }.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Award list exported');
    } catch {
      toast.error('Failed to export');
    }
  };

  const handleSubmitToHoD = async () => {
    setSubmitting(true);
    try {
      await api.post(`/course-assignments/${id}/submit`);
      toast.success('Result submitted to HoD successfully!');
      setSubmitModal(false);
      await fetchAwardList(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!awardList) return null;

  const { assignment, entries, statistics } = awardList;
  const status = assignment.status;
  const activePhase = getActivePhase(status);

  const canEnterMidterm = [
    'assigned',
    'award-list-ready',
    'midterm-saved',
    'rejected',
  ].includes(status);

  const canEnterFinals = [
    'midterm-saved',
    'finals-saved',
    'rejected',
  ].includes(status);

  const canSubmit = status === 'finals-saved';
  const isApproved = status === 'approved';
  const isSubmitted = status === 'submitted';
  const isRejected = status === 'rejected';

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">

      {/* ─── HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher/courses')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 transition-colors"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignment.course?.name}
              </h1>
              <Badge
                variant={
                  status === 'approved'
                    ? 'success'
                    : status === 'submitted'
                    ? 'purple'
                    : status === 'rejected'
                    ? 'danger'
                    : status === 'finals-saved'
                    ? 'warning'
                    : status === 'midterm-saved'
                    ? 'info'
                    : 'default'
                }
                size="sm"
              >
                {ASSIGNMENT_STATUS_LABELS[status] || status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {assignment.course?.code} • Semester {assignment.semester} •{' '}
              {assignment.session?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchAwardList(true)}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 transition-colors"
            title="Refresh page"
          >
            <HiOutlineArrowPath
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>

          <Button
            variant="secondary"
            size="sm"
            icon={HiOutlineArrowDownTray}
            onClick={handleExport}
          >
            Export Excel
          </Button>

          {!isApproved && !isSubmitted && (
            <Button
              variant="secondary"
              size="sm"
              icon={HiOutlineArrowUpTray}
              onClick={() => setImportModal(true)}
            >
              Import Excel
            </Button>
          )}

          {canSubmit && (
            <Button
              variant="primary"
              icon={HiOutlinePaperAirplane}
              onClick={() => setSubmitModal(true)}
            >
              Send to HoD
            </Button>
          )}
        </div>
      </div>

      {/* ─── REJECTION NOTICE ───────────────────────────────── */}
      {isRejected && assignment.rejectionReason && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4 flex items-start gap-3">
          <HiOutlineExclamationCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Result Returned for Correction
            </p>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {assignment.rejectionReason}
            </p>
          </div>
        </div>
      )}

      {/* ─── APPROVED NOTICE ────────────────────────────────── */}
      {isApproved && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 flex items-start gap-3">
          <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              ✅ Result Officially Approved
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">
              This result has been approved by the HoD.
            </p>
          </div>
        </div>
      )}

      {/* ─── PHASE STEPPER ──────────────────────────────────── */}
      <Card padding={false} className="p-4 lg:p-5">
        <div className="flex items-center">
          {phaseSteps.map((step, i) => {
            const complete = isPhaseComplete(status, step.key);
            const active = activePhase === step.key;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 ${
                      complete
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : active
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/30 shadow-sm'
                        : 'bg-gray-200 dark:bg-dark-card text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {complete ? '✓' : step.num}
                  </div>
                  <div className="hidden sm:block">
                    <p
                      className={`text-sm font-semibold ${
                        complete
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : active
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {step.key === 'midterm' && complete && '✓ Saved'}
                      {step.key === 'midterm' && active && 'Enter marks'}
                      {step.key === 'finals' && complete && '✓ Saved'}
                      {step.key === 'finals' && active && 'Enter marks'}
                      {step.key === 'submit' && complete && '✓ Submitted'}
                      {step.key === 'submit' && active && 'Click Send'}
                    </p>
                  </div>
                </div>
                {i < phaseSteps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 sm:mx-4 transition-colors duration-300 ${
                      complete
                        ? 'bg-emerald-400'
                        : 'bg-gray-200 dark:bg-dark-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Step Instruction */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
          {(status === 'assigned' || status === 'award-list-ready') && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <span className="text-blue-500 text-lg">📝</span>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                <strong>Step 1:</strong> Enter mid-term marks (0-{assignment.course?.marksDistribution?.midTerm || 20}) for each student in the blue input boxes below, then click <strong>"Save Mid-Term"</strong>
              </p>
            </div>
          )}
          {status === 'midterm-saved' && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
              <span className="text-amber-500 text-lg">✏️</span>
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                <strong>Step 2:</strong> Mid-term marks saved! Now enter <strong>Internal</strong> (0-{assignment.course?.marksDistribution?.internal || 20}) and <strong>Final Term</strong> (0-{assignment.course?.marksDistribution?.finalTerm || 60}) marks in the amber input boxes below, then click <strong>"Save Finals"</strong>
              </p>
            </div>
          )}
          {status === 'finals-saved' && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
              <span className="text-emerald-500 text-lg">✅</span>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                <strong>Step 3:</strong> All marks saved and grades calculated! Review the award list, then click <strong>"Send to HoD"</strong> button above to submit for approval.
              </p>
            </div>
          )}
          {isSubmitted && (
            <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <Badge variant="purple" size="md" dot>Awaiting HoD Review</Badge>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                Your result is pending approval. You will be notified when HoD reviews it.
              </p>
            </div>
          )}
          {isApproved && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
              <Badge variant="success" size="md" dot>Result Officially Approved</Badge>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Students can now view their official results and download transcripts.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* ─── STATS ──────────────────────────────────────────── */}
      {statistics && statistics.marksEntered > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatsCard title="Total" value={statistics.totalStudents || 0} color="primary" />
          <StatsCard title="Passed" value={statistics.passedStudents || 0} color="success" />
          <StatsCard title="Failed" value={statistics.failedStudents || 0} color="danger" />
          <StatsCard title="Pass Rate" value={`${statistics.passRate || 0}%`} color="info" />
          <StatsCard title="Average" value={statistics.averageMarks?.toFixed(1) || '0'} color="warning" />
          <StatsCard title="Highest" value={statistics.highestMarks || 0} color="gold" />
        </div>
      )}

      {/* ─── MARKS ENTRY TABLE ──────────────────────────────── */}
      {/* ✅ KEY PROP: Forces complete re-mount when status changes */}
      <MarksEntryTable
        key={`${id}-${status}`}
        assignmentId={id}
        entries={entries}
        assignment={assignment}
        canEnterMidterm={canEnterMidterm}
        canEnterFinals={canEnterFinals}
        isReadOnly={isSubmitted || isApproved}
        onRefresh={() => fetchAwardList(true)}
        awardList={awardList}
      />

      {/* ─── SUBMIT CONFIRMATION ────────────────────────────── */}
      <ConfirmDialog
        isOpen={submitModal}
        onClose={() => setSubmitModal(false)}
        onConfirm={handleSubmitToHoD}
        isLoading={submitting}
        title="Submit Result to HoD?"
        message="Once submitted, you cannot edit marks until HoD reviews it. Are all marks correct?"
        confirmLabel="Submit to HoD"
        variant="info"
      />

      {/* ─── IMPORT MODAL ───────────────────────────────────── */}
      <MarksImportModal
        isOpen={importModal}
        onClose={() => setImportModal(false)}
        assignmentId={id}
        onSuccess={() => {
          setImportModal(false);
          fetchAwardList(true);
        }}
      />
    </div>
  );
};

export default TeacherCourseDetail;