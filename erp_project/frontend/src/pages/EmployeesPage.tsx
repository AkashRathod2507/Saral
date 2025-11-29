import React from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/employees';
import { fetchAttendanceEmployeeSummary } from '../services/attendance';
import type { EmployeeRecord } from '../services/employees';
import type { EmployeeAttendanceSummary } from '../services/attendance';

const defaultForm = {
  fullName: '',
  roleTitle: '',
  email: '',
  phone: '',
  salary: '',
  joiningDate: '',
  status: 'active',
  notes: ''
};

const statusVariant = (status: string) => {
  switch (status) {
    case 'inactive':
      return 'secondary';
    case 'probation':
      return 'warning';
    default:
      return 'success';
  }
};

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = React.useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [formState, setFormState] = React.useState(defaultForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [summaryMonth, setSummaryMonth] = React.useState(() => new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = React.useState<EmployeeAttendanceSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);

  const loadEmployees = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchEmployees();
      setEmployees(response?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const loadSummary = React.useCallback(async () => {
    if (!summaryMonth) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await fetchAttendanceEmployeeSummary({ month: summaryMonth });
      setSummary(data?.totals || []);
    } catch (err: any) {
      setSummaryError(err?.response?.data?.message || err?.message || 'Unable to load attendance summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryMonth]);

  React.useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const summaryLookup = React.useMemo(() => {
    const map = new Map<string, EmployeeAttendanceSummary>();
    summary.forEach((item) => {
      if (item.employeeMongoId) map.set(item.employeeMongoId, item);
    });
    return map;
  }, [summary]);

  const headcount = employees.length;
  const totalPresent = summary.reduce((acc, record) => acc + record.present, 0);
  const totalAbsent = summary.reduce((acc, record) => acc + record.absent, 0);
  const totalLeave = summary.reduce((acc, record) => acc + record.leave, 0);
  const avgAttendance = summary.length
    ? Math.round(
        summary.reduce((acc, item) => acc + (item.total > 0 ? (item.present / item.total) * 100 : 0), 0) /
          summary.length
      )
    : 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        fullName: formState.fullName,
        roleTitle: formState.roleTitle,
        email: formState.email || undefined,
        phone: formState.phone || undefined,
        salary: formState.salary ? Number(formState.salary) : undefined,
        joiningDate: formState.joiningDate,
        status: formState.status as 'active' | 'inactive' | 'probation',
        notes: formState.notes || undefined
      };
      if (editingId) {
        await updateEmployee(editingId, payload);
      } else {
        await createEmployee(payload);
      }
      setShowModal(false);
      setEditingId(null);
      setFormState(defaultForm);
      await loadEmployees();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: EmployeeRecord) => {
    setEditingId(record._id);
    setFormState({
      fullName: record.fullName,
      roleTitle: record.roleTitle,
      email: record.email || '',
      phone: record.phone || '',
      salary: record.salary?.toString() || '',
      joiningDate: record.joiningDate?.slice(0, 10) || '',
      status: record.status ?? 'active',
      notes: record.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this employee?')) return;
    setError(null);
    try {
      await deleteEmployee(id);
      await loadEmployees();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to delete employee');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormState({ ...defaultForm, joiningDate: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  return (
    <div className="p-3">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center mb-4">
        <div>
          <div className="text-uppercase text-muted small">People Ops</div>
          <h3 className="mb-1">Employees</h3>
          <div className="text-muted small">Track roster and monthly attendance health</div>
        </div>
        <div className="d-flex flex-column flex-md-row gap-2">
          <Form.Control
            type="month"
            value={summaryMonth}
            onChange={(event) => setSummaryMonth(event.target.value)}
          />
          <Button onClick={openCreateModal}>Add Employee</Button>
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

      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="text-uppercase text-muted small">Headcount</div>
              <div className="display-6 fw-semibold mb-0">{headcount}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="text-uppercase text-muted small">Avg Attendance</div>
              <div className="display-6 fw-semibold mb-0">{avgAttendance}%</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="text-uppercase text-muted small">Present Days</div>
              <div className="display-6 fw-semibold mb-0">{totalPresent}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="text-uppercase text-muted small">Absent / Leave</div>
              <div className="display-6 fw-semibold mb-0">
                {totalAbsent}
                <span className="text-muted fs-6"> / {totalLeave}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="text-uppercase text-muted small">Team</div>
            {(loading || summaryLoading) && <Spinner animation="border" size="sm" />}
          </div>
          <Table responsive hover size="sm" className="align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Salary</th>
                <th>Joining</th>
                <th>Status</th>
                <th className="text-center">Present</th>
                <th className="text-center">Absent</th>
                <th className="text-center">Leave</th>
                <th className="text-center">Att %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id}>
                  <td className="fw-semibold">{employee.employeeId}</td>
                  <td>{employee.fullName}</td>
                  <td>{employee.roleTitle}</td>
                  <td>₹ {employee.salary?.toLocaleString('en-IN') ?? '-'}</td>
                  <td>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <Badge bg={statusVariant(employee.status ?? 'active')} className="text-uppercase">
                      {employee.status ?? 'active'}
                    </Badge>
                  </td>
                  {(() => {
                    const record = summaryLookup.get(employee._id);
                    const rate = record && record.total > 0 ? Math.round((record.present / record.total) * 100) : 0;
                    return (
                      <>
                        <td className="text-center fw-semibold text-success">{record?.present ?? 0}</td>
                        <td className="text-center fw-semibold text-danger">{record?.absent ?? 0}</td>
                        <td className="text-center text-warning fw-semibold">{record?.leave ?? 0}</td>
                        <td className="text-center">{record ? `${rate}%` : '—'}</td>
                      </>
                    );
                  })()}
                  <td className="text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <Button size="sm" variant="outline-secondary" onClick={() => handleEdit(employee)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete(employee._id)}>
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {!loading && employees.length === 0 && <div className="text-center text-muted small">No employees yet.</div>}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingId ? 'Edit Employee' : 'Add Employee'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group controlId="emp-name">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    required
                    value={formState.fullName}
                    onChange={(e) => setFormState((prev) => ({ ...prev, fullName: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group controlId="emp-role">
                  <Form.Label>Role Title</Form.Label>
                  <Form.Control
                    required
                    value={formState.roleTitle}
                    onChange={(e) => setFormState((prev) => ({ ...prev, roleTitle: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="emp-email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="emp-phone">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    value={formState.phone}
                    onChange={(e) => setFormState((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="emp-salary">
                  <Form.Label>Salary (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={formState.salary}
                    onChange={(e) => setFormState((prev) => ({ ...prev, salary: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="emp-joining">
                  <Form.Label>Joining Date</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={formState.joiningDate}
                    onChange={(e) => setFormState((prev) => ({ ...prev, joiningDate: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="emp-status">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formState.status}
                    onChange={(e) => setFormState((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="probation">Probation</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group controlId="emp-notes">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formState.notes}
                    onChange={(e) => setFormState((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeesPage;
