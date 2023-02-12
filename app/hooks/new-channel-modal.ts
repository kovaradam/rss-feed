import React from 'react';

export const NewChannelModalContext = React.createContext<{
  open: (() => void) | null;
}>({
  open: null,
});
