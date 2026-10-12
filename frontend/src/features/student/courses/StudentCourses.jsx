import { useState, useEffect } from 'react';
import { HiOutlineBookOpen } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import EmptyState from '../../../components/ui/EmptyState';
import { MARKS_PHASE_LABELS, MARKS_PHASE_COLORS, GRADE_COLORS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const StudentCourses = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/marks/student/current');
        setMarks(res.data.data.marks || []);
      } catch {
        toast.error('Failed to load courses');
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current semester enrolled courses</p>
      </div>

      {marks.length === 0 ? (
        <EmptyState icon={HiOutlineBookOpen} title="No Courses" description="You are not enrolled in any courses this semester." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {marks.map((mark) => {
            const course = mark.course;
            return (
              <Card key={mark._id} className="relative overflow-hidden">
                {mark.marksPhase === 'approved' && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-b-[40px] border-l-transparent border-b-emerald-500 rotate-90" />
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <HiOutlineBookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <Badge className={MARKS_PHASE_COLORS[mark.marksPhase] || ''} size="xs">
                    {MARKS_PHASE_LABELS[mark.marksPhase]}
                  </Badge>
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{course?.name}</h3>
                <p className="text-xs text-gray-500 mb-4">{course?.code} • {course?.creditHours} Credits • {course?.type}</p>

                {mark.teacher && <p className="text-xs text-gray-400 mb-3">Teacher: {mark.teacher?.firstName} {mark.teacher?.lastName}</p>}

                <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-gray-100 dark:border-dark-border">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Mid</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {mark.midTerm?.isEntered ? `${mark.midTerm.obtained}/${mark.midTerm.total}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Internal</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {mark.internal?.isEntered ? `${mark.internal.obtained}/${mark.internal.total}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Final</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {mark.finalTerm?.isEntered ? `${mark.finalTerm.obtained}/${mark.finalTerm.total}` : '—'}
                    </p>
                  </div>
                </div>

                {mark.grade && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total: <strong>{mark.totalObtained}/{mark.totalMarks}</strong></span>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${GRADE_COLORS[mark.grade]}`}>{mark.grade}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentCourses;