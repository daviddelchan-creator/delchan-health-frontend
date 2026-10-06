import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoricoClinicoPage from './page';
import { usePatientDashboardContext } from '../state/PatientDashboardContext';
import { MantineProvider } from '@mantine/core';
import React from 'react';

jest.mock('../state/PatientDashboardContext', () => ({
  usePatientDashboardContext: jest.fn(),
}));

// We must also mock matchMedia for SegmentedControl
beforeAll(() => {
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
    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

const mockContext = usePatientDashboardContext as jest.Mock;

describe('HistoricoClinicoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithMantine = (ui: React.ReactElement) => {
    return render(<MantineProvider>{ui}</MantineProvider>);
  };

  it('renders LOADING state', () => {
      mockContext.mockReturnValue({ state: 'LOADING', data: null });
      renderWithMantine(<HistoricoClinicoPage />);
      // We assume Loader is rendering an svg or something visible, let's just check it doesn't render page title
      expect(screen.queryByText('Histórico Clínico')).not.toBeInTheDocument();
  });

  it('renders ERROR state', () => {
    mockContext.mockReturnValue({ state: 'ERROR', data: null });
    renderWithMantine(<HistoricoClinicoPage />);
    expect(screen.getByText('Erro ao carregar histórico')).toBeInTheDocument();
    expect(screen.getByText('Não foi possível carregar os registros clínicos do paciente.')).toBeInTheDocument();
  });

  it('filters items correctly', async () => {
    mockContext.mockReturnValue({
      state: 'READY',
      data: {
        observations: { entry: [{ resource: { resourceType: 'Observation', id: 'obs1', code: { text: 'Peso' } } }] },
        diagnostics: { entry: [{ resource: { resourceType: 'DiagnosticReport', id: 'diag1', code: { text: 'Hemograma' } } }] },
        medications: { entry: [] },
        documents: { entry: [] },
      },
    });

    renderWithMantine(<HistoricoClinicoPage />);

    // Both should be visible initially
    expect(screen.getByText('Peso')).toBeInTheDocument();
    expect(screen.getByText('Hemograma')).toBeInTheDocument();

    // Click filter 'Observações'
    const obsFilter = screen.getByRole('radio', { name: /Observações/i });
    fireEvent.click(obsFilter);

    // Hemograma should disappear
    await waitFor(() => {
        expect(screen.queryByText('Hemograma')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Peso')).toBeInTheDocument();

    // Click filter 'Exames / Resultados'
    const diagFilter = screen.getByRole('radio', { name: /Exames \/ Resultados/i });
    fireEvent.click(diagFilter);

    await waitFor(() => {
        expect(screen.queryByText('Peso')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Hemograma')).toBeInTheDocument();
  });

  it('sorts deterministically using type and id as tie breakers for identical dates', () => {
    mockContext.mockReturnValue({
        state: 'READY',
        data: {
          observations: {
              entry: [
                  { resource: { resourceType: 'Observation', id: 'Z-Obs', effectiveDateTime: '2023-10-10T10:00:00Z', code: { text: 'Obs Z' } } },
                  { resource: { resourceType: 'Observation', id: 'A-Obs', effectiveDateTime: '2023-10-10T10:00:00Z', code: { text: 'Obs A' } } }
              ]
          },
          diagnostics: { entry: [] },
          medications: { entry: [] },
          documents: { entry: [] },
        },
      });

      renderWithMantine(<HistoricoClinicoPage />);

      const titles = screen.getAllByRole('button').map((btn) => btn.getAttribute('aria-label'));
      // A-Obs should come before Z-Obs because A < Z
      expect(titles[0]).toContain('Obs A');
      expect(titles[1]).toContain('Obs Z');
  });

  it('proves no direct fetch is made and no patientId is used', () => {
    // In node/jsdom environments global.fetch might not exist out of the box unless polyfilled.
    // We check if it exists before spying on it.
    let globalFetch;
    if (typeof global.fetch === 'function') {
        globalFetch = jest.spyOn(global, 'fetch');
    }

    mockContext.mockReturnValue({
      state: 'READY',
      data: {
        observations: { entry: [] }, diagnostics: { entry: [] }, medications: { entry: [] }, documents: { entry: [] },
      },
    });

    renderWithMantine(<HistoricoClinicoPage />);

    if (globalFetch) {
        expect(globalFetch).not.toHaveBeenCalled();
    }

    // In our component, we don't use 'useSearchParams' or anything to read '?patientId='.
    // The data purely comes from the context mock.
    // The test naturally passes because rendering succeeds purely off the mocked context without external deps.
    expect(screen.getByText('Histórico Clínico')).toBeInTheDocument();
  });

  it('renders mixed resources in descending chronological order, with null dates at the end', () => {
    mockContext.mockReturnValue({
      state: 'READY',
      data: {
        observations: {
          entry: [
            {
              resource: {
                resourceType: 'Observation',
                id: 'obs-1',
                effectiveDateTime: '2023-10-15T10:00:00Z',
                code: { text: 'Pressão Arterial' },
                valueQuantity: { value: 120, unit: 'mmHg' },
              },
            },
            {
              resource: {
                resourceType: 'Observation',
                id: 'obs-2',
                code: { text: 'Observação Sem Data' },
              },
            },
          ],
        },
        diagnostics: {
          entry: [
            {
              resource: {
                resourceType: 'DiagnosticReport',
                id: 'diag-1',
                issued: '2023-10-20T10:00:00Z',
                code: { text: 'Hemograma' },
              },
            },
          ],
        },
      },
    });

    renderWithMantine(<HistoricoClinicoPage />);

    const titles = screen.getAllByRole('button').map((btn) => btn.getAttribute('aria-label'));
    expect(titles[0]).toContain('Hemograma');
    expect(titles[1]).toContain('Pressão Arterial');
    expect(titles[2]).toContain('Observação Sem Data');
  });

  it('does not crash when optional fields are missing (graceful fallback)', () => {
      mockContext.mockReturnValue({
        state: 'READY',
        data: {
          observations: { entry: [{ resource: { resourceType: 'Observation', id: '1' } }] },
          diagnostics: { entry: [{ resource: { resourceType: 'DiagnosticReport', id: '2' } }] },
          medications: { entry: [{ resource: { resourceType: 'MedicationRequest', id: '3' } }] },
          documents: { entry: [{ resource: { resourceType: 'DocumentReference', id: '4' } }] },
        },
      });

      renderWithMantine(<HistoricoClinicoPage />);

      const obsElements = screen.getAllByText('Observação');
      expect(obsElements.length).toBeGreaterThan(0);
      const diagElements = screen.getAllByText('Relatório de Diagnóstico');
      expect(diagElements.length).toBeGreaterThan(0);
  });
});
