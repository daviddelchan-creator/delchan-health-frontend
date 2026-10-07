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

  it('renders Loading component on INITIALIZING or LOADING state', () => {
    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'LOADING', data: null });
    const { container } = render(<PatientSaudePage />);
    expect(container.querySelector('.mantine-Loader-root')).toBeInTheDocument();

    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'INITIALIZING', data: null });
    const { container: initContainer } = render(<PatientSaudePage />);
    expect(initContainer.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('proves no direct fetch is made and no patientId is used (Security against patientId)', () => {
    // Check if global fetch exists to spy
    let globalFetch: jest.SpyInstance | undefined;
    if (typeof global.fetch === 'function') {
      globalFetch = jest.spyOn(global, 'fetch');
    }

    // Simulate URL/query ?patientId=hacker123
    const navigation = require('next/navigation');
    (navigation.useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'patientId' ? 'hacker123' : null),
    });

    const mockContextData = {
       profile: { name: [{ given: ['ContextUser'] }] },
       observations: []
    };
    (usePatientDashboardContext as jest.Mock).mockReturnValue({
      state: 'READY',
      data: mockContextData,
    });

    render(<PatientSaudePage />);

    // Verify it continues to use the context and does not make a fetch call with patientId
    if (globalFetch) {
      expect(globalFetch).not.toHaveBeenCalled();
      globalFetch.mockRestore();
    }

    // Verify searchParams were not called in the component to read hacker123
    expect(navigation.useSearchParams).not.toHaveBeenCalled();

    // Verify it renders the expected data cleanly from Context (EmptyState since array is empty)
    expect(screen.getByText('Minha Saúde')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma métrica disponível')).toBeInTheDocument();
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
          { code: { coding: [{ code: '8480-6' }] }, valueQuantity: { value: 120 } },
          { code: { coding: [{ code: '8462-4' }] }, valueQuantity: { value: 80, unit: 'mmHg' } }
        ],
        effectiveDateTime: '2023-10-25T10:00:00Z',
        meta: { source: 'health_connect' },
        extension: [{ url: 'http://delchan.site/health-connect-origin', valueString: 'Sincronizado' }]
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
    expect(screen.getByText('120/80 mmHg')).toBeInTheDocument();

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

  it('opens Drawer manually firing Enter or Space via keyboard accessibility', async () => {
    const mockObs = [
      {
        resourceType: 'Observation',
        id: 'obs-keyboard',
        status: 'final',
        code: { text: 'Teclado Arterial' },
        valueQuantity: { value: 100, unit: 'kg' }
      }
    ];

    (usePatientDashboardContext as jest.Mock).mockReturnValue({
      state: 'READY',
      data: { observations: mockObs },
    });

    render(<PatientSaudePage />);

    const button = screen.getByRole('button', { name: /Visualizar detalhes de Teclado Arterial/i });
    button.focus();

    // Fire Enter
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getAllByText('Teclado Arterial').length).toBeGreaterThan(0);
    });

    // Close (Mantine drawer close button usually doesn't have standard "Close drawer" aria-label by default unless overridden. Let's find by class or querySelector)
    const closeBtn = document.querySelector('.mantine-Drawer-close') as HTMLElement;
    if (closeBtn) fireEvent.click(closeBtn);

    await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Fire Space
    button.focus();
    fireEvent.keyDown(button, { key: ' ', code: 'Space', charCode: 32 });

    await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getAllByText('Teclado Arterial').length).toBeGreaterThan(0);
    });
  });
});
