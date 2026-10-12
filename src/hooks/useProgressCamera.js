import { useCallback, useEffect, useRef, useState } from 'react';

const getReducedMotion = () => (
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
);

const getCardCenterY = (card) => {
  if (!card) return null;
  return (Number(card.y) || 0) + (Number(card.height) || 90) / 2;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Owns the map camera only for progress events. It deliberately does not
 * subscribe to ordinary scroll position to move the camera back to the
 * character, so user scrolling remains authoritative outside a transition.
 */
export const useProgressCamera = ({
  scrollRef,
  scale,
  mapReady,
  cameraReady,
  currentAnchor,
  currentLessonCard,
  transitionActive,
  transitionPosition,
  transitionTargetPosition,
  transitionTargetCard,
  transitionCompletedAt,
  initializationKey = 0,
}) => {
  const initialCameraAppliedRef = useRef(false);
  const positionRef = useRef(transitionPosition);
  const targetPositionRef = useRef(transitionTargetPosition);
  const targetCardRef = useRef(transitionTargetCard);
  const transitionRafRef = useRef(null);
  const [initialCameraApplied, setInitialCameraApplied] = useState(false);
  const [initialCameraError, setInitialCameraError] = useState(null);

  useEffect(() => {
    positionRef.current = transitionPosition;
    targetPositionRef.current = transitionTargetPosition;
    targetCardRef.current = transitionTargetCard;
  }, [transitionPosition, transitionTargetCard, transitionTargetPosition]);

  useEffect(() => {
    initialCameraAppliedRef.current = false;
    setInitialCameraApplied(false);
    setInitialCameraError(null);
  }, [initializationKey]);

  const scrollToBounds = useCallback((firstPoint, secondPoint, behavior = 'auto', cardOverride = null) => {
    const main = scrollRef.current;
    if (!main || !firstPoint) return;

    const firstY = Number(firstPoint.y) || 0;
    const secondY = secondPoint ? Number(secondPoint.y) || 0 : firstY;
    const cardCenterY = getCardCenterY(cardOverride || targetCardRef.current);
    const minY = Math.min(firstY, secondY, cardCenterY ?? firstY);
    const maxY = Math.max(firstY, secondY, cardCenterY ?? firstY);
    const focusY = (minY + maxY) / 2;
    const viewportHeight = main.clientHeight || window.innerHeight || 0;
    const desiredTop = focusY * scale - viewportHeight * 0.5;
    const maxScrollTop = Math.max(0, main.scrollHeight - main.clientHeight);
    const nextTop = clamp(desiredTop, 0, maxScrollTop);

    if (behavior === 'auto') {
      if (Math.abs(main.scrollTop - nextTop) > 1) main.scrollTop = nextTop;
    } else {
      main.scrollTo({ top: nextTop, behavior });
    }
  }, [scale, scrollRef]);

  // On refresh, restore the view around the persisted current lesson once the
  // map and progress payloads are both available. This runs once per mount.
  useEffect(() => {
    if (transitionActive) {
      // A transition owns the camera from its first frame. Do not let the
      // refresh restore run after the transition has already begun.
      initialCameraAppliedRef.current = true;
      setInitialCameraApplied(true);
      return undefined;
    }
    if (initialCameraAppliedRef.current || !mapReady || !cameraReady || !currentAnchor) return undefined;

    let firstRaf = null;
    let attempts = 0;
    const applyInitialCamera = () => {
      const main = scrollRef.current;
      const dimensionsReady = main && main.clientHeight > 0 && main.clientWidth > 0 && main.scrollHeight > 0;
      if (initialCameraAppliedRef.current) return;
      if (!dimensionsReady && attempts < 120) {
        attempts += 1;
        firstRaf = requestAnimationFrame(applyInitialCamera);
        return;
      }
      if (!dimensionsReady) {
        setInitialCameraError('The map viewport could not be sized. Please try again.');
        return;
      }
      scrollToBounds(currentAnchor, currentAnchor, 'auto', currentLessonCard);
      initialCameraAppliedRef.current = true;
      setInitialCameraApplied(true);
    };

    firstRaf = requestAnimationFrame(applyInitialCamera);

    return () => {
      if (firstRaf !== null) cancelAnimationFrame(firstRaf);
    };
  }, [cameraReady, currentAnchor, currentLessonCard, initializationKey, mapReady, scrollRef, scrollToBounds, transitionActive]);

  // During the lesson-to-lesson journey, follow the transition only. The
  // target is included in the bounds so the destination stays on screen.
  useEffect(() => {
    if (!transitionActive || !positionRef.current) {
      if (transitionRafRef.current !== null) {
        cancelAnimationFrame(transitionRafRef.current);
        transitionRafRef.current = null;
      }
      return undefined;
    }

    const tick = () => {
      const position = positionRef.current;
      if (position) {
        scrollToBounds(position, targetPositionRef.current, 'auto');
      }
      transitionRafRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      if (transitionRafRef.current !== null) {
        cancelAnimationFrame(transitionRafRef.current);
        transitionRafRef.current = null;
      }
    };
  }, [scrollToBounds, transitionActive]);

  // The walking hook keeps the final target available for this one camera
  // correction after the async asset/progress update completes.
  useEffect(() => {
    if (!transitionCompletedAt || !transitionPosition) return;
    scrollToBounds(
      transitionPosition,
      transitionTargetPosition || transitionPosition,
      getReducedMotion() ? 'auto' : 'smooth',
      targetCardRef.current
    );
  }, [scrollToBounds, transitionCompletedAt, transitionPosition, transitionTargetPosition]);

  return {
    initialCameraApplied,
    initialCameraError,
  };
};
