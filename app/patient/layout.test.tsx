import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PatientAppShell from './layout';
import * as DashboardContext from './state/PatientDashboardContext';
import { usePathname, useRouter } from 'next/navigation';
import { MantineProvider } from '@mantine/core';

// Mock hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock matchMedia for Mantine responsive AppShell tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('PatientAppShell Layout', () => {
  let mockUsePatientDashboardContext: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/patient');
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

    // We spy on the custom hook that provides the context so we can control its return value
    mockUsePatientDashboardContext = jest.spyOn(DashboardContext, 'usePatientDashboardContext');

    // Mock the provider to just render children so we can test the Inner component logic easily
    jest.spyOn(DashboardContext, 'PatientDashboardProvider').mockImplementation(({children}) => <>{children}</>);
  });

  afterEach(() => {
    mockUsePatientDashboardContext.mockRestore();
  });

  it('renders loading state when INITIALIZING', () => {
    mockUsePatientDashboardContext.mockReturnValue({ state: 'INITIALIZING', data: null, error: null });
    const { container } = renderWithProvider(<PatientAppShell><div>Conteúdo</div></PatientAppShell>);
    expect(screen.getByText('Carregando portal do paciente...')).toBeInTheDocument();
  });

  it('renders unauthorized state when UNAUTHORIZED', () => {
    mockUsePatientDashboardContext.mockReturnValue({ state: 'UNAUTHORIZED', data: null, error: null });
    renderWithProvider(<PatientAppShell><div>Conteúdo</div></PatientAppShell>);
    expect(screen.getByText('Sessão Expirada')).toBeInTheDocument();
    expect(screen.getByText('Por favor, faça login novamente para acessar o portal.')).toBeInTheDocument();
  });

  it('renders forbidden state when FORBIDDEN', () => {
    mockUsePatientDashboardContext.mockReturnValue({ state: 'FORBIDDEN', data: null, error: null });
    renderWithProvider(<PatientAppShell><div>Conteúdo</div></PatientAppShell>);
    expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
    expect(screen.getByText(/exclusivo para pacientes/)).toBeInTheDocument();
  });

  it('renders shell and children when READY', () => {
    mockUsePatientDashboardContext.mockReturnValue({
        state: 'READY',
        data: { profile: { name: [{ given: ['João'] }] } },
        error: null
    });
    renderWithProvider(<PatientAppShell><div>Conteúdo do Dashboard</div></PatientAppShell>);
    expect(screen.getByText('Portal do Paciente')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo do Dashboard')).toBeInTheDocument();
  });

  it('renders navigation links (e.g. Histórico)', () => {
    mockUsePatientDashboardContext.mockReturnValue({
        state: 'READY',
        data: { profile: { name: [{ given: ['João'] }] } },
        error: null
    });
    renderWithProvider(<PatientAppShell><div>Conteúdo</div></PatientAppShell>);
    // Check for the "Histórico" label which exists in both Navbar (desktop) and Footer (mobile 'Hist.')
    const navLinks = screen.getAllByText(/Histórico|Hist\./i);
    expect(navLinks.length).toBeGreaterThan(0);
  });

  describe('Active Navigation Matching', () => {
    const setupMock = () => {
      mockUsePatientDashboardContext.mockReturnValue({
          state: 'READY',
          data: { profile: { name: [{ given: ['João'] }] } },
          error: null
      });
    };

    it('matches /patient to inicio', () => {
      setupMock();
      (usePathname as jest.Mock).mockReturnValue('/patient');
      const { container } = renderWithProvider(<PatientAppShell><div>Conteúdo</div></PatientAppShell>);
      const activeLink = container.querySelector('[data-active="true"]');
      expect(activeLink).toHaveTextContent('Início');
    });

    it('matches /patient/ to inicio', () => {
      setupMock();
      (usePathname as jest.Mock).mockReturnValue('/patient/');
      const { container } = renderWithProvider(<PatientAppShell><div>Conteúdo</div></PatientAppShell>);
      const activeLink = container.querySelector('[data-active="true"]');
      expect(activeLink).toHaveTextContent('Início');
    });

    it('matches /patient/consultas to consultas', () => {
      setupMock();
      (usePathname as jest.Mock).mockReturnValue('/patient/consultas');
      const { container } = renderWithProvider(<PatientAppShell><div>Conteúdo</div></PatientAppShell>);
      const activeLink = container.querySelector('[data-active="true"]');
      expect(activeLink).toHaveTextContent('Consultas');
    });

    it('matches nested /patient/consultas/123 to consultas', () => {
      setupMock();
      (usePathname as jest.Mock).mockReturnValue('/patient/consultas/123');
      const { container } = renderWithProvider(<PatientAppShell><div>Conteúdo</div></PatientAppShell>);
      const activeLink = container.querySelector('[data-active="true"]');
      expect(activeLink).toHaveTextContent('Consultas');
    });

    it('does NOT match false positive /patient/consultasXYZ to consultas', () => {
      setupMock();
      (usePathname as jest.Mock).mockReturnValue('/patient/consultasXYZ');
      const { container } = renderWithProvider(<PatientAppShell><div>Conteúdo</div></PatientAppShell>);
      const activeLink = container.querySelector('[data-active="true"]');
      // Should fallback to inicio since it is not a matched route
      expect(activeLink).toHaveTextContent('Início');
    });

    it('matches other sections properly', () => {
      setupMock();
      const routes = [
        { path: '/patient/historico', expected: 'Histórico' },
        { path: '/patient/documentos', expected: 'Documentos' },
        { path: '/patient/saude', expected: 'Saúde' },
        { path: '/patient/perfil', expected: 'Perfil' },
      ];

      routes.forEach(({ path, expected }) => {
        (usePathname as jest.Mock).mockReturnValue(path);
        const { container } = renderWithProvider(<PatientAppShell><div>Conteúdo</div></PatientAppShell>);
        const activeLink = container.querySelector('[data-active="true"]');
        expect(activeLink).toHaveTextContent(expected);
      });
    });
  });
});
