import { withAbortController } from "./with-abort-controller";

export function attachOverscroll(element: HTMLDivElement) {
  const nextSibling = element?.nextSibling as HTMLElement | undefined;
  const handler = () => {
    nextSibling?.setAttribute(
      "data-overscroll",
      (element?.scrollHeight ?? 0) > (element?.clientHeight ?? 0)
        ? "true"
        : "false",
    );

    element.setAttribute(
      "data-overscroll",
      element.scrollTop > 10 ? "true" : "false",
    );

    if (
      // scrolled to the end
      element.scrollTop + element.clientHeight >
      element.scrollHeight - 10
    ) {
      nextSibling?.setAttribute("data-overscroll", "false");
    }
  };

  handler();

  return withAbortController(({ signal }) => {
    element?.addEventListener("scroll", handler, { signal });
  });
}
