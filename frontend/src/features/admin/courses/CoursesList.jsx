import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineBookOpen } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchBar from '../../../components/ui/SearchBar';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Card from '../../../components/ui/Card';
import useDebounce from '../../../hooks/useDebounce';
import toast from 'react-hot-toast';

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));

const CoursesList = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    api.get('/programs?limit=100&isActive=true').then((res) => {
      setPrograms((res.data.data.programs || []).map((p) => ({ value: p._id, label: `${p.name} (${p.code})` })));
    }).catch(() => {});
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterProgram) params.program = filterProgram;
      if (filterSemester) params.semester = filterSemester;
      const res = await api.get('/courses', { params });
      setCourses(res.data.data.courses || []);
      setPagination(res.data.data.pagination || {});
    } catch { toast.error('Failed to fetch courses'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, filterProgram, filterSemester]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filterProgram, filterSemester]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/courses/${deleteModal.id}`);
      toast.success('Course deactivated');
      setDeleteModal({ open: false, id: null, name: '' });
      fetchCourses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setDeleting(false); }
  };

  const typeColors = { theory: 'info', lab: 'warning', 'theory+lab': 'purple' };
  const categoryColors = { core: 'primary', elective: 'success', general: 'default' };

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all courses</p>
        </div>
        <Button icon={HiOutlinePlus} onClick={() => navigate('/admin/courses/create')}>Add Course</Button>
      </div>

      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or code..." className="flex-1" />
          <Select options={programs} value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} placeholder="All Programs" containerClassName="sm:w-56" />
          <Select options={SEMESTER_OPTIONS} value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} placeholder="All Semesters" containerClassName="sm:w-44" />
        </div>
      </Card>

      <Card padding={false}>
        <Table isLoading={loading} isEmpty={!loading && courses.length === 0} emptyProps={{ icon: HiOutlineBookOpen, title: 'No Courses Found', actionLabel: 'Add Course', onAction: () => navigate('/admin/courses/create') }}>
          <Table.Head>
            <Table.Row>
              <Table.Th>Course</Table.Th>
              <Table.Th>Program</Table.Th>
              <Table.Th align="center">Semester</Table.Th>
              <Table.Th align="center">Credits</Table.Th>
              <Table.Th align="center">Type</Table.Th>
              <Table.Th align="center">Category</Table.Th>
              <Table.Th align="center">Marks</Table.Th>
              <Table.Th align="center">Actions</Table.Th>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {courses.map((course) => (
              <Table.Row key={course._id}>
                <Table.Td>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{course.name}</p>
                    <p className="text-xs text-gray-400">{course.code}</p>
                  </div>
                </Table.Td>
                <Table.Td><span className="text-sm">{course.program?.code || 'N/A'}</span></Table.Td>
                <Table.Td align="center"><Badge variant="info" size="sm">Sem {course.semester}</Badge></Table.Td>
                <Table.Td align="center"><span className="font-semibold">{course.creditHours}</span></Table.Td>
                <Table.Td align="center"><Badge variant={typeColors[course.type] || 'default'} size="xs">{course.type}</Badge></Table.Td>
                <Table.Td align="center"><Badge variant={categoryColors[course.category] || 'default'} size="xs">{course.category}</Badge></Table.Td>
                <Table.Td align="center">
                  <span className="text-xs text-gray-500">
                    {course.marksDistribution?.midTerm}/{course.marksDistribution?.internal}/{course.marksDistribution?.finalTerm}
                  </span>
                </Table.Td>
                <Table.Td align="center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => navigate(`/admin/courses/${course._id}/edit`)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-amber-600 transition-colors"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteModal({ open: true, id: course._id, name: course.name })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-500 hover:text-red-600 transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                  </div>
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <div className="px-4 pb-4"><Pagination page={pagination.page || page} totalPages={pagination.totalPages} total={pagination.total} limit={10} onPageChange={setPage} /></div>
      </Card>

      <ConfirmDialog isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, name: '' })} onConfirm={handleDelete} isLoading={deleting} title="Deactivate Course?" message={`Deactivate "${deleteModal.name}"?`} confirmLabel="Deactivate" variant="danger" />
    </div>
  );
};

export default CoursesList;