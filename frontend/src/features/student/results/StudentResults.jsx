import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineDocumentCheck, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import { formatGPA } from '../../../utils/helpers';
import { GRADE_COLORS, MARKS_PHASE_LABELS, MARKS_PHASE_COLORS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const StudentResults = () => {
  const navigate = useNavigate();
  const [currentMarks, setCurrentMarks] = useState([]);
  const [semesterResults, setSemesterResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSem, setExpandedSem] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [profileRes, resultsRes] = await Promise.all([
          api.get('/students/my-profile'),
          api.get('/semester-results/my-results').catch(() => ({ data: { data: { results: [] } } })),
        ]);

        const profile = profileRes.data.data;
        setCurrentMarks(profile.currentMarks || []);
        setSemesterResults(resultsRes.data.data.results || []);
      } catch {
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Results</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your progressive marks and semester results</p>
      </div>

      {/* Current Semester Marks */}
      {currentMarks.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title>Current Semester - Live Marks</Card.Title>
            <Card.Description>Marks update as your teachers enter them</Card.Description>
          </Card.Header>
          <div className="space-y-3">
            {currentMarks.map((mark) => (
              <div key={mark._id} className="p-4 rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/30 dark:bg-dark-card/20">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{mark.course?.name}</p>
                    <p className="text-xs text-gray-500">{mark.course?.code} • {mark.course?.creditHours} Cr.H</p>
                  </div>
                  <Badge className={MARKS_PHASE_COLORS[mark.marksPhase] || ''} size="xs">
                    {MARKS_PHASE_LABELS[mark.marksPhase]}
                  </Badge>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <MarkCell label="Mid" val={mark.midTerm?.obtained} total={mark.midTerm?.total || 20} entered={mark.midTerm?.isEntered} />
                  <MarkCell label="Internal" val={mark.internal?.obtained} total={mark.internal?.total || 20} entered={mark.internal?.isEntered} />
                  <MarkCell label="Final" val={mark.finalTerm?.obtained} total={mark.finalTerm?.total || 60} entered={mark.finalTerm?.isEntered} />
                  <MarkCell label="Total" val={mark.totalObtained} total={mark.totalMarks || 100} entered={mark.totalObtained != null} highlight />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase mb-1">Grade</p>
                    {mark.grade ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${GRADE_COLORS[mark.grade]}`}>{mark.grade}</span>
                    ) : <span className="text-gray-300 text-sm">—</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Published Semester Results */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Semester Results</h2>
        {semesterResults.length > 0 ? (
          <div className="space-y-4">
            {semesterResults.map((result) => (
              <SemesterResultCard
                key={result._id}
                result={result}
                isExpanded={expandedSem === result.semester}
                onToggle={() => setExpandedSem(expandedSem === result.semester ? null : result.semester)}
                // ✅ Pass navigate down to SemesterResultCard
                navigate={navigate}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={HiOutlineDocumentCheck}
            title="No Published Results"
            description="Your semester results will appear here once published by the administration."
          />
        )}
      </div>
    </div>
  );
};

const MarkCell = ({ label, val, total, entered, highlight }) => (
  <div>
    <p className="text-[10px] text-gray-400 uppercase mb-1">{label}</p>
    {entered ? (
      <p className={`text-base font-bold ${highlight ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
        {val}<span className="text-[10px] text-gray-400 font-normal">/{total}</span>
      </p>
    ) : <p className="text-sm text-gray-300">—</p>}
  </div>
);

// ✅ UPDATED: Added navigate prop to enable "View Full Detail" link
const SemesterResultCard = ({ result, isExpanded, onToggle, navigate }) => {
  return (
    <Card padding={false} className="overflow-hidden">
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-card/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{result.semester}</span>
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900 dark:text-white">Semester {result.semester}</p>
            <p className="text-xs text-gray-500">{result.session?.name || 'N/A'}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-6 text-center">
            <div>
              <p className="text-lg font-bold text-primary-600">{formatGPA(result.semesterGPA)}</p>
              <p className="text-[10px] text-gray-400">GPA</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{formatGPA(result.cumulativeGPA)}</p>
              <p className="text-[10px] text-gray-400">CGPA</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-600">{result.totalCoursesPassed}</p>
              <p className="text-[10px] text-gray-400">Passed</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-600">{result.totalCoursesFailed}</p>
              <p className="text-[10px] text-gray-400">Failed</p>
            </div>
          </div>
          {isExpanded ? <HiOutlineChevronUp className="w-5 h-5 text-gray-400" /> : <HiOutlineChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-dark-border animate-[slide-down_0.2s_ease-out]">
          {/* Mobile stats */}
          <div className="sm:hidden grid grid-cols-4 gap-2 p-4 bg-gray-50 dark:bg-dark-card/30 text-center">
            <div><p className="text-base font-bold text-primary-600">{formatGPA(result.semesterGPA)}</p><p className="text-[10px] text-gray-400">GPA</p></div>
            <div><p className="text-base font-bold text-emerald-600">{formatGPA(result.cumulativeGPA)}</p><p className="text-[10px] text-gray-400">CGPA</p></div>
            <div><p className="text-sm font-semibold text-emerald-600">{result.totalCoursesPassed}</p><p className="text-[10px] text-gray-400">Passed</p></div>
            <div><p className="text-sm font-semibold text-red-600">{result.totalCoursesFailed}</p><p className="text-[10px] text-gray-400">Failed</p></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-card">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Course</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Cr.H</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Grade</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">G.Pts</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Q.Pts</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-border/50">
                {(result.courses || []).map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-dark-card/30">
                    <td className="px-4 py-2.5 font-mono text-xs font-medium text-primary-600 dark:text-primary-400">{c.courseCode || c.course?.code}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{c.courseName || c.course?.name}</td>
                    <td className="px-4 py-2.5 text-center">{c.creditHours || c.course?.creditHours}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${GRADE_COLORS[c.grade] || ''}`}>{c.grade}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center font-medium">{c.gradePoints?.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-center font-medium">{c.qualityPoints?.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-semibold ${c.isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                        {c.isPassed ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-primary-50/50 dark:bg-primary-900/10 border-t border-gray-100 dark:border-dark-border flex flex-wrap gap-6 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Credits Attempted: <strong className="text-gray-900 dark:text-white">{result.totalCreditHoursAttempted}</strong></span>
            <span className="text-gray-600 dark:text-gray-400">Credits Earned: <strong className="text-emerald-600">{result.totalCreditHoursEarned}</strong></span>
            <span className="text-gray-600 dark:text-gray-400">Semester GPA: <strong className="text-primary-600">{formatGPA(result.semesterGPA)}</strong></span>
            <span className="text-gray-600 dark:text-gray-400">CGPA: <strong className="text-primary-600">{formatGPA(result.cumulativeGPA)}</strong></span>
          </div>

          {/* ✅ ADDED: View Full Detail navigation link */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-card/30">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/student/results/${result.semester}`);
              }}
              className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1"
            >
              View Full Detail →
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StudentResults;