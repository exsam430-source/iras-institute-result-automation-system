import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineEye, HiOutlineTrash, HiOutlineClipboardDocumentCheck } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Card from '../../../components/ui/Card';
import { getFullName } from '../../../utils/helpers';
import { ASSIGNMENT_STATUS_LABELS, MARKS_PHASE_COLORS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'award-list-ready', label: 'Award List Ready' },
  { value: 'midterm-saved', label: 'Mid-Term Saved' },
  { value: 'finals-saved', label: 'Finals Saved' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const statusBadgeVariant = (status) => {
  const map = { assigned: 'default', 'award-list-ready': 'info', 'midterm-saved': 'info', 'finals-saved': 'warning', submitted: 'purple', approved: 'success', rejected: 'danger' };
  return map[status] || 'default';
};

const AssignmentsList = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/course-assignments', { params });
      setAssignments(res.data.data.assignments || []);
      setPagination(res.data.data.pagination || {});
    } catch { toast.error('Failed to fetch assignments'); }
    finally { setLoading(false); }
  }, [page, filterStatus]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);
  useEffect(() => { setPage(1); }, [filterStatus]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/course-assignments/${deleteModal.id}`);
      toast.success('Assignment deleted');
      setDeleteModal({ open: false, id: null, name: '' });
      fetchAssignments();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Assignments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Assign courses to teachers and manage results</p>
        </div>
        <Button icon={HiOutlinePlus} onClick={() => navigate('/hod/course-assignments/create')}>Assign Course</Button>
      </div>

      <Card padding={false} className="p-4">
        <Select options={STATUS_OPTIONS} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} placeholder="All Statuses" containerClassName="sm:w-56" />
      </Card>

      <Card padding={false}>
        <Table isLoading={loading} isEmpty={!loading && assignments.length === 0} emptyProps={{ icon: HiOutlineClipboardDocumentCheck, title: 'No Assignments', description: 'Assign your first course to a teacher.', actionLabel: 'Assign Course', onAction: () => navigate('/hod/course-assignments/create') }}>
          <Table.Head>
            <Table.Row>
              <Table.Th>Course</Table.Th>
              <Table.Th>Teacher</Table.Th>
              <Table.Th align="center">Semester</Table.Th>
              <Table.Th>Session</Table.Th>
              <Table.Th align="center">Students</Table.Th>
              <Table.Th align="center">Status</Table.Th>
              <Table.Th align="center">Actions</Table.Th>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {assignments.map((a) => (
              <Table.Row key={a._id}>
                <Table.Td>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{a.course?.name}</p>
                    <p className="text-xs text-gray-400">{a.course?.code} • {a.course?.creditHours} Cr.H</p>
                  </div>
                </Table.Td>
                <Table.Td>
                  <div className="flex items-center gap-2">
                    <Avatar src={a.teacher?.avatar} name={getFullName(a.teacher)} size="xs" />
                    <span className="text-sm truncate">{getFullName(a.teacher)}</span>
                  </div>
                </Table.Td>
                <Table.Td align="center"><Badge variant="info" size="sm">Sem {a.semester}</Badge></Table.Td>
                <Table.Td><span className="text-sm">{a.session?.name || 'N/A'}</span></Table.Td>
                <Table.Td align="center"><span className="font-semibold">{a.totalEnrolled || a.enrolledStudents?.filter((s) => s.isActive).length || 0}</span></Table.Td>
                <Table.Td align="center">
                  <Badge variant={statusBadgeVariant(a.status)} size="xs" dot>
                    {ASSIGNMENT_STATUS_LABELS[a.status] || a.status}
                  </Badge>
                </Table.Td>
                <Table.Td align="center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => navigate(`/hod/course-assignments/${a._id}`)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-primary-600 transition-colors" title="View">
                      <HiOutlineEye className="w-4 h-4" />
                    </button>
                    {!['submitted', 'approved'].includes(a.status) && (
                      <button onClick={() => setDeleteModal({ open: true, id: a._id, name: a.course?.name })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <div className="px-4 pb-4"><Pagination page={pagination.page || page} totalPages={pagination.totalPages} total={pagination.total} limit={10} onPageChange={setPage} /></div>
      </Card>

      <ConfirmDialog isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, name: '' })} onConfirm={handleDelete} isLoading={deleting} title="Delete Assignment?" message={`Delete assignment for "${deleteModal.name}"? This will also delete all marks records.`} confirmLabel="Delete" variant="danger" />
    </div>
  );
};

export default AssignmentsList;