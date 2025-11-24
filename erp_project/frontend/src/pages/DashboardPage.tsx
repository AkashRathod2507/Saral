import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Spinner, Alert, Table, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../services/http';
import DashboardChart from '../components/dashboard/DashboardChart';

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const navigate = useNavigate();

  useEffect(() => {
    const now = new Date();
    let from: string | undefined;
    let to: string | undefined;
    if (range === 'today') {
      const d = new Date(); d.setHours(0,0,0,0);
      from = d.toISOString().slice(0,10);
      to = new Date().toISOString().slice(0,10);
    } else if (range === 'week') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      from = d.toISOString().slice(0,10);
      to = now.toISOString().slice(0,10);
    } else if (range === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      from = d.toISOString().slice(0,10);
      to = now.toISOString().slice(0,10);
    }

    setLoading(true);
    setError(null);
    axiosInstance.get('/api/v1/dashboard', { params: { from, to } })
      .then(res => setData(res.data.data || {}))
      .catch(err => setError(err?.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));

    // fetch timeseries (invoices revenue by day) - optional endpoint
    axiosInstance.get('/api/v1/dashboard/timeseries', { params: { from, to } })
      .then(res => setTimeseries(res.data.data?.timeseries || []))
      .catch(() => setTimeseries([]));
  }, [range]);

  return (
    <>
      <Row className="align-items-center mb-3">
        <Col><h2 className="mb-0">Dashboard</h2></Col>
        <Col xs="auto">
          <Form.Group controlId="dash-range" className="d-flex align-items-center gap-2 mb-0">
            <Form.Label id="dash-range-label" className="mb-0">Range</Form.Label>
            <Form.Select aria-labelledby="dash-range-label" aria-label="Date range" title="Date range" value={range} onChange={e => setRange(e.target.value as any)}>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? <Spinner animation="border" /> : (
        <>
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="shadow-sm h-100"><Card.Body>
                <div className="text-muted small">Customers</div>
                <div className="display-6">{data?.Customer?.count ?? '—'}</div>
              </Card.Body></Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm h-100"><Card.Body>
                <div className="text-muted small">Items</div>
                <div className="display-6">{data?.Item?.count ?? '—'}</div>
              </Card.Body></Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm h-100"><Card.Body>
                <div className="text-muted small">Invoices</div>
                <div className="display-6">{data?.sales?.total ?? '—'}</div>
              </Card.Body></Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm h-100"><Card.Body>
                <div className="text-muted small">Revenue</div>
                <div className="display-6">₹ {Number(data?.sales?.revenue || 0).toFixed(2)}</div>
              </Card.Body></Card>
            </Col>
          </Row>

          <Card className="shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h5 className="mb-0">Model Overview</h5>
              </div>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Count</th>
                    <th>Key Sums</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data || {}).filter(([k]) => !['sales','payments','inventory'].includes(k)).map(([name, val]: any) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{(val as any)?.count || 0}</td>
                      <td>
                        {(val as any)?.sums ? Object.entries((val as any).sums).map(([k,v]: any) => (
                          <span key={k} className="me-3">{k}: {Number(v).toFixed(2)}</span>
                        )) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Charts row */}
          <Row className="g-3 mb-4">
            <Col lg={6}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="mb-0">Revenue (trend)</h5>
                    <small className="text-muted">Click a point to view invoices</small>
                  </div>
                  {timeseries.length ? (
                    <DashboardChart
                      type="line"
                      data={{
                        labels: timeseries.map(t => t.date),
                        datasets: [
                          {
                            label: 'Revenue',
                            data: timeseries.map(t => Number(t.revenue || 0)),
                            borderColor: 'rgba(54,162,235,1)',
                            backgroundColor: 'rgba(54,162,235,0.2)',
                            tension: 0.2,
                          }
                        ]
                      }}
                      options={{
                        scales: { x: { type: 'time', time: { unit: 'day' } } }
                      }}
                      onElementClick={({ elements }) => {
                        if (!elements || !elements.length) return;
                        const el = elements[0];
                        // element index -> date label
                        const idx = el.index ?? el.datasetIndex ?? 0;
                        const date = timeseries[idx]?.date;
                        if (date) navigate(`/app/invoices?date=${encodeURIComponent(date)}`);
                      }}
                    />
                  ) : (
                    <div className="text-muted">No timeseries available for selected range.</div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h5 className="mb-0">Breakdown</h5>
                    <div className="small text-muted">Toggle legend to show/hide</div>
                  </div>
                  <DashboardChart
                    type="doughnut"
                    data={{
                      labels: Object.entries(data || {}).filter(([k]) => !['sales','payments','inventory'].includes(k)).map(([k]) => k),
                      datasets: [{
                        label: 'Counts',
                        data: Object.entries(data || {}).filter(([k]) => !['sales','payments','inventory'].includes(k)).map(([_, v]: any) => Number(v?.count || 0)),
                        backgroundColor: ['#4dc9f6','#f67019','#f53794','#537bc4','#acc236','#166a8f','#00a950','#58595b','#8549ba']
                      }]
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Quick actions</h5>
              </div>
                <div className="d-flex gap-2 flex-wrap">
                <Button as={Link as any} to="/app/customers" variant="outline-primary">Manage Customers</Button>
                <Button as={Link as any} to="/app/items" variant="outline-primary">Manage Items</Button>
                <Button as={Link as any} to="/app/invoices" variant="primary">Create Invoice</Button>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </>
  );
};

export default DashboardPage;


