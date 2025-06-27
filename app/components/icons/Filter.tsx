import React from "react";
import { ClientOnly } from "../ClientOnly";

export function Filter(
  props: React.SVGProps<SVGSVGElement> & { size?: string },
) {
  const stroke = props.stroke ?? "currentColor";
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={props.fill ?? "none"}
      stroke={stroke}
      strokeWidth={props.strokeWidth ?? "2"}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`overflow-visible ${props.className}`}
    >
      <ClientOnly>
        {Array(4)
          .fill(0)
          .map((_, i, arr) => {
            const x = Math.floor(80 / arr.length) * (i + 1);
            const endX = x + (50 - x) / 2;
            const dur = `${300 + (i % 3) * 200}ms`;

            return (
              <circle
                key={i}
                r={`2%`}
                cx={`${x}%`}
                cy={"-10%"}
                fill={stroke}
                className="hidden md:group-hover:block"
              >
                <animate
                  attributeName="cy"
                  values="-20%;10%"
                  dur={dur}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cx"
                  values={`${x}%;${endX}%`}
                  dur={dur}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="fill-opacity"
                  values={`1;0`}
                  dur={dur}
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}
      </ClientOnly>

      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />

      {Array(4)
        .fill(0)
        .map((_, i) => (
          <circle
            key={i}
            r={`2%`}
            cx={`49%`}
            cy={"90%"}
            fill={stroke}
            className="hidden md:group-hover:block"
          >
            <animate
              attributeName="cy"
              values="90%;130%"
              dur=".5s"
              begin={`${i * 0.25}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
    </svg>
  );
}
