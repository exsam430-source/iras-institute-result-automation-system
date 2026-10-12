import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineUsers,
  HiOutlineArrowPath,
  HiOutlineArrowDownTray,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import api from '../../../utils/axios';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import SearchBar from '../../../components/ui/SearchBar';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';
import useDebounce from '../../../hooks/useDebounce';
import { getFullName, formatDate } from '../../../utils/helpers';
import { ROLE_LABELS, ROLE_COLORS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'director', label: 'Director' },
  { value: 'hod', label: 'HoD' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
];

const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);
  const [resetModal, setResetModal] = useState({ open: false, id: null, name: '' });
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.isActive = filterStatus;
      const res = await api.get('/users', { params });
      setUsers(res.data.data.users || []);
      setPagination(res.data.data.pagination || {});
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterRole, filterStatus]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filterRole, filterStatus]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteModal.id}`);
      toast.success('User deactivated');
      setDeleteModal({ open: false, id: null, name: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.patch(`/users/${userId}/toggle-status`);
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setResetting(true);
    try {
      await api.patch(`/users/${resetModal.id}/reset-password`, { newPassword });
      toast.success('Password reset successfully');
      setResetModal({ open: false, id: null, name: '' });
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setResetting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/users/import-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student_import_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch {
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all system users</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={HiOutlineArrowDownTray} size="sm" onClick={handleDownloadTemplate}>
            Import Template
          </Button>
          <Button icon={HiOutlinePlus} onClick={() => navigate('/admin/users/create')}>
            Add User
          </Button>
        </div>
      </div>

      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, CNIC..." className="flex-1" />
          <Select options={ROLE_OPTIONS} value={filterRole} onChange={(e) => setFilterRole(e.target.value)} placeholder="All Roles" containerClassName="sm:w-44" />
          <Select
            options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            placeholder="All Status"
            containerClassName="sm:w-36"
          />
        </div>
      </Card>

      <Card padding={false}>
        <Table
          isLoading={loading}
          isEmpty={!loading && users.length === 0}
          emptyProps={{
            icon: HiOutlineUsers,
            title: 'No Users Found',
            actionLabel: 'Add User',
            onAction: () => navigate('/admin/users/create'),
          }}
        >
          <Table.Head>
            <Table.Row>
              <Table.Th>User</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Department</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th align="center">Email Verified</Table.Th>
              <Table.Th align="center">Status</Table.Th>
              <Table.Th align="center">Actions</Table.Th>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {users.map((user) => (
              <Table.Row key={user._id}>
                <Table.Td>
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatar} name={getFullName(user)} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{getFullName(user)}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                </Table.Td>
                <Table.Td>
                  <Badge className={ROLE_COLORS[user.role]} size="sm">{ROLE_LABELS[user.role]}</Badge>
                </Table.Td>
                <Table.Td>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{user.department?.name || '—'}</span>
                </Table.Td>
                <Table.Td>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{user.phone || '—'}</span>
                </Table.Td>
                <Table.Td align="center">
                  <Badge variant={user.isEmailVerified ? 'success' : 'warning'} size="xs">
                    {user.isEmailVerified ? 'Verified' : 'Pending'}
                  </Badge>
                </Table.Td>
                <Table.Td align="center">
                  <button onClick={() => handleToggleStatus(user._id)} title="Toggle status">
                    <Badge variant={user.isActive ? 'success' : 'danger'} size="xs" dot className="cursor-pointer hover:opacity-80">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </Table.Td>
                <Table.Td align="center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => navigate(`/admin/users/${user._id}`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-primary-600 transition-colors"
                      title="View"
                    >
                      <HiOutlineEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/admin/users/${user._id}/edit`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-amber-600 transition-colors"
                      title="Edit"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setResetModal({ open: true, id: user._id, name: getFullName(user) })}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-blue-600 transition-colors"
                      title="Reset Password"
                    >
                      <HiOutlineLockClosed className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, id: user._id, name: getFullName(user) })}
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

      <ConfirmDialog
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Deactivate User?"
        message={`Deactivate "${deleteModal.name}"?`}
        confirmLabel="Deactivate"
        variant="danger"
      />

      <Modal
        isOpen={resetModal.open}
        onClose={() => { setResetModal({ open: false, id: null, name: '' }); setNewPassword(''); }}
        title="Reset Password"
        description={`Set a new password for ${resetModal.name}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setResetModal({ open: false, id: null, name: '' }); setNewPassword(''); }}>
              Cancel
            </Button>
            <Button isLoading={resetting} onClick={handleResetPassword}>
              Reset Password
            </Button>
          </>
        }
      >
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password (min 8 chars)"
          required
        />
      </Modal>
    </div>
  );
};

export default UsersList;