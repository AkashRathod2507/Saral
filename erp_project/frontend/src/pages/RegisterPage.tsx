import React, { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { axiosInstance } from '../services/http';

const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  business_name: z.string().min(2),
  state: z.string().min(2)
});

type FormValues = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });
  const [apiError, setApiError] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    setApiError(null);
    try {
      await axiosInstance.post('/api/v1/users/register', values, { withCredentials: true });
      const loginRes = await axiosInstance.post('/api/v1/users/login', { email: values.email, password: values.password }, { withCredentials: true });
      const { accessToken, success } = loginRes.data ?? {};
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (accessToken || success) {
        navigate('/app');
      } else {
        navigate('/login');
      }
    } catch (e: any) {
      setApiError(e?.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={7} lg={6}>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4 p-md-5">
                <h3 className="mb-4 text-center">Create your account</h3>
                {apiError && <Alert variant="danger">{apiError}</Alert>}
              <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="username">
                      <Form.Label>Username</Form.Label>
                      <Form.Control placeholder="Enter username" isInvalid={!!errors.username} {...register('username')} />
                      <Form.Control.Feedback type="invalid">{errors.username?.message}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="email">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" placeholder="Enter email" isInvalid={!!errors.email} {...register('email')} />
                      <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" placeholder="Enter password" isInvalid={!!errors.password} {...register('password')} />
                  <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
                </Form.Group>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3" controlId="business_name">
                      <Form.Label>Business Name</Form.Label>
                      <Form.Control placeholder="Your company" isInvalid={!!errors.business_name} {...register('business_name')} />
                      <Form.Control.Feedback type="invalid">{errors.business_name?.message}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3" controlId="state">
                      <Form.Label>State</Form.Label>
                      <Form.Control placeholder="State" isInvalid={!!errors.state} {...register('state')} />
                      <Form.Control.Feedback type="invalid">{errors.state?.message}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-grid gap-2">
                  <Button type="submit" disabled={isSubmitting} className="py-2">
                    {isSubmitting && <Spinner size="sm" className="me-2" />}Create Account
                  </Button>
                </div>
              </Form>
                <div className="mt-3 text-center">
                  <span>Already have an account? </span>
                  <Link to="/login">Login</Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default RegisterPage;


