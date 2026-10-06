import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoricoClinicoPage from './page';
import { usePatientDashboardContext } from '../state/PatientDashboardContext';
import { MantineProvider } from '@mantine/core';

jest.mock('../state/PatientDashboardContext', () => ({
  usePatientDashboardContext: jest.fn(),
}));

const mockContext = usePatientDashboardContext as jest.Mock;

describe('HistoricoClinicoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset matchMedia for Mantine
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
  });

  const renderWithMantine = (ui: React.ReactElement) => {
    return render(<MantineProvider>{ui}</MantineProvider>);
  };

  it('renders empty state when there are no clinical events', () => {
    mockContext.mockReturnValue({
      state: 'READY',
      data: {
        observations: { entry: [] },
        diagnostics: { entry: [] },
        medications: { entry: [] },
        documents: { entry: [] },
      },
    });

    renderWithMantine(<HistoricoClinicoPage />);
    expect(screen.getByText('Nenhum registro')).toBeInTheDocument();
    expect(screen.getByText('Você ainda não possui registros no seu histórico clínico.')).toBeInTheDocument();
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

  it('opens drawer with correct data on click, and closes it', async () => {
    mockContext.mockReturnValue({
      state: 'READY',
      data: {
        medications: {
          entry: [
            {
              resource: {
                resourceType: 'MedicationRequest',
                id: 'med-1',
                authoredOn: '2023-10-25T10:00:00Z',
                medicationCodeableConcept: { text: 'Paracetamol' },
                dosageInstruction: [{ text: 'Tomar 1 comprimido de 8 em 8 horas' }],
              },
            },
          ],
        },
      },
    });

    renderWithMantine(<HistoricoClinicoPage />);

    const button = screen.getByRole('button', { name: /Ver detalhes de Paracetamol/i });
    fireEvent.click(button);

    // Use getAllByText for things that appear twice (once in list, once in drawer)
    await waitFor(() => {
        expect(screen.getByText('Detalhes')).toBeInTheDocument();
    });

    // In the drawer there is a close button
    const closeBtn = screen.getByRole('button', { name: /Fechar detalhes/i });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);

    await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Fechar detalhes/i })).not.toBeInTheDocument();
    });
  });

  it('opens drawer on Enter key press', async () => {
    mockContext.mockReturnValue({
      state: 'READY',
      data: {
        documents: {
          entry: [
            {
              resource: {
                resourceType: 'DocumentReference',
                id: 'doc-1',
                date: '2023-10-26T10:00:00Z',
                type: { text: 'Atestado Médico' },
              },
            },
          ],
        },
      },
    });

    renderWithMantine(<HistoricoClinicoPage />);

    const button = screen.getByRole('button', { name: /Ver detalhes de Atestado Médico/i });
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Drawer should open, verifying the close button is visible
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /Fechar detalhes/i })).toBeInTheDocument();
    });
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

      const medElements = screen.getAllByText('Prescrição');
      expect(medElements.length).toBeGreaterThan(0);

      const docElements = screen.getAllByText('Documento Clínico');
      expect(docElements.length).toBeGreaterThan(0);
  });

  it('returns nothing if state is not READY', () => {
    mockContext.mockReturnValue({ state: 'LOADING', data: null });
    renderWithMantine(<HistoricoClinicoPage />);
    expect(screen.queryByText('Histórico Clínico')).not.toBeInTheDocument();
  });
});
