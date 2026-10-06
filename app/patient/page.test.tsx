import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import PatientDashboardPage from './page';
import * as DashboardContext from './state/PatientDashboardContext';
import { MantineProvider } from '@mantine/core';

const mockPush = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
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
    mockPush.mockClear();
    mockUsePatientDashboardContext = jest.spyOn(DashboardContext, 'usePatientDashboardContext');
  });

  afterEach(() => {
    mockUsePatientDashboardContext.mockRestore();
  });

  it('renders nothing when state is LOADING or INITIALIZING (handled by layout)', () => {
    mockUsePatientDashboardContext.mockReturnValue({ state: 'LOADING', data: null, error: null });
    const { container } = renderWithProvider(<PatientDashboardPage />);
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

  it('renders real data when state is READY and selects the closest future appointment', () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 86400000).toISOString(); // 1 day ago
    const farFutureDate = new Date(now.getTime() + 86400000 * 30).toISOString(); // 30 days ahead
    const nearFutureDate = new Date(now.getTime() + 86400000 * 2).toISOString(); // 2 days ahead

    const mockData = {
       profile: { name: [{ given: ['Carlos'] }] },
       appointments: [
         { status: 'booked', start: farFutureDate, description: 'Consulta Longe' },
         { status: 'booked', start: pastDate, description: 'Consulta Passada' },
         { status: 'booked', start: nearFutureDate, description: 'Consulta de Rotina', participant: [{ actor: { reference: 'Practitioner/123', display: 'Dr. Silva' } }] }
       ],
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
    expect(screen.queryByText('Consulta Longe')).not.toBeInTheDocument();
    expect(screen.queryByText('Consulta Passada')).not.toBeInTheDocument();
    expect(screen.getByText('Dr. Silva')).toBeInTheDocument();

    expect(screen.getByText('3 documentos disponíveis')).toBeInTheDocument();
    expect(screen.getByText('2 medicamentos')).toBeInTheDocument();
    expect(screen.getByText('1 resultado')).toBeInTheDocument();
    expect(screen.getByText('8 registros')).toBeInTheDocument();
  });

  it('renders "Consulta" as fallback when description is missing on appointment', () => {
    const nearFutureDate = new Date(new Date().getTime() + 86400000).toISOString();
    const mockData = {
       profile: { name: [{ given: ['Carlos'] }] },
       appointments: [{ status: 'booked', start: nearFutureDate }]
    };
    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: mockData,
       error: null
    });
    renderWithProvider(<PatientDashboardPage />);
    expect(screen.getByText('Consulta')).toBeInTheDocument();
    expect(screen.queryByText('Avaliação Clínica')).not.toBeInTheDocument();
  });

  it('renders "Tudo em dia" when READY but no upcoming appointments', () => {
    const pastDate = new Date(new Date().getTime() - 86400000).toISOString();
    const mockData = {
       profile: { name: [{ given: ['Beatriz'] }] },
       appointments: [{ status: 'cancelled' }, { status: 'booked', start: pastDate }]
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
       documents: [{}],
       medications: [],
       diagnostics: [],
       observations: [{}]
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

  it('navigates properly when interaction elements are clicked', () => {
    const mockData = {
       profile: { name: [{ given: ['Carlos'] }] },
       appointments: [],
       documents: [],
       medications: [],
       diagnostics: [],
       observations: []
    };
    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: mockData,
       error: null
    });
    renderWithProvider(<PatientDashboardPage />);

    // Quick Actions grid uses aria-labels
    fireEvent.click(screen.getByLabelText('Consultas'));
    expect(mockPush).toHaveBeenCalledWith('/patient/consultas');

    fireEvent.click(screen.getByLabelText('Histórico'));
    expect(mockPush).toHaveBeenCalledWith('/patient/historico');

    fireEvent.click(screen.getByLabelText('Documentos'));
    expect(mockPush).toHaveBeenCalledWith('/patient/documentos');

    fireEvent.click(screen.getByLabelText('Saúde'));
    expect(mockPush).toHaveBeenCalledWith('/patient/saude');

    fireEvent.click(screen.getByLabelText('Perfil'));
    expect(mockPush).toHaveBeenCalledWith('/patient/perfil');

    // Summary Cards
    const summaryDocs = screen.getAllByText('Documentos')[1].closest('button');
    if (summaryDocs) fireEvent.click(summaryDocs);
    expect(mockPush).toHaveBeenCalledWith('/patient/documentos');

    const summaryResults = screen.getAllByText('Resultados')[0].closest('button');
    if (summaryResults) fireEvent.click(summaryResults);
    expect(mockPush).toHaveBeenCalledWith('/patient/historico');
  });
});
