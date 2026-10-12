import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlinePencilSquare,
  HiOutlineBookOpen,
  HiOutlineUserGroup,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import StatsCard from '../../../components/ui/StatsCard';
import Spinner from '../../../components/ui/Spinner';
import toast from 'react-hot-toast';

const ProgramDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/programs/${id}`)
      .then((res) => setProgram(res.data.data.program))
      .catch(() => { toast.error('Failed to load program'); navigate('/admin/programs'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!program) return null;

  const coursesBySemester = program.coursesBySemester || {};
  const stats = program.stats || {};

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/programs')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500">
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{program.name}</h1>
              <Badge variant="purple" size="sm">{program.degreeType}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {program.code} • {program.department?.name} • {program.totalSemesters} Semesters
            </p>
          </div>
        </div>
        <Button icon={HiOutlinePencilSquare} variant="secondary" onClick={() => navigate(`/admin/programs/${id}/edit`)}>Edit</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Courses" value={stats.totalCourses || 0} icon={HiOutlineBookOpen} color="primary" />
        <StatsCard title="Active Students" value={stats.totalStudents || 0} icon={HiOutlineUserGroup} color="success" />
        <StatsCard title="Credit Hours" value={program.totalCreditHours || 0} color="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header><Card.Title>Program Info</Card.Title></Card.Header>
          <div className="space-y-2 text-sm">
            {program.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                <p className="text-gray-700 dark:text-gray-300">{program.description}</p>
              </div>
            )}
            {program.eligibility && (
              <div className="pt-2 border-t border-gray-100 dark:border-dark-border">
                <p className="text-xs font-medium text-gray-500 mb-1">Eligibility</p>
                <p className="text-gray-700 dark:text-gray-300">{program.eligibility}</p>
              </div>
            )}
            {program.duration && (
              <div className="pt-2 border-t border-gray-100 dark:border-dark-border flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium">{program.duration}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <Card.Header><Card.Title>Courses by Semester</Card.Title></Card.Header>
          <div className="space-y-4">
            {Object.entries(coursesBySemester).map(([sem, courses]) => (
              <div key={sem}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info" size="sm">Semester {sem}</Badge>
                  <span className="text-xs text-gray-400">{courses.length} courses</span>
                </div>
                <div className="space-y-1.5 pl-2">
                  {courses.map((c) => (
                    <div key={c._id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-dark-card">
                      <div>
                        <span className="font-mono text-xs text-primary-600 dark:text-primary-400 mr-2">{c.code}</span>
                        <span className="text-sm text-gray-900 dark:text-white">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={c.type === 'theory+lab' ? 'warning' : c.type === 'lab' ? 'info' : 'default'} size="xs">{c.type}</Badge>
                        <span className="text-xs text-gray-400">{c.creditHours} Cr</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(coursesBySemester).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No courses added yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProgramDetail;