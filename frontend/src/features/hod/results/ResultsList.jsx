import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineDocumentCheck, HiOutlineEye } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import Card from '../../../components/ui/Card';
import { getFullName, timeAgo } from '../../../utils/helpers';
import { ASSIGNMENT_STATUS_LABELS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const statusVariant = (s) => {
  const m = { submitted: 'warning', approved: 'success', rejected: 'danger' };
  return m[s] || 'default';
};

const ResultsList = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('submitted');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/course-assignments/hod-pending', { params });
      setAssignments(res.data.data.assignments || []);
      setPagination(res.data.data.pagination || {});
    } catch { toast.error('Failed to fetch'); }
    finally { setLoading(false); }
  }, [page, filterStatus]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [filterStatus]);

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Results Review</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and approve/reject submitted results</p>
      </div>

      <Card padding={false} className="p-4">
        <Select options={STATUS_OPTIONS} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} placeholder="All" containerClassName="sm:w-52" />
      </Card>

      <Card padding={false}>
        <Table isLoading={loading} isEmpty={!loading && assignments.length === 0} emptyProps={{ icon: HiOutlineDocumentCheck, title: filterStatus === 'submitted' ? 'No Pending Results' : 'No Results Found', description: filterStatus === 'submitted' ? 'All results have been reviewed.' : 'No matching results.' }}>
          <Table.Head>
            <Table.Row>
              <Table.Th>Course</Table.Th>
              <Table.Th>Teacher</Table.Th>
              <Table.Th align="center">Semester</Table.Th>
              <Table.Th align="center">Students</Table.Th>
              <Table.Th align="center">Pass Rate</Table.Th>
              <Table.Th align="center">Submitted</Table.Th>
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
                    <p className="text-xs text-gray-400">{a.course?.code}</p>
                  </div>
                </Table.Td>
                <Table.Td>
                  <div className="flex items-center gap-2">
                    <Avatar src={a.teacher?.avatar} name={getFullName(a.teacher)} size="xs" />
                    <span className="text-sm">{getFullName(a.teacher)}</span>
                  </div>
                </Table.Td>
                <Table.Td align="center"><Badge variant="info" size="sm">Sem {a.semester}</Badge></Table.Td>
                <Table.Td align="center"><span className="font-semibold">{a.statistics?.totalStudents || a.totalEnrolled || 0}</span></Table.Td>
                <Table.Td align="center">
                  <span className={`font-semibold ${(a.statistics?.passRate || 0) >= 70 ? 'text-emerald-600' : (a.statistics?.passRate || 0) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {a.statistics?.passRate || 0}%
                  </span>
                </Table.Td>
                <Table.Td align="center"><span className="text-xs text-gray-400">{timeAgo(a.submittedAt)}</span></Table.Td>
                <Table.Td align="center"><Badge variant={statusVariant(a.status)} size="xs" dot>{ASSIGNMENT_STATUS_LABELS[a.status]}</Badge></Table.Td>
                <Table.Td align="center">
                  <button onClick={() => navigate(`/hod/results/${a._id}/review`)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500 hover:text-primary-600 transition-colors" title="Review">
                    <HiOutlineEye className="w-4 h-4" />
                  </button>
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <div className="px-4 pb-4"><Pagination page={pagination.page || page} totalPages={pagination.totalPages} total={pagination.total} limit={10} onPageChange={setPage} /></div>
      </Card>
    </div>
  );
};

export default ResultsList;