import React from 'react';
import { Container, Navbar } from 'react-bootstrap';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const isInitialRender = React.useRef(true);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerModuleTransition = React.useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    setIsTransitioning(true);
    hideTimerRef.current = setTimeout(() => setIsTransitioning(false), 600);
  }, []);

  React.useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    triggerModuleTransition();
  }, [location.pathname, triggerModuleTransition]);

  React.useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <Navbar expand="lg" className="app-navbar border-bottom shadow-sm">
        <Container fluid>
          <Navbar.Brand as={Link} to="/app">Saral ERP</Navbar.Brand>
          <Navbar.Toggle aria-controls="app-navbar-nav" />
          <Navbar.Collapse id="app-navbar-nav" className="justify-content-end">
            <span className="text-muted small">Operational Command Center</span>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div className="app-shell">
        <aside className="app-sidebar">
          <Sidebar onNavigate={triggerModuleTransition} />
        </aside>
        <main className="app-content">
          <Container fluid className="px-0">
            <Outlet />
          </Container>
        </main>
      </div>
      {isTransitioning && (
        <div className="module-loader-overlay">
          <div className="module-loader-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="module-loader-label">Loading module...</div>
        </div>
      )}
    </>
  );
};

export default AppLayout;


