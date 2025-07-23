import type { Props as ReactModalProps } from "react-modal";
import { ClientOnly } from "./ClientOnly";
import useSound from "~/utils/use-sound";
import closeSound from "/sounds/navigation_backward-selection-minimal.wav?url";
import openSound from "/sounds/navigation_forward-selection-minimal.wav?url";
import ReactModal from "react-modal";
import clsx from "clsx";

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
      className={clsx(
        props.className,
        "fixed bottom-[5%] top-auto sm:top-[40%] left-[50%] translate-x-[-50%] translate-y-[-50%]",
        "bg-white dark:border   dark:bg-slate-700 rounded-xl h-min w-[60ch] max-w-[90vw]",
        "p-4 pb-6",
      )}
      overlayClassName={clsx(
        "fixed inset-0 z-20 bg-[#0f183b54]",
        props.overlayClassName,
      )}
      appElement={document.body}
    >
      {props.children}
    </ReactModal>
  );
};
