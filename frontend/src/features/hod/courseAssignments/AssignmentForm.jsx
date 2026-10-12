import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
import api from '../../../utils/axios';
import useAuth from '../../../hooks/useAuth';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import toast from 'react-hot-toast';

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));

const schema = z.object({
  course: z.string().min(1, 'Course is required'),
  teacher: z.string().min(1, 'Teacher is required'),
  session: z.string().min(1, 'Session is required'),
  semester: z.string().min(1, 'Semester is required'),
  program: z.string().min(1, 'Program is required'),
  section: z.string().optional().or(z.literal('')),
  academicYear: z.string().optional().or(z.literal('')),
});

const AssignmentForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [programs, setPrograms] = useState([]);

  const departmentId = user?.department?._id;
  const instituteId = user?.institute?._id;

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { course: '', teacher: '', session: '', semester: '', program: '', section: '', academicYear: new Date().getFullYear().toString() },
  });

  const selectedProgram = watch('program');
  const selectedSemester = watch('semester');

  // Fetch teachers in department
  useEffect(() => {
    if (departmentId) {
      api.get(`/departments/${departmentId}/teachers?limit=100`).then((res) => {
        setTeachers((res.data.data.teachers || []).map((t) => ({ value: t._id, label: `${t.firstName} ${t.lastName}` })));
      }).catch(() => {});
    }
  }, [departmentId]);

  // Fetch programs in department
  useEffect(() => {
    if (departmentId) {
      api.get(`/programs?department=${departmentId}&isActive=true&limit=100`).then((res) => {
        setPrograms((res.data.data.programs || []).map((p) => ({ value: p._id, label: `${p.name} (${p.code})` })));
      }).catch(() => {});
    }
  }, [departmentId]);

  // Fetch sessions for selected program
  useEffect(() => {
    if (selectedProgram) {
      api.get(`/sessions?program=${selectedProgram}&isActive=true&limit=100`).then((res) => {
        setSessions((res.data.data.sessions || []).map((s) => ({ value: s._id, label: s.name })));
      }).catch(() => {});
    } else setSessions([]);
  }, [selectedProgram]);

  // Fetch courses for selected program + semester
  useEffect(() => {
    if (selectedProgram && selectedSemester) {
      api.get(`/courses?program=${selectedProgram}&semester=${selectedSemester}&isActive=true&limit=100`).then((res) => {
        setCourses((res.data.data.courses || []).map((c) => ({ value: c._id, label: `${c.name} (${c.code}) - ${c.creditHours} Cr.H` })));
      }).catch(() => {});
    } else setCourses([]);
  }, [selectedProgram, selectedSemester]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await api.post('/course-assignments', {
        course: data.course, teacher: data.teacher, session: data.session,
        semester: parseInt(data.semester), institute: instituteId, department: departmentId,
        program: data.program, section: data.section || null,
        academicYear: data.academicYear || new Date().getFullYear().toString(),
      });
      const enrolledCount = res.data.data.enrolledCount || 0;
      toast.success(`Course assigned! ${enrolledCount} students auto-enrolled.`);
      navigate('/hod/course-assignments');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign course'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/hod/course-assignments')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500">
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assign Course to Teacher</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Students will be auto-enrolled and award list will be generated</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <Card.Header><Card.Title>Assignment Details</Card.Title></Card.Header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Program" required options={programs} error={errors.program?.message} {...register('program')} placeholder="Select Program" />
            <Select label="Semester" required options={SEMESTER_OPTIONS} error={errors.semester?.message} {...register('semester')} placeholder="Select Semester" />
            <Select label="Course" required options={courses} error={errors.course?.message} {...register('course')} placeholder="Select Course" containerClassName="sm:col-span-2" />
            <Select label="Teacher" required options={teachers} error={errors.teacher?.message} {...register('teacher')} placeholder="Select Teacher" />
            <Select label="Session" required options={sessions} error={errors.session?.message} {...register('session')} placeholder="Select Session" />
            <Input label="Section" {...register('section')} placeholder="e.g., A (optional)" className="uppercase" />
            <Input label="Academic Year" {...register('academicYear')} placeholder="e.g., 2024" />
          </div>
        </Card>

        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">📋 What happens when you assign:</p>
          <ul className="text-sm text-blue-600 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
            <li>All active students in the selected semester will be auto-enrolled</li>
            <li>An award list will be generated with student details</li>
            <li>Marks records will be created for each student</li>
            <li>The teacher will be notified of the assignment</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/hod/course-assignments')}>Cancel</Button>
          <Button type="submit" isLoading={submitting}>Assign Course</Button>
        </div>
      </form>
    </div>
  );
};

export default AssignmentForm;