import React, { useState } from 'react';
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import { axiosInstance } from '../../services/http';

type InventoryUploadProps = {
  onSuccess?: (insertedCount: number) => void;
};

export const InventoryUpload: React.FC<InventoryUploadProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && !selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    setFile(selectedFile || null);
    setError(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axiosInstance.post('/api/v1/inventory/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const inserted = response.data?.data?.insertedCount ?? 0;
      setSuccess(`Successfully imported ${inserted} item${inserted === 1 ? '' : 's'}`);
      onSuccess?.(inserted);
      setFile(null);
      // Reset the file input
      const fileInput = document.getElementById('csvFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error uploading file');
      console.error('Upload error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <h4>Import Inventory from CSV</h4>
      <p className="text-muted">
        Upload a CSV file with the following headers:<br />
        name, item_type, unit_price, stock_quantity, hsn_sac_code, tax_rate
      </p>
      
      <Form onSubmit={handleUpload}>
        <Form.Group className="mb-3">
          <Form.Label>Choose CSV File</Form.Label>
          <Form.Control
            id="csvFile"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
          <Form.Text className="text-muted">
            File must be in CSV format with the required headers
          </Form.Text>
        </Form.Group>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}

        <Button 
          type="submit" 
          variant="primary"
          disabled={!file || loading}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Uploading...
            </>
          ) : (
            'Upload CSV'
          )}
        </Button>
      </Form>

      <hr />
    </div>
  );
};