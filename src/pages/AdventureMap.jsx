import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage, Rect, Text as KonvaText, Group, Line, Path, Arc, Circle, Star, Ellipse } from 'react-konva';
import useImage from 'use-image';

import {
  fetchLessonProgressSummary,
  selectLessonProgressSummary,
  selectLessonProgressStatus,
  selectLessonProgressError,
} from '../redux/slices/lessonProgressSlice';
import {
  fetchLessonUnlocks,
  selectLessonUnlockMap,
  selectLessonUnlockStatus,
  selectLessonUnlockError,
} from '../redux/slices/lessonUnlockSlice';
import {
  fetchCharacterProgress,
  selectCharacterProgress,
  selectCharacterProgressLoading,
  selectCharacterProgressStatus,
  selectCharacterProgressError,
} from '../redux/slices/characterProgressSlice';
import {
  fetchMyStats,
  selectUserProgressStats,
} from '../redux/slices/userProgressSlice';
import {
  fetchMyRewards,
} from '../redux/slices/rewardSlice';
import API from '../api/api';
import { useActiveLanguage } from '../hooks/Useactivelanguage';
import { useUserWalkingAnimation } from '../hooks/useUserWalkingAnimation';
import { useProgressCamera } from '../hooks/useProgressCamera';
import { UserWalkingCharacter } from '../components/UserWalkingCharacter';
import { UserLockedLocation } from '../components/UserLockedLocation';
import { getOptimizedImageUrl } from '../utils/imageOptimization';
import { fetchPublishedMap, fetchUnlockedLessonAsset } from '../redux/slices/adventureMapSlice';
import { findNearestPointOnPolyline } from '../utils/roadCurveUtils';
import Loading from '../ui/Loading';
import {
  getResponsiveLayoutMetrics,
  projectWorldXToScreen,
  projectRoadPointsToScreen,
  DEFAULT_CARD_WIDTH,
  DEFAULT_CARD_HEIGHT,
  DEFAULT_ROAD_WIDTH
} from '../utils/mapProjection';

const VIEWPORT_BUFFER = 1000;
const INITIAL_VIEWPORT_BOUNDS = { top: -VIEWPORT_BUFFER, bottom: 2000 + VIEWPORT_BUFFER };
const DEFAULT_BG_SECTIONS = [{ id: '1', themeKey: 'deep_navy', height: 800, y: 0 }];
const FALLBACK_CATEGORY_ORDER = ['Buildings', 'Trees', 'Characters', 'Street Lights', 'Waterfalls'];
const WORLD_WIDTH = 800;
const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const CARD_MIN_W = 154;
const CARD_MAX_W = 280;
const CARD_MIN_H = 72;
const CARD_PAD_X = 14;
const CARD_PAD_Y = 12;
const CARD_GAP = 10;
const RING_R = 21;
const RING_D = 46;
const TITLE_FONT = 14;
const TITLE_LINE_H = 1.2;
const SUB_FONT = 11;
const SUB_GAP = 3;
const ACTION_H = 28;
const ACTION_GAP = 8;
const CARD_FONT_FAMILY = 'Fredoka, sans-serif';

const STARTED_COUNT_KEYS = [
  'startedScenes',
  'inProgressScenes',
  'attemptedScenes',
  'startedSentences',
  'attemptedSentences',
  'inProgressSentences',
];
const STARTED_ID_KEYS = [
  'currentSceneId',
  'currentSentenceId',
  'lastSceneId',
  'lastSentenceId',
  'lastAttemptedSceneId',
  'lastAttemptedSentenceId',
  'resumeSceneId',
  'resumeSentenceId',
];
const STARTED_DATE_KEYS = ['startedAt', 'lastAttemptedAt', 'lastActivityAt', 'lastAccessedAt'];
const STARTED_STATUSES = ['in_progress', 'in-progress', 'inprogress', 'started', 'active', 'ongoing'];
const NOT_STARTED_STATUSES = ['', 'not_started', 'not-started', 'notstarted', 'locked', 'pending', 'new'];
const SENTENCE_LIST_KEYS = ['scenes', 'sentences', 'sceneProgress', 'sentenceProgress'];

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const isLessonCompleted = (progress) => normalizeStatus(progress?.status) === 'completed';

const hasStartedLesson = (progress) => {
  if (!progress) return false;

  if (Number(progress.completedScenes) > 0) return true;
  if (STARTED_COUNT_KEYS.some((key) => Number(progress[key]) > 0)) return true;
  if (STARTED_ID_KEYS.some((key) => Boolean(progress[key]))) return true;
  if (STARTED_DATE_KEYS.some((key) => Boolean(progress[key]))) return true;
  if (STARTED_STATUSES.includes(normalizeStatus(progress.status))) return true;

  return SENTENCE_LIST_KEYS.some((key) => {
    const list = progress[key];
    if (!Array.isArray(list)) return false;
    return list.some((entry) => {
      if (!entry) return false;
      if (entry.completed === true || entry.isCompleted === true) return true;
      if (Number(entry.attempts) > 0 || Number(entry.attemptCount) > 0) return true;
      return !NOT_STARTED_STATUSES.includes(normalizeStatus(entry.status));
    });
  });
};

const getLessonActionState = (progress) => {
  if (isLessonCompleted(progress)) return 'review';
  return hasStartedLesson(progress) ? 'continue' : 'start';
};

const ACTION_LABELS = {
  start: 'Start',
  continue: 'Continue',
  review: 'Review',
};

const ACTION_COLORS = {
  start: ['#2dd4bf', '#14b8a6'],
  continue: ['#38bdf8', '#0ea5e9'],
  review: ['#818cf8', '#6366f1'],
};

let measureContext = null;

const getMeasureContext = () => {
  if (!measureContext && typeof document !== 'undefined') {
    measureContext = document.createElement('canvas').getContext('2d');
  }
  return measureContext;
};

const measureTextWidth = (text, fontSize, bold = true) => {
  const ctx = getMeasureContext();
  if (!ctx) return String(text).length * fontSize * 0.6;
  ctx.font = `${bold ? 'bold ' : ''}${fontSize}px ${CARD_FONT_FAMILY}`;
  return ctx.measureText(text).width;
};

const layoutTitleLines = (words, fontSize, maxWidth) => {
  const measure = (text) => measureTextWidth(text, fontSize, true);

  const greedy = (limit) => {
    const lines = [];
    let current = '';
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (!current || measure(next) <= limit) {
        current = next;
      } else {
        lines.push(current);
        current = word;
      }
    });
    if (current) lines.push(current);
    return lines;
  };

  let lines = greedy(maxWidth);

  if (lines.length > 1) {
    const targetCount = lines.length;
    let low = Math.max(...words.map(measure));
    let high = maxWidth;
    if (low < high) {
      for (let i = 0; i < 14; i += 1) {
        const mid = (low + high) / 2;
        if (greedy(mid).length <= targetCount) high = mid;
        else low = mid;
      }
      lines = greedy(high);
    }
  }

  const textWidth = lines.length ? Math.max(...lines.map(measure)) : 0;
  return { lines, textWidth };
};

const buildCardLayout = (titleText, subtitle, hasAction) => {
  const words = String(titleText || '').split(/\s+/).filter(Boolean);
  const textBudget = CARD_MAX_W - CARD_PAD_X * 2 - CARD_GAP - RING_D;
  const { lines, textWidth } = layoutTitleLines(words, TITLE_FONT, textBudget);

  const subtitleWidth = subtitle ? measureTextWidth(subtitle, SUB_FONT, false) : 0;
  const contentTextWidth = Math.max(textWidth, subtitleWidth);
  const rawWidth = Math.ceil(contentTextWidth) + CARD_PAD_X * 2 + CARD_GAP + RING_D;
  const cardWidth = Math.min(CARD_MAX_W, Math.max(CARD_MIN_W, rawWidth));
  const titleAreaWidth = cardWidth - CARD_PAD_X * 2 - CARD_GAP - RING_D;

  const titleBlockHeight =
    lines.length * TITLE_FONT * TITLE_LINE_H + (subtitle ? SUB_GAP + SUB_FONT * 1.2 : 0);
  const contentHeight = Math.max(titleBlockHeight, RING_D);
  const cardHeight = Math.max(
    CARD_MIN_H,
    CARD_PAD_Y * 2 + contentHeight + (hasAction ? ACTION_GAP + ACTION_H : 0)
  );

  return {
    lines,
    cardWidth,
    cardHeight,
    titleAreaWidth,
    titleBlockHeight,
    contentHeight,
  };
};

const useFontsReady = () => {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (typeof document === 'undefined' || !document.fonts) return undefined;
    Promise.all([
      document.fonts.load(`bold ${TITLE_FONT}px Fredoka`),
      document.fonts.load(`${SUB_FONT}px Fredoka`),
    ])
      .catch(() => null)
      .then(() => document.fonts.ready)
      .then(() => {
        if (!cancelled) setVersion(1);
      });
    return () => { cancelled = true; };
  }, []);
  return version;
};

const getRequiredMapAssetUrls = (mapItems, bgSections, customThemes, currentLessonMapImage) => {
  const urls = new Set();
  const add = (src, options = {}) => {
    const optimized = getOptimizedImageUrl(src, options);
    if (optimized) urls.add(optimized);
  };

  bgSections.forEach((section) => {
    add(customThemes[section.themeKey]?.image || '');
  });

  mapItems.forEach((item) => {
    const src = item.src || item.imageUrl || '';
    if (!src) return;
    add(src, { width: (item.width || 80) * 2 });
    if (item.type === 'Buildings') add(src, { width: 400 });
  });

  add(currentLessonMapImage, { width: 400 });
  return [...urls];
};

const preloadMapAssets = (urls) => Promise.all(
  urls.map((url) => new Promise((resolve) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve({ url, loaded: true });
    image.onerror = () => resolve({ url, loaded: false });
    image.src = url;
  }))
);

const getItemContent = (item, lang) =>
  (item && item.content && item.content[lang]) || { title: '', published: false };

const normalizeId = (value) => {
  const id = typeof value === 'object' ? value?._id : value;
  return id ? String(id).trim() : null;
};

const resolveLessonMasterId = (card, progressSummary) => {
  const directId = [card?.lessonMasterId, card?.lessonMaster, card?.lessonId, card?.masterId]
    .map(normalizeId);
  const summaryIds = new Set((progressSummary || []).map((entry) => normalizeId(entry.lessonMasterId)).filter(Boolean));
  const knownDirectId = directId.find((id) => summaryIds.has(id));
  if (knownDirectId) return knownDirectId;

  if (typeof card?.order === 'number' && Array.isArray(progressSummary)) {
    const record = progressSummary.find((entry) => Number(entry.lessonOrder) === Number(card.order));
    return normalizeId(record?.lessonMasterId);
  }
  return directId.find(Boolean) || null;
};

const getLanguageMapProgress = (items, lang) => {
  const cards = items
    .filter((item) => item.type === 'Lesson Cards')
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const visibleCards = [];
  for (const card of cards) {
    const content = getItemContent(card, lang);
    if (!content.published || !String(content.title || '').trim()) break;
    visibleCards.push(card);
  }
  const lastCard = visibleCards[visibleCards.length - 1];
  return {
    visibleCards,
    visibleCardIds: new Set(visibleCards.map((card) => card.id)),
    visibleBuildingIds: new Set(visibleCards.map((card) => card.buildingId).filter(Boolean)),
    visibleHeight: lastCard
      ? Math.max(80, lastCard.revealHeight || 0, lastCard.y + (lastCard.height || 72) + 80)
      : 0,
  };
};

const resolveCategoryOrder = (categoriesList, mapItems) => {
  const source = Array.isArray(categoriesList) && categoriesList.length
    ? [...categoriesList]
    : [...FALLBACK_CATEGORY_ORDER];
  mapItems.forEach((item) => {
    const type = item.type || 'Buildings';
    if (type !== 'Roads & Paths' && !source.includes(type)) source.push(type);
  });
  return [...source.filter((cat) => cat !== 'Roads & Paths'), 'Lesson Cards'].filter(
    (cat, index, all) => all.indexOf(cat) === index
  );
};

const MoreLessonsComingSoon = ({ y, worldWidth = 800 }) => {
  const width = 420;
  const x = Math.max(0, (worldWidth - width) / 2);

  const signW = 380;
  const signH = 100;
  const signX = (width - signW) / 2;
  const signY = 15;

  const plaqueW = 340;
  const plaqueH = 100;
  const plaqueX = (width - plaqueW) / 2;
  const plaqueY = signY + signH + 15;

  return (
    <Group x={x} y={y} listening={false}>
      <Group x={width / 2} y={signY + 20}>
        {[-45, -25, 0, 25, 45].map((angle, idx) => (
          <Rect
            key={idx}
            x={-3}
            y={-50}
            width={6}
            height={20}
            fill="#fef08a"
            cornerRadius={3}
            rotation={angle}
            opacity={0.85}
          />
        ))}
      </Group>

      <Group x={signX + 15} y={signY + signH - 12}>
        <Circle radius={18} fill="#22c55e" />
        <Circle x={20} radius={14} fill="#16a34a" />
        <Circle x={-15} y={8} radius={12} fill="#15803d" />
        <Circle x={30} y={5} radius={8} fill="#fde047" />
        <Circle x={-5} y={-5} radius={6} fill="#facc15" />
      </Group>

      <Group x={signX + signW - 35} y={signY + signH - 12}>
        <Circle radius={18} fill="#22c55e" />
        <Circle x={-20} radius={14} fill="#16a34a" />
        <Circle x={15} y={8} radius={12} fill="#15803d" />
        <Circle x={-30} y={5} radius={8} fill="#fde047" />
        <Circle x={5} y={-5} radius={6} fill="#facc15" />
      </Group>

      <Group x={signX} y={signY}>
        <Rect
          x={0}
          y={6}
          width={signW}
          height={signH}
          cornerRadius={18}
          fill="rgba(0, 0, 0, 0.25)"
        />
        <Rect
          x={0}
          y={0}
          width={signW}
          height={signH}
          cornerRadius={18}
          fill="#5c3a21"
          stroke="#3d2314"
          strokeWidth={3}
        />
        <Rect
          x={6}
          y={6}
          width={signW - 12}
          height={signH - 12}
          cornerRadius={14}
          fill="#8b5a2b"
        />
        <Rect x={10} y={10} width={signW - 20} height={36} cornerRadius={8} fill="#9f6b35" />
        <Rect x={10} y={50} width={signW - 20} height={38} cornerRadius={8} fill="#855223" />

        <Circle x={18} y={18} radius={3.5} fill="#3d2314" />
        <Circle x={17} y={17} radius={2} fill="#d1d5db" />
        <Circle x={signW - 18} y={18} radius={3.5} fill="#3d2314" />
        <Circle x={signW - 19} y={17} radius={2} fill="#d1d5db" />
        <Circle x={18} y={signH - 18} radius={3.5} fill="#3d2314" />
        <Circle x={17} y={signH - 19} radius={2} fill="#d1d5db" />
        <Circle x={signW - 18} y={signH - 18} radius={3.5} fill="#3d2314" />
        <Circle x={signW - 19} y={signH - 19} radius={2} fill="#d1d5db" />

        <KonvaText
          text="More Lessons"
          x={0}
          y={15}
          width={signW}
          align="center"
          fontSize={22}
          fontStyle="bold"
          fill="#ffffff"
          fontFamily="Fredoka, sans-serif"
          shadowColor="rgba(0,0,0,0.6)"
          shadowBlur={4}
          shadowOffsetY={2}
        />
        <KonvaText
          text="Coming Soon!"
          x={0}
          y={48}
          width={signW}
          align="center"
          fontSize={26}
          fontStyle="bold"
          fill="#fde047"
          fontFamily="Fredoka, sans-serif"
          shadowColor="rgba(0,0,0,0.7)"
          shadowBlur={5}
          shadowOffsetY={2}
        />
      </Group>

      <Group x={signX + signW - 30} y={signY + 25}>
        <Circle radius={22} fill="#d97706" />
        <Circle x={-2} y={3} radius={14} fill="#fef3c7" />
        <Ellipse x={-20} y={-8} radiusX={8} radiusY={16} fill="#78350f" rotation={-20} />
        <Ellipse x={18} y={-8} radiusX={8} radiusY={16} fill="#78350f" rotation={20} />
        <Circle x={-8} y={-4} radius={3} fill="#1e293b" />
        <Circle x={6} y={-4} radius={3} fill="#1e293b" />
        <Circle x={-9} y={-5} radius={1} fill="#ffffff" />
        <Circle x={5} y={-5} radius={1} fill="#ffffff" />
        <Ellipse x={-1} y={2} radiusX={3.5} radiusY={2.5} fill="#1e293b" />
        <Arc x={-1} y={4} innerRadius={2} outerRadius={3} angle={180} rotation={0} fill="#1e293b" />
        <Rect x={-12} y={18} width={22} height={5} cornerRadius={2} fill="#ef4444" />
        <Circle x={-1} y={22} radius={2.5} fill="#facc15" />
      </Group>

      <Group x={plaqueX} y={plaqueY}>
        <Rect
          x={0}
          y={4}
          width={plaqueW}
          height={plaqueH}
          cornerRadius={22}
          fill="rgba(0, 0, 0, 0.15)"
        />
        <Rect
          x={0}
          y={0}
          width={plaqueW}
          height={plaqueH}
          cornerRadius={22}
          fill="#fffbeb"
          stroke="#fde68a"
          strokeWidth={2.5}
        />
        <KonvaText
          text="Great job! 🎉"
          x={0}
          y={16}
          width={plaqueW}
          align="center"
          fontSize={18}
          fontStyle="bold"
          fill="#1e293b"
          fontFamily="Fredoka, sans-serif"
        />
        <KonvaText
          text={"You've reached the end for now.\nNew lessons are on the way!"}
          x={10}
          y={44}
          width={plaqueW - 20}
          align="center"
          fontSize={13}
          lineHeight={1.4}
          fill="#64748b"
          fontFamily="Fredoka, sans-serif"
        />
      </Group>
    </Group>
  );
};

const GlassSweep = ({ cardWidth, cardHeight, isHovered }) => {
  const groupRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (REDUCED_MOTION) return;
    const DURATION = 1900;
    const sweepW = cardWidth * 0.7;
    const totalDist = cardWidth + sweepW;
    let startTime = null;

    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % DURATION) / DURATION;
      const pos = isHovered 
        ? cardWidth - progress * totalDist 
        : -sweepW + progress * totalDist;

      if (groupRef.current) {
        groupRef.current.x(pos);
        groupRef.current.getLayer()?.batchDraw();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cardWidth, isHovered]);

  if (REDUCED_MOTION) {
    return (
      <Rect
        x={0}
        y={0}
        width={cardWidth * 0.35}
        height={cardHeight}
        fill="rgba(255,255,255,0.1)"
        listening={false}
      />
    );
  }

  return (
    <Group ref={groupRef} listening={false}>
      <Rect
        x={0}
        y={-cardHeight}
        width={cardWidth * 0.7}
        height={cardHeight * 3}
        fill="rgba(255,255,255,0.13)"
        rotation={-22}
        listening={false}
      />
    </Group>
  );
};

const CircularProgressRing = ({ cx, cy, r, pct, isCompleted, progressText, glowColor, isUnlocked }) => {
  const strokeW = 3.5;
  const bgR = r;
  const fgAngle = Math.min(pct / 100, 1) * 360;

  const trackColor = 'rgba(255,255,255,0.12)';
  const fillColor = isCompleted
    ? '#10b981'
    : isUnlocked
      ? glowColor.replace('0.6', '0.9').replace('0.5', '0.9')
      : 'rgba(255,255,255,0.35)';

  return (
    <Group x={cx} y={cy} listening={false}>
      <Circle
        radius={bgR}
        stroke={trackColor}
        strokeWidth={strokeW}
        fill="transparent"
        listening={false}
      />
      {fgAngle > 0 && (
        <Arc
          innerRadius={bgR - strokeW}
          outerRadius={bgR}
          angle={fgAngle}
          rotation={-90}
          fill={fillColor}
          listening={false}
        />
      )}
      {isCompleted ? (
        <KonvaText
          text="✓"
          x={-r} y={-r * 0.38}
          width={r * 2}
          align="center"
          fontSize={r * 0.8}
          fontStyle="bold"
          fill="#10b981"
          fontFamily="Fredoka, sans-serif"
          listening={false}
        />
      ) : progressText ? (
        <KonvaText
          text={progressText}
          x={-r} y={-r * 0.32}
          width={r * 2}
          align="center"
          fontSize={Math.max(7, r * 0.52)}
          fontStyle="bold"
          fill="rgba(255,255,255,0.85)"
          fontFamily="Fredoka, sans-serif"
          listening={false}
        />
      ) : null}
    </Group>
  );
};

const CardMagicBurst = ({ cardWidth, cardHeight, active }) => {
  const groupRef = useRef(null);
  const glowRef = useRef(null);
  const ringRef = useRef(null);
  const sparkleRefs = useRef([]);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const cx = cardWidth / 2;
  const cy = cardHeight / 2;

  const sparkles = useMemo(() => {
    const count = 15;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const rx = cardWidth * (0.55 + (i % 3) * 0.12);
      const ry = cardHeight * (0.9 + (i % 3) * 0.2);
      return {
        x: cx + Math.cos(angle) * rx,
        y: cy + Math.sin(angle) * ry,
        size: 3 + (i % 3) * 1.5,
        phase: (i / count) * Math.PI * 2,
      };
    });
  }, [cx, cy, cardWidth, cardHeight]);

  useEffect(() => {
    if (!active || REDUCED_MOTION) return undefined;
    startRef.current = null;

    const tick = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) / 1000;

      if (glowRef.current) {
        const pulse = 0.65 + Math.sin(elapsed * 4) * 0.35;
        glowRef.current.opacity(Math.max(0, pulse));
        const s = 1 + Math.sin(elapsed * 3.2) * 0.08;
        glowRef.current.scaleX(s);
        glowRef.current.scaleY(s);
      }
      if (ringRef.current) {
        const t = (elapsed % 1.5) / 1.5;
        ringRef.current.radiusX(cardWidth * 0.3 + t * cardWidth * 0.45);
        ringRef.current.radiusY(cardHeight * 0.5 + t * cardHeight * 0.8);
        ringRef.current.opacity(Math.max(0, 0.8 * (1 - t)));
      }
      sparkleRefs.current.forEach((node, i) => {
        if (!node) return;
        const tw = 0.5 + Math.sin(elapsed * 5 + sparkles[i].phase) * 0.5;
        node.opacity(tw);
        const s = 0.7 + tw * 0.8;
        node.scaleX(s);
        node.scaleY(s);
        node.rotation(elapsed * 60 * (i % 2 === 0 ? 1 : -1));
      });

      groupRef.current?.getLayer()?.batchDraw();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, sparkles, cardWidth, cardHeight]);

  if (!active) return null;

  return (
    <Group ref={groupRef} listening={false}>
      <Ellipse
        ref={glowRef}
        x={cx}
        y={cy}
        radiusX={cardWidth * 0.65}
        radiusY={cardHeight * 1.2}
        fill="rgba(253, 230, 138, 0.85)"
        shadowColor="#f59e0b"
        shadowBlur={40}
        opacity={0.8}
        listening={false}
      />
      <Ellipse
        ref={ringRef}
        x={cx}
        y={cy}
        radiusX={cardWidth * 0.3}
        radiusY={cardHeight * 0.5}
        stroke="#fbbf24"
        strokeWidth={3}
        opacity={0.8}
        fill="transparent"
        listening={false}
      />
      {sparkles.map((sp, i) => (
        <Star
          key={i}
          ref={(node) => { sparkleRefs.current[i] = node; }}
          x={sp.x}
          y={sp.y}
          numPoints={4}
          innerRadius={sp.size * 0.3}
          outerRadius={sp.size}
          fill="#fffbeb"
          shadowColor="#fde68a"
          shadowBlur={6}
          opacity={0.9}
          listening={false}
        />
      ))}
    </Group>
  );
};

const UserLessonCard = React.memo(({ item, activeLanguage, progress, isUnlocked: isUnlockedProp, onNodeClick, revealed = true, magicUnlock = false }) => {
  const content = getItemContent(item, activeLanguage);
  const isUnlocked = Boolean(isUnlockedProp);
  const [isHovered, setIsHovered] = useState(false);
  const fontsVersion = useFontsReady();

  const titleText = content.title ? content.title.toUpperCase() : 'UNTITLED';
  const lessonNumber = progress?.lessonOrder ?? item.order;
  const subtitle = lessonNumber != null && lessonNumber !== '' ? `Lesson ${lessonNumber}` : '';

  const layout = useMemo(
    () => buildCardLayout(titleText, subtitle, isUnlocked),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [titleText, subtitle, isUnlocked, fontsVersion]
  );

  const { lines, cardWidth, cardHeight, titleAreaWidth, titleBlockHeight, contentHeight } = layout;

  const baseWidth = item.width || CARD_MIN_W;
  const baseHeight = item.height || CARD_MIN_H;
  const baseX = Math.max(0, Number(item.x) || 0);
  const screenX = Math.min(
    Math.max(0, baseX + (baseWidth - cardWidth) / 2),
    Math.max(0, WORLD_WIDTH - cardWidth)
  );
  const screenY = (Number(item.y) || 0) + (baseHeight - cardHeight) / 2;

  const halfW = cardWidth / 2;
  const halfH = cardHeight / 2;
  const innerGroupRef = useRef(null);
  const hasAnimatedRef = useRef(false);
  const entranceRafRef = useRef(null);
  const initialRevealedRef = useRef(revealed);

  useLayoutEffect(() => {
    const node = innerGroupRef.current;
    if (!node) return;
    if (REDUCED_MOTION || initialRevealedRef.current) {
      hasAnimatedRef.current = true;
      return;
    }
    node.x(halfW - 100);
    node.opacity(0);
    node.scaleX(0.92);
    node.scaleY(0.92);
    node.getLayer()?.batchDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (REDUCED_MOTION) return undefined;
    if (!revealed) return undefined;
    if (hasAnimatedRef.current) return undefined;
    hasAnimatedRef.current = true;

    const node = innerGroupRef.current;
    if (!node) return undefined;

    const DURATION = 650;
    const fromX = halfW - 100;
    const toX = halfW;
    const fromScale = 0.92;
    const toScale = 1;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    let start = null;

    const tick = (timestamp) => {
      if (start === null) start = timestamp;
      const t = Math.min((timestamp - start) / DURATION, 1);
      const eased = easeOutCubic(t);
      node.x(fromX + (toX - fromX) * eased);
      node.opacity(eased);
      const s = fromScale + (toScale - fromScale) * eased;
      node.scaleX(s);
      node.scaleY(s);
      node.getLayer()?.batchDraw();
      if (t < 1) {
        entranceRafRef.current = requestAnimationFrame(tick);
      } else {
        entranceRafRef.current = null;
      }
    };
    entranceRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (entranceRafRef.current) {
        cancelAnimationFrame(entranceRafRef.current);
        entranceRafRef.current = null;
      }
    };
  }, [revealed, halfW]);

  useEffect(() => {
    return () => {
      if (entranceRafRef.current) cancelAnimationFrame(entranceRafRef.current);
    };
  }, []);

  const completedScenes =
    typeof progress?.completedScenes === 'number' ? progress.completedScenes : null;
  const totalScenes =
    typeof progress?.totalScenes === 'number' ? progress.totalScenes : null;

  const hasProgress = progress != null;
  const showProgress = hasProgress && totalScenes !== null && completedScenes !== null;

  const isCompleted = isLessonCompleted(progress);

  const pct = isCompleted
    ? 100
    : showProgress && totalScenes > 0
      ? Math.round((completedScenes / totalScenes) * 100)
      : 0;

  const progressText = showProgress ? `${completedScenes}/${totalScenes}` : null;

  const actionState = getLessonActionState(progress);
  const actionLabel = ACTION_LABELS[actionState];
  const [actionColorTop, actionColorBottom] = ACTION_COLORS[actionState];

  let colorStart = '#0f172a';
  let colorEnd = '#020617';
  let glowColor = 'rgba(56, 189, 248, 0.5)';

  if (!isUnlocked) {
    colorStart = '#1e293b';
    colorEnd = '#0f172a';
    glowColor = 'rgba(255, 255, 255, 0.1)';
  } else if (titleText.includes('HOME')) {
    colorStart = '#064e3b';
    colorEnd = '#022c22';
    glowColor = 'rgba(16, 185, 129, 0.6)';
  } else if (titleText.includes('KITCHEN')) {
    colorStart = '#0f766e';
    colorEnd = '#115e59';
    glowColor = 'rgba(20, 184, 166, 0.6)';
  } else {
    colorStart = '#1e1b4b';
    colorEnd = '#0f172a';
    glowColor = 'rgba(99, 102, 241, 0.6)';
  }

  const cardStroke = (isHovered && isUnlocked) ? glowColor : 'rgba(255,255,255,0.25)';
  const radius = 18;

  const ringCx = cardWidth - CARD_PAD_X - RING_D / 2;
  const ringCy = CARD_PAD_Y + contentHeight / 2;

  const titleBlockY = CARD_PAD_Y + (contentHeight - titleBlockHeight) / 2;
  const titleTextHeight = lines.length * TITLE_FONT * TITLE_LINE_H;

  const actionW = cardWidth - CARD_PAD_X * 2;
  const actionY = cardHeight - CARD_PAD_Y - ACTION_H;

  const lockSvgPath = "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z M7 11V7a5 5 0 0 1 10 0v4";

  const setCursor = (e, value) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = value;
  };

  return (
    <Group
      x={screenX}
      y={screenY}
      onClick={(e) => {
        e.cancelBubble = true;
        if (isUnlocked) onNodeClick?.(item);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        if (isUnlocked) onNodeClick?.(item);
      }}
      onMouseEnter={(e) => {
        if (!isUnlocked) return;
        setIsHovered(true);
        setCursor(e, 'pointer');
      }}
      onMouseLeave={(e) => {
        if (!isUnlocked) return;
        setIsHovered(false);
        setCursor(e, 'default');
      }}
      opacity={isUnlocked ? 1 : 0.6}
    >
      <CardMagicBurst cardWidth={cardWidth} cardHeight={cardHeight} active={magicUnlock} />
      <Group
        ref={innerGroupRef}
        x={halfW}
        y={halfH}
        offsetX={halfW}
        offsetY={halfH}
        opacity={1}
        scaleX={1}
        scaleY={1}
      >
        <Rect
          width={cardWidth}
          height={cardHeight}
          cornerRadius={radius}
          fill="transparent"
          shadowColor={isHovered && isUnlocked ? glowColor : '#000000'}
          shadowBlur={isHovered && isUnlocked ? 24 : 12}
          shadowOpacity={isHovered && isUnlocked ? 0.6 : 0.4}
          shadowOffsetY={isHovered && isUnlocked ? 8 : 4}
          listening={false}
        />
        <Rect
          width={cardWidth}
          height={cardHeight}
          cornerRadius={radius}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: cardWidth, y: cardHeight }}
          fillLinearGradientColorStops={[0, colorStart, 1, colorEnd]}
          stroke={cardStroke}
          strokeWidth={isHovered && isUnlocked ? 2 : 1.5}
        />
        <Rect
          x={8} y={4}
          width={cardWidth - 16}
          height={cardHeight * 0.38}
          cornerRadius={[radius - 4, radius - 4, 0, 0]}
          fill="rgba(255,255,255,0.09)"
          listening={false}
        />

        {isUnlocked && (
          <Group
            clipFunc={(ctx) => {
              ctx.beginPath();
              ctx.roundRect(0, 0, cardWidth, cardHeight, radius);
              ctx.closePath();
            }}
          >
            <GlassSweep cardWidth={cardWidth} cardHeight={cardHeight} isHovered={isHovered} />
          </Group>
        )}

        <KonvaText
          text={lines.join('\n')}
          x={CARD_PAD_X}
          y={titleBlockY}
          width={titleAreaWidth}
          height={titleTextHeight}
          align="center"
          wrap="none"
          lineHeight={TITLE_LINE_H}
          fontSize={TITLE_FONT}
          fontStyle="bold"
          fill="#ffffff"
          fontFamily={CARD_FONT_FAMILY}
          shadowColor="rgba(0,0,0,0.55)"
          shadowBlur={3}
          shadowOffsetY={1}
          listening={false}
        />

        {subtitle ? (
          <KonvaText
            text={subtitle}
            x={CARD_PAD_X}
            y={titleBlockY + titleTextHeight + SUB_GAP}
            width={titleAreaWidth}
            align="center"
            wrap="none"
            fontSize={SUB_FONT}
            fill="rgba(255,255,255,0.75)"
            fontFamily={CARD_FONT_FAMILY}
            listening={false}
          />
        ) : null}

        {showProgress && (
          <CircularProgressRing
            cx={ringCx}
            cy={ringCy}
            r={RING_R}
            pct={pct}
            isCompleted={isCompleted}
            progressText={progressText}
            glowColor={glowColor}
            isUnlocked={isUnlocked}
          />
        )}

        {isUnlocked && (
          <Group x={CARD_PAD_X} y={actionY} listening={false}>
            <Rect
              width={actionW}
              height={ACTION_H}
              cornerRadius={ACTION_H / 2}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: 0, y: ACTION_H }}
              fillLinearGradientColorStops={[0, actionColorTop, 1, actionColorBottom]}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={1}
              shadowColor="#000000"
              shadowBlur={6}
              shadowOpacity={0.3}
              shadowOffsetY={2}
              listening={false}
            />
            <KonvaText
              text={`${actionLabel} →`}
              x={0}
              y={0}
              width={actionW}
              height={ACTION_H}
              align="center"
              verticalAlign="middle"
              wrap="none"
              fontSize={14}
              fontStyle="bold"
              fill="#ffffff"
              fontFamily={CARD_FONT_FAMILY}
              listening={false}
            />
          </Group>
        )}

        {!isUnlocked && (
          <Path
            x={ringCx - 9}
            y={ringCy - 9}
            data={lockSvgPath}
            fill="none"
            stroke={showProgress ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.55)'}
            strokeWidth={showProgress ? 1.6 : 1.8}
            scaleX={0.75}
            scaleY={0.75}
            listening={false}
          />
        )}
      </Group>
    </Group>
  );
});

const UserBackgroundSection = React.memo(({ sec, customThemes, stageWidth, worldWidth, visibleHeight }) => {
  const tObj = customThemes[sec.themeKey] || {};
  const [bgImg] = useImage(getOptimizedImageUrl(tObj.image || ''));
  const sectionHeight = Math.max(sec.height || 800, (visibleHeight || 800) - (sec.y || 0));
  return (
    <Group y={sec.y} listening={false}>
      <Rect
        name="bg-rect"
        width={worldWidth || stageWidth}
        height={sectionHeight}
        fill={bgImg ? undefined : (tObj.color || '#071426')}
        fillPatternImage={bgImg || undefined}
        fillPatternRepeat="repeat"
        listening={false}
      />
    </Group>
  );
});

const UserCanvasItem = React.memo(({ item, metrics, onNodeClick }) => {
  void metrics;
  const screenX = Math.max(0, Number(item.x) || 0);
  const [img, status] = useImage(getOptimizedImageUrl(item.src || item.imageUrl || '', { width: (item.width || 80) * 2 }));
  
  if (status === 'failed') {
    return <UserLockedLocation item={item} />;
  }
  
  return (
    <Group
      x={screenX} y={item.y}
      scaleX={item.scaleX || 1} scaleY={item.scaleY || 1} rotation={item.rotation || 0}
      onClick={onNodeClick ? (e) => { e.cancelBubble = true; onNodeClick(item); } : undefined}
      onTap={onNodeClick ? (e) => { e.cancelBubble = true; onNodeClick(item); } : undefined}
      listening={!!onNodeClick}
    >
      {img ? (
        <KonvaImage image={img} width={item.width || 40} height={item.height || 40} listening={!!onNodeClick} />
      ) : null}
    </Group>
  );
});

const UserRoadPath = React.memo(({ path, metrics }) => {
  void metrics;
  const projectedPoints = path.points;
  const roadWidth = Math.max(28, Number(path.width) || DEFAULT_ROAD_WIDTH);

  return (
    <Group listening={false}>
      <Line
        points={projectedPoints}
        stroke="rgba(0, 240, 255, 0.4)"
        strokeWidth={roadWidth + 14}
        lineCap="round"
        lineJoin="round"
        tension={0.4}
        shadowColor="#00f0ff"
        shadowBlur={16}
        shadowOpacity={0.7}
        listening={false}
        perfectDrawEnabled={false}
      />
      <Line
        points={projectedPoints}
        stroke="#00f0ff"
        strokeWidth={roadWidth + 6}
        lineCap="round"
        lineJoin="round"
        tension={0.4}
        listening={false}
        perfectDrawEnabled={false}
      />
      <Line
        points={projectedPoints}
        stroke="#1a1c3d"
        strokeWidth={roadWidth}
        lineCap="round"
        lineJoin="round"
        tension={0.4}
        dash={path.dash}
        listening={false}
        perfectDrawEnabled={false}
      />
      <Line
        points={projectedPoints}
        stroke="#3b82f6"
        strokeWidth={roadWidth * 0.55}
        lineCap="round"
        lineJoin="round"
        tension={0.4}
        opacity={0.4}
        listening={false}
        perfectDrawEnabled={false}
      />
      <Line
        points={projectedPoints}
        stroke="#ffffff"
        strokeWidth={Math.max(3, roadWidth * 0.08)}
        lineCap="round"
        lineJoin="round"
        tension={0.4}
        opacity={0.9}
        dash={[14, 12]}
        listening={false}
        perfectDrawEnabled={false}
      />
    </Group>
  );
});

const CurrentLessonPanel = ({ currentLessonProgress, currentLessonMasterId, lessonImage, navigate }) => {
  if (!currentLessonProgress || !currentLessonMasterId) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 p-3 text-center shrink-0">
        <p className="text-xs text-slate-500">Choose a lesson to begin</p>
      </div>
    );
  }

  const completedScenes = currentLessonProgress.completedScenes ?? 0;
  const totalScenes = currentLessonProgress.totalScenes ?? 0;
  const title = currentLessonProgress.title || 'Lesson';
  const lessonOrder = currentLessonProgress.lessonOrder || '—';
  const scenesDisplay = totalScenes > 0 ? `${completedScenes}/${totalScenes}` : '—/—';

  const actionState = getLessonActionState(currentLessonProgress);
  const panelActionLabel =
    actionState === 'start'
      ? 'Start Learning →'
      : actionState === 'review'
        ? 'Review Lesson →'
        : 'Continue Learning →';

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
      <div className="bg-teal-600 text-white px-3 py-2 flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold leading-tight">{title}</h3>
          <p className="text-[11px] opacity-90">Lesson {lessonOrder}</p>
        </div>
        <div className="bg-white text-slate-800 px-2 py-1 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap">
          {scenesDisplay} ⭐
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2">
        <div className="w-full h-[110px] bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-slate-300">
          {lessonImage ? (
            <img
              src={getOptimizedImageUrl(lessonImage, { width: 400 })}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-slate-600">
              <span className="text-sm font-semibold">Image</span>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-500 leading-snug">
          Learn through real pictures and everyday sentences.
        </p>

        <div className="grid grid-cols-4 gap-1.5 py-1">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center text-sm">🖼️</div>
            <span className="text-[8px] text-slate-500 text-center">Pictures</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center text-sm">🎧</div>
            <span className="text-[8px] text-slate-500 text-center">Audio</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center text-sm">🎤</div>
            <span className="text-[8px] text-slate-500 text-center">Speak</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center text-sm">⭐</div>
            <span className="text-[8px] text-slate-500 text-center">XP</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (currentLessonMasterId) {
              navigate(`/sentence-list/${currentLessonMasterId}`);
            }
          }}
          className="w-full py-2 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-teal-700 transition-colors cursor-pointer"
        >
          {panelActionLabel}
        </button>
      </div>
    </div>
  );
};

const YourProgressPanel = ({ currentLessonProgress }) => {
  if (!currentLessonProgress) {
    return null;
  }

  const completedScenes = currentLessonProgress.completedScenes ?? 0;
  const totalScenes = currentLessonProgress.totalScenes ?? 1;
  const isCompleted = currentLessonProgress.status === 'completed';

  const percentage = totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;
  const progressPercent = totalScenes > 0 ? (completedScenes / totalScenes) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
      <div className="px-3 py-2 flex justify-between items-center border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
            📊 Your Progress
          </h3>
          <p className="text-[9px] text-slate-500">Track your progress in this lesson</p>
        </div>
        <span className="text-sm font-bold text-teal-700 shrink-0">{percentage}%</span>
      </div>

      <div className="px-3 py-2 flex flex-col gap-1.5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-slate-700">Sentences Learned</label>
            <span className="text-[10px] font-bold text-slate-600">
              {completedScenes} / {totalScenes}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <p className="text-[9px] text-green-700 font-semibold leading-snug">
          {isCompleted
            ? '🌱 Great job! Your next adventure is ready.'
            : '🌱 Keep going! Complete this lesson to unlock your next adventure.'}
        </p>
      </div>
    </div>
  );
};

const WhatsNextPanel = ({ languageMapProgress, currentLessonMasterId }) => {
  const hasNextLesson = useMemo(() => {
    const currentCardIndex = languageMapProgress.visibleCards.findIndex((card) => {
      const candidates = [card.lessonMasterId, card.lessonMaster, card.lessonId, card.masterId];
      for (const val of candidates) {
        const id = typeof val === 'object' ? val._id : val;
        if (id && String(id).trim() === currentLessonMasterId) {
          return true;
        }
      }
      return false;
    });
    return currentCardIndex >= 0 && currentCardIndex < languageMapProgress.visibleCards.length - 1;
  }, [languageMapProgress.visibleCards, currentLessonMasterId]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 shrink-0">
      <div className="px-3 py-2 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
          ✨ What's Next?
        </h3>
        <p className="text-[9px] text-slate-500">Complete this lesson to discover what's next.</p>
      </div>

      <div className="px-3 py-2 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
          <span>🔒</span>
          <span className="font-semibold">New place</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
          <span>🔒</span>
          <span className="font-semibold">New sentences</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
          <span>🔒</span>
          <span className="font-semibold">New activities</span>
        </div>
        <p className="text-[9px] text-purple-700 font-semibold text-center mt-1">
          {hasNextLesson ? '🎁 Your next adventure awaits!' : '🎁 More adventures coming soon!'}
        </p>
      </div>
    </div>
  );
};

const AdventureMap = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    publishedMap: mapData,
    loading: mapLoadingRequest,
    error: mapError,
  } = useSelector((state) => state.adventureMap);
  const progressSummary = useSelector(selectLessonProgressSummary);
  const progressStatus = useSelector(selectLessonProgressStatus);
  const progressError = useSelector(selectLessonProgressError);
  const lessonUnlockMap = useSelector(selectLessonUnlockMap);
  const lessonUnlockStatus = useSelector(selectLessonUnlockStatus);
  const lessonUnlockError = useSelector(selectLessonUnlockError);
  const characterProgress = useSelector(selectCharacterProgress);
  const characterProgressLoading = useSelector(selectCharacterProgressLoading);
  const characterProgressStatus = useSelector(selectCharacterProgressStatus);
  const characterProgressError = useSelector(selectCharacterProgressError);
  const progressStats = useSelector(selectUserProgressStats);

  const [activeLanguage] = useActiveLanguage();

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ level: 1 });
  const previousLevelRef = useRef(null);

  useEffect(() => {
    if (!progressStats?.level) return;

    if (previousLevelRef.current === null) {
      previousLevelRef.current = progressStats.level;
      return;
    }

    if (progressStats.level > previousLevelRef.current) {
      setLevelUpData({
        level: progressStats.level,
      });
      setShowLevelUp(true);
    }

    previousLevelRef.current = progressStats.level;
  }, [progressStats?.level]);

  const levelUpTestTriggeredRef = useRef(false);

  useEffect(() => {
    const isLevelUpTest =
      import.meta.env.DEV &&
      new URLSearchParams(window.location.search).get('levelUpTest') === '2';

    if (isLevelUpTest && !levelUpTestTriggeredRef.current) {
      levelUpTestTriggeredRef.current = true;
      setLevelUpData({
        level: 2,
      });
      setShowLevelUp(true);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehavior;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.overscrollBehavior = prevHtmlOverscroll;
    };
  }, []);

  const [containerWidth, setContainerWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 800));
  const [languageDb, setLanguageDb] = useState({});
  const [languageStatus, setLanguageStatus] = useState('loading');
  const [languageError, setLanguageError] = useState(null);
  const [initializationRetryKey, setInitializationRetryKey] = useState(0);
  const [initializedLanguage, setInitializedLanguage] = useState(null);
  const [assetState, setAssetState] = useState({ status: 'idle', error: null });
  const [lessonAssetState, setLessonAssetState] = useState({ key: null, status: 'idle', error: null });
  const [initializationTimeoutKey, setInitializationTimeoutKey] = useState(null);
  const [requestedDataKey, setRequestedDataKey] = useState(null);
  const containerRef = useRef(null);
  const mainScrollRef = useRef(null);
  const [revealedCardIds, setRevealedCardIds] = useState(() => new Set());
  const viewportBoundsRef = useRef(INITIAL_VIEWPORT_BOUNDS);
  const [viewportBounds, setViewportBounds] = useState(INITIAL_VIEWPORT_BOUNDS);

  useEffect(() => {
    let cancelled = false;
    setLanguageStatus('loading');
    setLanguageError(null);
    setLanguageDb({});

    API.get('/languages', { timeout: 30000 })
      .then((res) => {
        if (cancelled) return;
        if (!res.data.success || !Array.isArray(res.data.data)) {
          throw new Error('Unable to load languages.');
        }
        const lookup = {};
        res.data.data.forEach((lang) => { lookup[lang.code] = lang; });
        setLanguageDb(lookup);
        setLanguageStatus('succeeded');
      })
      .catch((error) => {
        if (cancelled) return;
        setLanguageStatus('failed');
        setLanguageError(error.message || 'Unable to load languages.');
      });

    return () => { cancelled = true; };
  }, [initializationRetryKey]);

  useEffect(() => {
    if (!mapData) {
      dispatch(fetchPublishedMap());
    }
  }, [mapData, dispatch]);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
    };
    updateSize();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect?.width > 0) setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateSize);
    return () => { observer.disconnect(); window.removeEventListener('resize', updateSize); };
  }, [mapData, mapLoadingRequest]);

  const defaultThemes = useMemo(() => ({
    rich_grass_green: { color: '#599824', label: 'Rich Grass Green' },
    light_meadow: { color: '#76b041', label: 'Light Meadow' },
    forest_green: { color: '#386623', label: 'Forest Green' },
  }), []);

  const bgSections = mapData?.bgSections || DEFAULT_BG_SECTIONS;
  const customThemes = mapData?.customThemes || defaultThemes;
  const EMPTY_ARRAY = useMemo(() => [], []);
  const mapItems = mapData?.mapItems || EMPTY_ARRAY;
  const roadPaths = mapData?.roadPaths || EMPTY_ARRAY;
  const languagesList = useMemo(
    () => Object.values(languageDb).map((l) => ({ code: l.code, name: l.name })),
    [languageDb]
  );

  const resolvedLanguage = languagesList.some((l) => l.code === activeLanguage)
    ? activeLanguage
    : (languagesList[0]?.code || null);

  const languageMapProgress = useMemo(
    () => getLanguageMapProgress(mapItems, resolvedLanguage),
    [mapItems, resolvedLanguage]
  );

  const progressByLessonMasterId = useMemo(() => {
    const map = {};
    const sortedSummary = [...(progressSummary || [])].sort((a, b) => a.lessonOrder - b.lessonOrder);

    sortedSummary.forEach((rec) => {
      const lmId = typeof rec.lessonMasterId === 'object' ? rec.lessonMasterId?._id : rec.lessonMasterId;
      if (lmId) {
        map[String(lmId)] = {
          ...rec,
        };
      }
    });
    return map;
  }, [progressSummary]);

  const lmIdByOrder = useMemo(() => {
    const map = {};
    (progressSummary || []).forEach(rec => {
      const lmId = typeof rec.lessonMasterId === 'object' ? rec.lessonMasterId?._id : rec.lessonMasterId;
      if (lmId && rec.lessonOrder != null) {
        map[Number(rec.lessonOrder)] = String(lmId);
      }
    });
    return map;
  }, [progressSummary]);

  const fetchedBuildingAssetIds = useRef(new Set());

  const {
    isWalking,
    isTransitionActive,
    targetCardId,
    lastTransitionTargetCardId,
    transitionTargetPosition,
    transitionCompletedAt,
    magicUnlockCardId,
    currentPos,
    facingLeft,
    walkFrameIndex
  } = useUserWalkingAnimation(
    mapItems,
    roadPaths,
    characterProgress,
    languageMapProgress,
    progressSummary,
  );

  const lessonBuildingStateByBuildingId = useMemo(() => {
    const map = {};
    (languageMapProgress.visibleCards || []).forEach((card) => {
      const buildingId = normalizeId(card.buildingId);
      if (!buildingId) return;

      const lessonMasterId = resolveLessonMasterId(card, progressSummary)
        || (typeof card.order === 'number' && card.order > 0 ? lmIdByOrder[card.order] : null)
        || null;

      const isOrder1 = Number(card.order) === 1;
      const isMagicTarget = Boolean(
        magicUnlockCardId && normalizeId(card.id) === normalizeId(magicUnlockCardId)
      );
      const unlocked = isOrder1
        || isMagicTarget
        || Boolean(lessonMasterId && lessonUnlockMap?.[lessonMasterId]?.unlocked === true);

      const previous = map[buildingId];
      map[buildingId] = {
        cardId: normalizeId(card.id),
        lessonMasterId: unlocked ? lessonMasterId : (previous?.lessonMasterId || lessonMasterId),
        unlocked: Boolean(previous?.unlocked) || unlocked,
      };
    });
    return map;
  }, [languageMapProgress.visibleCards, progressSummary, lmIdByOrder, lessonUnlockMap, magicUnlockCardId]);

  useEffect(() => {
    if (!mapItems || mapItems.length === 0) return;

    mapItems.forEach((building) => {
      if (building.type !== 'Buildings') return;
      const buildingKey = normalizeId(building.id);
      if (!buildingKey) return;

      const lessonState = lessonBuildingStateByBuildingId[buildingKey];
      if (!lessonState || !lessonState.unlocked || !lessonState.lessonMasterId) return;

      const assetMissing = Boolean(building.isLocked) || !(building.src || building.imageUrl);
      if (!assetMissing) return;
      if (fetchedBuildingAssetIds.current.has(buildingKey)) return;

      fetchedBuildingAssetIds.current.add(buildingKey);
      dispatch(fetchUnlockedLessonAsset(lessonState.lessonMasterId));
    });
  }, [mapItems, lessonBuildingStateByBuildingId, dispatch]);

  const transitionCardId = normalizeId(targetCardId || lastTransitionTargetCardId);
  const transitionTargetCard = useMemo(
    () => mapItems.find((item) => normalizeId(item.id) === transitionCardId) || null,
    [mapItems, transitionCardId]
  );

  const userVisibleCards = useMemo(() => {
    const published = languageMapProgress.visibleCards || [];
    return published.filter((card) => {
      const content = getItemContent(card, resolvedLanguage);
      const title = String(content.title || '').trim();
      if (!title || title.toUpperCase() === 'UNTITLED') return false;

      const finalLmId = resolveLessonMasterId(card, progressSummary)
        || (typeof card.order === 'number' && card.order > 0 ? lmIdByOrder[card.order] : null);

      const isOrder1 = card.order === 1;
      const isUnlocked = isOrder1 || Boolean(finalLmId && lessonUnlockMap?.[finalLmId]?.unlocked === true);
      const isTransitionTarget = Boolean(
        (isTransitionActive && normalizeId(card.id) === normalizeId(targetCardId)) ||
        (magicUnlockCardId && normalizeId(card.id) === normalizeId(magicUnlockCardId))
      );

      return isUnlocked || isTransitionTarget;
    });
  }, [
    languageMapProgress.visibleCards,
    resolvedLanguage,
    progressSummary,
    lmIdByOrder,
    lessonUnlockMap,
    isTransitionActive,
    targetCardId,
    magicUnlockCardId,
  ]);

  const userVisibleCardIds = useMemo(
    () => new Set(userVisibleCards.map((c) => c.id)),
    [userVisibleCards]
  );

  const userVisibleBuildingIds = useMemo(
    () => new Set(userVisibleCards.map((c) => c.buildingId).filter(Boolean)),
    [userVisibleCards]
  );

  const allPublishedBuildingIds = useMemo(
    () => new Set(
      (languageMapProgress.visibleCards || []).map((c) => normalizeId(c.buildingId)).filter(Boolean)
    ),
    [languageMapProgress.visibleCards]
  );

  const lastVisibleCard = userVisibleCards.length > 0
    ? userVisibleCards[userVisibleCards.length - 1]
    : null;
  void lastVisibleCard;

  const allPublishedCards = languageMapProgress.visibleCards || [];
  const lastPublishedCard = allPublishedCards.length > 0
    ? allPublishedCards[allPublishedCards.length - 1]
    : null;

  const lastPublishedBuilding = useMemo(() => {
    if (!lastPublishedCard?.buildingId) return null;
    return mapItems.find((i) => i.type === 'Buildings' && String(i.id) === String(lastPublishedCard.buildingId)) || null;
  }, [lastPublishedCard, mapItems]);

  const lastPublishedContentBottom = useMemo(() => {
    if (!lastPublishedCard) return 0;
    const cardBottom = (Number(lastPublishedCard.y) || 0) + (Number(lastPublishedCard.height) || 72);
    const bldgBottom = lastPublishedBuilding
      ? (Number(lastPublishedBuilding.y) || 0) + (Number(lastPublishedBuilding.height) || 60)
      : 0;
    return Math.max(cardBottom, bldgBottom);
  }, [lastPublishedCard, lastPublishedBuilding]);

  const endMessageTopGap = 80;
  const endMessageComponentHeight = 240;
  const bottomPadding = 60;

  const endMessageY = lastPublishedCard ? lastPublishedContentBottom + endMessageTopGap : 0;
  const endMessageBottom = endMessageY + endMessageComponentHeight;

  const roadContinuationY = useMemo(() => {
    let maxY = endMessageBottom + 40;
    roadPaths.forEach((path) => {
      if (!path.visible || !path.points) return;
      for (let i = 1; i < path.points.length; i += 2) {
        const py = path.points[i];
        if (py >= endMessageY && py <= endMessageBottom + 180) {
          if (py > maxY) maxY = py;
        }
      }
    });
    return maxY;
  }, [endMessageBottom, endMessageY, roadPaths]);

  const visibleMapHeight = useMemo(() => {
    if (!lastPublishedCard) return 600;
    return Math.max(600, endMessageBottom + bottomPadding, roadContinuationY + bottomPadding);
  }, [lastPublishedCard, endMessageBottom, roadContinuationY]);

  const categoryOrder = useMemo(
    () => resolveCategoryOrder(mapData?.categoriesList, mapItems),
    [mapData?.categoriesList, mapItems]
  );

  useEffect(() => {
    if (languageStatus !== 'succeeded' || !resolvedLanguage) return;
    const langObj = languageDb[resolvedLanguage];
    if (!langObj?._id) return;
    try {
      localStorage.setItem('pic2speak_active_language', resolvedLanguage);
    } catch {
      return;
    }
    setRequestedDataKey(`${resolvedLanguage}:${initializationRetryKey}`);
    dispatch(fetchLessonProgressSummary(langObj._id));
    dispatch(fetchLessonUnlocks(langObj._id));
    dispatch(fetchCharacterProgress(langObj._id));
    dispatch(fetchMyStats());
    dispatch(fetchMyRewards());
  }, [resolvedLanguage, languageDb, languageStatus, initializationRetryKey, dispatch]);

  const itemsByCategory = useMemo(() => {
    const groups = {};
    mapItems.forEach(item => {
      const cat = item.type || 'Buildings';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [mapItems]);

  const characterConfigItem = useMemo(() => {
    return mapItems.find(item => {
      const t = String(item.type || 'Buildings').trim().toLowerCase();
      return t === 'character' || t === 'characters';
    });
  }, [mapItems]);

  const characterAnchor = useMemo(() => {
    if (characterProgressLoading) return null;

    const currentLmId = normalizeId(characterProgress?.currentLessonMasterId);
    if (!currentLmId) {
      if (!characterConfigItem) return null;
      return {
        x: (characterConfigItem.x || 0) + (characterConfigItem.width || 40) / 2,
        y: (characterConfigItem.y || 0) + (characterConfigItem.height || 40) * 0.88,
      };
    }

    const visibleCards = languageMapProgress?.visibleCards || [];
    const targetCard = visibleCards.find((card) => resolveLessonMasterId(card, progressSummary) === currentLmId);

    if (!targetCard) return null;

    const building = mapItems.find((i) => i.type === 'Buildings' && String(i.id) === String(targetCard.buildingId))
      || null;

    if (!building) return null;

    const cx = building.x + (building.width || 40) / 2;
    const cy = building.y + (building.height || 40) / 2;

    let nearest = null;
    let nearestDist = Infinity;
    roadPaths.forEach((path) => {
      if (path.visible === false || !Array.isArray(path.points) || path.points.length < 4) return;
      const points = Array.from({ length: path.points.length / 2 }, (_, index) => ({
        x: path.points[index * 2],
        y: path.points[index * 2 + 1],
      }));
      const candidate = findNearestPointOnPolyline(points, cx, cy);
      if (candidate && candidate.distance < nearestDist) {
        nearestDist = candidate.distance;
        nearest = { x: candidate.x, y: candidate.y, roadId: path.id };
      }
    });

    return nearest || { x: cx, y: building.y + (building.height || 40) + 16 };
  }, [characterConfigItem, characterProgress, characterProgressLoading, languageMapProgress, mapItems, roadPaths, progressSummary]);

  const { top: vpTop, bottom: vpBottom } = viewportBounds;
  const transitionTargetBuildingId = normalizeId(transitionTargetCard?.buildingId);

  const visibleItemsByCategory = useMemo(() => {
    const groups = {};
    categoryOrder.forEach((catName) => {
      groups[catName] = (itemsByCategory[catName] || []).filter((item) => {
        const isTransitionPriority = normalizeId(item.id) === transitionCardId || normalizeId(item.id) === transitionTargetBuildingId;
        if (isTransitionPriority) return true;

        const isCharacterItem = /^characters?$/i.test(String(item.type || '').trim());
        if (isCharacterItem && characterAnchor) return true;

        const itemTop = item.y ?? 0;
        const itemBottom = itemTop + (item.height || 60);
        const inViewport = itemBottom >= vpTop && itemTop <= vpBottom;
        if (!inViewport) return false;

        if (item.type === 'Lesson Cards') {
          return userVisibleCardIds.has(item.id);
        }
        if (item.type === 'Buildings') {
          return allPublishedBuildingIds.has(normalizeId(item.id));
        }
        return itemTop <= visibleMapHeight;
      });
    });
    return groups;
  }, [categoryOrder, characterAnchor, itemsByCategory, userVisibleCardIds, userVisibleBuildingIds, allPublishedBuildingIds, transitionCardId, transitionTargetBuildingId, visibleMapHeight, vpBottom, vpTop]);

  const currentLessonProgress = useMemo(() => {
    if (characterProgressLoading || !characterProgress) return null;

    const rawId = characterProgress.currentLessonMasterId;
    const currentLmId = rawId
      ? String(typeof rawId === 'object' ? rawId._id : rawId)
      : null;

    if (!currentLmId) return null;

    const prog = progressByLessonMasterId[currentLmId];
    return prog || null;
  }, [characterProgress, characterProgressLoading, progressByLessonMasterId]);

  const currentLessonMasterId = useMemo(() => {
    if (characterProgressLoading || !characterProgress) return null;
    const rawId = characterProgress.currentLessonMasterId;
    return rawId ? String(typeof rawId === 'object' ? rawId._id : rawId) : null;
  }, [characterProgress, characterProgressLoading]);

  const currentLessonCard = useMemo(
    () => languageMapProgress.visibleCards.find(
      (card) => resolveLessonMasterId(card, progressSummary) === currentLessonMasterId
    ) || null,
    [currentLessonMasterId, languageMapProgress.visibleCards, progressSummary]
  );

  const handleLessonCardClick = useCallback((item) => {
    const lessonMasterId = resolveLessonMasterId(item, progressSummary)
      || (typeof item?.order === 'number' && item.order > 0 ? lmIdByOrder[item.order] : null);
    if (lessonMasterId) navigate(`/sentence-list/${lessonMasterId}`);
  }, [navigate, progressSummary, lmIdByOrder]);

  const currentLessonMapImage = useMemo(() => {
    if (!currentLessonMasterId || !languageMapProgress.visibleCards) return null;

    let lessonCard = null;
    for (const card of languageMapProgress.visibleCards) {
      let resolvedLmId = null;
      const candidates = [card.lessonMasterId, card.lessonMaster, card.lessonId, card.masterId];
      for (const val of candidates) {
        if (val) {
          const id = typeof val === 'object' ? val._id : val;
          if (id && String(id).trim()) {
            resolvedLmId = String(id).trim();
            break;
          }
        }
      }

      if (!resolvedLmId && typeof card.order === 'number' && Array.isArray(progressSummary)) {
        const match = progressSummary.find(p => p.lessonOrder === card.order);
        if (match) {
          const id = typeof match.lessonMasterId === 'object' ? match.lessonMasterId?._id : match.lessonMasterId;
          if (id) {
            resolvedLmId = String(id).trim();
          }
        }
      }

      if (resolvedLmId === currentLessonMasterId) {
        lessonCard = card;
        break;
      }
    }

    if (!lessonCard || !lessonCard.buildingId) return null;

    const building = mapItems.find(
      (item) => item.type === 'Buildings' && String(item.id) === String(lessonCard.buildingId)
    );

    if (!building) return null;

    return building.src || building.imageUrl || null;
  }, [currentLessonMasterId, languageMapProgress, progressSummary, mapItems]);

  const metrics = getResponsiveLayoutMetrics(containerWidth);
  const scale = metrics.scale;
  const stageWidth = metrics.containerWidth;
  const stageHeight = visibleMapHeight * scale;

  const currentLessonIsUnlocked = Boolean(
    currentLessonCard && (
      Number(currentLessonCard.order) === 1 ||
      lessonUnlockMap[currentLessonMasterId]?.unlocked === true
    )
  );
  const currentLessonBuilding = useMemo(
    () => currentLessonCard?.buildingId
      ? mapItems.find((item) => item.type === 'Buildings' && String(item.id) === String(currentLessonCard.buildingId)) || null
      : null,
    [currentLessonCard, mapItems]
  );
  const currentLessonAssetMissing = Boolean(
    currentLessonBuilding &&
    currentLessonIsUnlocked &&
    (currentLessonBuilding.isLocked || !(currentLessonBuilding.src || currentLessonBuilding.imageUrl))
  );

  const currentDataRequestKey = `${resolvedLanguage || ''}:${initializationRetryKey}`;
  const mapDataReady = Boolean(mapData) && !mapLoadingRequest;
  const initializationDataReady = Boolean(
    mapDataReady &&
    languageStatus === 'succeeded' &&
    resolvedLanguage &&
    progressStatus === 'succeeded' &&
    lessonUnlockStatus === 'succeeded' &&
    characterProgressStatus === 'succeeded' &&
    !characterProgressLoading &&
    requestedDataKey === currentDataRequestKey
  );

  const dataValidationError = useMemo(() => {
    if (languageStatus === 'succeeded' && languagesList.length === 0) {
      return 'No active languages are available right now.';
    }
    if (!initializationDataReady) return null;
    if (!characterProgress) return 'Your character progress could not be loaded.';
    if (!currentLessonMasterId) return 'Your current lesson could not be identified.';
    if (!currentLessonCard) return 'Your current lesson is not available on this map.';
    if (!currentLessonIsUnlocked) return 'Your current lesson is not unlocked yet.';
    if (!characterAnchor) return 'Your character could not be placed on the map.';
    return null;
  }, [characterAnchor, characterProgress, currentLessonCard, currentLessonIsUnlocked, currentLessonMasterId, initializationDataReady, languageStatus, languagesList.length]);

  const currentLessonAssetKey = `${initializationRetryKey}:${resolvedLanguage || ''}:${currentLessonMasterId || ''}`;
  const lessonAssetRequestKeyRef = useRef(null);

  useEffect(() => {
    if (!initializationDataReady || dataValidationError || !currentLessonMasterId) return undefined;

    if (!currentLessonAssetMissing) {
      setLessonAssetState({ key: currentLessonAssetKey, status: 'succeeded', error: null });
      return undefined;
    }

    if (lessonAssetRequestKeyRef.current === currentLessonAssetKey) return undefined;
    lessonAssetRequestKeyRef.current = currentLessonAssetKey;
    let cancelled = false;
    setLessonAssetState({ key: currentLessonAssetKey, status: 'loading', error: null });

    dispatch(fetchUnlockedLessonAsset(currentLessonMasterId))
      .unwrap()
      .then((asset) => {
        if (cancelled) return;
        if (!asset?.src && !asset?.imageUrl) {
          throw new Error('The current lesson artwork is unavailable.');
        }
        setLessonAssetState({ key: currentLessonAssetKey, status: 'succeeded', error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        setLessonAssetState({
          key: currentLessonAssetKey,
          status: 'failed',
          error: error.message || 'The current lesson artwork could not be loaded.',
        });
      });

    return () => { cancelled = true; };
  }, [currentLessonAssetKey, currentLessonAssetMissing, currentLessonMasterId, dataValidationError, dispatch, initializationDataReady]);

  const requiredMapAssetUrls = useMemo(
    () => getRequiredMapAssetUrls(mapItems, bgSections, customThemes, currentLessonMapImage),
    [bgSections, customThemes, currentLessonMapImage, mapItems]
  );

  useEffect(() => {
    if (!initializationDataReady || dataValidationError) {
      setAssetState((previous) => previous.status === 'idle' && !previous.error
        ? previous
        : { status: 'idle', error: null });
      return undefined;
    }

    let cancelled = false;
    setAssetState({ status: 'loading', error: null });

    preloadMapAssets(requiredMapAssetUrls).then((results) => {
      if (cancelled) return;
      const failedCount = results.filter((result) => !result.loaded).length;
      if (failedCount > 0) {
        setAssetState({
          status: 'failed',
          error: 'Some map artwork could not be loaded. Please try again.',
        });
      } else {
        setAssetState({ status: 'succeeded', error: null });
      }
    });

    return () => { cancelled = true; };
  }, [dataValidationError, initializationDataReady, requiredMapAssetUrls]);

  const initializationKey = `${initializationRetryKey}:${resolvedLanguage || ''}`;
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setInitializationTimeoutKey(initializationKey);
    }, 30000);
    return () => window.clearTimeout(timeoutId);
  }, [initializationKey]);

  const initializationTimeoutError = initializationTimeoutKey === initializationKey
    ? 'The adventure map is taking too long to load. Please try again.'
    : null;
  const {
    initialCameraApplied,
    initialCameraError,
  } = useProgressCamera({
    scrollRef: mainScrollRef,
    scale,
    mapReady: initializationDataReady && !dataValidationError && stageHeight > 0,
    cameraReady: initializationDataReady && !dataValidationError && Boolean(characterAnchor),
    currentAnchor: characterAnchor,
    currentLessonCard,
    transitionActive: isTransitionActive,
    transitionPosition: currentPos,
    transitionTargetPosition,
    transitionTargetCard,
    transitionCompletedAt,
    initializationKey,
  });

  const initializationError = mapError
    || (languageStatus === 'failed' ? languageError : null)
    || (progressStatus === 'failed' ? progressError : null)
    || (lessonUnlockStatus === 'failed' ? lessonUnlockError : null)
    || (characterProgressStatus === 'failed' ? characterProgressError : null)
    || dataValidationError
    || assetState.error
    || (lessonAssetState.key === currentLessonAssetKey ? lessonAssetState.error : null)
    || initializationTimeoutError
    || initialCameraError;

  const initialMapReady = Boolean(
    initializationDataReady &&
    !initializationError &&
    assetState.status === 'succeeded' &&
    !currentLessonAssetMissing &&
    lessonAssetState.key === currentLessonAssetKey &&
    lessonAssetState.status === 'succeeded' &&
    initialCameraApplied
  );

  useEffect(() => {
    if (initialMapReady && resolvedLanguage) {
      setInitializedLanguage(resolvedLanguage);
    }
  }, [initialMapReady, resolvedLanguage]);

  const isMapInitialized = Boolean(resolvedLanguage && initializedLanguage === resolvedLanguage);
  const mapViewportError = !isMapInitialized ? initializationError : null;
  const mapViewportLoading = !isMapInitialized && !mapViewportError;

  const handleRetryInitialization = useCallback(() => {
    setRequestedDataKey(null);
    setInitializedLanguage(null);
    setAssetState({ status: 'idle', error: null });
    setLessonAssetState({ key: null, status: 'idle', error: null });
    setInitializationTimeoutKey(null);
    setLanguageDb({});
    setLanguageStatus('loading');
    setLanguageError(null);
    setInitializationRetryKey((value) => value + 1);
    dispatch(fetchPublishedMap());
  }, [dispatch]);

  const checkCardVisibility = useCallback(() => {
    const mainEl = mainScrollRef.current;
    const stageEl = containerRef.current;
    if (!mainEl || !stageEl) return;
    const mainRect = mainEl.getBoundingClientRect();
    const stageRect = stageEl.getBoundingClientRect();
    const visibleTop = mainRect.top - stageRect.top;
    const visibleBottom = visibleTop + mainRect.height + 60;

    setRevealedCardIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      userVisibleCards.forEach((card) => {
        if (next.has(card.id)) return;
        const cardTop = card.y * scale;
        const cardBottom = (card.y + (card.height || 72)) * scale;
        if (cardBottom >= visibleTop && cardTop <= visibleBottom) {
          next.add(card.id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    const newMapTop = visibleTop / scale - VIEWPORT_BUFFER;
    const newMapBottom = visibleBottom / scale + VIEWPORT_BUFFER;
    const prevBounds = viewportBoundsRef.current;
    
    if (Math.abs(prevBounds.top - newMapTop) > 120 || Math.abs(prevBounds.bottom - newMapBottom) > 120) {
      viewportBoundsRef.current = { top: newMapTop, bottom: newMapBottom };
      setViewportBounds(viewportBoundsRef.current);
    }

  }, [userVisibleCards, scale]);

  useEffect(() => {
    const mainEl = mainScrollRef.current;
    if (!mainEl) return undefined;

    let rafId = null;
    const onScrollOrResize = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        checkCardVisibility();
      });
    };

    checkCardVisibility();
    mainEl.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      mainEl.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [checkCardVisibility, stageHeight, stageWidth]);

  const lastSectionTheme = bgSections.length
    ? customThemes[bgSections[bgSections.length - 1].themeKey]
    : null;
  const fallbackBgColor = lastSectionTheme?.color || '#071426';
  const renderWindowTopPx = Math.max(0, Math.min(stageHeight, vpTop * scale));
  const renderWindowBottomPx = Math.max(
    renderWindowTopPx + 1,
    Math.min(stageHeight, vpBottom * scale)
  );
  const renderStageHeight = Math.max(1, renderWindowBottomPx - renderWindowTopPx);
  const mapViewportHeight = stageHeight > 0
    ? stageHeight
    : 'calc(100dvh - var(--shell-top-h, 0px) - var(--shell-bottom-h, 0px))';

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100dvh_-_var(--shell-top-h,0px)_-_var(--shell-bottom-h,0px))] lg:h-screen w-full bg-slate-100 text-slate-800 overflow-hidden font-sans">
      <main
        ref={mainScrollRef}
        className="flex-1 min-w-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain relative lg:h-full min-h-0"
      >
        <div className="flex-1 w-full px-0 pb-6 flex flex-col items-center">
          <div ref={containerRef} className="w-full relative flex justify-center">
            <div className="w-full relative overflow-hidden" style={{ height: mapViewportHeight, minHeight: mapViewportHeight }}>
              {mapViewportError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
                  <p className="max-w-md text-sm font-semibold text-slate-700">
                    {mapViewportError}
                  </p>
                  <button
                    type="button"
                    onClick={handleRetryInitialization}
                    className="rounded-full bg-teal-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-700"
                  >
                    Try again
                  </button>
                </div>
              ) : mapViewportLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                  <Loading message="Preparing your adventure..." />
                </div>
              ) : visibleMapHeight > 0 ? (
                <Stage
                  width={stageWidth}
                  height={renderStageHeight}
                  listening={true}
                  style={{ position: 'absolute', top: renderWindowTopPx, left: 0 }}
                >
                  <Layer y={-renderWindowTopPx} name="background-layer" listening={false}>
                    <Rect x={0} y={0} width={stageWidth} height={renderStageHeight} fill={fallbackBgColor} listening={false} />
                    <Group scaleX={scale} scaleY={scale} listening={false}>
                      {bgSections
                        .filter(sec => {
                          const secBottom = sec.y + sec.height;
                          return secBottom >= vpTop && sec.y <= vpBottom;
                        })
                        .map((sec) => (
                          <UserBackgroundSection key={sec.id} sec={sec} customThemes={customThemes} stageWidth={stageWidth} worldWidth={WORLD_WIDTH} visibleHeight={visibleMapHeight} />
                        ))}
                    </Group>
                  </Layer>

                  <Layer y={-renderWindowTopPx} name="roads-layer" listening={false}>
                    <Group scaleX={scale} scaleY={scale} listening={false}>
                      {roadPaths.map((path) => {
                        if (!path.visible || path.points.length < 2) return null;
                        if (isTransitionActive && path.id === transitionTargetPosition?.roadId) {
                          return <UserRoadPath key={path.id} path={path} metrics={metrics} />;
                        }
                        let minY = Infinity, maxY = -Infinity;
                        for (let i = 1; i < path.points.length; i += 2) {
                          if (path.points[i] < minY) minY = path.points[i];
                          if (path.points[i] > maxY) maxY = path.points[i];
                        }
                        if (maxY < vpTop || minY > vpBottom) return null;
                        return <UserRoadPath key={path.id} path={path} metrics={metrics} />;
                      })}
                    </Group>
                  </Layer>

                  <Layer y={-renderWindowTopPx} name="objects-layer">
                    <Group scaleX={scale} scaleY={scale}>
                      {categoryOrder.map((catName) => {
                        const catItems = visibleItemsByCategory[catName] || [];
                        return (
                          <Group key={catName} name={`group-${catName}`} listening={catName === 'Lesson Cards'}>
                            {catItems
                              .filter((item) => item.type !== 'Lesson Cards')
                              .map((item) => {
                                const normalizedCat = String(catName).trim().toLowerCase();
                                const isCharacter = normalizedCat === 'character' || normalizedCat === 'characters';
                                if (isCharacter && (characterProgressLoading || isTransitionActive)) return null;
                                const renderItem =
                                  isCharacter && characterAnchor
                                    ? { ...item, x: characterAnchor.x - (item.width || 40) / 2, y: characterAnchor.y - (item.height || 40) * 0.88 }
                                    : item;
                                if (renderItem === null) return null;

                                const lessonBuildingState = renderItem.type === 'Buildings'
                                  ? lessonBuildingStateByBuildingId[normalizeId(renderItem.id)] || null
                                  : null;

                                let finalIsLocked = lessonBuildingState
                                  ? !lessonBuildingState.unlocked
                                  : renderItem.isLocked;

                                if (isTransitionActive && targetCardId && renderItem.id) {
                                  if (transitionTargetBuildingId === normalizeId(renderItem.id)) {
                                    finalIsLocked = true;
                                  }
                                }

                                if (finalIsLocked) {
                                  return (
                                    <UserLockedLocation
                                      key={item.id}
                                      item={renderItem}
                                      metrics={metrics}
                                      />
                                  );
                                }

                                const unlockedRenderItem = lessonBuildingState
                                  ? { ...renderItem, isLocked: false }
                                  : renderItem;

                                return (
                                  <UserCanvasItem
                                    key={item.id}
                                    item={unlockedRenderItem}
                                    metrics={metrics}
                                    />
                                );
                              })}
                            {catName === 'Lesson Cards' &&
                              catItems.map((item) => {
                                const finalLmId = resolveLessonMasterId(item, progressSummary)
                                  || (typeof item.order === 'number' && item.order > 0 ? lmIdByOrder[item.order] : null);

                                const progress = finalLmId ? progressByLessonMasterId[finalLmId] : undefined;
                                const unlockState = finalLmId ? lessonUnlockMap[finalLmId] : null;

                                const isBeingUnlocked = isTransitionActive && normalizeId(item.id) === normalizeId(targetCardId);
                                const isOrder1 = item.order === 1;
                                const isUnlocked = isOrder1
                                  ? true
                                  : (!isBeingUnlocked && unlockState?.unlocked === true);

                                const isMagicTarget = normalizeId(item.id) === normalizeId(magicUnlockCardId);

                                return (
                                  <UserLessonCard
                                    key={item.id}
                                    item={item}
                                    activeLanguage={resolvedLanguage}
                                    progress={progress}
                                    isUnlocked={isUnlocked || isMagicTarget}
                                    revealed={REDUCED_MOTION || isBeingUnlocked || isMagicTarget || revealedCardIds.has(item.id)}
                                    magicUnlock={isMagicTarget}
                                    onNodeClick={handleLessonCardClick}
                                  />
                                );
                              })}
                          </Group>
                        );
                      })}

                      <UserWalkingCharacter
                        characterConfig={characterConfigItem}
                        scale={scale}
                        isWalking={isWalking}
                        isTransitionActive={isTransitionActive}
                        currentPos={currentPos}
                        facingLeft={facingLeft}
                        walkFrameIndex={walkFrameIndex}
                      />

                      {lastPublishedCard && (
                        <MoreLessonsComingSoon y={endMessageY} worldWidth={WORLD_WIDTH} />
                      )}
                    </Group>
                  </Layer>
                </Stage>
              ) : (
                <div className="flex h-96 items-center justify-center text-white font-bold text-center px-6">
                  Lessons are not available in this language yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <aside className="hidden xl:flex w-80 h-full bg-slate-100 border-l border-slate-200 flex-col overflow-hidden shrink-0 z-20">
        <div className="flex-1 overflow-hidden flex flex-col gap-2.5 p-3">
          {characterProgressLoading || mapViewportLoading ? (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 p-3 text-center shrink-0">
              <p className="text-xs text-slate-500">Loading lesson...</p>
            </div>
          ) : (
            <CurrentLessonPanel 
              currentLessonProgress={currentLessonProgress}
              currentLessonMasterId={currentLessonMasterId}
              lessonImage={currentLessonMapImage}
              navigate={navigate}
            />
          )}

          {currentLessonProgress && (
            <YourProgressPanel currentLessonProgress={currentLessonProgress} />
          )}

          {currentLessonProgress && (
            <WhatsNextPanel
              languageMapProgress={languageMapProgress}
              currentLessonMasterId={currentLessonMasterId}
            />
          )}
        </div>
      </aside>

      <AnimatePresence>
        {showLevelUp && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 sm:p-6">
            <motion.div
              initial={REDUCED_MOTION ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={REDUCED_MOTION ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative w-full max-w-[500px] rounded-[32px] overflow-hidden border-[3px] border-white/70 shadow-[0_20px_60px_-15px_rgba(13,148,136,0.4)] bg-gradient-to-br from-white via-[#e0f8fb] to-[#ccf2f6] text-center p-6 md:p-8 md:[@media(max-height:820px)]:!py-5 flex flex-col items-center"
            >
              {!REDUCED_MOTION && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-yellow-300/20 rounded-full blur-[60px]"
                  />
                  <div className="absolute top-1/4 left-[10%] w-3 h-8 bg-teal-400 rotate-45 rounded-sm" />
                  <div className="absolute top-1/3 right-[15%] w-4 h-4 bg-yellow-400 rotate-12 rounded-full" />
                  <div className="absolute bottom-1/4 left-[20%] w-5 h-5 bg-cyan-400 rotate-45 rounded-sm" />
                  <div className="absolute bottom-1/3 right-[10%] w-3 h-10 bg-teal-300 -rotate-45 rounded-sm" />
                  <div className="absolute top-1/2 left-[5%] w-6 h-6 bg-yellow-300 rotate-[60deg] clip-star" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'}} />
                  <div className="absolute top-[20%] right-[5%] w-5 h-5 bg-cyan-200 rotate-[30deg] clip-star" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'}} />
                </div>
              )}

              <motion.div
                initial={REDUCED_MOTION ? {} : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="relative z-10 -mt-2 mb-2 md:[@media(max-height:820px)]:!mb-0"
              >
                <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-40 rounded-full" />
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="relative drop-shadow-md">
                  <path d="M4 19V11L7.5 14L12 7L16.5 14L20 11V19H4Z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1" strokeLinejoin="round"/>
                  <circle cx="12" cy="5" r="2" fill="#34D399"/>
                  <circle cx="4" cy="9" r="1.5" fill="#60A5FA"/>
                  <circle cx="20" cy="9" r="1.5" fill="#60A5FA"/>
                </svg>
              </motion.div>

              <motion.div
                initial={REDUCED_MOTION ? {} : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                className="relative z-10 mb-6 md:[@media(max-height:820px)]:!mb-3"
              >
                <div className="bg-gradient-to-b from-teal-400 to-teal-600 px-8 py-3 rounded-full shadow-[0_10px_20px_-5px_rgba(13,148,136,0.5)] border-b-4 border-teal-700 relative">
                  <div className="absolute -left-4 top-4 bottom-4 w-8 bg-teal-700 -z-10 rounded-l-md skew-x-[-15deg] shadow-inner" />
                  <div className="absolute -right-4 top-4 bottom-4 w-8 bg-teal-700 -z-10 rounded-r-md skew-x-[15deg] shadow-inner" />
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-wider uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                    LEVEL UP!
                  </h2>
                </div>
              </motion.div>

              <motion.div
                initial={REDUCED_MOTION ? {} : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="relative z-10 flex flex-col items-center justify-center mb-4 md:[@media(max-height:820px)]:!mb-2"
              >
                <p className="text-lg font-bold text-teal-800 uppercase tracking-widest mb-[-10px]">Level</p>
                <div className="flex items-center justify-center gap-4">
                  <svg width="40" height="80" viewBox="0 0 40 80" className="text-teal-300/60 fill-current opacity-80 rotate-[-10deg]">
                    <path d="M35 10 C 20 30, 0 50, 10 75 C 10 50, 30 30, 35 10 Z" />
                    <path d="M25 25 C 15 35, 5 45, 12 60 C 15 45, 25 35, 25 25 Z" />
                    <path d="M18 40 C 10 45, 5 50, 15 65 C 15 55, 20 45, 18 40 Z" />
                  </svg>
                  
                  <span className="text-[100px] md:text-[120px] md:[@media(max-height:820px)]:!text-[76px] md:[@media(max-height:640px)]:!text-[60px] font-black text-teal-700 leading-none drop-shadow-[0_4px_10px_rgba(13,148,136,0.3)]">
                    {levelUpData.level}
                  </span>

                  <svg width="40" height="80" viewBox="0 0 40 80" className="text-teal-300/60 fill-current opacity-80 rotate-[10deg] scale-x-[-1]">
                    <path d="M35 10 C 20 30, 0 50, 10 75 C 10 50, 30 30, 35 10 Z" />
                    <path d="M25 25 C 15 35, 5 45, 12 60 C 15 45, 25 35, 25 25 Z" />
                    <path d="M18 40 C 10 45, 5 50, 15 65 C 15 55, 20 45, 18 40 Z" />
                  </svg>
                </div>
              </motion.div>

              <motion.div
                initial={REDUCED_MOTION ? {} : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="relative z-10 mb-8 md:[@media(max-height:820px)]:!mb-4"
              >
                <h3 className="text-2xl md:text-3xl font-bold text-teal-600 mb-2">Amazing!</h3>
                <p className="text-lg font-bold text-slate-700">You reached Level {levelUpData.level}!</p>
                <p className="text-sm text-slate-500 mt-1 max-w-[280px] mx-auto">Keep going — your next adventure is waiting for you!</p>
              </motion.div>

              <motion.div
                initial={REDUCED_MOTION ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="relative z-10 w-full"
              >
                <button
                  onClick={() => setShowLevelUp(false)}
                  className="w-full bg-gradient-to-b from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold text-lg py-4 md:[@media(max-height:820px)]:!py-3 rounded-full shadow-[0_10px_20px_-5px_rgba(13,148,136,0.5)] border-b-4 border-teal-700 active:border-b-0 active:translate-y-[4px] transition-all"
                >
                  Continue Adventure &rarr;
                </button>
              </motion.div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdventureMap;