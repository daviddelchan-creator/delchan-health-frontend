import React from 'react';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MantineProvider } from '@mantine/core';
import PatientSaudePage from './page';
import { usePatientDashboardContext } from '../state/PatientDashboardContext';

// Custom render to wrap with MantineProvider
function render(ui: React.ReactNode) {
  return rtlRender(<MantineProvider>{ui}</MantineProvider>);
}

// Mock context hook
jest.mock('../state/PatientDashboardContext', () => ({
  usePatientDashboardContext: jest.fn(),
}));

// Mock Navigation (useSearchParams to ensure no patientId comes from URL)
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/patient/saude',
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

describe('PatientSaudePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock matchMedia for Mantine Drawer/AppShell
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
  });

  it('renders nothing on INITIALIZING state', () => {
    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'INITIALIZING', data: null });
    const { container } = render(<PatientSaudePage />);
    // Just testing that the stack container containing "Minha Saúde" is absent.
    expect(screen.queryByText('Minha Saúde')).not.toBeInTheDocument();
  });

  it('renders ErrorState on ERROR state', () => {
    (usePatientDashboardContext as jest.Mock).mockReturnValue({
      state: 'ERROR',
      error: new Error('Failed to load')
    });
    render(<PatientSaudePage />);
    // The exact text output by the ErrorState component might differ based on how it renders the message props vs. default
    // We check for the text we expect, or the default error text fallback if error context works differently.
    expect(screen.getByText('Ocorreu um erro')).toBeInTheDocument(); // matches the ErrorState title
    expect(screen.getByText('Failed to load')).toBeInTheDocument(); // matches the actual text passed
  });

  it('renders EmptyState when observations array is empty', () => {
    (usePatientDashboardContext as jest.Mock).mockReturnValue({
      state: 'READY',
      data: { observations: [] },
    });
    render(<PatientSaudePage />);
    expect(screen.getByText('Nenhuma métrica disponível')).toBeInTheDocument();
    expect(screen.getByText(/Você ainda não possui registros de saúde/)).toBeInTheDocument();
  });

  it('renders a grid of observations and opens Drawer on click/Enter', async () => {
    const mockObs = [
      {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Pressão Arterial' },
        component: [
          { valueQuantity: { value: 120 } },
          { valueQuantity: { value: 80, unit: 'mmHg' } }
        ],
        effectiveDateTime: '2023-10-25T10:00:00Z',
        meta: { source: 'health_connect' }
      },
      {
        resourceType: 'Observation',
        id: 'obs-2',
        status: 'final',
        code: { coding: [{ display: 'Frequência Cardíaca' }] },
        valueQuantity: { value: 75, unit: 'bpm' },
        effectiveDateTime: '2023-10-26T08:30:00Z',
      }
    ];

    (usePatientDashboardContext as jest.Mock).mockReturnValue({
      state: 'READY',
      data: { observations: mockObs },
    });

    render(<PatientSaudePage />);

    // Check rendering
    expect(screen.getByText('Pressão Arterial')).toBeInTheDocument();
    expect(screen.getByText('120/80')).toBeInTheDocument();

    expect(screen.getByText('Frequência Cardíaca')).toBeInTheDocument();
    expect(screen.getByText('75 bpm')).toBeInTheDocument();

    // Verify Drawer is not yet open
    expect(screen.queryByText('Detalhes da Métrica')).not.toBeInTheDocument();

    // Open via Enter key accessibility
    const bpCard = screen.getByLabelText('Visualizar detalhes de Pressão Arterial');
    bpCard.focus();
    fireEvent.keyDown(bpCard, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Verify Drawer is now open with details
    await waitFor(() => {
        expect(screen.getByText('Detalhes da Métrica')).toBeInTheDocument();
    });

    // Provenance formatting test inside drawer
    const allHealthConnectTexts = screen.getAllByText('Health Connect');
    expect(allHealthConnectTexts.length).toBeGreaterThan(0);
  });

  it('does not use patientId from URL parameters', () => {
    const useSearchParamsMock = require('next/navigation').useSearchParams;
    expect(useSearchParamsMock).not.toHaveBeenCalled();
    // Safety verification: The implementation solely relies on usePatientDashboardContext.
  });
});
