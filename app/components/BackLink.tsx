import React from "react";
import { useNavigate, Link } from "react-router";
import { HistoryStack } from "~/utils/history-stack";

type Props = Omit<React.ComponentProps<typeof Link>, "onClick" | "children"> & {
  children:
    | ((backEntry: ReturnType<typeof HistoryStack.peek>) => React.JSX.Element)
    | React.ReactNode;
};

export function BackLink({ children, ...props }: Props) {
  const backEntry = HistoryStack.useStack()[1];
  const navigate = useNavigate();

  // Prevent rendering next entry during transition
  const [prevEntry, setPrevEntry] = React.useState<typeof backEntry | null>(
    null,
  );

  return React.createElement(
    backEntry ? "button" : Link,
    {
      type: backEntry ? "button" : undefined,
      ...props,
      onClick: () => {
        if (backEntry) {
          setPrevEntry(backEntry);
          navigate(-1);
        }
      },
    },
    typeof children === "function"
      ? children(prevEntry ?? backEntry)
      : children,
  );
}
