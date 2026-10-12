import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineDocumentArrowDown } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import StatsCard from '../../../components/ui/StatsCard';
import Spinner from '../../../components/ui/Spinner';
import { formatGPA } from '../../../utils/helpers';
import { GRADE_COLORS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const SemesterDetail = () => {
  const { semester } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(
          `/semester-results/student/self/semester/${semester}`
        );
        setResult(res.data.data.result);
      } catch (err) {
        if (err.response?.status === 404) {
          toast.error(`No result found for Semester ${semester}`);
        } else {
          toast.error('Failed to load result');
        }
        navigate('/student/results');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [semester, navigate]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get(
        `/transcripts/download?type=semester&semester=${semester}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `semester-${semester}-result.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Result downloaded');
    } catch {
      toast.error('Failed to download');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!result) return null;

  const courses = result.courses || [];

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/student/results')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 transition-colors"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Semester {semester} Result
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Session: {result.session?.name || 'N/A'}
            </p>
          </div>
        </div>
        <Button
          icon={HiOutlineDocumentArrowDown}
          variant="secondary"
          isLoading={downloading}
          onClick={handleDownload}
        >
          Download PDF
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatsCard title="Semester GPA" value={formatGPA(result.semesterGPA)} color="primary" />
        <StatsCard title="CGPA" value={formatGPA(result.cumulativeGPA)} color="gold" />
        <StatsCard title="Passed" value={result.totalCoursesPassed || 0} color="success" />
        <StatsCard title="Failed" value={result.totalCoursesFailed || 0} color="danger" />
        <StatsCard title="Cr. Attempted" value={result.totalCreditHoursAttempted || 0} color="info" />
        <StatsCard title="Cr. Earned" value={result.totalCreditHoursEarned || 0} color="success" />
        <StatsCard title="Total Courses" value={result.totalCoursesAttempted || 0} color="purple" />
      </div>

      {/* Courses Table */}
      <Card padding={false}>
        <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Course Results ({courses.length} courses)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-card">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Course Title</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Cr.H</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Mid /20</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Int /20</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Final /60</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Grade</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">G.Pts</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Q.Pts</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border/50">
              {courses.map((c, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50/50 dark:hover:bg-dark-card/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium text-primary-600 dark:text-primary-400">
                    {c.courseCode || c.course?.code}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {c.courseName || c.course?.name}
                    {c.isRepeated && (
                      <span className="ml-2 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-semibold">
                        REPEAT
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.creditHours || c.course?.creditHours}
                  </td>
                  <td className="px-4 py-3 text-center">{c.midTermMarks ?? '—'}</td>
                  <td className="px-4 py-3 text-center">{c.internalMarks ?? '—'}</td>
                  <td className="px-4 py-3 text-center">{c.finalTermMarks ?? '—'}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                    {c.totalMarks ?? '—'}/100
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.grade ? (
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${GRADE_COLORS[c.grade] || ''}`}>
                        {c.grade}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.gradePoints?.toFixed(2) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.qualityPoints?.toFixed(2) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold ${c.isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                      {c.isPassed ? 'Pass' : 'Fail'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-primary-50/50 dark:bg-primary-900/10 border-t border-gray-100 dark:border-dark-border flex flex-wrap gap-6 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Quality Points: <strong className="text-gray-900 dark:text-white">
              {result.totalQualityPoints?.toFixed(2)}
            </strong>
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            Credits Attempted: <strong className="text-gray-900 dark:text-white">
              {result.totalCreditHoursAttempted}
            </strong>
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            Credits Earned: <strong className="text-emerald-600">
              {result.totalCreditHoursEarned}
            </strong>
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            Semester GPA: <strong className="text-primary-600">
              {formatGPA(result.semesterGPA)}
            </strong>
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            CGPA: <strong className="text-primary-600">
              {formatGPA(result.cumulativeGPA)}
            </strong>
          </span>
        </div>
      </Card>
    </div>
  );
};

export default SemesterDetail;