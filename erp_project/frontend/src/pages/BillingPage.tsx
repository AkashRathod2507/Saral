import React, { useState, useEffect } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { axiosInstance } from '../services/http';

type Item = {
  _id: string;
  name: string;
  item_type: 'product' | 'service';
  unit_price: number;
  hsn_sac_code?: string;
  tax_rate: number;
  stock_quantity?: number;
};

const BillingPage: React.FC = () => {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  // Billing cart logic
  const [productInput, setProductInput] = useState('');
  const [quantityInput, setQuantityInput] = useState(1);
  const [cart, setCart] = useState<{ item: Item; quantity: number }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Payments (recent bills) for history — only show payments (real bills)
  const [payments, setPayments] = useState<any[]>([]);
  const [payLoading, setPayLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Fetch items and customers on mount
  useEffect(() => {
    setLoading(true);
    axiosInstance.get('/api/v1/items').then(res => {
      setAllItems((res.data.data || res.data.items || []).filter((i: Item) => i.item_type === 'product'));
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setApiError('Unable to load items');
      setLoading(false);
    });
    axiosInstance.get('/api/v1/customers').then(res => setCustomers(res.data.data || res.data.customers || [])).catch(err => {
      console.error(err);
      setApiError('Unable to load customer list');
      setCustomers([]);
    });
    // Recent bills: fetch payments (these represent actual paid bills)
    setPayLoading(true);
    axiosInstance.get('/api/v1/payments').then(res => {
      // payments endpoint returns array of payments sorted by createdAt desc
      setPayments(res.data.data || []); setPayLoading(false);
    }).catch(err => {
      console.error(err);
      setApiError('Unable to load payment history');
      setPayLoading(false);
    });
  }, []);

  // Cart/Total Calculation
  const subTotal = cart.reduce((sum, row) => sum + (row.item.unit_price * row.quantity), 0);
  const totalGST = cart.reduce((sum, row) => sum + (row.item.unit_price * row.quantity * (row.item.tax_rate || 0) / 100), 0);
  const grandTotal = subTotal + totalGST;

  // Add product to cart by HSN, name, or _id
  function handleAddToCart() {
    const found = allItems.find(i => productInput.trim() && (
      i.hsn_sac_code?.toLowerCase() === productInput.trim().toLowerCase() ||
      i._id === productInput.trim() ||
      i.name.toLowerCase() === productInput.trim().toLowerCase()
    ));
    if (!found) return setFormError('Product not found');
    if (quantityInput < 1) return setFormError('Quantity required');
    if (found.stock_quantity && quantityInput > found.stock_quantity)
      return setFormError('Insufficient stock');
    setCart(prev => {
      const idx = prev.findIndex(row => row.item._id === found._id);
      if (idx !== -1) {
        // Already in cart, update qty
        const newCart = [...prev];
        newCart[idx].quantity += quantityInput;
        return newCart;
      }
      return [...prev, { item: found, quantity: quantityInput }];
    });
    setProductInput('');
    setQuantityInput(1);
    setFormError(null);
  }

  function handleCartRemove(id: string) {
    setCart(c => c.filter(row => row.item._id !== id));
  }

  return (
    <>
      <h5 className="mb-3">Billing</h5>
      <Card className="mb-4"><Card.Body>
        {apiError && <Alert variant="danger">{apiError}</Alert>}
        <Form className="mb-3" onSubmit={e => { e.preventDefault(); handleAddToCart(); }}>
          <Row className="align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Product (HSN/ID/Name)</Form.Label>
                <Form.Control
                  type="text"
                  list="bill-product-list"
                  value={productInput}
                  autoFocus
                  onChange={e => setProductInput(e.target.value)}
                  placeholder="Enter or scan product HSN/SAC, ID, or Name" />
                <datalist id="bill-product-list">
                  {allItems.map(i => <option key={i._id} value={i.hsn_sac_code || i._id}>{i.name}</option>)}
                </datalist>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Quantity</Form.Label>
                <Form.Control
                  type="number"
                  min={1}
                  value={quantityInput}
                  onChange={e => setQuantityInput(Number(e.target.value))}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Button type="submit" disabled={loading || !productInput || quantityInput < 1} className="w-100">Add</Button>
            </Col>
          </Row>
          {formError && <Alert variant="danger" className="mt-2">{formError}</Alert>}
        </Form>
        <Table className="mb-2" responsive hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>HSN</th>
              <th>Unit Price</th>
              <th>GST(%)</th>
              <th>Quantity</th>
              <th>Subtotal</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {cart.map(row => (
              <tr key={row.item._id}>
                <td>{row.item.name}</td>
                <td>{row.item.hsn_sac_code || '-'}</td>
                <td>{row.item.unit_price}</td>
                <td>{row.item.tax_rate}</td>
                <td>{row.quantity}</td>
                <td>{(row.item.unit_price * row.quantity).toFixed(2)}</td>
                <td><Button size="sm" variant="outline-danger" onClick={() => handleCartRemove(row.item._id)}>Remove</Button></td>
              </tr>
            ))}
            {cart.length === 0 && <tr><td colSpan={7}><span className="text-muted">Cart empty</span></td></tr>}
          </tbody>
        </Table>
        <div className="mb-2">
          <strong>Subtotal:</strong> ₹ {subTotal.toFixed(2)}<br />
          <strong>GST:</strong> ₹ {totalGST.toFixed(2)}<br />
          <strong>Total:</strong> ₹ {grandTotal.toFixed(2)}
        </div>
        <Form.Group className="mb-2">
          <Form.Label>Customer (select existing)</Form.Label>
          <Form.Select title="Customer" value={selectedCustomer?._id || ''} onChange={e => {
            const c = customers.find(c => c._id === e.target.value);
            setSelectedCustomer(c || null);
            if (c) { setCustomerName(c.name || ''); setCustomerEmail(c.email || ''); setCustomerPhone(c.phone || ''); }
          }}>
            <option value="">-- New Customer --</option>
            {customers.map(c => <option value={c._id} key={c._id}>{c.name} {c.email ? `(${c.email})` : ''}</option>)}
          </Form.Select>
        </Form.Group>
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="email@example.com" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Phone</Form.Label>
              <Form.Control value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone" />
            </Form.Group>
          </Col>
        </Row>
        <Button
          disabled={cart.length < 1 || submitting || (!selectedCustomer && (!customerName || !customerEmail))}
          onClick={async () => {
            setSubmitting(true); setFormError(null);
            try {
              // 1) Resolve customer
              let customerId = selectedCustomer?._id;
              if (!customerId) {
                try {
                  const createRes = await axiosInstance.post('/api/v1/customers', { name: customerName, email: customerEmail, phone: customerPhone });
                  customerId = createRes.data?.customer?._id || createRes.data?.data?._id;
                } catch (err: any) {
                  // If duplicate email, fetch existing
                  if (err?.response?.status === 409) {
                    const existing = (customers || []).find(c => c.email === customerEmail);
                    if (existing) customerId = existing._id;
                    else throw err;
                  } else {
                    throw err;
                  }
                }
              }

              if (!customerId) throw new Error('Customer not resolved');

              // 2) Create invoice
              const invResp = await axiosInstance.post('/api/v1/invoices', {
                customer_id: customerId,
                line_items: cart.map(ci => ({ item_id: ci.item._id, quantity: ci.quantity })),
              });
              const createdInvoice = invResp.data?.data;

              // 3) Record payment using old Payment model
              await axiosInstance.post('/api/v1/payments', {
                invoice_id: createdInvoice?._id,
                amount_received: grandTotal,
                payment_mode: 'cash'
              });

              // 4) Print-friendly bill for PDF
              const billHtml = `<!doctype html><html><head><meta charset='utf-8'><title>Bill ${createdInvoice?.invoice_number || ''}</title></head><body>
                <h3>Invoice ${createdInvoice?.invoice_number || ''}</h3>
                <div>Customer: ${customerName || selectedCustomer?.name || ''}</div>
                <div>Email: ${customerEmail || selectedCustomer?.email || ''}</div>
                <div>Phone: ${customerPhone || selectedCustomer?.phone || ''}</div>
                <hr />
                <table border='1' cellspacing='0' cellpadding='6'>
                  <thead><tr><th>Name</th><th>HSN</th><th>Price</th><th>GST%</th><th>Qty</th><th>Subtotal</th></tr></thead>
                  <tbody>
                    ${cart.map(ci => `<tr><td>${ci.item.name}</td><td>${ci.item.hsn_sac_code || ''}</td><td>${ci.item.unit_price}</td><td>${ci.item.tax_rate}</td><td>${ci.quantity}</td><td>${(ci.item.unit_price * ci.quantity).toFixed(2)}</td></tr>`).join('')}
                  </tbody>
                </table>
                <div style='margin-top:8px'>Subtotal: ₹ ${subTotal.toFixed(2)}</div>
                <div>GST: ₹ ${totalGST.toFixed(2)}</div>
                <div><strong>Total: ₹ ${grandTotal.toFixed(2)}</strong></div>
                <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); }</script>
              </body></html>`;
              const w = window.open('', '_blank');
              if (w) { w.document.write(billHtml); w.document.close(); }

              // Cleanup and refresh
              setCart([]);
              setSelectedCustomer(null);
              setCustomerName(''); setCustomerEmail(''); setCustomerPhone('');
              setFormError(null);
              // refresh recent payments list
              setPayLoading(true);
              axiosInstance.get('/api/v1/payments').then(res => {
                setPayments(res.data.data || []); setPayLoading(false);
              }).catch(() => setPayLoading(false));
            } catch (e: any) {
              console.error(e);
              setFormError(e?.response?.data?.message || e?.message || 'Billing failed');
            } finally {
              setSubmitting(false);
            }
          }}>
          {submitting ? 'Billing...' : 'Checkout / Bill Now'}
        </Button>
        {formError && <Alert variant="danger" className="mt-2">{formError}</Alert>}
      </Card.Body></Card>
      <Card className="shadow-sm">
        <Card.Body>
          <h6>Recent Bills</h6>
            {payLoading && <Spinner size="sm" />} 
            {!payLoading && payments.length === 0 && <span className="text-muted">No payments yet.</span>}
            {payments.length > 0 && (
              <Table className="mb-0" responsive hover>
                <thead>
                  <tr><th>Invoice #</th><th>Customer</th><th>Amount</th><th>Mode</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map(p => (
                    <tr key={p._id}>
                      <td>{p.invoice_id?.invoice_number || (p.invoice_id?.invoiceNumber || '')}</td>
                      <td>{p.customer_id?.name || (p.customer_id?.name || '')}</td>
                      <td>₹ {Number(p.amount_received || p.amount || 0).toFixed(2)}</td>
                      <td>{p.payment_mode || p.paymentMethod || '-'}</td>
                      <td>{p.payment_date ? new Date(p.payment_date).toLocaleString() : new Date(p.createdAt || p.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
        </Card.Body>
      </Card>
    </>
  );
};

export default BillingPage;


