import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineBuildingLibrary,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Card from '../../../components/ui/Card';
import useDebounce from '../../../hooks/useDebounce';
import toast from 'react-hot-toast';

const InstitutesList = () => {
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchInstitutes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await api.get('/institutes', { params });
      setInstitutes(res.data.data.institutes || []);
      setPagination(res.data.data.pagination || {});
    } catch (err) {
      toast.error('Failed to fetch institutes');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchInstitutes();
  }, [fetchInstitutes]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/institutes/${deleteModal.id}`);
      toast.success('Institute deactivated successfully');
      setDeleteModal({ open: false, id: null, name: '' });
      fetchInstitutes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete institute');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Institutes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage all institutes of the university
          </p>
        </div>
        <Button icon={HiOutlinePlus} onClick={() => navigate('/admin/institutes/create')}>
          Add Institute
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search institutes by name or code..."
            className="flex-1"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <Table isLoading={loading} isEmpty={!loading && institutes.length === 0} emptyProps={{ icon: HiOutlineBuildingLibrary, title: 'No Institutes Found', description: 'Create your first institute to get started.', actionLabel: 'Add Institute', onAction: () => navigate('/admin/institutes/create') }}>
          <Table.Head>
            <Table.Row>
              <Table.Th>Institute</Table.Th>
              <Table.Th>Code</Table.Th>
              <Table.Th align="center">Departments</Table.Th>
              <Table.Th align="center">Students</Table.Th>
              <Table.Th align="center">Teachers</Table.Th>
              <Table.Th>Director</Table.Th>
              <Table.Th align="center">Status</Table.Th>
              <Table.Th align="center">Actions</Table.Th>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {institutes.map((inst) => (
              <Table.Row key={inst._id}>
                <Table.Td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <HiOutlineBuildingLibrary className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{inst.name}</p>
                      {inst.shortName && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{inst.shortName}</p>
                      )}
                    </div>
                  </div>
                </Table.Td>
                <Table.Td>
                  <Badge variant="primary" size="sm">{inst.code}</Badge>
                </Table.Td>
                <Table.Td align="center">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {inst.stats?.totalDepartments || inst.totalDepartments || 0}
                  </span>
                </Table.Td>
                <Table.Td align="center">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {inst.stats?.totalStudents || 0}
                  </span>
                </Table.Td>
                <Table.Td align="center">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {inst.stats?.totalTeachers || 0}
                  </span>
                </Table.Td>
                <Table.Td>
                  {inst.director ? (
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {inst.director.firstName} {inst.director.lastName}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Not assigned</span>
                  )}
                </Table.Td>
                <Table.Td align="center">
                  <Badge variant={inst.isActive ? 'success' : 'danger'} size="xs" dot>
                    {inst.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Td>
                <Table.Td align="center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => navigate(`/admin/institutes/${inst._id}`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-primary-600 transition-colors"
                      title="View"
                    >
                      <HiOutlineEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/admin/institutes/${inst._id}/edit`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-amber-600 transition-colors"
                      title="Edit"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, id: inst._id, name: inst.name })}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        {/* Pagination */}
        <div className="px-4 pb-4">
          <Pagination
            page={pagination.page || page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit || 10}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Deactivate Institute?"
        message={`Are you sure you want to deactivate "${deleteModal.name}"? This will not delete any data but will hide it from active lists.`}
        confirmLabel="Deactivate"
        variant="danger"
      />
    </div>
  );
};

export default InstitutesList;