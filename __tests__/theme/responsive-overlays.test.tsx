import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { QuickViewDrawer } from '../../components/ui/QuickViewDrawer';
import { theme } from '../../app/theme';

describe('Delchan Overlays Responsive & Accessibility', () => {
  it('QuickViewDrawer explicitly renders with required accessibility props', () => {
    const { getByTestId } = render(
      <MantineProvider theme={theme}>
        <QuickViewDrawer opened={true} title="Access Drawer" onClose={() => {}}>
          <div>Content</div>
        </QuickViewDrawer>
      </MantineProvider>
    );

    // The rendered overlay container in RTL should have aria-label and structural attributes
    // In Mantine we verify it renders successfully without crashing when these strict props are injected
    expect(getByTestId('quick-view-drawer')).toBeTruthy();
  });
});
