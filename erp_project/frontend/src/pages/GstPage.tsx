import React from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import {
  fetchGstReturns,
  generateGstReturn,
  updateGstReturnStatus,
  fetchGstDraftPreview,
  searchGstTransactions
} from '../services/gst';
import type {
  GstReturnSummary,
  GstReturnStatus,
  GstReturnType,
  GstDraftPreview,
  GstDraftInvoicePreview
} from '../services/gst';

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const STATUS_VARIANTS: Record<GstReturnStatus, string> = {
  draft: 'secondary',
  submitted: 'info',
  filed: 'primary',
  paid: 'success'
};

const RETURN_TYPES: GstReturnType[] = ['GSTR1', 'GSTR3B', 'ANNUAL'];
const STATUS_OPTIONS: GstReturnStatus[] = ['draft', 'submitted', 'filed', 'paid'];

const monthInputDefault = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const GstPage: React.FC = () => {
  const [entries, setEntries] = React.useState<GstReturnSummary[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const limit = 10;
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formState, setFormState] = React.useState({ period: monthInputDefault(), returnType: 'GSTR1' as GstReturnType });
  const [generating, setGenerating] = React.useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = React.useState<string | null>(null);
  const [draftPeriod, setDraftPeriod] = React.useState(monthInputDefault());
  const [draft, setDraft] = React.useState<GstDraftPreview | null>(null);
  const [draftLoading, setDraftLoading] = React.useState(false);
  const [transactions, setTransactions] = React.useState<GstDraftInvoicePreview[]>([]);
  const [transactionFilters, setTransactionFilters] = React.useState({ q: '', treatment: 'all', status: 'all' });
  const [appliedFilters, setAppliedFilters] = React.useState({ q: '', treatment: 'all', status: 'all' });
  const [transactionsLoading, setTransactionsLoading] = React.useState(false);

  const loadReturns = React.useCallback(async (pageOverride?: number) => {
    setLoading(true);
    setError(null);
    try {
      const targetPage = pageOverride ?? page;
      const response = await fetchGstReturns({ page: targetPage, limit });
      setEntries(response?.data ?? []);
      setTotal(response?.total ?? 0);
      if (typeof pageOverride === 'number' && pageOverride !== page) {
        setPage(pageOverride);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load GST returns');
    } finally {
      setLoading(false);
    }
  }, [page]);

  React.useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const loadDraft = React.useCallback(async () => {
    setDraftLoading(true);
    setError(null);
    try {
      const data = await fetchGstDraftPreview({ period: draftPeriod });
      setDraft(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to prepare GST draft');
    } finally {
      setDraftLoading(false);
    }
  }, [draftPeriod]);

  const loadTransactions = React.useCallback(async () => {
    setTransactionsLoading(true);
    setError(null);
    try {
      const data = await searchGstTransactions({
        period: draftPeriod,
        q: appliedFilters.q || undefined,
        treatment: appliedFilters.treatment,
        status: appliedFilters.status,
        limit: 100
      });
      setTransactions(data.results || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to fetch GST transactions');
    } finally {
      setTransactionsLoading(false);
    }
  }, [draftPeriod, appliedFilters]);

  React.useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  React.useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const latestReturn = React.useMemo(() => entries.at(0), [entries]);

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGenerating(true);
    setError(null);
    try {
      await generateGstReturn({ period: formState.period, returnType: formState.returnType });
      await loadReturns(1);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate GST summary');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (id: string, status: GstReturnStatus) => {
    setStatusUpdatingId(id);
    setError(null);
    try {
      await updateGstReturnStatus(id, { status });
      await loadReturns();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to update status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="text-uppercase text-muted small">Compliance</div>
          <h3 className="mb-0">GST Filing Console</h3>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={() => loadReturns()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Row className="g-4 mb-4">
        <Col lg={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="text-uppercase text-muted small mb-3">Generate Summary</div>
              <Form onSubmit={handleGenerate}>
                <Form.Group className="mb-3" controlId="gst-period">
                  <Form.Label className="small">Period</Form.Label>
                  <Form.Control
                    type="month"
                    required
                    value={formState.period}
                    onChange={(event) => setFormState((prev) => ({ ...prev, period: event.target.value }))}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="gst-return-type">
                  <Form.Label className="small">Return Type</Form.Label>
                  <Form.Select
                    value={formState.returnType}
                    onChange={(event) => setFormState((prev) => ({ ...prev, returnType: event.target.value as GstReturnType }))}
                  >
                    {RETURN_TYPES.map((variant) => (
                      <option key={variant} value={variant}>
                        {variant}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Button type="submit" className="w-100" disabled={generating}>
                  {generating ? <Spinner animation="border" size="sm" /> : 'Prepare Summary'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={8}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div className="text-uppercase text-muted small">Latest Snapshot</div>
                  <h5 className="mb-0">{latestReturn ? `Period ${latestReturn.period}` : 'No filings yet'}</h5>
                </div>
                {latestReturn && (
                  <Badge bg={STATUS_VARIANTS[latestReturn.status]}>{latestReturn.status}</Badge>
                )}
              </div>
              {latestReturn ? (
                <Row className="g-3 text-muted small">
                  <Col sm={6} md={3}>
                    <div className="text-uppercase">Taxable Value</div>
                    <div className="fw-semibold text-dark">{formatCurrency(latestReturn.total_taxable_value)}</div>
                  </Col>
                  <Col sm={6} md={3}>
                    <div className="text-uppercase">Tax</div>
                    <div className="fw-semibold text-dark">{formatCurrency(latestReturn.total_tax)}</div>
                  </Col>
                  <Col sm={6} md={3}>
                    <div className="text-uppercase">Invoices</div>
                    <div className="fw-semibold text-dark">{latestReturn.total_invoices}</div>
                  </Col>
                  <Col sm={6} md={3}>
                    <div className="text-uppercase">Collections</div>
                    <div className="fw-semibold text-dark">{formatCurrency(latestReturn.payments_received)}</div>
                  </Col>
                </Row>
              ) : (
                <div className="text-muted">Run your first GST summary to populate compliance insights.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
            <div>
              <div className="text-uppercase text-muted small">Draft Builder</div>
              <h5 className="mb-0">Period {draft?.period ?? draftPeriod}</h5>
            </div>
            <div className="d-flex gap-2">
              <Form.Control type="month" value={draftPeriod} onChange={(event) => setDraftPeriod(event.target.value)} />
              <Button variant="outline-secondary" onClick={loadDraft} disabled={draftLoading}>
                {draftLoading ? <Spinner animation="border" size="sm" /> : 'Refresh Draft'}
              </Button>
            </div>
          </div>
          {draft ? (
            <Row className="g-3">
              <Col md={4}>
                <Card className="border-0 bg-light h-100">
                  <Card.Body>
                    <div className="text-uppercase text-muted small">Taxable Value</div>
                    <div className="fs-3 fw-semibold">{formatCurrency(draft.totals.taxableValue)}</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="border-0 bg-light h-100">
                  <Card.Body>
                    <div className="text-uppercase text-muted small">Tax Liability</div>
                    <div className="fs-3 fw-semibold">{formatCurrency(draft.totals.tax)}</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="border-0 bg-light h-100">
                  <Card.Body>
                    <div className="text-uppercase text-muted small">Documents</div>
                    <div className="fs-3 fw-semibold">{draft.totals.invoices}</div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ) : (
            <div className="text-muted">No draft data yet. Generate a summary first.</div>
          )}
        </Card.Body>
      </Card>

      {draft && (
        <Row className="g-4 mb-4">
          {Object.entries(draft.sections).map(([key, section]) => (
            <Col md={6} lg={3} key={key}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Body>
                  <div className="text-uppercase text-muted small">{section.label}</div>
                  <div className="display-6 fw-semibold mb-2">{section.count}</div>
                  <div className="text-muted small">Taxable {formatCurrency(section.taxableValue)}</div>
                  <div className="text-muted small">Tax {formatCurrency(section.tax)}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
            <div>
              <div className="text-uppercase text-muted small">Transaction Review</div>
              <h5 className="mb-0">Invoice register for {draft?.period ?? draftPeriod}</h5>
            </div>
            <div className="d-flex flex-column flex-md-row gap-2">
              <Form.Control
                placeholder="Search invoice or GSTIN"
                value={transactionFilters.q}
                onChange={(event) => setTransactionFilters((prev) => ({ ...prev, q: event.target.value }))}
              />
              <Form.Select
                value={transactionFilters.treatment}
                onChange={(event) => setTransactionFilters((prev) => ({ ...prev, treatment: event.target.value }))}
              >
                <option value="all">All Types</option>
                <option value="b2b">B2B</option>
                <option value="b2c">B2C</option>
                <option value="export">Export</option>
                <option value="sez">SEZ</option>
              </Form.Select>
              <Form.Select
                value={transactionFilters.status}
                onChange={(event) => setTransactionFilters((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="all">Any Status</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </Form.Select>
              <Button
                variant="outline-secondary"
                onClick={() => setAppliedFilters(transactionFilters)}
                disabled={transactionsLoading}
              >
                {transactionsLoading ? <Spinner animation="border" size="sm" /> : 'Apply'}
              </Button>
            </div>
          </div>
          <Table responsive hover size="sm" className="align-middle">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Customer</th>
                <th>GSTIN</th>
                <th>Type</th>
                <th className="text-end">Taxable</th>
                <th className="text-end">Tax</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.invoiceNumber}>
                  <td className="fw-semibold">{txn.invoiceNumber}</td>
                  <td>{txn.invoiceDate ? new Date(txn.invoiceDate).toLocaleDateString() : '-'}</td>
                  <td>{txn.customerName}</td>
                  <td>{txn.customerGSTIN || 'N/A'}</td>
                  <td>{txn.gstTreatment}</td>
                  <td className="text-end">{formatCurrency(txn.subTotal)}</td>
                  <td className="text-end">{formatCurrency(txn.taxAmount)}</td>
                  <td className="text-end">{formatCurrency((txn.grandTotal ?? (txn.subTotal + txn.taxAmount)))}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          {!transactionsLoading && transactions.length === 0 && (
            <div className="text-center text-muted small">No transactions match the filters.</div>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="text-uppercase text-muted small">Filings</div>
              <h5 className="mb-0">{total} record{total === 1 ? '' : 's'}</h5>
            </div>
          </div>
          <Table responsive hover size="sm" className="align-middle">
            <thead>
              <tr>
                <th>Period</th>
                <th>Return</th>
                <th>Taxable Value</th>
                <th>Tax</th>
                <th>Invoices</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id}>
                  <td className="fw-semibold">{entry.period}</td>
                  <td>{entry.return_type}</td>
                  <td>{formatCurrency(entry.total_taxable_value)}</td>
                  <td>{formatCurrency(entry.total_tax)}</td>
                  <td>{entry.total_invoices}</td>
                  <td>
                    <Badge bg={STATUS_VARIANTS[entry.status]} className="text-uppercase">
                      {entry.status}
                    </Badge>
                  </td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={entry.status}
                      onChange={(event) => handleStatusChange(entry._id, event.target.value as GstReturnStatus)}
                      disabled={statusUpdatingId === entry._id}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Form.Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {loading && <div className="text-center text-muted small">Loading filings...</div>}
          {!loading && entries.length === 0 && <div className="text-center text-muted small">No GST filings yet.</div>}
        </Card.Body>
      </Card>
    </div>
  );
};

export default GstPage;
