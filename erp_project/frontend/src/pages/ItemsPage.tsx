import React, { useState } from 'react';
import { Alert, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../services/http';

type Item = {
  _id: string;
  name: string;
  item_type: 'product' | 'service';
  unit_price: number;
  hsn_sac_code?: string;
  tax_rate: number;
};

const ItemsPage: React.FC = () => {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const itemsQuery = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/v1/items');
      return res.data.data || res.data.items; // controller returns ApiResponse with data
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Item, '_id'>) => {
      const res = await axiosInstance.post('/api/v1/items', payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      setShowCreate(false);
    },
    onError: (e: any) => setApiError(e?.response?.data?.message || 'Failed to create item')
  });

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Items</h5>
        <Button onClick={() => { setApiError(null); setShowCreate(true); }}>Add Item</Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          {itemsQuery.isLoading && <div className="py-5 text-center"><Spinner /></div>}
          {itemsQuery.error && <Alert variant="danger">Failed to load items</Alert>}
          {Array.isArray(itemsQuery.data) && itemsQuery.data.length === 0 && <div className="text-muted">No items yet.</div>}
          {Array.isArray(itemsQuery.data) && itemsQuery.data.length > 0 && (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Unit Price</th>
                  <th>HSN/SAC</th>
                  <th>Tax Rate</th>
                </tr>
              </thead>
              <tbody>
                {itemsQuery.data.map((it: Item) => (
                  <tr key={it._id}>
                    <td>{it.name}</td>
                    <td className="text-capitalize">{it.item_type}</td>
                    <td>₹ {Number(it.unit_price).toFixed(2)}</td>
                    <td>{it.hsn_sac_code || '-'}</td>
                    <td>{it.tax_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {apiError && <Alert variant="danger">{apiError}</Alert>}
          <CreateItemForm onSubmit={(payload) => createMutation.mutate(payload)} submitting={createMutation.isPending} />
        </Modal.Body>
      </Modal>
    </>
  );
};

const CreateItemForm: React.FC<{ onSubmit: (p: Omit<Item, '_id'>) => void; submitting: boolean }> = ({ onSubmit, submitting }) => {
  const [name, setName] = useState('');
  const [itemType, setItemType] = useState<'product' | 'service'>('product');
  const [unitPrice, setUnitPrice] = useState('');
  const [hsn, setHsn] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [initialStock, setInitialStock] = useState('0');

  return (
    <Form onSubmit={(e) => {
      e.preventDefault();
      const payload = {
        name,
        item_type: itemType,
        unit_price: Number(unitPrice || '0'),
        hsn_sac_code: hsn,
        tax_rate: Number(taxRate || '0'),
        stock_quantity: Number(initialStock || '0')
      } as Omit<Item, '_id'>;
      onSubmit(payload);
    }}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control value={name} onChange={(e) => setName(e.target.value)} required />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="item_type">Type</Form.Label>
            <Form.Select id="item_type" aria-label="Item type" title="Item type" value={itemType} onChange={(e) => setItemType(e.target.value as 'product' | 'service')}>
              <option value="product">Product</option>
              <option value="service">Service</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Unit Price</Form.Label>
            <Form.Control type="number" step="0.01" placeholder="0.00" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Tax Rate (%)</Form.Label>
            <Form.Control type="number" step="0.01" placeholder="0" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} required />
          </Form.Group>
        </Col>
      </Row>
      <Form.Group className="mb-3">
        <Form.Label>HSN / SAC</Form.Label>
        <Form.Control value={hsn} onChange={(e) => setHsn(e.target.value)} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Initial Stock (optional)</Form.Label>
        <Form.Control type="number" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} />
      </Form.Group>
      <div className="d-grid">
        <Button type="submit" disabled={submitting} className="py-2">{submitting && <Spinner size="sm" className="me-2" />}Create</Button>
      </div>
    </Form>
  );
};

export { CreateItemForm };

export default ItemsPage;


