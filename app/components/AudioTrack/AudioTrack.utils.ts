import React from "react";

export type AudioMetadata = {
  title: string;
  artist: string;
  artworkUrl?: string;
};

export function useMediaSession(
  audioElementRef: React.RefObject<HTMLAudioElement | null>,
  metadata?: AudioMetadata,
) {
  const hasMetadata = !!metadata;

  const getElement = React.useEffectEvent(() => audioElementRef.current);

  React.useEffect(() => {
    const audioElement = getElement();

    if (!audioElement || !hasMetadata || !("mediaSession" in navigator)) {
      return;
    }

    const abortController = new AbortController();

    audioElement.addEventListener(
      "play",
      () => {
        const defaultSkipTime = 10;
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
            (details) => {
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
      },
      { signal: abortController.signal },
    );

    (
      [
        "play",
        "playing",
        "pause",
        "durationchange",
        "ratechange",
        "timechange",
      ] as const
    ).forEach((event) => {
      audioElement.addEventListener(
        event,
        () => {
          if (event === "playing" || event === "play") {
            (
              Array.from(
                document.querySelectorAll("[data-track]"),
              ) as HTMLAudioElement[]
            ).forEach((e) => {
              if (e !== audioElement) {
                e.pause();
              }
            });

            navigator.mediaSession.metadata = new MediaMetadata({
              title: metadata?.title,
              artist: metadata?.artist,
              artwork: metadata?.artworkUrl
                ? [{ src: metadata.artworkUrl }]
                : [{ src: "/reading.svg" }],
            });

            navigator.mediaSession.playbackState = "playing";
          }

          if (event === "pause") {
            navigator.mediaSession.playbackState = "paused";
          }

          navigator.mediaSession.setPositionState({
            duration: audioElement.duration,
            position: audioElement.currentTime,
            playbackRate: audioElement.playbackRate,
          });
        },
        { signal: abortController.signal },
      );
    });

    return () => {
      abortController.abort();
    };
  }, [hasMetadata, metadata?.title, metadata?.artist, metadata?.artworkUrl]);
}
