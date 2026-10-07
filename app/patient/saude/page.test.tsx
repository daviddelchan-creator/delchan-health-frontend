import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SaudePlaceholderPage from './page';
import { usePatientDashboardContext } from '../state/PatientDashboardContext';
import { MantineProvider } from '@mantine/core';
import React from 'react';
import * as navigation from 'next/navigation';

jest.mock('../state/PatientDashboardContext', () => ({
  usePatientDashboardContext: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// We must also mock matchMedia for components internally
beforeAll(() => {
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

const mockContext = usePatientDashboardContext as jest.Mock;

const renderWithMantine = (ui: React.ReactNode) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe('SaudePlaceholderPage', () => {
  let globalFetch: jest.SpyInstance | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    if (typeof global.fetch === 'function') {
      globalFetch = jest.spyOn(global, 'fetch');
    }
  });

  afterEach(() => {
    if (globalFetch) {
      globalFetch.mockRestore();
    }
  });

  it('renders Loading state correctly for LOADING and INITIALIZING', () => {
    mockContext.mockReturnValue({
      state: 'LOADING',
      data: null,
    });

    // We render the component. It should show the loader SVG from the Loading component.
    const { container } = renderWithMantine(<SaudePlaceholderPage />);

    // Look for the Loader component element wrapper
    expect(container.querySelector('.mantine-Loader-root')).toBeInTheDocument();

    // Test INITIALIZING as well
    mockContext.mockReturnValue({
      state: 'INITIALIZING',
      data: null,
    });
    const { container: containerInit } = renderWithMantine(<SaudePlaceholderPage />);
    expect(containerInit.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('proves no direct fetch is made and no patientId is used (Security against patientId)', () => {
    // 1. Simulate URL/query ?patientId=hacker123
    (navigation.useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === 'patientId' ? 'hacker123' : null),
    });

    // 2. Provide data by PatientDashboardContext
    mockContext.mockReturnValue({
      state: 'READY',
      data: {},
    });

    // 3. Render the page
    renderWithMantine(<SaudePlaceholderPage />);

    // 4. Verify that the page continues to use the context and does not make a fetch call with patientId
    if (globalFetch) {
      expect(globalFetch).not.toHaveBeenCalled();
    }

    // 5. Verify the searchParams were not called in the component itself to select a patient
    expect(navigation.useSearchParams).not.toHaveBeenCalled();

    // Verify it renders the Empty state
    expect(screen.getByText('Minha Saúde')).toBeInTheDocument();
    expect(screen.getByText('Em breve')).toBeInTheDocument();
  });

  it('returns null for ERROR, UNAUTHORIZED, and FORBIDDEN states', () => {
    mockContext.mockReturnValue({ state: 'ERROR' });
    renderWithMantine(<SaudePlaceholderPage />);
    expect(screen.queryByText('Minha Saúde')).not.toBeInTheDocument();

    mockContext.mockReturnValue({ state: 'UNAUTHORIZED' });
    renderWithMantine(<SaudePlaceholderPage />);
    expect(screen.queryByText('Minha Saúde')).not.toBeInTheDocument();

    mockContext.mockReturnValue({ state: 'FORBIDDEN' });
    renderWithMantine(<SaudePlaceholderPage />);
    expect(screen.queryByText('Minha Saúde')).not.toBeInTheDocument();
  });
});
