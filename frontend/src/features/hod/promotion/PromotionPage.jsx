import { useState, useEffect } from 'react';
import {
  HiOutlineArrowUpCircle,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import useAuth from '../../../hooks/useAuth';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Badge from '../../../components/ui/Badge';
import StatsCard from '../../../components/ui/StatsCard';
import Spinner from '../../../components/ui/Spinner';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { formatGPA } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

const PromotionPage = () => {
  const { user } = useAuth();
  const departmentId = user?.department?._id;

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [eligibility, setEligibility] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    if (departmentId) {
      api.get(`/sessions?department=${departmentId}&isActive=true&limit=50`)
        .then((res) => {
          setSessions(
            (res.data.data.sessions || []).map((s) => ({
              value: s._id,
              label: `${s.name} (${s.program?.code || ''})`,
            }))
          );
        })
        .catch(() => {});
    }
  }, [departmentId]);

  const handleCheckEligibility = async () => {
    if (!selectedSession || !selectedSemester) {
      toast.error('Select both session and semester');
      return;
    }
    setLoading(true);
    setEligibility(null);
    setPreview(null);
    try {
      const res = await api.get('/promotion/preview', {
        params: {
          semester: selectedSemester,
          sessionId: selectedSession,
          departmentId,
        },
      });
      setEligibility(res.data.data.eligibility);
      setPreview(res.data.data.preview);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const res = await api.post('/promotion/initiate', {
        semester: parseInt(selectedSemester),
        sessionId: selectedSession,
        departmentId,
        forcePromotion: false,
      });
      const results = res.data.data.results;
      toast.success(
        `Promotion complete! ${results.promoted?.length || 0} promoted, ${results.graduated?.length || 0} graduated.`
      );
      setConfirmModal(false);
      setEligibility(null);
      setPreview(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Promotion failed');
    } finally {
      setPromoting(false);
    }
  };

  const summary = preview?.summary || {};
  const students = preview?.preview || [];

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Semester Promotion
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Promote students to the next semester after all results are approved
        </p>
      </div>

      {/* Selection */}
      <Card>
        <Card.Header>
          <Card.Title>Select Session & Semester</Card.Title>
        </Card.Header>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Session"
            options={sessions}
            value={selectedSession}
            onChange={(e) => {
              setSelectedSession(e.target.value);
              setEligibility(null);
              setPreview(null);
            }}
            placeholder="Select Session"
          />
          <Select
            label="Semester"
            options={SEMESTER_OPTIONS}
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value);
              setEligibility(null);
              setPreview(null);
            }}
            placeholder="Select Semester"
          />
          <div className="flex items-end">
            <Button
              onClick={handleCheckEligibility}
              isLoading={loading}
              fullWidth
            >
              Check & Preview
            </Button>
          </div>
        </div>
      </Card>

      {/* Eligibility Status */}
      {eligibility && (
        <div
          className={`rounded-xl p-4 border flex items-start gap-3 ${
            eligibility.isEligible
              ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'
              : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
          }`}
        >
          {eligibility.isEligible ? (
            <HiOutlineCheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <HiOutlineXCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={`font-semibold text-sm ${
                eligibility.isEligible
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-red-700 dark:text-red-300'
              }`}
            >
              {eligibility.isEligible
                ? 'Eligible for Promotion'
                : 'Not Eligible for Promotion'}
            </p>
            {eligibility.issues?.length > 0 && (
              <ul className="mt-1 text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                {eligibility.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-4 mt-2 text-xs">
              <span>
                Assignments: {eligibility.approvedAssignments}/
                {eligibility.totalAssignments} approved
              </span>
              <span>
                Results: {eligibility.publishedResults}/
                {eligibility.totalStudents} published
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatsCard
              title="Total Students"
              value={summary.totalStudents || 0}
              color="primary"
            />
            <StatsCard
              title="All Passed"
              value={summary.studentsWithAllPassed || 0}
              color="success"
            />
            <StatsCard
              title="Has Failed Courses"
              value={summary.studentsWithFailedCourses || 0}
              color="warning"
            />
            <StatsCard
              title="Final Semester"
              value={summary.finalSemesterStudents || 0}
              color="purple"
            />
            <StatsCard
              title="Avg GPA"
              value={formatGPA(summary.avgSemesterGPA)}
              color="gold"
            />
          </div>

          {/* Student Preview Table */}
          <Card padding={false}>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Promotion Preview
              </h3>
              {eligibility?.isEligible && (
                <Button
                  icon={HiOutlineArrowUpCircle}
                  onClick={() => setConfirmModal(true)}
                >
                  Promote All Students
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-card">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                      Roll No
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">
                      Current
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">
                      Next
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">
                      GPA
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">
                      CGPA
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">
                      Passed
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">
                      Failed
                    </th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-border/50">
                  {students.map((stu) => (
                    <tr
                      key={stu.studentId}
                      className="hover:bg-gray-50/50 dark:hover:bg-dark-card/30"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-primary-600 dark:text-primary-400 font-medium">
                        {stu.rollNumber}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">
                        {stu.studentName}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant="info" size="sm">
                          Sem {stu.currentSemester}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {stu.nextSemester ? (
                          <Badge variant="success" size="sm">
                            Sem {stu.nextSemester}
                          </Badge>
                        ) : (
                          <Badge variant="purple" size="sm">
                            Graduate
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold">
                        {formatGPA(stu.semesterGPA)}
                      </td>
                      <td className="px-4 py-2.5 text-center font-bold text-primary-600">
                        {formatGPA(stu.cumulativeGPA)}
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold text-emerald-600">
                        {stu.passedCourses}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {stu.failedCourses > 0 ? (
                          <span className="font-semibold text-red-600">
                            {stu.failedCourses}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge
                          variant={
                            stu.isFinalSemester ? 'purple' : 'success'
                          }
                          size="xs"
                        >
                          {stu.action === 'MARK_AS_GRADUATED'
                            ? 'Graduate'
                            : 'Promote'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Failed courses detail */}
            {students.some((s) => s.failedCoursesList?.length > 0) && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-dark-border bg-amber-50/50 dark:bg-amber-900/5">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
                  <HiOutlineExclamationTriangle className="w-4 h-4" />
                  Students with Failed Courses (will be carried forward)
                </p>
                <div className="space-y-1">
                  {students
                    .filter((s) => s.failedCoursesList?.length > 0)
                    .map((stu) => (
                      <p
                        key={stu.studentId}
                        className="text-xs text-amber-600 dark:text-amber-300"
                      >
                        <strong>{stu.rollNumber}</strong>:{' '}
                        {stu.failedCoursesList
                          .map((f) => `${f.code} (${f.grade})`)
                          .join(', ')}
                      </p>
                    ))}
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Confirm Modal */}
      <ConfirmDialog
        isOpen={confirmModal}
        onClose={() => setConfirmModal(false)}
        onConfirm={handlePromote}
        isLoading={promoting}
        title="Confirm Semester Promotion"
        message={`This will promote ${summary.totalStudents || 0} student(s) to the next semester. ${
          summary.studentsWithFailedCourses > 0
            ? `${summary.studentsWithFailedCourses} student(s) have failed courses that will be carried forward.`
            : ''
        } All students will be notified. This action cannot be undone.`}
        confirmLabel="Promote Students"
        variant="info"
      />
    </div>
  );
};

export default PromotionPage;