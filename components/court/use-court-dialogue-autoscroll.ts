"use client";

import { useEffect, useRef, type RefObject } from "react";

const AUTO_FOLLOW_THRESHOLD_PX = 56;

function isNearBottom(target: HTMLElement, threshold = AUTO_FOLLOW_THRESHOLD_PX) {
  return target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
}

// 对白框默认自动追底；只有用户主动上翻时才暂时停止，避免抢滚动位置。
export function useCourtDialogueAutoScroll(containerRef: RefObject<HTMLDivElement | null>, triggerKey: string) {
  const autoFollowRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      autoFollowRef.current = isNearBottom(container);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !autoFollowRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [containerRef, triggerKey]);
}
