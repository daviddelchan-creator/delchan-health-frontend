import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PatientDashboardPage from './page';
import * as DashboardContext from './state/PatientDashboardContext';
import { MantineProvider } from '@mantine/core';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('PatientDashboardPage', () => {
  let mockUsePatientDashboardContext: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePatientDashboardContext = jest.spyOn(DashboardContext, 'usePatientDashboardContext');
  });

  afterEach(() => {
    mockUsePatientDashboardContext.mockRestore();
  });

  it('renders nothing when state is LOADING or INITIALIZING (handled by layout)', () => {
    mockUsePatientDashboardContext.mockReturnValue({ state: 'LOADING', data: null, error: null });
    const { container } = renderWithProvider(<PatientDashboardPage />);
    // Mantine injects style tags, so instead of toBeNull, we check if there's no actual content text
    expect(screen.queryByText(/Bem-vindo/i)).not.toBeInTheDocument();
  });

  it('renders nothing when state is UNAUTHORIZED or FORBIDDEN', () => {
    mockUsePatientDashboardContext.mockReturnValue({ state: 'UNAUTHORIZED', data: null, error: null });
    renderWithProvider(<PatientDashboardPage />);
    expect(screen.queryByText(/Bem-vindo/i)).not.toBeInTheDocument();

    mockUsePatientDashboardContext.mockReturnValue({ state: 'FORBIDDEN', data: null, error: null });
    renderWithProvider(<PatientDashboardPage />);
    expect(screen.queryByText(/Bem-vindo/i)).not.toBeInTheDocument();
  });

  it('renders ErrorState when state is ERROR', () => {
    mockUsePatientDashboardContext.mockReturnValue({
       state: 'ERROR',
       data: null,
       error: new Error('Mock API Error')
    });
    renderWithProvider(<PatientDashboardPage />);
    expect(screen.getByText('Ocorreu um erro')).toBeInTheDocument();
    expect(screen.getByText('Mock API Error')).toBeInTheDocument();
  });

  it('renders EmptyState when state is EMPTY', () => {
    mockUsePatientDashboardContext.mockReturnValue({
       state: 'EMPTY',
       data: { profile: { name: [{ given: ['Ana'] }] } },
       error: null
    });
    renderWithProvider(<PatientDashboardPage />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Histórico limpo')).toBeInTheDocument();
  });

  it('renders real data when state is READY', () => {
    const mockData = {
       profile: { name: [{ given: ['Carlos'] }] },
       appointments: [{
         status: 'booked',
         start: '2023-12-01T10:00:00Z',
         description: 'Consulta de Rotina',
         participant: [
           { actor: { reference: 'Practitioner/123', display: 'Dr. Silva' } }
         ]
       }],
       documents: [{}, {}, {}],
       medications: [{}, {}],
       diagnostics: [{}],
       observations: [{}, {}, {}, {}, {}, {}, {}, {}]
    };
    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: mockData,
       error: null
    });
    renderWithProvider(<PatientDashboardPage />);
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByText('Próxima Consulta')).toBeInTheDocument();
    expect(screen.getByText('Consulta de Rotina')).toBeInTheDocument();
    expect(screen.getByText('Dr. Silva')).toBeInTheDocument();

    // Check summaries
    expect(screen.getByText('3 documentos disponíveis')).toBeInTheDocument();
    expect(screen.getByText('2 medicamentos')).toBeInTheDocument();
    expect(screen.getByText('1 resultado')).toBeInTheDocument();
    expect(screen.getByText('8 registros')).toBeInTheDocument();
  });

  it('renders "Tudo em dia" when READY but no upcoming appointments', () => {
    const mockData = {
       profile: { name: [{ given: ['Beatriz'] }] },
       appointments: [{ status: 'cancelled' }] // No booked appointments
    };
    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: mockData,
       error: null
    });
    renderWithProvider(<PatientDashboardPage />);
    expect(screen.getByText('Beatriz')).toBeInTheDocument();
    expect(screen.getByText('Tudo em dia')).toBeInTheDocument();
    expect(screen.getByText('Você não possui consultas agendadas no momento.')).toBeInTheDocument();
  });

  it('handles pluralization and zero states in summaries correctly', () => {
    const mockData = {
       profile: { name: [{ given: ['Carlos'] }] },
       appointments: [],
       documents: [{}], // singular
       medications: [], // zero
       diagnostics: [], // zero
       observations: [{}] // singular
    };
    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: mockData,
       error: null
    });
    renderWithProvider(<PatientDashboardPage />);

    expect(screen.getByText('1 documento disponível')).toBeInTheDocument();
    expect(screen.getByText('Nenhum medicamento')).toBeInTheDocument();
    expect(screen.getByText('Nenhum resultado')).toBeInTheDocument();
    expect(screen.getByText('1 registro')).toBeInTheDocument();
  });
});
