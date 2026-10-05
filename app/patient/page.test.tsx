import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PatientDashboardPage from './page';
import * as DashboardContext from './state/PatientDashboardContext';
import { MantineProvider } from '@mantine/core';

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
    // Mantine injects style tags, so instead of tobeNull, we check if there's no actual content text
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
    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
  });

  it('renders real data when state is READY', () => {
    const mockData = {
       profile: { name: [{ given: ['Carlos'] }] },
       appointments: [{ status: 'booked', start: '2023-12-01T10:00:00Z', description: 'Consulta de Rotina' }]
    };
    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: mockData,
       error: null
    });
    renderWithProvider(<PatientDashboardPage />);
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByText('Consulta Confirmada')).toBeInTheDocument();
    expect(screen.getByText('Consulta de Rotina')).toBeInTheDocument();
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
});
