import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchBar from '../../../components/ui/SearchBar';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Card from '../../../components/ui/Card';
import Avatar from '../../../components/ui/Avatar';
import useDebounce from '../../../hooks/useDebounce';
import { getFullName } from '../../../utils/helpers';
import toast from 'react-hot-toast';

const DepartmentsList = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterInstitute, setFilterInstitute] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        const res = await api.get('/institutes?limit=100&isActive=true');
        setInstitutes(
          (res.data.data.institutes || []).map((i) => ({
            value: i._id,
            label: `${i.name} (${i.code})`,
          }))
        );
      } catch {}
    };
    fetchInstitutes();
  }, []);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterInstitute) params.institute = filterInstitute;

      const res = await api.get('/departments', { params });
      setDepartments(res.data.data.departments || []);
      setPagination(res.data.data.pagination || {});
    } catch {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterInstitute]);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filterInstitute]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/departments/${deleteModal.id}`);
      toast.success('Department deactivated successfully');
      setDeleteModal({ open: false, id: null, name: '' });
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage departments under institutes</p>
        </div>
        <Button icon={HiOutlinePlus} onClick={() => navigate('/admin/departments/create')}>
          Add Department
        </Button>
      </div>

      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search departments..." className="flex-1" />
          <Select
            options={institutes}
            value={filterInstitute}
            onChange={(e) => setFilterInstitute(e.target.value)}
            placeholder="All Institutes"
            containerClassName="sm:w-64"
          />
        </div>
      </Card>

      <Card padding={false}>
        <Table isLoading={loading} isEmpty={!loading && departments.length === 0} emptyProps={{ icon: HiOutlineBuildingOffice2, title: 'No Departments Found', description: 'Create your first department.', actionLabel: 'Add Department', onAction: () => navigate('/admin/departments/create') }}>
          <Table.Head>
            <Table.Row>
              <Table.Th>Department</Table.Th>
              <Table.Th>Institute</Table.Th>
              <Table.Th>HoD</Table.Th>
              <Table.Th align="center">Programs</Table.Th>
              <Table.Th align="center">Students</Table.Th>
              <Table.Th align="center">Teachers</Table.Th>
              <Table.Th align="center">Status</Table.Th>
              <Table.Th align="center">Actions</Table.Th>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {departments.map((dept) => (
              <Table.Row key={dept._id}>
                <Table.Td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <HiOutlineBuildingOffice2 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{dept.name}</p>
                      <p className="text-xs text-gray-400">{dept.code}</p>
                    </div>
                  </div>
                </Table.Td>
                <Table.Td>
                  <span className="text-sm">{dept.institute?.name || 'N/A'}</span>
                </Table.Td>
                <Table.Td>
                  {dept.hod ? (
                    <div className="flex items-center gap-2">
                      <Avatar src={dept.hod.avatar} name={getFullName(dept.hod)} size="xs" />
                      <span className="text-sm">{getFullName(dept.hod)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Not assigned</span>
                  )}
                </Table.Td>
                <Table.Td align="center"><span className="font-semibold">{dept.stats?.totalPrograms || 0}</span></Table.Td>
                <Table.Td align="center"><span className="font-semibold text-emerald-600">{dept.stats?.totalStudents || 0}</span></Table.Td>
                <Table.Td align="center"><span className="font-semibold text-amber-600">{dept.stats?.totalTeachers || 0}</span></Table.Td>
                <Table.Td align="center">
                  <Badge variant={dept.isActive ? 'success' : 'danger'} size="xs" dot>
                    {dept.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Td>
                <Table.Td align="center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => navigate(`/admin/departments/${dept._id}`)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-primary-600 transition-colors" title="View">
                      <HiOutlineEye className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigate(`/admin/departments/${dept._id}/edit`)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-amber-600 transition-colors" title="Edit">
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteModal({ open: true, id: dept._id, name: dept.name })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <div className="px-4 pb-4">
          <Pagination page={pagination.page || page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit || 10} onPageChange={setPage} />
        </div>
      </Card>

      <ConfirmDialog isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, name: '' })} onConfirm={handleDelete} isLoading={deleting} title="Deactivate Department?" message={`Are you sure you want to deactivate "${deleteModal.name}"?`} confirmLabel="Deactivate" variant="danger" />
    </div>
  );
};

export default DepartmentsList;