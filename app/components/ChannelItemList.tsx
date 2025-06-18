import { List } from "./List";

export function ChannelItemList(props: React.HTMLProps<HTMLUListElement>) {
  return (
    <List
      className={` grid grid-cols-1 gap-4 sm:min-w-[30ch] xl:grid-cols-2  ${props.className}`}
    >
      {props.children}
    </List>
  );
}
