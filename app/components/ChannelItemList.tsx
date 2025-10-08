import React from "react";
import { StableList } from "./List";

export function ChannelItemList<U>(
  props: React.ComponentProps<typeof StableList<U>>,
) {
  return (
    <StableList
      {...props}
      className={` grid grid-cols-1 gap-4 sm:min-w-[30ch] xl:grid-cols-2  ${props.className}`}
    />
  );
}
