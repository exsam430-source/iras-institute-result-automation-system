import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineCalendarDays } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Card from '../../../components/ui/Card';
import toast from 'react-hot-toast';

const SessionsList = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProgram, setFilterProgram] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get('/programs?limit=100&isActive=true').then((res) => {
      setPrograms((res.data.data.programs || []).map((p) => ({ value: p._id, label: `${p.name} (${p.code})` })));
    }).catch(() => {});
  }, []);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterProgram) params.program = filterProgram;
      const res = await api.get('/sessions', { params });
      setSessions(res.data.data.sessions || []);
      setPagination(res.data.data.pagination || {});
    } catch { toast.error('Failed to fetch sessions'); }
    finally { setLoading(false); }
  }, [page, filterProgram]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { setPage(1); }, [filterProgram]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/sessions/${deleteModal.id}`);
      toast.success('Session deleted');
      setDeleteModal({ open: false, id: null, name: '' });
      fetchSessions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sessions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage academic sessions</p>
        </div>
        <Button icon={HiOutlinePlus} onClick={() => navigate('/admin/sessions/create')}>Add Session</Button>
      </div>

      <Card padding={false} className="p-4">
        <Select options={programs} value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} placeholder="Filter by Program" containerClassName="sm:w-80" />
      </Card>

      <Card padding={false}>
        <Table isLoading={loading} isEmpty={!loading && sessions.length === 0} emptyProps={{ icon: HiOutlineCalendarDays, title: 'No Sessions Found', actionLabel: 'Add Session', onAction: () => navigate('/admin/sessions/create') }}>
          <Table.Head>
            <Table.Row>
              <Table.Th>Session</Table.Th>
              <Table.Th>Program</Table.Th>
              <Table.Th>Department</Table.Th>
              <Table.Th align="center">Current Sem</Table.Th>
              <Table.Th align="center">Students</Table.Th>
              <Table.Th align="center">Current</Table.Th>
              <Table.Th align="center">Status</Table.Th>
              <Table.Th align="center">Actions</Table.Th>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {sessions.map((ses) => (
              <Table.Row key={ses._id}>
                <Table.Td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <HiOutlineCalendarDays className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{ses.name}</span>
                  </div>
                </Table.Td>
                <Table.Td><span className="text-sm">{ses.program?.name || 'N/A'}</span></Table.Td>
                <Table.Td><span className="text-sm">{ses.department?.name || 'N/A'}</span></Table.Td>
                <Table.Td align="center"><Badge variant="info" size="sm">Sem {ses.currentSemester || 1}</Badge></Table.Td>
                <Table.Td align="center"><span className="font-semibold text-emerald-600">{ses.totalStudents || 0}</span></Table.Td>
                <Table.Td align="center">
                  {ses.isCurrent ? <Badge variant="success" size="xs" dot>Current</Badge> : <span className="text-xs text-gray-400">—</span>}
                </Table.Td>
                <Table.Td align="center"><Badge variant={ses.isActive ? 'success' : 'danger'} size="xs" dot>{ses.isActive ? 'Active' : 'Inactive'}</Badge></Table.Td>
                <Table.Td align="center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => navigate(`/admin/sessions/${ses._id}/edit`)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-amber-600 transition-colors"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteModal({ open: true, id: ses._id, name: ses.name })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-500 hover:text-red-600 transition-colors"><HiOutlineTrash className="w-4 h-4" /></button>
                  </div>
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <div className="px-4 pb-4"><Pagination page={pagination.page || page} totalPages={pagination.totalPages} total={pagination.total} limit={10} onPageChange={setPage} /></div>
      </Card>

      <ConfirmDialog isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null, name: '' })} onConfirm={handleDelete} isLoading={deleting} title="Delete Session?" message={`Delete "${deleteModal.name}"? This cannot be undone.`} confirmLabel="Delete" variant="danger" />
    </div>
  );
};

export default SessionsList;