import React, { useEffect, useState } from 'react';
import { Table, Spinner, Alert, Form, Row, Col, Pagination } from 'react-bootstrap';
import { axiosInstance } from '../services/http';

const InvoicesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosInstance.get('/api/v1/invoices', { params: { page, limit, status: status || undefined } })
      .then(res => {
        const d = res.data?.data;
        setInvoices(d?.data || []);
        setTotal(d?.total || 0);
      })
      .catch(err => {
        console.error(err);
        setError(err?.response?.data?.message || 'Failed to load invoices');
      })
      .finally(() => setLoading(false));
  }, [page, limit, status]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <Row className="align-items-end mb-3">
        <Col><h5 className="mb-0">Invoices</h5></Col>
        <Col xs="auto">
          <Form.Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All Status</option>
            <option>Draft</option>
            <option>Sent</option>
            <option>Paid</option>
            <option>Overdue</option>
            <option>Cancelled</option>
          </Form.Select>
        </Col>
      </Row>

      {error && <Alert variant="danger" className="mb-2">{error}</Alert>}
      {loading ? <Spinner animation="border" /> : (
        <>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted">No invoices yet.</td></tr>
              )}
              {invoices.map(inv => (
                <tr key={inv._id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}</td>
                  <td>{inv.customerId?.name || inv.customerName || ''}</td>
                  <td>{inv.status}</td>
                  <td>{Number(inv.grandTotal || 0).toFixed(2)}</td>
                  <td>{Number(inv.amountPaid || 0).toFixed(2)}</td>
                  <td>{Number(inv.balanceDue || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination className="mb-0">
            <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
            <Pagination.Prev onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
            <Pagination.Item active>{page}</Pagination.Item>
            <Pagination.Next onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
            <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
          </Pagination>
        </>
      )}
    </div>
  );
};

export default InvoicesPage;







