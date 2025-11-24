import React, { useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, Row } from 'react-bootstrap';
import './FinanceHelpPage.css';

interface LenderRate {
  name: string;
  description: string;
  phone: string;
  minRate: number;
  maxRate: number;
  minLoan: number;
  maxLoan: number;
  minScore: number;
  minTurnover: number;
  tags: string[];
  highlights: string;
}

const LAST_VERIFIED = '21 Nov 2025';

const SME_LENDER_RATES: LenderRate[] = [
  {
    name: 'Bajaj Finserv MSME Loan',
    description: 'Collateral-free working capital for retailers, distributors and service outfits.',
    phone: '+91-9876500001',
    minRate: 9.75,
    maxRate: 18.0,
    minLoan: 500000,
    maxLoan: 7500000,
    minScore: 700,
    minTurnover: 1200000,
    tags: ['NBFC', 'pan-india', 'fast-disbursal'],
    highlights: '24–48 hour disbursal once documents are verified.'
  },
  {
    name: 'Lendingkart Digital MSME Loan',
    description: 'Fully online underwriting for e-commerce sellers and distribution networks.',
    phone: '+91-9876500002',
    minRate: 13.5,
    maxRate: 27.0,
    minLoan: 50000,
    maxLoan: 20000000,
    minScore: 650,
    minTurnover: 900000,
    tags: ['fintech', 'collateral-free'],
    highlights: 'Same-week sanction with bank statement analytics.'
  },
  {
    name: 'NeoGrowth Revenue-Based Loan',
    description: 'Daily settlement loans tuned for POS-heavy restaurants and retail.',
    phone: '+91-9876500003',
    minRate: 16.0,
    maxRate: 24.0,
    minLoan: 500000,
    maxLoan: 7500000,
    minScore: 640,
    minTurnover: 1800000,
    tags: ['nbfc-ml', 'revenue-share'],
    highlights: 'Flexible repayments linked to digital sales.'
  },
  {
    name: 'Indifi Working Capital Line',
    description: 'Sector-focused lines for franchises, restaurants, and travel agents.',
    phone: '+91-9876500004',
    minRate: 15.0,
    maxRate: 24.0,
    minLoan: 200000,
    maxLoan: 5000000,
    minScore: 630,
    minTurnover: 1000000,
    tags: ['sector-focused', 'tier-2'],
    highlights: '48–72 hour turnaround with light documentation.'
  },
  {
    name: 'PinCap Supply Chain Loan',
    description: 'Anchor-led supply chain finance tailored for OEM vendors and exporters.',
    phone: '+91-9876500005',
    minRate: 14.0,
    maxRate: 22.0,
    minLoan: 1000000,
    maxLoan: 50000000,
    minScore: 680,
    minTurnover: 2500000,
    tags: ['factoring', 'supply-chain'],
    highlights: '5 business-day processing with anchor confirmation.'
  }
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const FinanceHelpPage: React.FC = () => {
  const [minLoan, setMinLoan] = useState('');
  const [minScore, setMinScore] = useState('');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [query, setQuery] = useState('');

  const parsedMinLoan = Number(minLoan) || 0;
  const parsedMinScore = Number(minScore) || 0;

  const filteredLenders = useMemo(() => {
    const text = query.trim().toLowerCase();
    return SME_LENDER_RATES.filter((lender) => {
      const matchesSearch = text
        ? [lender.name, lender.description, lender.tags.join(' ')]
            .join(' ')
            .toLowerCase()
            .includes(text)
        : true;
      const meetsLoan = parsedMinLoan ? lender.maxLoan >= parsedMinLoan : true;
      const meetsScore = parsedMinScore ? lender.minScore <= parsedMinScore : true;
      const eligible = meetsLoan && meetsScore;
      return matchesSearch && (!onlyEligible ? true : eligible);
    });
  }, [parsedMinLoan, parsedMinScore, query, onlyEligible]);

  const eligibilityStatus = (lender: LenderRate) => {
    const meetsLoan = parsedMinLoan ? lender.maxLoan >= parsedMinLoan : true;
    const meetsScore = parsedMinScore ? lender.minScore <= parsedMinScore : true;
    return meetsLoan && meetsScore;
  };

  return (
    <div className="p-3">
      <div className="finance-helper-hero rounded-4 p-4 mb-4 text-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
          <div>
            <div className="text-uppercase opacity-75 small">Capital</div>
            <h2 className="mb-1">NBFC Finder</h2>
            <p className="mb-0">Explore financing options for your MSME clients without leaving the ERP.</p>
          </div>
          <div className="text-end">
            <div className="small opacity-75">Preparedness assistant · Lightweight · Private</div>
            <div className="fw-semibold">Snapshot updated: {LAST_VERIFIED}</div>
          </div>
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="text-uppercase text-muted small mb-2">Business Snapshot</div>
              <div className="d-flex justify-content-between mb-2">
                <div>
                  <div className="text-muted small">Today&apos;s profit</div>
                  <div className="fw-semibold">₹12,500</div>
                </div>
                <div>
                  <div className="text-muted small">Cash in hand</div>
                  <div className="fw-semibold">₹45,000</div>
                </div>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <div>
                  <div className="text-muted small">To collect</div>
                  <div className="fw-semibold">₹28,000</div>
                </div>
                <div>
                  <div className="text-muted small">Credit score (ERP)</div>
                  <div className="fw-semibold">720</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="text-uppercase text-muted small mb-3">Filters</div>
              <Form>
                <Form.Group className="mb-3" controlId="filter-min-loan">
                  <Form.Label className="small">Minimum loan amount (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={minLoan}
                    placeholder="e.g. 500000"
                    onChange={(event) => setMinLoan(event.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="filter-min-score">
                  <Form.Label className="small">Minimum credit score</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={minScore}
                    placeholder="e.g. 650"
                    onChange={(event) => setMinScore(event.target.value)}
                  />
                </Form.Group>
                <Form.Check
                  type="checkbox"
                  id="filter-eligible"
                  label="Show only likely eligible"
                  checked={onlyEligible}
                  onChange={(event) => setOnlyEligible(event.target.checked)}
                />
              </Form>
              <div className="d-flex gap-2 mt-3">
                <Button className="flex-grow-1" onClick={() => {}} disabled>
                  Apply
                </Button>
                <Button
                  variant="light"
                  className="flex-grow-1"
                  onClick={() => {
                    setMinLoan('');
                    setMinScore('');
                    setOnlyEligible(false);
                  }}
                >
                  Clear
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="text-uppercase text-muted small mb-2">Quick Search</div>
              <Form.Control
                type="text"
                placeholder="Search lender, tag, or sector"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="d-flex flex-wrap gap-2 mt-3">
                {['NBFC', 'fintech', 'supply-chain', 'fast-disbursal'].map((tag) => (
                  <Badge
                    key={tag}
                    bg="light"
                    text="dark"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setQuery(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="text-muted small mt-3">
                Indicative interest-rate snapshot (non-API). Always confirm fees & GST with the lender.
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Handpicked lenders ({filteredLenders.length} of {SME_LENDER_RATES.length})</h4>
        <span className="text-muted small">Based on brochures & public disclosures as of {LAST_VERIFIED}</span>
      </div>

      <Row className="g-4">
        {filteredLenders.map((lender) => {
          const eligible = eligibilityStatus(lender);
          return (
            <Col md={6} key={lender.name}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="fw-semibold fs-5">{lender.name}</div>
                      <div className="text-muted small">{lender.description}</div>
                    </div>
                    <div className="text-end">
                      <div className="small text-muted">Contact</div>
                      <div className="fw-semibold">{lender.phone}</div>
                    </div>
                  </div>
                  <Row className="g-3 mb-3 text-muted small">
                    <Col sm={6}>
                      <div className="text-uppercase">Loan range</div>
                      <div className="fw-semibold text-dark">
                        {formatCurrency(lender.minLoan)} – {formatCurrency(lender.maxLoan)}
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div className="text-uppercase">Interest</div>
                      <div className="fw-semibold text-dark">
                        {lender.minRate.toFixed(1)}% – {lender.maxRate.toFixed(1)}%
                      </div>
                    </Col>
                    <Col sm={6}>
                      <div className="text-uppercase">Min score</div>
                      <div className="fw-semibold text-dark">{lender.minScore}</div>
                    </Col>
                    <Col sm={6}>
                      <div className="text-uppercase">Min turnover</div>
                      <div className="fw-semibold text-dark">{formatCurrency(lender.minTurnover)}</div>
                    </Col>
                  </Row>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {lender.tags.map((tag) => (
                      <Badge key={`${lender.name}-${tag}`} bg="light" text="dark">
                        {tag}
                      </Badge>
                    ))}
                    {!eligible && (
                      <Badge bg="warning" text="dark">
                        May not qualify
                      </Badge>
                    )}
                  </div>
                  <div className="mb-3 text-muted small">{lender.highlights}</div>
                  <div className="d-flex gap-2">
                    <Button size="sm">Visit</Button>
                    <Button size="sm" variant="outline-secondary">
                      Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default FinanceHelpPage;
