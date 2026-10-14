import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { VitalsModal } from '../../../components/Vitals/VitalsModal';
import { MantineProvider } from '@mantine/core';

// Mock contexts and hooks
const mockCreateResource = jest.fn().mockImplementation((res) => {
  return new Promise((resolve) => setTimeout(() => resolve(res), 50));
});

jest.mock('@medplum/react-hooks', () => ({
  useMedplum: () => ({
    createResource: mockCreateResource,
  }),
}));

jest.mock('../../../contexts/TenantContext', () => ({
  useTenant: () => ({
    tenantConfig: {
      internalColor: '#0d9488',
      activeTenantId: 'tenant-1'
    }
  }),
}));

// ResizeObserver mock
window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(), // Deprecated
  removeListener: jest.fn(), // Deprecated
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

describe('VitalsModal Performance', () => {
  beforeEach(() => {
    mockCreateResource.mockClear();
  });

  it('should save vitals efficiently', async () => {
    const { getByText, getByLabelText } = render(
      <MantineProvider>
        <VitalsModal opened={true} onClose={() => {}} patientId="test-123" />
      </MantineProvider>
    );

    // Fill in all vital signs to trigger maximum creates
    fireEvent.change(getByLabelText(/Pressão Sistólica/i), { target: { value: '120' } });
    fireEvent.change(getByLabelText(/Frequência Cardíaca/i), { target: { value: '75' } });
    fireEvent.change(getByLabelText(/Frequência Respiratória/i), { target: { value: '16' } });
    fireEvent.change(getByLabelText(/Temperatura/i), { target: { value: '36.5' } });
    fireEvent.change(getByLabelText(/Saturação/i), { target: { value: '98' } });
    fireEvent.change(getByLabelText(/Peso/i), { target: { value: '70' } });
    fireEvent.change(getByLabelText(/Altura/i), { target: { value: '170' } });

    const startTime = performance.now();

    const saveButton = getByText(/Salvar Sinais Vitais/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockCreateResource).toHaveBeenCalledTimes(7);
    }, { timeout: 3000 });

    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`Save operation took: ${duration.toFixed(2)}ms`);

    // We expect sequential saves of 50ms each to take > 350ms
    // If parallelized, it should be closer to 50ms total
  });
});
