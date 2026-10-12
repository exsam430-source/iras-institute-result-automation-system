import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineUserGroup,
  HiOutlineArrowUpTray,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import SearchBar from '../../../components/ui/SearchBar';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import Card from '../../../components/ui/Card';
import BulkImportModal from './BulkImportModal';
import useDebounce from '../../../hooks/useDebounce';
import { getFullName, formatGPA } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

const StudentsList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [importModal, setImportModal] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  // Load departments for filter dropdown
  useEffect(() => {
    api
      .get('/departments?limit=100&isActive=true')
      .then((res) => {
        setDepartments(
          (res.data.data.departments || []).map((d) => ({
            value: d._id,
            label: `${d.name} (${d.code})`,
          }))
        );
      })
      .catch(() => {});
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterDept) params.department = filterDept;
      if (filterSemester) params.semester = filterSemester;
      const res = await api.get('/students', { params });
      setStudents(res.data.data.students || []);
      setPagination(res.data.data.pagination || {});
    } catch {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterDept, filterSemester]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterDept, filterSemester]);

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* ─── PAGE HEADER ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Students
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage student profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={HiOutlineArrowUpTray}
            onClick={() => setImportModal(true)}
          >
            Bulk Import
          </Button>
          <Button
            icon={HiOutlinePlus}
            onClick={() => navigate('/admin/students/create')}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* ─── FILTERS ────────────────────────────────────────── */}
      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, roll, email..."
            className="flex-1"
          />
          <Select
            options={departments}
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            placeholder="All Departments"
            containerClassName="sm:w-52"
          />
          <Select
            options={SEMESTER_OPTIONS}
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            placeholder="All Semesters"
            containerClassName="sm:w-44"
          />
        </div>
      </Card>

      {/* ─── TABLE ──────────────────────────────────────────── */}
      <Card padding={false}>
        <Table
          isLoading={loading}
          isEmpty={!loading && students.length === 0}
          emptyProps={{
            icon: HiOutlineUserGroup,
            title: 'No Students Found',
            description: 'Create your first student or import from Excel.',
            actionLabel: 'Add Student',
            onAction: () => navigate('/admin/students/create'),
          }}
        >
          <Table.Head>
            <Table.Row>
              <Table.Th>Student</Table.Th>
              <Table.Th>Roll Number</Table.Th>
              <Table.Th>Father Name</Table.Th>
              <Table.Th>Program</Table.Th>
              <Table.Th align="center">Semester</Table.Th>
              <Table.Th align="center">CGPA</Table.Th>
              <Table.Th align="center">Status</Table.Th>
              <Table.Th align="center">Actions</Table.Th>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {students.map((stu) => (
              <Table.Row key={stu._id}>
                <Table.Td>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={stu.user?.avatar}
                      name={getFullName(stu.user)}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {getFullName(stu.user)}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {stu.user?.email}
                      </p>
                    </div>
                  </div>
                </Table.Td>
                <Table.Td>
                  <span className="font-mono text-sm font-medium text-primary-600 dark:text-primary-400">
                    {stu.rollNumber}
                  </span>
                </Table.Td>
                <Table.Td>
                  <span className="text-sm">{stu.fatherName || 'N/A'}</span>
                </Table.Td>
                <Table.Td>
                  <Badge variant="purple" size="xs">
                    {stu.program?.code || 'N/A'}
                  </Badge>
                </Table.Td>
                <Table.Td align="center">
                  <Badge variant="info" size="sm">
                    Sem {stu.currentSemester}
                  </Badge>
                </Table.Td>
                <Table.Td align="center">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatGPA(stu.cumulativeGPA)}
                  </span>
                </Table.Td>
                <Table.Td align="center">
                  <Badge
                    variant={
                      stu.enrollmentStatus === 'active'
                        ? 'success'
                        : stu.enrollmentStatus === 'graduated'
                        ? 'info'
                        : 'danger'
                    }
                    size="xs"
                    dot
                  >
                    {stu.enrollmentStatus?.charAt(0).toUpperCase() +
                      stu.enrollmentStatus?.slice(1)}
                  </Badge>
                </Table.Td>
                <Table.Td align="center">
                  <button
                    onClick={() => navigate(`/admin/students/${stu._id}`)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-primary-600 transition-colors"
                    title="View"
                  >
                    <HiOutlineEye className="w-4 h-4" />
                  </button>
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <div className="px-4 pb-4">
          <Pagination
            page={pagination.page || page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={10}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {/* ─── BULK IMPORT MODAL ──────────────────────────────── */}
      <BulkImportModal
        isOpen={importModal}
        onClose={() => setImportModal(false)}
        onSuccess={() => {
          setImportModal(false);
          fetchStudents();
        }}
      />
    </div>
  );
};

export default StudentsList;