import React, { useEffect, useState } from 'react';
import { Table, Spinner, Alert } from 'react-bootstrap';
import { axiosInstance } from '../services/http';

const TransactionsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosInstance.get('/api/v1/transactions')
      .then(res => setTransactions(res.data.data || []))
      .catch(err => {
        console.error(err);
        setError(err?.response?.data?.message || err.message || 'Failed to load transactions');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h5 className="mb-3">Transactions</h5>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? <Spinner animation="border" /> : (
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Txn #</th>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Direction</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted">No transactions yet.</td></tr>
            )}
            {transactions.map(tx => (
              <tr key={tx._id}>
                <td>{tx.transaction_number || tx._id}</td>
                <td>{tx.invoice?.invoiceNumber || ''}</td>
                <td>{tx.customer?.name || ''}</td>
                <td>{tx.amount}</td>
                <td>{tx.direction || '-'}</td>
                <td>{tx.paymentMethod || '-'}</td>
                <td>{tx.status}</td>
                <td>{new Date(tx.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default TransactionsPage;
