import { XIcon } from '@heroicons/react/outline';
import ReactModal, { Props as ReactModalProps } from 'react-modal';
import { ClientOnly } from './ClientOnly';

type Props = ReactModalProps;

export function Modal(props: Props) {
  return (
    <ClientOnly>
      {() => (
        <ReactModal
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
          <h1 className="relative bg-slate-700 px-4 py-2 text-2xl font-medium text-white ">
            {props.contentLabel}
            <button
              className="absolute right-2 p-1"
              onClick={props.onRequestClose}
            >
              <XIcon className="w-4" />
            </button>
          </h1>
          <div className="p-4 pb-6">{props.children}</div>
        </ReactModal>
      )}
    </ClientOnly>
  );
}
