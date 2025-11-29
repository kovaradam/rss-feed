import clsx from "clsx";
import React from "react";

interface Props extends React.ComponentProps<"section"> {
  aside?: React.ReactNode;
}

export function MainSection({ aside, ...props }: Props) {
  return (
    <AsideOutletContext.Provider value={aside}>
      <div className="flex">
        <section
          {...props}
          className={clsx(
            "max-w-[calc(100vw-2*(--spacing(6)))] min-w-2/3 flex-1",
            props.className,
          )}
        />
        <aside className="w-64 pl-4 max-sm:hidden">{aside}</aside>
      </div>
    </AsideOutletContext.Provider>
  );
}

const AsideOutletContext = React.createContext<Props["aside"]>(null);

MainSection.AsideOutlet = function AsideOutlet() {
  return React.useContext(AsideOutletContext);
};
