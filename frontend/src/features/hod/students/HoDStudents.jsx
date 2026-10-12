import { useState, useEffect, useCallback } from 'react';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import api from '../../../utils/axios';
import useAuth from '../../../hooks/useAuth';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import SearchBar from '../../../components/ui/SearchBar';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import Card from '../../../components/ui/Card';
import useDebounce from '../../../hooks/useDebounce';
import { getFullName, formatGPA } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));

const HoDStudents = () => {
  const { user } = useAuth();
  const departmentId = user?.department?._id;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const debouncedSearch = useDebounce(search, 400);

  const fetch = useCallback(async () => {
    if (!departmentId) return;
    setLoading(true);
    try {
      const params = { page, limit: 15, department: departmentId };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterSemester) params.semester = filterSemester;
      const res = await api.get('/students', { params });
      setStudents(res.data.data.students || []);
      setPagination(res.data.data.pagination || {});
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, filterSemester, departmentId]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filterSemester]);

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Department Students</h1>
      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search students..." className="flex-1" />
          <Select options={SEMESTER_OPTIONS} value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} placeholder="All Semesters" containerClassName="sm:w-44" />
        </div>
      </Card>
      <Card padding={false}>
        <Table isLoading={loading} isEmpty={!loading && students.length === 0} emptyProps={{ icon: HiOutlineUserGroup, title: 'No Students' }}>
          <Table.Head>
            <Table.Row>
              <Table.Th>Student</Table.Th>
              <Table.Th>Roll Number</Table.Th>
              <Table.Th>Father</Table.Th>
              <Table.Th align="center">Semester</Table.Th>
              <Table.Th align="center">CGPA</Table.Th>
              <Table.Th align="center">Status</Table.Th>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {students.map((s) => (
              <Table.Row key={s._id}>
                <Table.Td>
                  <div className="flex items-center gap-2"><Avatar src={s.user?.avatar} name={getFullName(s.user)} size="sm" /><div><p className="font-semibold text-gray-900 dark:text-white truncate">{getFullName(s.user)}</p><p className="text-xs text-gray-400">{s.user?.email}</p></div></div>
                </Table.Td>
                <Table.Td><span className="font-mono text-xs font-medium text-primary-600">{s.rollNumber}</span></Table.Td>
                <Table.Td>{s.fatherName || '—'}</Table.Td>
                <Table.Td align="center"><Badge variant="info" size="sm">Sem {s.currentSemester}</Badge></Table.Td>
                <Table.Td align="center"><strong>{formatGPA(s.cumulativeGPA)}</strong></Table.Td>
                <Table.Td align="center"><Badge variant={s.enrollmentStatus === 'active' ? 'success' : 'danger'} size="xs" dot>{s.enrollmentStatus}</Badge></Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <div className="px-4 pb-4"><Pagination page={pagination.page || page} totalPages={pagination.totalPages} total={pagination.total} limit={15} onPageChange={setPage} /></div>
      </Card>
    </div>
  );
};

export default HoDStudents;