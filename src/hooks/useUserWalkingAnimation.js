import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateCharacterProgress } from '../redux/slices/characterProgressSlice';
import { setLessonUnlocked, selectLessonUnlockMap } from '../redux/slices/lessonUnlockSlice';
import { fetchUnlockedLessonAsset } from '../redux/slices/adventureMapSlice';
import { findNearestPointIndex, buildChainedRoadCurve } from '../utils/roadCurveUtils';
import { getOptimizedImageUrl } from '../utils/imageOptimization';
import { toast } from 'react-toastify';

const resolveCardLessonMasterId = (card, progressSummary) => {
  const directCandidates = [
    card?.lessonMasterId,
    card?.lessonMaster,
    card?.lessonId,
    card?.masterId,
  ];

  for (const value of directCandidates) {
    const id = typeof value === 'object' ? value?._id : value;
    if (id) return String(id).trim();
  }

  if (typeof card?.order === 'number' && Array.isArray(progressSummary)) {
    const match = progressSummary.find(
      (p) => Number(p.lessonOrder) === Number(card.order)
    );
    if (match) {
      const id =
        typeof match.lessonMasterId === 'object'
          ? match.lessonMasterId?._id
          : match.lessonMasterId;
      if (id) return String(id).trim();
    }
  }

  return null;
};

export const useUserWalkingAnimation = (mapItems, roadPaths, characterProgress, languageMapProgress, progressSummary) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const unlockMap = useSelector(selectLessonUnlockMap);

  const [isWalking, setIsWalking] = useState(false);
  const [currentPos, setCurrentPos] = useState(null);
  const [facingLeft, setFacingLeft] = useState(false);
  const [walkFrameIndex, setWalkFrameIndex] = useState(0);

  const [isTransitionActive, setIsTransitionActive] = useState(false);
  const [targetCardId, setTargetCardId] = useState(null);
  const [magicUnlockCardId, setMagicUnlockCardId] = useState(null);
  const magicTimerRef = useRef(null);

  const transitionInFlightRef = useRef(false);

  const animationFrameRef = useRef(null);
  const revealTimerRef = useRef(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { 
      mountedRef.current = false; 
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      if (revealTimerRef.current !== null) clearTimeout(revealTimerRef.current);
      if (magicTimerRef.current !== null) clearTimeout(magicTimerRef.current);
    };
  }, []);

  const PENDING_KEY = 'pic2speak_pending_character_transition_v1';

  const readPendingTransition = () => {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.completedLessonMasterId === 'string' &&
        typeof parsed.languageId === 'string'
      ) {
        return parsed;
      }
    } catch { /* ignore */ }
    return null;
  };

  const clearPendingTransition = () => {
    try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
  };

  const pendingNavHintRef = useRef(null);

  useEffect(() => {
    const raw = location.state?.completedLessonMasterId;
    if (!raw) return;

    const normalized =
      typeof raw === 'object' ? String(raw?._id || '').trim() : String(raw).trim();

    if (normalized) {
      pendingNavHintRef.current = normalized;

      try {
        const existing = readPendingTransition();
        if (!existing || existing.completedLessonMasterId !== normalized) {
          localStorage.setItem(PENDING_KEY, JSON.stringify({
            completedLessonMasterId: normalized,
            languageId: String(characterProgress?.languageId || ''),
            createdAt: Date.now(),
          }));
        }
      } catch { /* ignore */ }
    }

    navigate('.', { replace: true, state: {} });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    console.debug('[UserWalking][EFFECT ENTER]');
    if (!characterProgress || !languageMapProgress || !progressSummary || !unlockMap) return;
    if (transitionInFlightRef.current) return;

    const currentId = characterProgress.currentLessonMasterId;
    const normCurrent =
      typeof currentId === 'object'
        ? String(currentId?._id || '').trim()
        : String(currentId || '').trim();

    if (!normCurrent) return;

    let pendingHint = pendingNavHintRef.current;
    let pendingLangId = null;

    if (!pendingHint) {
      const stored = readPendingTransition();
      if (stored) {
        pendingHint = stored.completedLessonMasterId;
        pendingLangId = stored.languageId;
      }
    }

    if (!pendingHint || pendingHint !== normCurrent) {
      if (pendingHint && pendingHint !== normCurrent) {
        console.debug('[UserWalking] stale pending transition — discarding', {
          pendingHint,
          normCurrent,
        });
        pendingNavHintRef.current = null;
        clearPendingTransition();
      }
      return;
    }

    console.debug('[UserWalking] hint captured', pendingHint);

    const visibleCards = Array.isArray(languageMapProgress?.visibleCards)
      ? languageMapProgress.visibleCards
      : [];

    console.debug('[UserWalking] waiting for transition data', {
      visibleCards: visibleCards.length,
      progressSummary: progressSummary?.length,
      unlockCount: Object.keys(unlockMap || {}).length,
    });

    if (visibleCards.length === 0) return;
    if (!Array.isArray(progressSummary) || progressSummary.length === 0) return;
    if (!unlockMap || Object.keys(unlockMap).length === 0) return;

    const currentCardIdx = visibleCards.findIndex((card) => {
      const cardLmId = resolveCardLessonMasterId(card, progressSummary);
      return cardLmId !== null && cardLmId === normCurrent;
    });

    if (currentCardIdx === -1 || currentCardIdx >= visibleCards.length - 1) return;

    const targetCard = visibleCards[currentCardIdx + 1];
    const resolvedTargetLmId = resolveCardLessonMasterId(targetCard, progressSummary);

    if (!resolvedTargetLmId) return;

    const currentCard = visibleCards[currentCardIdx];
    if (typeof targetCard.order === 'number' && typeof currentCard.order === 'number') {
      if (targetCard.order <= currentCard.order) return;
    }

    const targetUnlock = unlockMap[resolvedTargetLmId];
    if (!targetUnlock) return;

    const mainRoad = roadPaths.find(
      (p) => p.visible !== false && Array.isArray(p.points) && p.points.length >= 2
    );
    if (!mainRoad) return;

    const roadPts = [];
    for (let i = 0; i < mainRoad.points.length; i += 2) {
      roadPts.push({ x: mainRoad.points[i], y: mainRoad.points[i + 1] });
    }

    const getBuildingCenter = (bId) => {
      const b = mapItems.find((i) => i.type === 'Buildings' && i.id === bId);
      return b ? { x: b.x + (b.width || 40) / 2, y: b.y + (b.height || 40) / 2 } : null;
    };

    const c1 = getBuildingCenter(currentCard.buildingId);
    const c2 = getBuildingCenter(targetCard.buildingId);

    if (!c1 || !c2) return;

    const startIndex = findNearestPointIndex(roadPts, c1.x, c1.y);
    const endIndex = findNearestPointIndex(roadPts, c2.x, c2.y);

    if (startIndex === endIndex) return;

    const curve = buildChainedRoadCurve(roadPts, startIndex, endIndex);
    if (!curve.length) return;

    if (startIndex > endIndex) curve.reverse();

    console.debug('[UserWalking] transition validated', {
      currentLessonMasterId: normCurrent,
      targetLessonMasterId: resolvedTargetLmId,
    });

    pendingNavHintRef.current = null;

    console.debug('[UserWalking][ROAD_GEOMETRY]', {
      currentLessonMasterId: normCurrent,
      targetLessonMasterId: resolvedTargetLmId,
      currentCardIdx,
      currentOrder: currentCard.order,
      targetOrder: targetCard.order,
      currentBuildingId: currentCard.buildingId,
      targetBuildingId: targetCard.buildingId,
      currentBuildingCenter: c1,
      targetBuildingCenter: c2,
      roadPointCount: roadPts.length,
      startIndex,
      endIndex,
      startRoadPoint: roadPts[startIndex],
      endRoadPoint: roadPts[endIndex],
      curveLength: curve.length,
      curveStart: curve[0],
      curveEnd: curve[curve.length - 1],
    });

    console.debug('[UserWalking] WALK START', {
      currentLessonMasterId: normCurrent,
      targetLessonMasterId: resolvedTargetLmId,
    });

    const capturedLanguageId =
      characterProgress.languageId ||
      pendingLangId ||
      (readPendingTransition()?.languageId ?? '');
    const capturedTargetLmId = resolvedTargetLmId;
    const capturedTargetOrder = targetCard.order;
    const capturedTargetCardId = targetCard.id;

    let dist = 0;
    for (let i = 1; i < curve.length; i++) {
      dist += Math.hypot(curve[i].x - curve[i - 1].x, curve[i].y - curve[i - 1].y);
    }
    const duration = Math.max(1.0, dist / 34) * 1000;

    console.debug('[UserWalking][CURVE_DISTANCE]', { debugDistance: dist, duration });

    transitionInFlightRef.current = true;
    setIsTransitionActive(true);
    setTargetCardId(targetCard.id);
    setCurrentPos(curve[0]);
    setIsWalking(true);

    let start = null;
    let loggedFirstFrame = false;
    let lastDebugTime = 0;

    const animate = (timestamp) => {
      if (!mountedRef.current) return;

      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      let progress = Math.min(elapsed / duration, 1.0);

      progress = -(Math.cos(Math.PI * progress) - 1) / 2;

      const exactIndexFloat = progress * (curve.length - 1);
      const i0 = Math.floor(exactIndexFloat);
      const i1 = Math.min(i0 + 1, curve.length - 1);
      const frac = exactIndexFloat - i0;

      const p0 = curve[i0];
      const p1 = curve[i1];

      const x = p0.x + (p1.x - p0.x) * frac;
      const y = p0.y + (p1.y - p0.y) * frac;

      if (p1.x < p0.x) setFacingLeft(true);
      else if (p1.x > p0.x) setFacingLeft(false);

      if (
        !loggedFirstFrame ||
        timestamp - lastDebugTime >= 500 ||
        progress >= 1
      ) {
        console.debug('[UserWalking][RAF_POSITION]', {
          x,
          y,
          progress,
          curveLength: curve.length,
          curveStart: curve[0],
          curveEnd: curve[curve.length - 1],
        });
        loggedFirstFrame = true;
        lastDebugTime = timestamp;
      }

      setCurrentPos({ x, y });

      if (progress < 1.0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        console.debug('[UserWalking] ARRIVED');
        setCurrentPos(curve[curve.length - 1]);
        setIsWalking(false);

        revealTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;

          console.debug('[UserWalking] updating CharacterProgress');
          dispatch(
            updateCharacterProgress({
              languageId: capturedLanguageId,
              lessonMasterId: capturedTargetLmId,
            })
          ).then((resultAction) => {
            if (updateCharacterProgress.fulfilled.match(resultAction)) {
              console.debug('[UserWalking] CharacterProgress update fulfilled');
              clearPendingTransition();
              toast.success(`Lesson ${capturedTargetOrder} Unlocked! 🎉`, { icon: '✨' });

              // Capture the target card ID before clearing the transition so the
              // magic animation knows which card to light up.
              const capturedCardId = capturedTargetCardId;

              const finishTransition = () => {
                if (!mountedRef.current) return;
                // Trigger the dedicated magic animation state
                setMagicUnlockCardId(capturedCardId);
                // Clear the walking transition — the card stays visible via magicUnlockCardId
                transitionInFlightRef.current = false;
                setIsTransitionActive(false);
                setTargetCardId(null);
                dispatch(setLessonUnlocked({ lessonMasterId: capturedTargetLmId, unlocked: true }));
                // Clear magic animation after 2000ms
                if (magicTimerRef.current) clearTimeout(magicTimerRef.current);
                magicTimerRef.current = setTimeout(() => {
                  if (mountedRef.current) setMagicUnlockCardId(null);
                }, 2000);
              };

              dispatch(fetchUnlockedLessonAsset(capturedTargetLmId)).then((fetchResult) => {
                 if (fetchUnlockedLessonAsset.fulfilled.match(fetchResult)) {
                    const newBuilding = fetchResult.payload;
                    const src = newBuilding?.src || newBuilding?.imageUrl;
                    if (src) {
                       const optSrc = getOptimizedImageUrl(src, { width: (newBuilding.width || 80) * 2 });
                       const img = new window.Image();
                       img.onload = finishTransition;
                       img.onerror = finishTransition;
                       img.src = optSrc;
                    } else {
                       finishTransition();
                    }
                 } else {
                    finishTransition();
                 }
              });
            } else {
              transitionInFlightRef.current = false;
              setIsTransitionActive(false);
              setTargetCardId(null);
            }
          });
        }, 2300);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterProgress, languageMapProgress, mapItems, roadPaths, unlockMap, dispatch, progressSummary]);

  useEffect(() => {
    if (!isWalking) return;
    const interval = setInterval(() => setWalkFrameIndex((i) => i + 1), 150);
    return () => clearInterval(interval);
  }, [isWalking]);

  return { isWalking, isTransitionActive, targetCardId, magicUnlockCardId, currentPos, facingLeft, walkFrameIndex };
};