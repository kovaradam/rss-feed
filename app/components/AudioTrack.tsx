import React from "react";

interface Props extends React.ComponentProps<"audio"> {
  metadata?: {
    title: string;
    artist: string;
    artworkUrl?: string;
  };
}

export function AudioTrack({ metadata, ...audioProps }: Props) {
  const elementRef = React.useRef<HTMLAudioElement>(null);
  const hasMetadata = !!metadata;

  React.useEffect(() => {
    const audioElement = elementRef.current;
    if (!audioElement || !hasMetadata || !("mediaSession" in navigator)) {
      return;
    }

    const abortController = new AbortController();

    const defaultSkipTime = 10;

    audioElement.addEventListener(
      "play",
      () => {
        (
          Array.from(
            document.querySelectorAll("[data-track]"),
          ) as HTMLAudioElement[]
        ).forEach((e) => {
          if (e !== audioElement) {
            e.pause();
          }
        });

        const actionHandlers: [
          MediaSessionAction,
          MediaSessionActionHandler,
        ][] = [
          [
            "play",
            async () => {
              audioElement.play();
            },
          ],
          [
            "pause",
            () => {
              audioElement.pause();
            },
          ],

          [
            "seekto",
            (details: MediaSessionActionDetails) => {
              if (details.seekTime === undefined) return;

              if (details.fastSeek && "fastSeek" in audioElement) {
                audioElement.fastSeek(details.seekTime);
                return;
              }
              audioElement.currentTime = details.seekTime;
            },
          ],

          [
            "seekbackward",
            (details) => {
              const skipTime = details.seekOffset || defaultSkipTime;
              audioElement.currentTime = Math.max(
                audioElement.currentTime - skipTime,
                0,
              );
            },
          ],

          [
            "seekforward",
            (details) => {
              const skipTime = details.seekOffset || defaultSkipTime;
              audioElement.currentTime = Math.min(
                audioElement.currentTime + skipTime,
                audioElement.duration,
              );
            },
          ],
        ];

        for (const [action, handler] of actionHandlers) {
          try {
            navigator.mediaSession.setActionHandler(action, handler);
          } catch (error) {
            console.error(error);
          }
        }

        (
          [
            "playing",
            "paused",
            "durationchange",
            "durationchange",
            "ratechange",
            "timechange",
          ] as const
        ).forEach((event) => {
          audioElement.addEventListener(event, () => {
            if (event === "playing" || event === "paused") {
              navigator.mediaSession.playbackState = event;
            }

            navigator.mediaSession.setPositionState({
              duration: audioElement.duration,
              position: audioElement.currentTime,
              playbackRate: audioElement.playbackRate,
            });
          });
        });

        navigator.mediaSession.metadata = new MediaMetadata({
          title: metadata?.title,
          artist: metadata?.artist,
          artwork: metadata?.artworkUrl
            ? [{ src: metadata.artworkUrl }]
            : [{ src: "/reading.svg" }],
        });
      },
      { signal: abortController.signal },
    );

    return () => {
      abortController.abort();
    };
  }, [hasMetadata, metadata?.title, metadata?.artist, metadata?.artworkUrl]);

  return (
    <>
      {/*eslint-disable-next-line jsx-a11y/media-has-caption*/}
      <audio
        {...audioProps}
        controls={audioProps.controls !== false}
        preload={audioProps.preload ?? "none"}
        onMouseOverCapture={(e) => {
          e.currentTarget.preload = "auto";
        }}
        ref={elementRef}
        data-track
      />
    </>
  );
}
