import { createPortal } from "react-dom";

export function FormsPortal(props: React.PropsWithChildren) {
  const root = globalThis.document?.getElementById("forms");

  if (!root) {
    return null;
  }

  return createPortal(props.children, root);
}
