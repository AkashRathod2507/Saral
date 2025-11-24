import React, { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { axiosInstance } from '../services/http';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });
  const [apiError, setApiError] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    setApiError(null);
    try {
      const res = await axiosInstance.post('/api/v1/users/login', values, { withCredentials: true });
      const { accessToken, success } = res.data ?? {};
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (accessToken || success) {
        navigate('/app');
      }
    } catch (e: any) {
      setApiError(e?.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={5}>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4 p-md-5">
                <h3 className="mb-4 text-center">Welcome back</h3>
                {apiError && <Alert variant="danger">{apiError}</Alert>}
              <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" placeholder="Enter email" isInvalid={!!errors.email} {...register('email')} />
                  <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" placeholder="Enter password" isInvalid={!!errors.password} {...register('password')} />
                  <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button type="submit" disabled={isSubmitting} className="py-2">
                    {isSubmitting && <Spinner size="sm" className="me-2" />}Login
                  </Button>
                </div>
              </Form>
                <div className="mt-3 text-center">
                  <span>New here? </span>
                  <Link to="/register">Create an account</Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;


