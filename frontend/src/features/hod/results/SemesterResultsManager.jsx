import { useState, useEffect } from 'react';
import {
  HiOutlineCalculator,
  HiOutlineCheckCircle,
  HiOutlineDocumentCheck,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import useAuth from '../../../hooks/useAuth';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import StatsCard from '../../../components/ui/StatsCard';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import { formatGPA } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

const SemesterResultsManager = () => {
  const { user } = useAuth();
  const departmentId = user?.department?._id;

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [stats, setStats] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmCalc, setConfirmCalc] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [eligibilityInfo, setEligibilityInfo] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    if (departmentId) {
      api
        .get(`/sessions?department=${departmentId}&isActive=true&limit=50`)
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

  // ─── CHECK ELIGIBILITY WHEN SESSION/SEMESTER CHANGES ──────
  useEffect(() => {
    if (selectedSession && selectedSemester && departmentId) {
      checkEligibility();
      fetchResults();
    } else {
      setEligibilityInfo(null);
      setStats(null);
      setResults([]);
    }
  }, [selectedSession, selectedSemester]);

  const checkEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const res = await api.get('/promotion/check-eligibility', {
        params: {
          semester: selectedSemester,
          sessionId: selectedSession,
          departmentId,
        },
      });
      setEligibilityInfo(res.data.data.eligibility);
    } catch (err) {
      console.error('Eligibility check failed:', err);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/semester-results/statistics', {
        params: {
          semester: selectedSemester,
          sessionId: selectedSession,
          departmentId,
        },
      });
      setStats(res.data.data.statistics);
    } catch {}
  };

  const fetchResults = async () => {
    setLoadingResults(true);
    try {
      const res = await api.get('/semester-results/department', {
        params: {
          semester: selectedSemester,
          sessionId: selectedSession,
          departmentId,
          limit: 100,
        },
      });
      const fetchedResults = res.data.data.results || [];
      setResults(fetchedResults);

      // If results exist, fetch stats too
      if (fetchedResults.length > 0) {
        fetchStats();
      }
    } catch {}
    finally {
      setLoadingResults(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await api.post('/semester-results/calculate', {
        semester: parseInt(selectedSemester),
        sessionId: selectedSession,
        departmentId,
      });
      const r = res.data.data.results;
      toast.success(
        `Results calculated: ${r.calculated?.length || 0} students`
      );
      setConfirmCalc(false);
      fetchStats();
      fetchResults();
      checkEligibility();
    } catch (err) {
      // ✅ Show the actual backend error message
      const message = err.response?.data?.message || 'Calculation failed';
      toast.error(message);
      console.error('Calculate error:', err.response?.data);
    } finally {
      setCalculating(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await api.post('/semester-results/publish', {
        semester: parseInt(selectedSemester),
        sessionId: selectedSession,
        departmentId,
      });
      toast.success(`${res.data.data.publishedCount} results published!`);
      setConfirmPublish(false);
      fetchStats();
      fetchResults();
    } catch (err) {
      const message = err.response?.data?.message || 'Publishing failed';
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  };

  const isEligible = eligibilityInfo?.isEligible;
  const pendingAssignments = eligibilityInfo?.pendingAssignments || 0;
  const approvedAssignments = eligibilityInfo?.approvedAssignments || 0;
  const totalAssignments = eligibilityInfo?.totalAssignments || 0;
  const hasPublishedResults = results.some((r) => r.isPublished);
  const hasCalculatedResults = results.length > 0;

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Semester Results
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Calculate and publish semester results for students
        </p>
      </div>

      {/* Selection */}
      <Card>
        <Card.Header>
          <Card.Title>Select Session & Semester</Card.Title>
        </Card.Header>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Session"
            options={sessions}
            value={selectedSession}
            onChange={(e) => {
              setSelectedSession(e.target.value);
              setEligibilityInfo(null);
            }}
            placeholder="Select Session"
          />
          <Select
            label="Semester"
            options={SEMESTER_OPTIONS}
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value);
              setEligibilityInfo(null);
            }}
            placeholder="Select Semester"
          />
        </div>

        {/* Action Buttons */}
        {selectedSession && selectedSemester && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button
              icon={HiOutlineCalculator}
              variant="secondary"
              onClick={() => setConfirmCalc(true)}
              disabled={!isEligible && pendingAssignments > 0}
            >
              Calculate Results
            </Button>
            <Button
              icon={HiOutlineCheckCircle}
              onClick={() => setConfirmPublish(true)}
              disabled={!hasCalculatedResults}
            >
              Publish Results
            </Button>
          </div>
        )}
      </Card>

      {/* Eligibility Status */}
      {checkingEligibility && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-dark-card rounded-xl">
          <Spinner size="sm" />
          <p className="text-sm text-gray-500">Checking eligibility...</p>
        </div>
      )}

      {eligibilityInfo && !checkingEligibility && (
        <div className={`rounded-xl p-4 border flex items-start gap-3 ${
          isEligible
            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'
            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
        }`}>
          <HiOutlineExclamationCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
            isEligible ? 'text-emerald-500' : 'text-amber-500'
          }`} />
          <div className="flex-1">
            <p className={`font-semibold text-sm ${
              isEligible
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-amber-700 dark:text-amber-300'
            }`}>
              {isEligible
                ? '✅ All course results are approved — ready to calculate!'
                : `⚠️ ${pendingAssignments} course result(s) still pending approval`}
            </p>

            <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span>
                Assignments:{' '}
                <strong className="text-emerald-600">{approvedAssignments}</strong>
                /{totalAssignments} approved
              </span>
              <span>
                Students:{' '}
                <strong>{eligibilityInfo.publishedResults}</strong>
                /{eligibilityInfo.totalStudents} results published
              </span>
            </div>

            {!isEligible && eligibilityInfo.issues?.length > 0 && (
              <div className="mt-2 space-y-1">
                {eligibilityInfo.issues.map((issue, i) => (
                  <p key={i} className="text-xs text-amber-600 dark:text-amber-400">
                    • {issue}
                  </p>
                ))}
              </div>
            )}

            {!isEligible && (
              <div className="mt-3 p-3 bg-white dark:bg-dark-surface rounded-lg border border-amber-200 dark:border-amber-800/30">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Required steps before calculating:
                </p>
                <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 list-decimal list-inside">
                  <li>Teacher enters mid-term marks → saves → students notified</li>
                  <li>Teacher enters internal + final marks → saves</li>
                  <li>Teacher submits result to HoD</li>
                  <li>HoD reviews and approves result ← <strong className="text-amber-600">pending step</strong></li>
                  <li>Then come back here to calculate results ✅</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatsCard title="Students" value={stats.totalStudents || 0} color="primary" />
          <StatsCard title="Avg GPA" value={formatGPA(stats.avgGPA)} color="info" />
          <StatsCard title="Highest" value={formatGPA(stats.highestGPA)} color="gold" />
          <StatsCard title="Lowest" value={formatGPA(stats.lowestGPA)} color="warning" />
          <StatsCard title="All Passed" value={stats.studentsWithAllPassed || 0} color="success" />
          <StatsCard title="Has Failed" value={stats.studentsWithFailedCourses || 0} color="danger" />
          <StatsCard title="Pass Rate" value={`${stats.passRate || 0}%`} color="info" />
        </div>
      )}

      {/* Results Table */}
      {loadingResults ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : results.length > 0 ? (
        <Card padding={false}>
          <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Semester {selectedSemester} Results ({results.length} students)
            </h3>
            <div className="flex items-center gap-2">
              {hasPublishedResults && (
                <Badge variant="success" size="sm" dot>Published</Badge>
              )}
              {hasCalculatedResults && !hasPublishedResults && (
                <Badge variant="warning" size="sm" dot>Calculated - Not Published</Badge>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-card">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Roll No</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">GPA</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">CGPA</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Passed</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Failed</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Cr. Earned</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-border/50">
                {results.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-dark-card/30"
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs font-medium text-primary-600 dark:text-primary-400">
                        {r.student?.rollNumber || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {r.student?.user
                          ? `${r.student.user.firstName} ${r.student.user.lastName}`
                          : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-primary-600">
                      {formatGPA(r.semesterGPA)}
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-600">
                      {formatGPA(r.cumulativeGPA)}
                    </td>
                    <td className="px-4 py-2.5 text-center text-emerald-600 font-semibold">
                      {r.totalCoursesPassed}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {r.totalCoursesFailed > 0 ? (
                        <span className="text-red-600 font-semibold">
                          {r.totalCoursesFailed}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center text-gray-600 dark:text-gray-400">
                      {r.totalCreditHoursEarned}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge
                        variant={r.isPublished ? 'success' : 'warning'}
                        size="xs"
                        dot
                      >
                        {r.isPublished ? 'Published' : 'Calculated'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : selectedSession && selectedSemester && !loadingResults ? (
        <Card>
          <div className="text-center py-8">
            <HiOutlineDocumentCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No results calculated yet for this selection.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Make sure all course results are approved, then click Calculate.
            </p>
          </div>
        </Card>
      ) : null}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={confirmCalc}
        onClose={() => setConfirmCalc(false)}
        onConfirm={handleCalculate}
        isLoading={calculating}
        title="Calculate Semester Results?"
        message={
          isEligible
            ? `Calculate GPA/CGPA for all students in Semester ${selectedSemester}. All ${approvedAssignments} course results are approved.`
            : `Warning: ${pendingAssignments} course result(s) are not yet approved. Calculation may be incomplete. Proceed anyway?`
        }
        confirmLabel="Calculate Results"
        variant="info"
      />

      <ConfirmDialog
        isOpen={confirmPublish}
        onClose={() => setConfirmPublish(false)}
        onConfirm={handlePublish}
        isLoading={publishing}
        title="Publish Semester Results?"
        message="Results will be visible to students after publishing. Students CGPA will be updated. This cannot be undone."
        confirmLabel="Publish Results"
        variant="info"
      />
    </div>
  );
};

export default SemesterResultsManager;