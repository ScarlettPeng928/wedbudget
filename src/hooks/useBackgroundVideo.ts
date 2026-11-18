import { useEffect, useRef, useState, type RefObject } from 'react';

// Playback for a muted, looping background video, shared by the hero and the story.
// - Saves battery: pauses while `area` is scrolled out of view and resumes when it's
//   back. Only a video this hook paused is resumed, so it never starts a video early
//   that something else is holding (the intro keeps the hero video on its first frame)
//   and never overrides the visitor's own pause.
// - A looping video must be pausable (WCAG 2.2.2): `toggle` is for a pause/play button.
export function useBackgroundVideo(area: RefObject<HTMLElement | null>, video: RefObject<HTMLVideoElement | null>) {
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false);

  useEffect(() => {
    const el = video.current;
    const box = area.current;
    if (!el || !box) return;
    let pausedForScroll = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !el.paused) {
        el.pause();
        pausedForScroll = true;
      } else if (entry.isIntersecting && pausedForScroll) {
        pausedForScroll = false;
        if (!userPausedRef.current) void el.play().catch(() => {});
      }
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [area, video]);

  const toggle = () => {
    const el = video.current;
    if (!el) return;
    const pause = !userPausedRef.current;
    userPausedRef.current = pause;
    setUserPaused(pause);
    if (pause) el.pause();
    else void el.play().catch(() => {});
  };

  return { userPaused, toggle };
}
