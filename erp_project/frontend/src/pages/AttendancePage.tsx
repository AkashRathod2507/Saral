import React from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { fetchEmployees } from '../services/employees';
import type { EmployeeRecord } from '../services/employees';
import {
  fetchAttendance,
  saveAttendance,
  fetchAttendanceEmployeeSummary,
  fetchMonthlyAttendanceSummary
} from '../services/attendance';
import type {
  AttendanceStatus,
  EmployeeAttendanceSummary,
  MonthlyAttendanceSummaryRow
} from '../services/attendance';

const statusColors: Record<AttendanceStatus, string> = {
  present: 'success',
  absent: 'danger',
  leave: 'warning'
};

interface AttendanceState {
  status: AttendanceStatus;
  notes?: string;
}

const AttendancePage: React.FC = () => {
  const [employees, setEmployees] = React.useState<EmployeeRecord[]>([]);
  const [loadingEmployees, setLoadingEmployees] = React.useState(false);
  const [attendanceMap, setAttendanceMap] = React.useState<Record<string, AttendanceState>>({});
  const [selectedDate, setSelectedDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [loadingAttendance, setLoadingAttendance] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [employeeSummary, setEmployeeSummary] = React.useState<EmployeeAttendanceSummary[]>([]);
  const [monthlySummary, setMonthlySummary] = React.useState<MonthlyAttendanceSummaryRow[]>([]);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);

  const loadEmployees = React.useCallback(async () => {
    setLoadingEmployees(true);
    setError(null);
    try {
      const response = await fetchEmployees({ limit: 100 });
      setEmployees(response?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  const loadAttendance = React.useCallback(async (date: string) => {
    setLoadingAttendance(true);
    setError(null);
    try {
      const records = await fetchAttendance({ date });
      const nextMap: Record<string, AttendanceState> = {};
      records.forEach((record) => {
        const id = typeof record.employee_id === 'string' ? record.employee_id : record.employee_id?._id;
        if (id) {
          nextMap[id] = { status: record.status, notes: record.notes ?? '' };
        }
      });
      setAttendanceMap(nextMap);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load attendance');
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  React.useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  React.useEffect(() => {
    if (selectedDate) {
      loadAttendance(selectedDate);
    }
  }, [selectedDate, loadAttendance]);

  const loadSummaries = React.useCallback(async (date: string) => {
    if (!date) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const monthParam = date.slice(0, 7);
      const yearParam = new Date(date).getFullYear();
      const [employeeResp, monthlyResp] = await Promise.all([
        fetchAttendanceEmployeeSummary({ month: monthParam }),
        fetchMonthlyAttendanceSummary({ year: yearParam })
      ]);
      setEmployeeSummary(employeeResp?.totals || []);
      setMonthlySummary(monthlyResp?.months || []);
    } catch (err: any) {
      setSummaryError(err?.response?.data?.message || err?.message || 'Unable to load attendance summaries');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (selectedDate) {
      loadSummaries(selectedDate);
    }
  }, [selectedDate, loadSummaries]);

  const summaryMonthLabel = React.useMemo(
    () => new Date(selectedDate).toLocaleString('default', { month: 'long', year: 'numeric' }),
    [selectedDate]
  );

  const normalizedMonthlyRows = React.useMemo(() => {
    const year = new Date(selectedDate).getFullYear();
    return Array.from({ length: 12 }, (_, index) => {
      const match = monthlySummary.find((row) => row.month === index + 1);
      return {
        month: index + 1,
        label: new Date(year, index, 1).toLocaleString('default', { month: 'short' }),
        present: match?.present ?? 0,
        absent: match?.absent ?? 0,
        leave: match?.leave ?? 0,
        total: match?.total ?? 0
      };
    });
  }, [monthlySummary, selectedDate]);

  const yearlyTotals = React.useMemo(
    () =>
      normalizedMonthlyRows.reduce(
        (acc, row) => ({
          present: acc.present + row.present,
          absent: acc.absent + row.absent,
          leave: acc.leave + row.leave,
          total: acc.total + row.total
        }),
        { present: 0, absent: 0, leave: 0, total: 0 }
      ),
    [normalizedMonthlyRows]
  );

  const updateLocalState = (employeeId: string, partial: Partial<AttendanceState>) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [employeeId]: {
        status: prev[employeeId]?.status || 'present',
        notes: prev[employeeId]?.notes || '',
        ...partial
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const records = employees.map((emp) => ({
        employeeId: emp._id,
        date: selectedDate,
        status: attendanceMap[emp._id]?.status || 'present',
        notes: attendanceMap[emp._id]?.notes
      }));
      await saveAttendance(records);
      await loadAttendance(selectedDate);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="text-uppercase text-muted small">People Ops</div>
          <h3 className="mb-0">Attendance</h3>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <Form.Control
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
          <Button onClick={handleSave} disabled={saving || employees.length === 0}>
            {saving ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      {summaryError && (
        <Alert variant="warning" onClose={() => setSummaryError(null)} dismissible>
          {summaryError}
        </Alert>
      )}

      <Card className="shadow-sm border-0">
        <Card.Body>
          <Row className="g-3 mb-3">
            <Col>
              <div className="text-uppercase text-muted small">Date</div>
              <div className="fw-semibold">{new Date(selectedDate).toDateString()}</div>
            </Col>
            <Col className="text-end">
              {(loadingEmployees || loadingAttendance) && <Spinner animation="border" size="sm" />}
            </Col>
          </Row>
          <Table responsive hover size="sm" className="align-middle">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const attendance = attendanceMap[employee._id] || { status: 'present' as AttendanceStatus, notes: '' };
                return (
                  <tr key={employee._id}>
                    <td>
                      <div className="fw-semibold">{employee.fullName}</div>
                      <div className="text-muted small">{employee.employeeId}</div>
                    </td>
                    <td>{employee.roleTitle}</td>
                    <td className="attendance-status-cell">
                      <div className="d-flex align-items-center gap-2">
                        <Form.Select
                          value={attendance.status}
                          onChange={(event) =>
                            updateLocalState(employee._id, { status: event.target.value as AttendanceStatus })
                          }
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="leave">On Leave</option>
                        </Form.Select>
                        <Badge bg={statusColors[attendance.status]}>{attendance.status}</Badge>
                      </div>
                    </td>
                    <td>
                      <Form.Control
                        value={attendance.notes || ''}
                        placeholder="Notes"
                        onChange={(event) => updateLocalState(employee._id, { notes: event.target.value })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {!loadingEmployees && employees.length === 0 && (
            <div className="text-center text-muted small">No employees available.</div>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0 mt-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="text-uppercase text-muted small">Monthly Snapshot</div>
              <h5 className="mb-0">{summaryMonthLabel}</h5>
            </div>
            {summaryLoading && <Spinner animation="border" size="sm" />}
          </div>
          <Table responsive hover size="sm" className="align-middle">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="text-center">Present</th>
                <th className="text-center">Absent</th>
                <th className="text-center">On Leave</th>
                <th className="text-center">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {employeeSummary.map((record) => {
                const attendanceRate = record.total > 0 ? Math.round((record.present / record.total) * 100) : 0;
                return (
                  <tr key={record.employeeMongoId}>
                    <td>
                      <div className="fw-semibold">{record.fullName || 'Unknown employee'}</div>
                      <div className="text-muted small">{record.roleTitle || record.employeeId || 'Not set'}</div>
                    </td>
                    <td className="text-center fw-semibold text-success">{record.present}</td>
                    <td className="text-center fw-semibold text-danger">{record.absent}</td>
                    <td className="text-center fw-semibold text-warning">{record.leave}</td>
                    <td className="text-center">{attendanceRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {employeeSummary.length === 0 && !summaryLoading && (
            <div className="text-center text-muted small">No attendance captured for this period.</div>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0 mt-4">
        <Card.Body>
          <div className="text-uppercase text-muted small mb-3">Year-to-date attendance</div>
          <Table responsive hover size="sm" className="align-middle">
            <thead>
              <tr>
                <th>Month</th>
                <th className="text-center">Present</th>
                <th className="text-center">Absent</th>
                <th className="text-center">On Leave</th>
                <th className="text-center">Recorded Days</th>
              </tr>
            </thead>
            <tbody>
              {normalizedMonthlyRows.map((row) => (
                <tr key={row.month}>
                  <td>{row.label}</td>
                  <td className="text-center">{row.present}</td>
                  <td className="text-center">{row.absent}</td>
                  <td className="text-center">{row.leave}</td>
                  <td className="text-center">{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <th className="text-center">{yearlyTotals.present}</th>
                <th className="text-center">{yearlyTotals.absent}</th>
                <th className="text-center">{yearlyTotals.leave}</th>
                <th className="text-center">{yearlyTotals.total}</th>
              </tr>
            </tfoot>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AttendancePage;
