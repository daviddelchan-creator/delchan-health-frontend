import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import PatientDocumentsScreen from './index';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';

// Mocks
jest.mock('expo-secure-store');
jest.mock('axios');
jest.mock('expo-document-picker');
jest.mock('expo-file-system');
jest.mock('expo-sharing');
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

describe('PatientDocumentsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    process.env.EXPO_PUBLIC_API_URL = 'https://jest-mock.internal';
  });

  it('deve redirecionar para login se não houver token', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

    render(<PatientDocumentsScreen />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
  });

  it('deve exibir mensagem de lista vazia quando não há documentos', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid_token');
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { documents: [] } });

    render(<PatientDocumentsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum documento encontrado.')).toBeTruthy();
    });
  });

  it('deve listar os documentos e permitir upload', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid_token');

    const mockDocuments = [
      {
        id: 'doc-1',
        date: '2023-10-01T10:00:00.000Z',
        content: [{ attachment: { title: 'Exame de Sangue', url: 'Binary/bin-1' } }]
      }
    ];

    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { documents: mockDocuments } });

    render(<PatientDocumentsScreen />);

    await waitFor(() => {
        expect(screen.getByText('Exame de Sangue')).toBeTruthy();
    });

    // Simula upload
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://test.pdf', name: 'test.pdf', mimeType: 'application/pdf' }]
    });

    (axios.post as jest.Mock).mockResolvedValueOnce({ status: 201 });
    // Mock para recarregar a lista após o upload
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { documents: mockDocuments } });

    fireEvent.press(screen.getByText('Adicionar Documento'));

    await waitFor(() => {
        expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled();
        expect(axios.post).toHaveBeenCalledWith(
            'https://jest-mock.internal/api/patient/documents',
            expect.any(FormData),
            expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer valid_token' }) })
        );
    });
  });

  it('deve tentar abrir um documento', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid_token');

    const mockDocuments = [
      {
        id: 'doc-1',
        date: '2023-10-01T10:00:00.000Z',
        content: [{ attachment: { title: 'Raio X', url: 'Binary/bin-2' } }]
      }
    ];

    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { documents: mockDocuments } });

    render(<PatientDocumentsScreen />);

    await waitFor(() => {
        expect(screen.getByText('Raio X')).toBeTruthy();
    });

    (FileSystem.downloadAsync as jest.Mock).mockResolvedValueOnce({ status: 200, uri: 'file://downloaded.pdf' });
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);

    fireEvent.press(screen.getByText('Abrir Original'));

    await waitFor(() => {
        expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
            'https://jest-mock.internal/api/patient/binary/bin-2',
            expect.any(String),
            expect.objectContaining({ headers: { Authorization: 'Bearer valid_token' } })
        );
        expect(Sharing.shareAsync).toHaveBeenCalledWith('file://downloaded.pdf');
    });
  });
});
