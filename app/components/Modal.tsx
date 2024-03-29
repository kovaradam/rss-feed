import type { Props as ReactModalProps } from 'react-modal';
import { ClientOnly } from './ClientOnly';
import useSound from '~/utils/use-sound';
import closeSound from '/sounds/navigation_backward-selection-minimal.wav?url';
import openSound from '/sounds/navigation_forward-selection-minimal.wav?url';
import ReactModal from 'react-modal';
import React from 'react';

type Props = ReactModalProps;

export function Modal(props: Props) {
  return (
    <ClientOnly>
      <RenderModal {...props} />
    </ClientOnly>
  );
}
const RenderModal = (props: Props) => {
  const [playCloseSound] = useSound(closeSound);
  const [playOpenSound] = useSound(openSound);

  return (
    <ReactModal
      onAfterOpen={() => playOpenSound()}
      onAfterClose={() => playCloseSound()}
      {...props}
      style={{
        content: {
          top: '30%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          border: 'none',
          boxShadow: '0 0.1rem 5rem -1rem #00000061',
          borderRadius: '0.7rem',
          padding: '0',
          height: 'min-content',
          width: '80ch',
          maxWidth: '90vw',
          ...props.style?.content,
        },
        overlay: {
          zIndex: '20',
          backgroundColor: '#00000075',
          ...props.style?.overlay,
        },
      }}
      appElement={document.body}
    >
      <div className="p-4 pb-6">{props.children}</div>
    </ReactModal>
  );
};
