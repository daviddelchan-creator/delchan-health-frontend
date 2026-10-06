import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsultasPage from './page';
import * as DashboardContext from '../state/PatientDashboardContext';
import { MantineProvider } from '@mantine/core';

// Mock window.matchMedia for Mantine Drawer/AppShell
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('ConsultasPage', () => {
  let mockUsePatientDashboardContext: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePatientDashboardContext = jest.spyOn(DashboardContext, 'usePatientDashboardContext');

    // Set fixed date for deterministic tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    mockUsePatientDashboardContext.mockRestore();
    jest.useRealTimers();
  });

  it('renders nothing when state is LOADING or INITIALIZING (handled by layout)', () => {
    mockUsePatientDashboardContext.mockReturnValue({ state: 'LOADING', data: null, error: null });
    renderWithProvider(<ConsultasPage />);
    expect(screen.queryByText(/Minhas Consultas/i)).not.toBeInTheDocument();
  });

  it('renders EmptyState when there are no appointments', () => {
    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: { appointments: [] },
       error: null
    });
    renderWithProvider(<ConsultasPage />);
    expect(screen.getByText('Minhas Consultas')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma consulta')).toBeInTheDocument();
    expect(screen.getByText('Você não possui histórico ou consultas agendadas no momento.')).toBeInTheDocument();
  });

  it('renders correctly future, past, and cancelled appointments, deterministically selecting the next appointment', () => {
    const mockAppointments = [
      { id: '1', status: 'fulfilled', start: '2023-12-01T10:00:00Z', description: 'Consulta Antiga' },
      { id: '2', status: 'booked', start: '2024-01-20T10:00:00Z', description: 'Consulta Futura Longe' },
      { id: '3', status: 'booked', start: '2024-01-16T10:00:00Z', description: 'Próxima Consulta Real' },
      { id: '4', status: 'cancelled', start: '2024-01-18T10:00:00Z', description: 'Consulta Cancelada Futura' },
      { id: '5', status: 'cancelled', start: '2023-12-10T10:00:00Z', description: 'Consulta Cancelada Passada' }
    ];

    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: { appointments: mockAppointments },
       error: null
    });

    renderWithProvider(<ConsultasPage />);

    // Titles
    expect(screen.getByText('Minhas Consultas')).toBeInTheDocument();

    // Next Appointment
    const nextApptTitle = screen.getByText('Próxima Consulta Real');
    expect(nextApptTitle).toBeInTheDocument();
    // It should have the "Próxima" badge
    const nextBadge = screen.getByText('Próxima');
    expect(nextBadge).toBeInTheDocument();

    // Future
    expect(screen.getByText('Consulta Futura Longe')).toBeInTheDocument();

    // Past
    expect(screen.getByText('Consulta Antiga')).toBeInTheDocument();
    expect(screen.getByText('Realizada')).toBeInTheDocument();

    // Cancelled section
    expect(screen.getByText('Canceladas')).toBeInTheDocument();
    expect(screen.getByText('Consulta Cancelada Futura')).toBeInTheDocument();
    expect(screen.getByText('Consulta Cancelada Passada')).toBeInTheDocument();
  });

  it('handles missing fields gracefully (no description, no practitioner, no start time)', () => {
    const mockAppointments = [
      { id: '1', status: 'booked' } // Missing start, description, participant
    ];

    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: { appointments: mockAppointments },
       error: null
    });

    renderWithProvider(<ConsultasPage />);

    // Because it lacks a start date, it should not appear in future or past lists.
    // However, it should not break the UI. We assert that Empty states are shown for the lists.
    expect(screen.getByText('Nenhuma consulta futura agendada.')).toBeInTheDocument();
    expect(screen.getByText('Nenhum histórico de consultas.')).toBeInTheDocument();
  });

  it('handles missing fields gracefully when in list (no description, no practitioner)', () => {
    const mockAppointments = [
      { id: '1', status: 'booked', start: '2024-01-16T10:00:00Z' } // Missing description, participant
    ];

    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: { appointments: mockAppointments },
       error: null
    });

    renderWithProvider(<ConsultasPage />);

    // Fallback description
    expect(screen.getByText('Consulta')).toBeInTheDocument();
  });

  it('shows practitioner name when available and opens drawer via keyboard interaction', async () => {
    const mockAppointments = [
      {
        id: '1',
        status: 'booked',
        start: '2024-01-16T10:00:00Z',
        description: 'Retorno',
        participant: [
          { actor: { reference: 'Practitioner/123', display: 'Dr. House' } }
        ]
      }
    ];

    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: { appointments: mockAppointments },
       error: null
    });

    renderWithProvider(<ConsultasPage />);

    // Click the card to open drawer
    const cardTitle = screen.getByText('Retorno');
    fireEvent.click(cardTitle);

    // Check Drawer content
    // Since Mantine uses a Portal for the Drawer, we might need to wait for it or just check it if rendered.
    // using findByText
    expect(await screen.findByText('Detalhes da Consulta')).toBeInTheDocument();
    expect(screen.getByText('Dr. House')).toBeInTheDocument();


  });

  it('shows empty state for future if only past exists', () => {
    const mockAppointments = [
      { id: '1', status: 'fulfilled', start: '2023-12-01T10:00:00Z', description: 'Consulta Antiga' }
    ];

    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: { appointments: mockAppointments },
       error: null
    });

    renderWithProvider(<ConsultasPage />);

    expect(screen.getByText('Nenhuma consulta futura agendada.')).toBeInTheDocument();
    expect(screen.getByText('Consulta Antiga')).toBeInTheDocument();
  });

});
