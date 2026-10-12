import { useState, useEffect, useCallback } from 'react';
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import api from '../../../utils/axios';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import Card from '../../../components/ui/Card';
// ✅ ADDED: AdvancedFilter import
import AdvancedFilter from '../../../components/ui/AdvancedFilter';
import { getFullName, formatDateTime } from '../../../utils/helpers';
import { ROLE_LABELS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const ACTION_OPTIONS = [
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_CREATED',
  'USER_UPDATED',
  'PASSWORD_CHANGED',
  'INSTITUTE_CREATED',
  'DEPARTMENT_CREATED',
  'COURSE_ASSIGNED',
  'MIDTERM_MARKS_SAVED',
  'FINALS_MARKS_SAVED',
  'RESULT_SUBMITTED',
  'RESULT_APPROVED',
  'RESULT_REJECTED',
  'SEMESTER_PROMOTION_COMPLETED',
  'SETTINGS_UPDATED',
].map((a) => ({ value: a, label: a.replace(/_/g, ' ') }));

const actionVariant = (action) => {
  if (action?.includes('CREATE') || action?.includes('APPROVED'))
    return 'success';
  if (action?.includes('DELETE') || action?.includes('REJECTED'))
    return 'danger';
  if (action?.includes('LOGIN') || action?.includes('LOGOUT'))
    return 'info';
  if (action?.includes('UPDATE') || action?.includes('SAVED'))
    return 'warning';
  return 'default';
};

// ✅ ADDED: Filter config for AdvancedFilter component
const filterConfig = [
  {
    key: 'action',
    label: 'Action Type',
    type: 'select',
    placeholder: 'All Actions',
    options: ACTION_OPTIONS,
  },
  {
    key: 'resource',
    label: 'Resource',
    type: 'text',
    placeholder: 'e.g., user, marks, course',
  },
  {
    key: 'startDate',
    label: 'From Date',
    type: 'date',
  },
  {
    key: 'endDate',
    label: 'To Date',
    type: 'date',
  },
];

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  // ✅ ADDED: Advanced filter state
  const [filterValues, setFilterValues] = useState({
    action: '',
    resource: '',
    startDate: '',
    endDate: '',
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterAction) params.action = filterAction;
      // ✅ ADDED: Include advanced filter values in API params
      if (filterValues.action) params.action = filterValues.action;
      if (filterValues.resource) params.resource = filterValues.resource;
      if (filterValues.startDate) params.startDate = filterValues.startDate;
      if (filterValues.endDate) params.endDate = filterValues.endDate;
      const res = await api.get('/audit-logs', { params });
      setLogs(res.data.data.logs || []);
      setPagination(res.data.data.pagination || {});
    } catch {
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterValues]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [filterAction, filterValues]);

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Audit Logs
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track all system actions and changes
        </p>
      </div>

      {/* ✅ UPDATED: Filter card now includes both Select and AdvancedFilter */}
      <Card padding={false} className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            options={ACTION_OPTIONS}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            placeholder="Filter by Action"
            containerClassName="sm:w-64"
          />
          <AdvancedFilter
            filters={filterConfig}
            values={filterValues}
            onChange={(key, val) =>
              setFilterValues((prev) => ({ ...prev, [key]: val }))
            }
            onReset={() =>
              setFilterValues({
                action: '',
                resource: '',
                startDate: '',
                endDate: '',
              })
            }
          />
        </div>
      </Card>

      <Card padding={false}>
        <Table
          isLoading={loading}
          isEmpty={!loading && logs.length === 0}
          emptyProps={{
            icon: HiOutlineClipboardDocumentList,
            title: 'No Audit Logs',
            description: 'System actions will appear here.',
          }}
        >
          <Table.Head>
            <Table.Row>
              <Table.Th>User</Table.Th>
              <Table.Th>Action</Table.Th>
              <Table.Th>Resource</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>IP Address</Table.Th>
              <Table.Th>Time</Table.Th>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {logs.map((log) => (
              <Table.Row key={log._id}>
                <Table.Td>
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={log.user?.avatar}
                      name={getFullName(log.user)}
                      size="xs"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getFullName(log.user)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {ROLE_LABELS[log.user?.role]}
                      </p>
                    </div>
                  </div>
                </Table.Td>
                <Table.Td>
                  <Badge variant={actionVariant(log.action)} size="xs">
                    {log.action?.replace(/_/g, ' ')}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {log.resource}
                  </span>
                </Table.Td>
                <Table.Td>
                  <span className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate block">
                    {log.description || '—'}
                  </span>
                </Table.Td>
                <Table.Td>
                  <span className="text-xs font-mono text-gray-400">
                    {log.ipAddress || '—'}
                  </span>
                </Table.Td>
                <Table.Td>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(log.createdAt)}
                  </span>
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
            limit={20}
            onPageChange={setPage}
          />
        </div>
      </Card>
    </div>
  );
};

export default AuditLogsPage;