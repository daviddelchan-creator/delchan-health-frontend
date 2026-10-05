import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../app/theme';
import { Loading } from '../../components/ui/Loading';

describe('Loading Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MantineProvider theme={theme}>
        <Loading />
      </MantineProvider>
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
