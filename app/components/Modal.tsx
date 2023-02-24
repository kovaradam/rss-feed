import { XIcon } from '@heroicons/react/outline';
import type { Props as ReactModalProps } from 'react-modal';
import { ClientOnly } from './ClientOnly';
import useSound from 'use-sound';
import closeSound from 'public/sounds/navigation_backward-selection-minimal.wav';
import openSound from 'public/sounds/navigation_forward-selection-minimal.wav';
import ReactModal from 'react-modal';

type Props = ReactModalProps;

export function Modal(props: Props) {
  const [playCloseSound] = useSound(closeSound);
  const [playOpenSound] = useSound(openSound);

  const RenderModal = () => (
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
          boxShadow: '0 0.1rem 5rem -1rem #00000046',
          borderRadius: '0.7rem',
          padding: '0',
          height: 'min-content',
          width: '80ch',
          maxWidth: '90vw',
          ...props.style?.content,
        },
        overlay: props.style?.overlay,
      }}
      appElement={document.body}
    >
      <div className="p-4 pb-6">{props.children}</div>
    </ReactModal>
  );

  return (
    <ClientOnly>
      <RenderModal />
    </ClientOnly>
  );
}
