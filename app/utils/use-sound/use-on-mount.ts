import * as React from 'react';

export default function useOnMount(callback: React.EffectCallback) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(callback, []);
}
