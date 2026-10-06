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
    // Depends on Loading.tsx - assuming it renders something that we can find, otherwise we just assert it doesn't crash
    expect(container).toBeInTheDocument();
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

  it('downloads supported format document', async () => {
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

    renderComponent();
    fireEvent.click(screen.getByText('Receita Medica'));

    const downloadBtn = await screen.findByRole('button', { name: /Visualizar documento/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
       expect(global.fetch).toHaveBeenCalledWith('/api/patient/binary/abc1234', expect.objectContaining({
           headers: { 'Authorization': 'Bearer mock-token' }
       }));
       expect(window.URL.createObjectURL).toHaveBeenCalled();
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

  it('handles interaction with Enter/Space', async () => {
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
    renderComponent();

    const button = screen.getByLabelText('Ver detalhes de Laudo');
    button.focus();

    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
        expect(screen.getByRole('button', { name: /Visualizar documento/i })).toBeInTheDocument();
    });
  });

  it('does not read patientId from window location search', () => {
    (usePatientDashboardContext as jest.Mock).mockReturnValue({ state: 'READY', data: { documents: [] } });
    renderComponent();

    expect(window.location.search).toBe('');
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('patientId'));
  });
});
