import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlinePencilSquare,
  HiOutlineAcademicCap,
  HiOutlineDocumentCheck,
  HiOutlineChartBar,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import StatsCard from '../../../components/ui/StatsCard';
import Avatar from '../../../components/ui/Avatar';
import Spinner from '../../../components/ui/Spinner';
import { getFullName, formatDate, formatGPA } from '../../../utils/helpers';
import { GRADE_COLORS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/students/${id}`);
        setStudent(res.data.data.studentProfile);
      } catch {
        toast.error('Failed to load student');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!student) return null;

  const user = student.user || {};
  const semesterResults = student.semesterResults || [];
  const failedCourses = (student.failedCourses || []).filter((f) => !f.isCleared);

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 transition-colors">
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Avatar src={user.avatar} name={getFullName(user)} size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getFullName(user)}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {student.rollNumber} • {student.program?.name}
              </p>
            </div>
          </div>
        </div>
        <Badge variant={student.enrollmentStatus === 'active' ? 'success' : student.enrollmentStatus === 'graduated' ? 'info' : 'danger'} size="md" dot>
          {student.enrollmentStatus?.toUpperCase()}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatsCard title="Semester" value={student.currentSemester || 1} icon={HiOutlineAcademicCap} color="primary" />
        <StatsCard title="CGPA" value={formatGPA(student.cumulativeGPA)} icon={HiOutlineChartBar} color="gold" />
        <StatsCard title="Credits Earned" value={student.totalCreditHoursEarned || 0} color="success" />
        <StatsCard title="Credits Attempted" value={student.totalCreditHoursAttempted || 0} color="info" />
        <StatsCard title="Semesters Done" value={semesterResults.length} icon={HiOutlineDocumentCheck} color="purple" />
        <StatsCard title="Failed Courses" value={failedCourses.length} icon={HiOutlineExclamationTriangle} color="danger" />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <Card>
          <Card.Header><Card.Title>Personal Information</Card.Title></Card.Header>
          <div className="space-y-3 text-sm">
            {[
              ['Full Name', getFullName(user)],
              ['Father Name', student.fatherName],
              ['Email', user.email],
              ['Phone', user.phone || 'N/A'],
              ['Gender', user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'N/A'],
              ['CNIC', user.cnic || 'N/A'],
              ['Blood Group', student.bloodGroup || 'N/A'],
              ['Date of Birth', user.dateOfBirth ? formatDate(user.dateOfBirth) : 'N/A'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%] truncate">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Academic Info */}
        <Card>
          <Card.Header><Card.Title>Academic Information</Card.Title></Card.Header>
          <div className="space-y-3 text-sm">
            {[
              ['Roll Number', student.rollNumber],
              ['Reg. Number', student.registrationNumber],
              ['Institute', student.institute?.name],
              ['Department', student.department?.name],
              ['Program', `${student.program?.degreeType || ''} ${student.program?.name || ''}`],
              ['Session', student.session?.name],
              ['Admission Date', formatDate(student.admissionDate)],
              ['Admission Type', student.admissionType || 'regular'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%] truncate">{value || 'N/A'}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Failed Courses */}
        <Card>
          <Card.Header><Card.Title>Failed Courses ({failedCourses.length})</Card.Title></Card.Header>
          {failedCourses.length > 0 ? (
            <div className="space-y-2">
              {failedCourses.map((fc, i) => (
                <div key={i} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">{fc.courseCode || fc.courseName}</p>
                      <p className="text-xs text-red-500">Semester {fc.semester} • Attempt #{fc.attemptNumber}</p>
                    </div>
                    <span className="text-sm font-bold text-red-600">{fc.grade}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No failed courses 🎉</p>
          )}
        </Card>
      </div>

      {/* Semester Results */}
      {semesterResults.length > 0 && (
        <Card>
          <Card.Header><Card.Title>Semester Results Summary</Card.Title></Card.Header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-card">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Semester</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">GPA</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">CGPA</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Passed</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Failed</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Credits</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-border/50">
                {semesterResults.map((sr) => (
                  <tr key={sr._id || sr.semester} className="hover:bg-gray-50/50 dark:hover:bg-dark-card/30">
                    <td className="px-4 py-2.5 font-semibold">Semester {sr.semester}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-primary-600">{formatGPA(sr.semesterGPA)}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-600">{formatGPA(sr.cumulativeGPA)}</td>
                    <td className="px-4 py-2.5 text-center text-emerald-600 font-semibold">{sr.totalCoursesPassed}</td>
                    <td className="px-4 py-2.5 text-center">
                      {sr.totalCoursesFailed > 0 ? (
                        <span className="text-red-600 font-semibold">{sr.totalCoursesFailed}</span>
                      ) : <span className="text-gray-400">0</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">{sr.totalCreditHoursEarned}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge variant={sr.status === 'promoted' ? 'success' : sr.status === 'completed' ? 'info' : 'warning'} size="xs">
                        {sr.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentDetail;