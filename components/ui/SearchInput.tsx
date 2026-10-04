import React from 'react';
import { TextInput, TextInputProps } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export function SearchInput(props: TextInputProps) {
  return (
    <TextInput
      leftSection={<IconSearch size={16} />}
      placeholder="Pesquisar..."
      data-testid="search-input"
      {...props}
    />
  );
}
