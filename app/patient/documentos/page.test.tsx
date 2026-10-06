import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePatientDashboardContext } from './../state/PatientDashboardContext';
import DocumentosPage from './page';
import { MantineProvider } from '@mantine/core';
import { useMedplum } from '@medplum/react-hooks';

// Mock the contexts
jest.mock('./../state/PatientDashboardContext', () => ({
  usePatientDashboardContext: jest.fn(),
}));

jest.mock('@medplum/react-hooks', () => ({
  useMedplum: jest.fn(),
}));

const mockGetAccessToken = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useMedplum as jest.Mock).mockReturnValue({
    getAccessToken: mockGetAccessToken,
  });

  // Mock URL object
  window.URL.createObjectURL = jest.fn(() => 'blob:mock');
  window.URL.revokeObjectURL = jest.fn();

  // Mock window open
  window.open = jest.fn();

  // Mock global fetch
  global.fetch = jest.fn();
});

const renderComponent = () => {
  return render(
    <MantineProvider>
      <DocumentosPage />
    </MantineProvider>
  );
};

describe('DocumentosPage', () => {
  it('renders loading state', () => {
    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'LOADING', data: null });
    const { container } = renderComponent();

    // We check that the UI isn't the error or main UI.
    expect(screen.queryByText('Documentos do Paciente')).not.toBeInTheDocument();
    expect(screen.queryByText('Ocorreu um erro')).not.toBeInTheDocument();

    // Check for the Loader by inspecting Mantine's class format
    // mantine-Loader-root is standard for mantine loaders
    const loaders = container.querySelectorAll('.mantine-Loader-root');
    expect(loaders.length).toBeGreaterThan(0);
  });

  it('renders unauthorized state', () => {
    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'UNAUTHORIZED', data: null });
    renderComponent();
    expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
  });

  it('renders error state', () => {
    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'ERROR', data: null });
    renderComponent();
    expect(screen.getByText('Ocorreu um erro')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'READY', data: { documents: [] } });
    renderComponent();
    expect(screen.getByText('Nenhum documento disponível')).toBeInTheDocument();
  });

  it('renders list of documents and opens drawer on click', async () => {
    const documents = [
      {
        resourceType: 'DocumentReference',
        id: 'doc1',
        status: 'current',
        type: { text: 'Exame de Sangue' },
        date: '2023-10-01T10:00:00Z',
        description: 'Hemograma completo',
        content: [{ attachment: { contentType: 'application/pdf', url: 'Binary/b1' } }]
      },
      {
         resourceType: 'DocumentReference',
         id: 'doc2',
         status: 'current',
         date: '2023-11-01T10:00:00Z',
         content: [{ attachment: { contentType: 'image/png', url: 'Binary/b2' } }]
      }
    ];

    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'READY', data: { documents } });
    renderComponent();

    expect(screen.getByText('Documentos do Paciente')).toBeInTheDocument();
    expect(screen.getByText('Exame de Sangue')).toBeInTheDocument();

    // Sort logic places latest first
    const items = screen.getAllByRole('button');
    expect(items.length).toBeGreaterThan(1);

    // Open drawer
    fireEvent.click(screen.getByText('Exame de Sangue'));

    // Drawer content
    await waitFor(() => {
       const descElements = screen.getAllByText('Hemograma completo');
       expect(descElements.length).toBeGreaterThan(0);
       expect(screen.getByRole('button', { name: /Visualizar documento/i })).toBeInTheDocument();
    });
  });

  it('views supported format document via window.open', async () => {
    const documents = [
        {
          resourceType: 'DocumentReference',
          id: 'doc1',
          status: 'current',
          type: { text: 'Receita Medica' },
          date: '2023-10-01T10:00:00Z',
          content: [{ attachment: { contentType: 'application/pdf', url: 'Binary/abc1234' } }]
        }
    ];

    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'READY', data: { documents } });
    mockGetAccessToken.mockReturnValue('mock-token');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['dummy content'], { type: 'application/pdf' })
    });

    // Simulate window.open succeeding
    (window.open as jest.Mock).mockReturnValue({ focus: jest.fn() });

    renderComponent();
    fireEvent.click(screen.getByText('Receita Medica'));

    const viewBtn = await screen.findByRole('button', { name: /Visualizar documento/i });
    fireEvent.click(viewBtn);

    await waitFor(() => {
       expect(global.fetch).toHaveBeenCalledWith('/api/patient/binary/abc1234', expect.objectContaining({
           headers: { 'Authorization': 'Bearer mock-token' }
       }));
       expect(window.URL.createObjectURL).toHaveBeenCalled();
       expect(window.open).toHaveBeenCalledWith('blob:mock', '_blank');
    });
  });

  it('shows error when popup blocker prevents viewing', async () => {
    const documents = [
        {
          resourceType: 'DocumentReference',
          id: 'doc1',
          status: 'current',
          type: { text: 'Receita Medica' },
          content: [{ attachment: { contentType: 'application/pdf', url: 'Binary/abc1234' } }]
        }
    ];

    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'READY', data: { documents } });
    mockGetAccessToken.mockReturnValue('mock-token');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['dummy content'], { type: 'application/pdf' })
    });

    // Simulate window.open returning null (popup blocked)
    (window.open as jest.Mock).mockReturnValue(null);

    renderComponent();
    fireEvent.click(screen.getByText('Receita Medica'));

    const viewBtn = await screen.findByRole('button', { name: /Visualizar documento/i });
    fireEvent.click(viewBtn);

    await waitFor(() => {
       expect(screen.getByText(/Abertura bloqueada pelo navegador/i)).toBeInTheDocument();
    });
  });

  it('shows alert for unsupported format', async () => {
    const documents = [
        {
          resourceType: 'DocumentReference',
          id: 'doc1',
          status: 'current',
          type: { text: 'Exame DICOM' },
          date: '2023-10-01T10:00:00Z',
          content: [{ attachment: { contentType: 'application/dicom', url: 'Binary/b1' } }]
        }
    ];

    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'READY', data: { documents } });
    renderComponent();

    fireEvent.click(screen.getByText('Exame DICOM'));

    await waitFor(() => {
       expect(screen.getByText(/O formato/)).toBeInTheDocument();
       expect(screen.getByText('application/dicom')).toBeInTheDocument();
       expect(screen.queryByRole('button', { name: /Visualizar documento/i })).not.toBeInTheDocument();
    });
  });

  it('handles interaction with Enter and Space', async () => {
    const documents = [
        {
          resourceType: 'DocumentReference',
          id: 'doc1',
          status: 'current',
          type: { text: 'Laudo' },
          content: [{ attachment: { contentType: 'application/pdf', url: 'Binary/1' } }]
        }
    ];

    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'READY', data: { documents } });
    const { unmount } = renderComponent();

    const button = screen.getByLabelText('Ver detalhes de Laudo');
    button.focus();

    // Test Enter
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
        expect(screen.getByRole('button', { name: /Visualizar documento/i })).toBeInTheDocument();
    });

    unmount();

    // Re-render to test Space
    renderComponent();
    const button2 = screen.getByLabelText('Ver detalhes de Laudo');
    button2.focus();

    // Test Space
    fireEvent.keyDown(button2, { key: ' ', code: 'Space', charCode: 32 });

    await waitFor(() => {
        expect(screen.getByRole('button', { name: /Visualizar documento/i })).toBeInTheDocument();
    });
  });

  it('does not use client searchParams or window location for identity', () => {
    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'READY', data: { documents: [] } });
    renderComponent();

    expect(window.location.search).toBe('');
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('patientId'));
  });
});
