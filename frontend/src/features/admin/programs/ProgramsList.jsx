import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineAcademicCap } from 'react-icons/hi2';
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

const ProgramsList = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    api.get('/departments?limit=100&isActive=true').then((res) => {
      setDepartments((res.data.data.departments || []).map((d) => ({ value: d._id, label: `${d.name} (${d.code})` })));
    }).catch(() => {});
  }, []);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterDept) params.department = filterDept;
      const res = await api.get('/programs', { params });
      setPrograms(res.data.data.programs || []);
      setPagination(res.data.data.pagination || {});
    } catch { toast.error('Failed to fetch programs'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, filterDept]);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filterDept]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/programs/${deleteModal.id}`);
      toast.success('Program deactivated');
      setDeleteModal({ open: false, id: null, name: '' });
      fetchPrograms();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Programs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage degree programs</p>
        </div>
        <Button icon={HiOutlinePlus} onClick={() => navigate('/admin/programs/create')}>Add Program</Button>
      </div>

      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search programs..." className="flex-1" />
          <Select options={departments} value={filterDept} onChange={(e) => setFilterDept(e.target.value)} placeholder="All Departments" containerClassName="sm:w-64" />
        </div>
      </Card>

      <Card padding={false}>
        <Table isLoading={loading} isEmpty={!loading && programs.length === 0} emptyProps={{ icon: HiOutlineAcademicCap, title: 'No Programs Found', actionLabel: 'Add Program', onAction: () => navigate('/admin/programs/create') }}>
          <Table.Head>
            <Table.Row>
              <Table.Th>Program</Table.Th>
              <Table.Th>Department</Table.Th>
              <Table.Th>Degree</Table.Th>
              <Table.Th align="center">Semesters</Table.Th>
              <Table.Th align="center">Credit Hrs</Table.Th>
              <Table.Th align="center">Students</Table.Th>
              <Table.Th align="center">Courses</Table.Th>
              <Table.Th align="center">Status</Table.Th>
              <Table.Th align="center">Actions</Table.Th>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {programs.map((prog) => (
              <Table.Row key={prog._id}>
                <Table.Td>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{prog.name}</p>
                    <p className="text-xs text-gray-400">{prog.code}</p>
                  </div>
                </Table.Td>
                <Table.Td><span className="text-sm">{prog.department?.name || 'N/A'}</span></Table.Td>
                <Table.Td><Badge variant="purple" size="sm">{prog.degreeType}</Badge></Table.Td>
                <Table.Td align="center"><span className="font-semibold">{prog.totalSemesters}</span></Table.Td>
                <Table.Td align="center"><span className="font-semibold">{prog.totalCreditHours}</span></Table.Td>
                <Table.Td align="center"><span className="font-semibold text-emerald-600">{prog.stats?.totalStudents || 0}</span></Table.Td>
                <Table.Td align="center"><span className="font-semibold text-blue-600">{prog.stats?.totalCourses || 0}</span></Table.Td>
                <Table.Td align="center"><Badge variant={prog.isActive ? 'success' : 'danger'} size="xs" dot>{prog.isActive ? 'Active' : 'Inactive'}</Badge></Table.Td>
                <Table.Td align="center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => navigate(`/admin/programs/${prog._id}/edit`)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-amber-600 transition-colors"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteModal({ open: true, id: prog._id, name: prog.name })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-500 hover:text-red-600 transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                  </div>
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <div className="px-4 pb-4">
          <Pagination page={pagination.page || page} totalPages={pagination.totalPages} total={pagination.total} limit={10} onPageChange={setPage} />
        </div>
      </Card>

      <ConfirmDialog isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, name: '' })} onConfirm={handleDelete} isLoading={deleting} title="Deactivate Program?" message={`Deactivate "${deleteModal.name}"?`} confirmLabel="Deactivate" variant="danger" />
    </div>
  );
};

export default ProgramsList;