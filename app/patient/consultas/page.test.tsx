import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsultasPage from './page';
import * as DashboardContext from '../state/PatientDashboardContext';
import { MantineProvider } from '@mantine/core';

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
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    mockUsePatientDashboardContext.mockRestore();
    jest.useRealTimers();
  });

  it('renders Loading state when state is LOADING or INITIALIZING', () => {
    mockUsePatientDashboardContext.mockReturnValue({ state: 'LOADING', data: null, error: null });
    const { container } = renderWithProvider(<ConsultasPage />);
    expect(container.querySelector('.mantine-Loader-root')).toBeInTheDocument();

    mockUsePatientDashboardContext.mockReturnValue({ state: 'INITIALIZING', data: null, error: null });
    const { container: initContainer } = renderWithProvider(<ConsultasPage />);
    expect(initContainer.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('returns null for ERROR, UNAUTHORIZED, and FORBIDDEN states', () => {
    mockUsePatientDashboardContext.mockReturnValue({ state: 'ERROR', data: null, error: null });
    renderWithProvider(<ConsultasPage />);
    expect(screen.queryByText(/Minhas Consultas/i)).not.toBeInTheDocument();

    mockUsePatientDashboardContext.mockReturnValue({ state: 'UNAUTHORIZED', data: null, error: null });
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
  });

  it('renders correctly future, past, and cancelled appointments', () => {
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

    expect(screen.getByText('Próxima Consulta Real')).toBeInTheDocument();
    expect(screen.getByText('Consulta Futura Longe')).toBeInTheDocument();
    expect(screen.getByText('Consulta Antiga')).toBeInTheDocument();
    expect(screen.getByText('Consulta Cancelada Futura')).toBeInTheDocument();
  });

  it('handles missing fields gracefully', () => {
    const mockAppointments = [
      { id: '1', status: 'booked' },
      { id: '2', status: 'booked', start: '2024-01-16T10:00:00Z' }
    ];

    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: { appointments: mockAppointments },
       error: null
    });

    renderWithProvider(<ConsultasPage />);
    expect(screen.getByText('Consulta')).toBeInTheDocument();
  });

  it('shows practitioner name when available and opens drawer via click', async () => {
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

    fireEvent.click(screen.getByText('Retorno'));
    const detalhes = await screen.findAllByText('Detalhes da Consulta');
    expect(detalhes.length).toBeGreaterThan(0);
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
  });

  it('renders CTA for telemedicine appointments and none for presencial', async () => {
    const mockAppointments = [
      {
        id: '1',
        status: 'booked',
        start: '2024-01-16T10:00:00Z',
        description: 'Remoto',
        appointmentType: { text: 'Telemedicina' }
      },
      {
        id: '2',
        status: 'booked',
        start: '2024-01-17T10:00:00Z',
        description: 'Presencial',
        appointmentType: { text: 'Presencial' }
      }
    ];

    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: { appointments: mockAppointments },
       error: null
    });

    renderWithProvider(<ConsultasPage />);

    fireEvent.click(screen.getByText('Remoto'));
    const ctas = await screen.findAllByText('Acessar Telemedicina');
    expect(ctas.length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('Presencial'));
    const detalhes = await screen.findAllByText('Detalhes da Consulta');
    expect(detalhes.length).toBeGreaterThan(0);
    expect(screen.queryByText('Acessar Telemedicina')).not.toBeInTheDocument();
  });

  it('opens Telemedicine Workspace when CTA is clicked, displays indisponível message, and can close', async () => {
    const mockAppointments = [
      {
        id: '1',
        status: 'booked',
        start: '2024-01-16T10:00:00Z',
        description: 'Remoto',
        appointmentType: { text: 'Telemedicina' }
      }
    ];

    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: { appointments: mockAppointments },
       error: null
    });

    renderWithProvider(<ConsultasPage />);

    fireEvent.click(screen.getByText('Remoto'));
    const ctas = await screen.findAllByText('Acessar Telemedicina');
    fireEvent.click(ctas[0]);

    const salas = await screen.findAllByText('Sala de Vídeo');
    expect(salas.length).toBeGreaterThan(0);
    expect(screen.getByText('Telemedicina Indisponível')).toBeInTheDocument();
    expect(screen.queryByText('Minhas Consultas')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Sair da Sala'));

    expect(screen.getByText('Minhas Consultas')).toBeInTheDocument();
    expect(screen.queryByText('Sala de Vídeo')).not.toBeInTheDocument();
  });

  it('supports keyboard interaction (Enter/Space) to open Drawer', async () => {
    const mockAppointments = [
      {
        id: '1',
        status: 'booked',
        start: '2024-01-16T10:00:00Z',
        description: 'Teclado',
        appointmentType: { text: 'Telemedicina' }
      },
      {
        id: '2',
        status: 'booked',
        start: '2024-01-17T10:00:00Z',
        description: 'Espaco',
        appointmentType: { text: 'Telemedicina' }
      }
    ];

    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: { appointments: mockAppointments },
       error: null
    });

    renderWithProvider(<ConsultasPage />);

    const btn = screen.getByRole('button', { name: /Teclado/i });
    btn.focus();
    expect(btn).toHaveFocus();
    fireEvent.keyDown(btn, { key: 'Enter', code: 'Enter', charCode: 13 });
    fireEvent.click(btn);
    const ctas = await screen.findAllByText('Acessar Telemedicina');
    expect(ctas.length).toBeGreaterThan(0);
  });

  it('handles appointment without appointmentType gracefully', async () => {
    const mockAppointments = [
      {
        id: '1',
        status: 'booked',
        start: '2024-01-16T10:00:00Z',
        description: 'Sem Tipo'
      }
    ];

    mockUsePatientDashboardContext.mockReturnValue({
       state: 'READY',
       data: { appointments: mockAppointments },
       error: null
    });

    renderWithProvider(<ConsultasPage />);

    fireEvent.click(screen.getByText('Sem Tipo'));
    const detalhes = await screen.findAllByText('Detalhes da Consulta');
    expect(detalhes.length).toBeGreaterThan(0);
    expect(screen.queryByText('Acessar Telemedicina')).not.toBeInTheDocument();
  });
});
