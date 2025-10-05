import React from "react";
import { getPrefersReducedMotion } from "~/utils";

interface Props<T> {
  timeout: number;
  value: T;
  render(transition: {
    prev: T;
    next: T;
    isTransition: boolean;
    timeout: Props<T>["timeout"];
  }): React.ReactNode;
  getKey?: (value: T) => string;
}

export function TimedTransition<T>(props: Props<T>) {
  const [prev, setPrev] = React.useState(props.value);
  const next = props.value;

  const isDisabled = getPrefersReducedMotion();

  const timeout = React.useMemo(() => {
    return props.timeout - (props.timeout / 2) * Math.random();
  }, [props.timeout]);

  const getKey =
    props.getKey ??
    ((v) => {
      if (React.isValidElement(v)) {
        return v.key ?? v;
      }
      return v;
    });

  React.useEffect(() => {
    if (isDisabled) {
      return;
    }
    const id = window.setTimeout(() => setPrev(next), timeout);
    return () => window.clearTimeout(id);
  }, [setPrev, prev, next, timeout, isDisabled]);

  return props.render({
    prev: isDisabled ? next : prev,
    next,
    timeout,
    isTransition: getKey(prev) !== getKey(next),
  });
}
