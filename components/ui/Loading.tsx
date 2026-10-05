import React from 'react';
import { Loader, LoaderProps, Center } from '@mantine/core';

export interface LoadingProps extends LoaderProps {
  centered?: boolean;
  minHeight?: string | number;
}

export function Loading({ centered = true, minHeight = '100%', ...props }: LoadingProps) {
  const loader = <Loader color="delchanPrimary" type="oval" {...props} />;

  if (centered) {
    return (
      <Center style={{ minHeight, width: '100%' }}>
        {loader}
      </Center>
    );
  }

  return loader;
}
