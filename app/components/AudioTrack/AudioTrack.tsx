import React from "react";
import { AudioMetadata, useMediaSession } from "./AudioTrack.utils";

interface Props extends React.ComponentProps<"audio"> {
  metadata?: AudioMetadata;
}

export function AudioTrack({ metadata, ...audioProps }: Props) {
  const elementRef = React.useRef<HTMLAudioElement>(null);

  useMediaSession(elementRef, metadata);

  return (
    <>
      {/*eslint-disable-next-line jsx-a11y/media-has-caption*/}
      <audio
        {...audioProps}
        controls={audioProps.controls !== false}
        onMouseOverCapture={() => {
          if (elementRef.current) {
            elementRef.current.preload = "auto";
          }
        }}
        preload={audioProps.preload ?? "none"}
        ref={elementRef}
        data-track
      />
    </>
  );
}
