import { HydratedRouter } from 'react-router/dom';
import React from 'react';
import { hydrateRoot } from 'react-dom/client';

React.startTransition(() => {
  hydrateRoot(
    document,
    <React.StrictMode>
      <HydratedRouter />
    </React.StrictMode>
  );
});
