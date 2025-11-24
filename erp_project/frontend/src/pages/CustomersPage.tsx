import React, { useState } from 'react';
import { Alert, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../services/http';

type Customer = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
};

const CustomersPage: React.FC = () => {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/customers');
      return res.data.customers as Customer[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Customer, '_id'>) => {
      const res = await axiosInstance.post('/api/v1/customers', payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setShowCreate(false);
    },
    onError: (e: any) => setApiError(e?.response?.data?.message || 'Failed to create customer')
  });

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Customers</h5>
        <Button onClick={() => { setApiError(null); setShowCreate(true); }}>Add Customer</Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          {customersQuery.isLoading && <div className="py-5 text-center"><Spinner /></div>}
          {customersQuery.error && <Alert variant="danger">Failed to load customers</Alert>}
          {customersQuery.data && customersQuery.data.length === 0 && <div className="text-muted">No customers yet.</div>}
          {customersQuery.data && customersQuery.data.length > 0 && (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {customersQuery.data.map(c => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {apiError && <Alert variant="danger">{apiError}</Alert>}
          <CreateCustomerForm onSubmit={(payload) => createMutation.mutate(payload)} submitting={createMutation.isPending} />
        </Modal.Body>
      </Modal>
    </>
  );
};

const CreateCustomerForm: React.FC<{ onSubmit: (p: Omit<Customer, '_id'>) => void; submitting: boolean }> = ({ onSubmit, submitting }) => {
  const [form, setForm] = useState<Omit<Customer, '_id'>>({ name: '', email: '', phone: '', address: '' });
  return (
    <Form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Form.Group>
        </Col>
      </Row>
      <div className="d-grid">
        <Button type="submit" disabled={submitting} className="py-2">{submitting && <Spinner size="sm" className="me-2" />}Create</Button>
      </div>
    </Form>
  );
};

export default CustomersPage;


