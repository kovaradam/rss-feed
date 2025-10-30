export function withAbortController(fn: (controller: AbortController) => void) {
  const controller = new AbortController();

  fn(controller);

  return () => {
    controller.abort();
  };
}
