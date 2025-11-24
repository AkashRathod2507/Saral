import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { axiosInstance } from '../services/http';
import { useMutation } from '@tanstack/react-query';
import { CreateItemForm } from './ItemsPage';
import { InventoryUpload } from '../components/inventory/InventoryUpload';

const PAGE_SIZE = 10;

type Item = {
  _id: string;
  name: string;
  item_type: 'product' | 'service';
  unit_price: number;
  hsn_sac_code?: string;
  tax_rate: number;
  stock_quantity?: number;
};

const InventoryPage: React.FC = () => {
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedForStock, setSelectedForStock] = useState<Item | null>(null);
  const [stockAmount, setStockAmount] = useState<number>(0);
  const [stockReason, setStockReason] = useState<string>('purchase');
  const [opError, setOpError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/v1/items');
      const products = (res.data.data || res.data.items || []).filter((i: Item) => i.item_type === 'product');
      setAllItems(products);
      setItems(products.slice(0, PAGE_SIZE));
      setPage(0);
    } catch (e: any) {
      setApiError('Failed to load inventory');
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  // Refetch items when CSV upload completes
  const handleUploadSuccess = () => {
    fetchItems();
  };

  useEffect(() => {
    // Filter and page on search or page change
    let filtered = allItems;
    if (search.trim()) {
      filtered = allItems.filter(
        i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.hsn_sac_code || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    setItems(filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE));
  }, [allItems, page, search]);

  // --- PRODUCT CREATION MUTATION ---
  const createMutation = useMutation({
    mutationFn: async (payload: Omit<Item, '_id'>) => {
      const res = await axiosInstance.post('/api/v1/items', payload);
      return res.data;
    },
    onSuccess: () => {
      setShowCreateItem(false);
      setCreateError(null);
      fetchItems();
    },
    onError: (e: any) => setCreateError(e?.response?.data?.message || 'Failed to create product')
  });

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Inventory</h5>
        <Button onClick={() => { setShowCreateItem(true); setCreateError(null); }}>Add Product</Button>
      </div>
      <InventoryUpload onSuccess={handleUploadSuccess} />
      <Form className="mb-3">
        <Form.Control type="text" placeholder="Search by name or HSN/SAC" value={search} onChange={e => setSearch(e.target.value)} />
      </Form>
      <Card className="shadow-sm">
        <Card.Body>
          {loading && <div className="py-5 text-center"><Spinner /></div>}
          {apiError && <Alert variant="danger">{apiError}</Alert>}
          {!loading && !apiError && items.length === 0 && <div className="text-muted">No products found.</div>}
          {items.length > 0 && (
            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>HSN/SAC</th>
                  <th>Unit Price</th>
                  <th>Stock</th>
                  <th>Tax Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i._id}>
                    <td>{i.name}</td>
                    <td>{i.hsn_sac_code || '-'}</td>
                    <td>₹ {Number(i.unit_price).toFixed(2)}</td>
                    <td>{i.stock_quantity ?? '-'}</td>
                    <td>{i.tax_rate}%</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button size="sm" onClick={() => { setSelectedForStock(i); setStockAmount(1); setStockReason('purchase'); setShowAddStock(true); setOpError(null); }}>Add Stock</Button>
                        <Button size="sm" variant="outline-danger" onClick={async () => {
                          if (!confirm('Delete this product? This will remove it from items and inventory.')) return;
                          try {
                            await axiosInstance.delete(`/api/v1/items/${i._id}`);
                            fetchItems();
                          } catch (e: any) {
                            setOpError(e?.response?.data?.message || 'Delete failed');
                          }
                        }}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {/* Pagination */}
          <div className="d-flex gap-2 justify-content-end mt-3">
            <Button size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button size="sm" disabled={(page + 1) * PAGE_SIZE >= (search ? allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.hsn_sac_code || '').toLowerCase().includes(search.toLowerCase())).length : allItems.length)} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </Card.Body>
      </Card>
      <Modal show={showCreateItem} onHide={() => setShowCreateItem(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createError && <Alert variant="danger">{createError}</Alert>}
          <CreateItemForm
            onSubmit={payload => createMutation.mutate(payload)}
            submitting={createMutation.isPending}
          />
        </Modal.Body>
      </Modal>
      {/* Add Stock Modal */}
      <Modal show={showAddStock} onHide={() => setShowAddStock(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {opError && <Alert variant="danger">{opError}</Alert>}
          <Form onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedForStock) return;
            try {
              await axiosInstance.post('/api/v1/inventory/adjust', { item_id: selectedForStock._id, quantity_change: Number(stockAmount), reason: stockReason });
              setShowAddStock(false);
              setSelectedForStock(null);
              fetchItems();
            } catch (err: any) {
              setOpError(err?.response?.data?.message || 'Failed to update stock');
            }
          }}>
            <Form.Group className="mb-3">
              <Form.Label>Product</Form.Label>
              <Form.Control readOnly value={selectedForStock?.name || ''} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantity to add</Form.Label>
              <Form.Control type="number" min={1} value={stockAmount} onChange={e => setStockAmount(Number(e.target.value))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Select title="Stock movement reason" value={stockReason} onChange={e => setStockReason(e.target.value)}>
                <option value="purchase">Purchase</option>
                <option value="adjustment">Adjustment</option>
                <option value="correction">Correction</option>
              </Form.Select>
            </Form.Group>
            <div className="d-grid">
              <Button type="submit">Add Stock</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default InventoryPage;


