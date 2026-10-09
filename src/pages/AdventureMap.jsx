import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage, Rect, Text as KonvaText, Group, Line, Path, Arc, Circle, Star, Ellipse } from 'react-konva';
import useImage from 'use-image';

import {
  fetchLessonProgressSummary,
  selectLessonProgressSummary,
} from '../redux/slices/lessonProgressSlice';
import {
  fetchLessonUnlocks,
  selectLessonUnlockMap,
} from '../redux/slices/lessonUnlockSlice';
import {
  fetchCharacterProgress,
  selectCharacterProgress,
  selectCharacterProgressLoading,
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
import { UserWalkingCharacter } from '../components/UserWalkingCharacter';
import { UserLockedLocation } from '../components/UserLockedLocation';
import { getOptimizedImageUrl } from '../utils/imageOptimization';
import { fetchPublishedMap, fetchUnlockedLessonAsset } from '../redux/slices/adventureMapSlice';

const DESIGN_WIDTH = 800;
const VIEWPORT_BUFFER = 1000;
const FALLBACK_CATEGORY_ORDER = ['Buildings', 'Trees', 'Characters', 'Street Lights', 'Waterfalls'];
const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const getItemContent = (item, lang) =>
  (item && item.content && item.content[lang]) || { title: '', published: false };

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
  const source =
    Array.isArray(categoriesList) && categoriesList.length
      ? categoriesList
      : (() => {
          const seen = [...FALLBACK_CATEGORY_ORDER];
          mapItems.forEach((item) => {
            const t = item.type || 'Buildings';
            if (t !== 'Lesson Cards' && t !== 'Roads & Paths' && !seen.includes(t)) seen.push(t);
          });
          return seen;
        })();
  return [...source.filter((cat) => cat !== 'Roads & Paths'), 'Lesson Cards'].filter(
    (cat, index, all) => all.indexOf(cat) === index
  );
};

const MoreLessonsComingSoon = ({ y }) => {
  const width = 420;
  const height = 240;
  const x = (DESIGN_WIDTH - width) / 2;

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

const UserLessonCard = ({ item, slotNumber, activeLanguage, progress, isUnlocked: isUnlockedProp, onNodeClick, revealed = true, magicUnlock = false }) => {
  const content = getItemContent(item, activeLanguage);
  const cardWidth = item.width || 220;
  const cardHeight = item.height || 90;
  const [isHovered, setIsHovered] = useState(false);

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
  const backendStatus = progress?.status || null;

  const isUnlocked = Boolean(isUnlockedProp);

  const hasProgress = progress != null;
  const showProgress = hasProgress && totalScenes !== null && completedScenes !== null;

  const isCompleted = backendStatus === 'completed';

  const pct = isCompleted
    ? 100
    : showProgress && totalScenes > 0
      ? Math.round((completedScenes / totalScenes) * 100)
      : 0;

  const progressText = showProgress ? `${completedScenes}/${totalScenes}` : null;

  const titleText = content.title ? content.title.toUpperCase() : 'UNTITLED';

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
  const isKitchenCard = isUnlocked && !isCompleted && titleText.includes('KITCHEN');
  const startBtnW = cardWidth - 24;
  const startBtnH = 30;
  const startBtnY = cardHeight - startBtnH - 8;
  const startContentX = (startBtnW - 54) / 2;
  const radius = 18;

  const ringR = Math.round(cardHeight * 0.28);
  const ringCx = cardWidth - ringR - 10;
  const ringCy = cardHeight / 2;

  const titleW = cardWidth - ringR * 2 - 22;

  const lockSvgPath = "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z M7 11V7a5 5 0 0 1 10 0v4";

  return (
    <Group
      x={item.x}
      y={item.y}
      onClick={(e) => {
        e.cancelBubble = true;
        if (isUnlocked) onNodeClick?.(item);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        if (isUnlocked) onNodeClick?.(item);
      }}
      onMouseEnter={() => { if (isUnlocked) setIsHovered(true); }}
      onMouseLeave={() => { if (isUnlocked) setIsHovered(false); }}
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
          text={titleText}
          x={12}
          y={isKitchenCard ? 16 : cardHeight / 2 - 9}
          width={isKitchenCard ? cardWidth - 24 - 56 : titleW}
          align="left"
          fontSize={14}
          fontStyle="bold"
          fill="#ffffff"
          fontFamily="Fredoka, sans-serif"
          shadowColor="rgba(0,0,0,0.55)"
          shadowBlur={3}
          shadowOffsetY={1}
          ellipsis
          listening={false}
        />

        {isKitchenCard && (
          <>
            <KonvaText
              text={progressText || '0/0'}
              x={12}
              y={16}
              width={cardWidth - 24}
              align="right"
              fontSize={14}
              fontStyle="bold"
              fill="#ffffff"
              fontFamily="Fredoka, sans-serif"
              shadowColor="rgba(0,0,0,0.55)"
              shadowBlur={3}
              shadowOffsetY={1}
              listening={false}
            />
            <Group
              x={12}
              y={startBtnY}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'pointer';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            >
              <Rect
                width={startBtnW}
                height={startBtnH}
                cornerRadius={startBtnH / 2}
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: 0, y: startBtnH }}
                fillLinearGradientColorStops={[0, '#2dd4bf', 1, '#14b8a6']}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={1}
                shadowColor="#000000"
                shadowBlur={6}
                shadowOpacity={0.3}
                shadowOffsetY={2}
              />
              <Line
                points={[startContentX, startBtnH / 2 - 6, startContentX, startBtnH / 2 + 6, startContentX + 10, startBtnH / 2]}
                closed
                fill="#ffffff"
                listening={false}
              />
              <KonvaText
                text="Start"
                x={startContentX + 18}
                y={startBtnH / 2 - 8}
                fontSize={15}
                fontStyle="bold"
                fill="#ffffff"
                fontFamily="Fredoka, sans-serif"
                listening={false}
              />
            </Group>
          </>
        )}

        {showProgress && !isKitchenCard && (
          <CircularProgressRing
            cx={ringCx}
            cy={ringCy}
            r={ringR}
            pct={pct}
            isCompleted={isCompleted}
            progressText={progressText}
            glowColor={glowColor}
            isUnlocked={isUnlocked}
          />
        )}

        {!isUnlocked && !showProgress && (
          <Path
            x={ringCx - 9}
            y={ringCy - 9}
            data={lockSvgPath}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={1.8}
            scaleX={0.75}
            scaleY={0.75}
            listening={false}
          />
        )}

        {!isUnlocked && showProgress && (
          <Path
            x={ringCx - 9}
            y={ringCy - 9}
            data={lockSvgPath}
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={1.6}
            scaleX={0.75}
            scaleY={0.75}
            listening={false}
          />
        )}
      </Group>
    </Group>
  );
};

const UserBackgroundSection = ({ sec, customThemes, stageWidth }) => {
  const tObj = customThemes[sec.themeKey] || {};
  const [bgImg] = useImage(getOptimizedImageUrl(tObj.image || ''));
  return (
    <Group y={sec.y} listening={false}>
      <Rect
        name="bg-rect"
        width={stageWidth}
        height={sec.height}
        fill={bgImg ? undefined : (tObj.color || '#599824')}
        fillPatternImage={bgImg || undefined}
        fillPatternRepeat="repeat"
        listening={false}
      />
    </Group>
  );
};

const UserCanvasItem = ({ item, onNodeClick }) => {
  const [img, status] = useImage(getOptimizedImageUrl(item.src || item.imageUrl || '', { width: (item.width || 80) * 2 }));
  
  if (status === 'failed') {
    return <UserLockedLocation item={item} />;
  }
  
  return (
    <Group
      x={item.x} y={item.y}
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
};

const UserRoadPath = ({ path }) => (
  <Group listening={false}>
    <Line points={path.points} stroke="#a9825a" strokeWidth={(path.width || 40) + 10}
      lineCap="round" lineJoin="round" tension={0.4} opacity={0.9} listening={false} />
    <Line points={path.points} stroke={path.color || '#e8cd9e'} strokeWidth={path.width || 40}
      lineCap="round" lineJoin="round" tension={0.4} dash={path.dash} listening={false} />
    <Line points={path.points} stroke="#f6ecd2" strokeWidth={Math.max(4, (path.width || 40) * 0.32)}
      lineCap="round" lineJoin="round" tension={0.4} opacity={0.7} dash={[16, 14]} listening={false} />
  </Group>
);

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
          Continue Learning →
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
  const { publishedMap: mapData, loading } = useSelector((state) => state.adventureMap);
  const progressSummary = useSelector(selectLessonProgressSummary);
  const lessonUnlockMap = useSelector(selectLessonUnlockMap);
  const characterProgress = useSelector(selectCharacterProgress);
  const characterProgressLoading = useSelector(selectCharacterProgressLoading);
  const progressStats = useSelector(selectUserProgressStats);

  // Sidebar / mobile top bar / bottom bar / profile & more sheets now live in Navbar.jsx.
  // The active language is shared with the Navbar's language dropdown.
  const [activeLanguage] = useActiveLanguage();

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ level: 1 });
  const previousLevelRef = useRef(null);

  // LevelUp is a level-change celebration only.
  // Reward amounts are intentionally NOT calculated here.
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

  // DEV ONLY — TEMPORARY LEVEL UP MODAL PREVIEW
  // Remove this block after UI testing is complete.
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

  const [containerWidth, setContainerWidth] = useState(DESIGN_WIDTH);
  const [languageDb, setLanguageDb] = useState({});
  const containerRef = useRef(null);
  const mainScrollRef = useRef(null);
  const [revealedCardIds, setRevealedCardIds] = useState(() => new Set());
  const viewportBoundsRef = useRef({ top: -VIEWPORT_BUFFER, bottom: 2000 + VIEWPORT_BUFFER });
  const [viewportEpoch, setViewportEpoch] = useState(0);

  useEffect(() => {
    API.get('/languages')
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data)) {
          const lookup = {};
          res.data.data.forEach((lang) => { lookup[lang.code] = lang; });
          setLanguageDb(lookup);
        }
      })
      .catch(() => {});
  }, []);

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
  }, [loading]);

  const defaultThemes = {
    rich_grass_green: { color: '#599824', label: 'Rich Grass Green' },
    light_meadow: { color: '#76b041', label: 'Light Meadow' },
    forest_green: { color: '#386623', label: 'Forest Green' },
  };

  const bgSections = mapData?.bgSections || [{ id: '1', themeKey: 'rich_grass_green', height: 800, y: 0 }];
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

  useEffect(() => {
    if (!mapItems || mapItems.length === 0 || !lessonUnlockMap) return;

    mapItems.forEach((item) => {
      if (item.type === 'Lesson Cards' && item.buildingId) {
        let lmId = item.lessonMasterId || item.lessonMaster || item.lessonId || item.masterId;
        lmId = typeof lmId === 'object' ? lmId._id?.toString() : lmId?.toString();

        if (!lmId && typeof item.order === 'number' && item.order > 0) {
          lmId = lmIdByOrder[item.order] || null;
        }

        const isUnlocked = lmId && lessonUnlockMap[lmId]?.unlocked === true;
        if (isUnlocked) {
          const building = mapItems.find(b => b.id === item.buildingId);
          if (building && building.isLocked && !fetchedBuildingAssetIds.current.has(building.id)) {
            fetchedBuildingAssetIds.current.add(building.id);
            dispatch(fetchUnlockedLessonAsset(lmId));
          }
        }
      }
    });
  }, [mapItems, lessonUnlockMap, lmIdByOrder, dispatch]);

  const {
    isWalking,
    isTransitionActive,
    targetCardId,
    magicUnlockCardId,
    currentPos,
    facingLeft,
    walkFrameIndex
  } = useUserWalkingAnimation(
    mapItems,
    roadPaths,
    characterProgress,
    languageMapProgress,
    progressSummary
  );

  const lastVisibleCard = languageMapProgress.visibleCards.length > 0
    ? languageMapProgress.visibleCards[languageMapProgress.visibleCards.length - 1]
    : null;

  const endMessageTopGap = 120;
  const endMessageComponentHeight = 240;
  const bottomPadding = 50;

  const lastVisibleCardBottom = lastVisibleCard
    ? lastVisibleCard.y + (lastVisibleCard.height || 90)
    : 0;

  const endMessageY = lastVisibleCardBottom + endMessageTopGap;

  let visibleMapHeight = lastVisibleCard
    ? Math.max(
        languageMapProgress.visibleHeight,
        lastVisibleCardBottom + endMessageTopGap + endMessageComponentHeight + bottomPadding
      )
    : languageMapProgress.visibleHeight;

  if (mapData?.bgSections && mapData.bgSections.length > 0) {
    mapData.bgSections.forEach(bg => {
       if (bg.y < visibleMapHeight) {
          const bgBottom = bg.y + (bg.height || 0);
          if (bgBottom > visibleMapHeight) {
             visibleMapHeight = bgBottom;
          }
       }
    });
  }

  const hasUnlinkedVisibleCards = languageMapProgress.visibleCards.some((card) => !card.buildingId);
  const categoryOrder = resolveCategoryOrder(mapData?.categoriesList, mapItems);

  useEffect(() => {
    if (!resolvedLanguage) return;
    const langObj = languageDb[resolvedLanguage];
    if (!langObj?._id) return;
    try {
      localStorage.setItem('pic2speak_active_language', resolvedLanguage);
    } catch {
    }
    dispatch(fetchLessonProgressSummary(langObj._id));
    dispatch(fetchLessonUnlocks(langObj._id));
    dispatch(fetchCharacterProgress(langObj._id));
    dispatch(fetchMyStats());
    dispatch(fetchMyRewards());
  }, [resolvedLanguage, languageDb, dispatch]);


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
    if (characterProgressLoading || !characterProgress) return null;

    const rawId = characterProgress.currentLessonMasterId;
    const currentLmId = rawId
      ? String(typeof rawId === 'object' ? rawId._id : rawId)
      : null;
    if (!currentLmId) return null;

    const visibleCards = languageMapProgress?.visibleCards || [];
    let targetCard = null;

    for (const card of visibleCards) {
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

      if (resolvedLmId === currentLmId) {
        targetCard = card;
        break;
      }
    }

    if (!targetCard) return null;

    const building = mapItems.find((i) => i.type === 'Buildings' && i.id === targetCard.buildingId)
      || null;

    if (!building) return null;

    const cx = building.x + (building.width || 40) / 2;
    const cy = building.y + (building.height || 40) / 2;

    let nearest = null;
    let nearestDist = Infinity;
    roadPaths.forEach((path) => {
      if (!path.visible || !Array.isArray(path.points) || path.points.length < 2) return;
      for (let i = 0; i < path.points.length; i += 2) {
        const dist = Math.hypot(path.points[i] - cx, path.points[i + 1] - cy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = { x: path.points[i], y: path.points[i + 1] };
        }
      }
    });

    return nearest || { x: cx, y: building.y + (building.height || 40) + 16 };
  }, [characterProgress, characterProgressLoading, languageMapProgress, mapItems, roadPaths, progressSummary]);



  const { top: vpTop, bottom: vpBottom } = viewportBoundsRef.current;

  const isItemInViewport = (item) => {
    const itemTop = item.y ?? 0;
    const itemBottom = itemTop + (item.height || 60);
    return itemBottom >= vpTop && itemTop <= vpBottom;
  };

  const isItemVisible = (item) => {
    if (item.type === 'Lesson Cards') {
      return languageMapProgress.visibleCardIds.has(item.id) && isItemInViewport(item);
    }
    if (item.type === 'Buildings') {
      const baseVisible = languageMapProgress.visibleBuildingIds.has(item.id) ||
        (hasUnlinkedVisibleCards && item.y <= visibleMapHeight);
      return baseVisible && isItemInViewport(item);
    }
    return isItemInViewport(item);
  };

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
      (item) => item.type === 'Buildings' && item.id === lessonCard.buildingId
    );

    if (!building) return null;

    return building.src || building.imageUrl || null;
  }, [currentLessonMasterId, languageMapProgress, progressSummary, mapItems]);

  const scale = containerWidth > 0 ? containerWidth / DESIGN_WIDTH : 1;
  const stageWidth = containerWidth > 0 ? containerWidth : DESIGN_WIDTH;
  const stageHeight = visibleMapHeight * scale;

  const checkCardVisibility = useCallback(() => {
    if (REDUCED_MOTION) return;
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
      languageMapProgress.visibleCards.forEach((card) => {
        if (next.has(card.id)) return;
        const cardTop = card.y * scale;
        const cardBottom = (card.y + (card.height || 90)) * scale;
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
    
    if (Math.abs(prevBounds.top - newMapTop) > 200 || Math.abs(prevBounds.bottom - newMapBottom) > 200) {
      viewportBoundsRef.current = { top: newMapTop, bottom: newMapBottom };
      setViewportEpoch(e => e + 1);
    }

  }, [languageMapProgress, scale]);

  useEffect(() => {
    if (REDUCED_MOTION) return undefined;
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
  const fallbackBgColor = lastSectionTheme?.color || '#599824';

  return (
    // Height on mobile = viewport minus the fixed top bar & bottom bar (CSS vars set by Navbar).
    // On desktop the Navbar sidebar is fixed on the left and #root is padded, so h-screen is correct.
    <div className="flex flex-col lg:flex-row h-[calc(100dvh_-_var(--shell-top-h,0px)_-_var(--shell-bottom-h,0px))] lg:h-screen w-full bg-slate-100 text-slate-800 overflow-hidden font-sans">
      <main
        ref={mainScrollRef}
        className="flex-1 min-w-0 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain relative lg:h-full min-h-0"
      >
        <div className="flex-1 w-full px-0 pb-6 flex flex-col items-center">
          <div ref={containerRef} className="w-full max-w-[800px] relative flex justify-center">
            <div className="w-full overflow-hidden">
              {loading ? (
                <div className="flex h-96 items-center justify-center text-white font-bold">Loading Adventure Map...</div>
              ) : visibleMapHeight > 0 ? (
                <Stage width={stageWidth} height={stageHeight} listening={true}>
                  <Layer name="background-layer" listening={false}>
                    <Rect x={0} y={0} width={stageWidth} height={stageHeight} fill={fallbackBgColor} listening={false} />
                    <Group scaleX={scale} scaleY={scale} listening={false}>
                      {bgSections
                        .filter(sec => {
                          const secBottom = sec.y + sec.height;
                          return secBottom >= vpTop && sec.y <= vpBottom;
                        })
                        .map((sec) => (
                          <UserBackgroundSection key={sec.id} sec={sec} customThemes={customThemes} stageWidth={DESIGN_WIDTH} />
                        ))}
                    </Group>
                  </Layer>

                  <Layer name="roads-layer" listening={false}>
                    <Group scaleX={scale} scaleY={scale} listening={false}>
                      {roadPaths.map((path) => {
                        if (!path.visible || path.points.length < 2) return null;
                        let minY = Infinity, maxY = -Infinity;
                        for (let i = 1; i < path.points.length; i += 2) {
                          if (path.points[i] < minY) minY = path.points[i];
                          if (path.points[i] > maxY) maxY = path.points[i];
                        }
                        if (maxY < vpTop || minY > vpBottom) return null;
                        return <UserRoadPath key={path.id} path={path} />;
                      })}
                    </Group>
                  </Layer>

                  <Layer name="end-mask-layer" listening={false}>
                    <Group scaleX={scale} scaleY={scale} listening={false}>
                      {lastVisibleCard && (
                        <Rect
                          x={0}
                          y={endMessageY - 15}
                          width={DESIGN_WIDTH}
                          height={endMessageComponentHeight + bottomPadding + 30}
                          fill={fallbackBgColor}
                          listening={false}
                        />
                      )}
                    </Group>
                  </Layer>

                  <Layer name="objects-layer">
                    <Group scaleX={scale} scaleY={scale}>
                      {categoryOrder.map((catName) => {
                        const allCatItems = itemsByCategory[catName] || [];
                        const catItems = allCatItems.filter(isItemVisible);
                        return (
                          <Group key={catName} name={`group-${catName}`} listening={catName === 'Lesson Cards'}>
                            {catItems
                              .filter((item) => item.type !== 'Lesson Cards')
                              .map((item, idx) => {
                                const normalizedCat = String(catName).trim().toLowerCase();
                                const isCharacter = normalizedCat === 'character' || normalizedCat === 'characters';
                                if (isCharacter && (characterProgressLoading || isTransitionActive)) return null;
                                const renderItem =
                                  isCharacter && characterAnchor
                                    ? { ...item, x: characterAnchor.x - (item.width || 40) / 2, y: characterAnchor.y - (item.height || 40) * 0.88 }
                                    : isCharacter && !characterAnchor
                                      ? null
                                      : item;
                                if (renderItem === null) return null;

                                let finalIsLocked = renderItem.isLocked;
                                if (isTransitionActive && targetCardId && renderItem.id) {
                                  const targetCard = mapItems.find(i => i.id === targetCardId);
                                  if (targetCard && targetCard.buildingId === renderItem.id) {
                                    finalIsLocked = true;
                                  }
                                }

                                if (finalIsLocked) {
                                  return (
                                    <UserLockedLocation
                                      key={item.id}
                                      item={renderItem}
                                    />
                                  );
                                }
                                return (
                                  <UserCanvasItem
                                    key={item.id}
                                    item={renderItem}
                                  />
                                );
                              })}
                            {catName === 'Lesson Cards' &&
                              catItems.map((item, index) => {
                                  let finalLmId = null;
                                  const candidates = [item.lessonMasterId, item.lessonMaster, item.lessonId, item.masterId];
                                  for (const val of candidates) {
                                    if (val) {
                                      const extracted = typeof val === 'object' ? val._id : val;
                                      if (extracted && String(extracted).trim()) {
                                        finalLmId = String(extracted).trim();
                                        break;
                                      }
                                    }
                                  }

                                  if (!finalLmId && typeof item.order === 'number' && item.order > 0) {
                                    finalLmId = lmIdByOrder[item.order] || null;
                                  }

                                  if (process.env.NODE_ENV !== 'production') {
                                    console.debug('[AdventureMap][LessonCard] id resolution', {
                                      itemId: item.id,
                                      itemOrder: item.order,
                                      directCandidates: candidates.map(v => v ? String(typeof v === 'object' ? v._id : v) : null),
                                      finalLmId,
                                    });
                                  }

                                  const progress = finalLmId ? progressByLessonMasterId[finalLmId] : undefined;
                                  const unlockState = finalLmId ? lessonUnlockMap[finalLmId] : null;

                                  const isBeingUnlocked = isTransitionActive && item.id === targetCardId;
                                  const isOrder1 = item.order === 1;
                                  const isUnlocked = isOrder1
                                    ? true
                                    : (!isBeingUnlocked && unlockState?.unlocked === true);

                                  // Keep the card visible while the magic animation is playing on it,
                                  // even if unlockState hasn't propagated yet.
                                  const isMagicTarget = item.id === magicUnlockCardId;

                                  if (!isUnlocked && !isOrder1 && !isMagicTarget) {
                                    return null;
                                  }

                                  return (
                                    <UserLessonCard
                                      key={item.id}
                                      item={item}
                                      slotNumber={item.order || index + 1}
                                      activeLanguage={resolvedLanguage}
                                      progress={progress}
                                      isUnlocked={isUnlocked || isMagicTarget}
                                      revealed={REDUCED_MOTION ? true : revealedCardIds.has(item.id)}
                                      magicUnlock={isMagicTarget}
                                      onNodeClick={() => {
                                        if (finalLmId) {
                                          console.debug('[AdventureMap][LessonClick] navigating', {
                                            itemId: item.id,
                                            itemOrder: item.order,
                                            finalLmId,
                                          });
                                          navigate(`/sentence-list/${finalLmId}`);
                                        }
                                      }}
                                    />
                                  );
                              })}
                          </Group>
                        );
                      })}

                      <UserWalkingCharacter 
                        characterConfig={characterConfigItem}
                        isWalking={isWalking}
                        isTransitionActive={isTransitionActive}
                        currentPos={currentPos}
                        facingLeft={facingLeft}
                        walkFrameIndex={walkFrameIndex}
                      />

                      {lastVisibleCard && (
                        <MoreLessonsComingSoon y={endMessageY} />
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
          {characterProgressLoading ? (
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

      {/* Level Up Overlay */}
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
              {/* Particles */}
              {!REDUCED_MOTION && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-yellow-300/20 rounded-full blur-[60px]"
                  />
                  {/* Confetti pieces */}
                  <div className="absolute top-1/4 left-[10%] w-3 h-8 bg-teal-400 rotate-45 rounded-sm" />
                  <div className="absolute top-1/3 right-[15%] w-4 h-4 bg-yellow-400 rotate-12 rounded-full" />
                  <div className="absolute bottom-1/4 left-[20%] w-5 h-5 bg-cyan-400 rotate-45 rounded-sm" />
                  <div className="absolute bottom-1/3 right-[10%] w-3 h-10 bg-teal-300 -rotate-45 rounded-sm" />
                  <div className="absolute top-1/2 left-[5%] w-6 h-6 bg-yellow-300 rotate-[60deg] clip-star" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'}} />
                  <div className="absolute top-[20%] right-[5%] w-5 h-5 bg-cyan-200 rotate-[30deg] clip-star" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'}} />
                </div>
              )}

              {/* Crown */}
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

              {/* LEVEL UP Banner */}
              <motion.div
                initial={REDUCED_MOTION ? {} : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                className="relative z-10 mb-6 md:[@media(max-height:820px)]:!mb-3"
              >
                <div className="bg-gradient-to-b from-teal-400 to-teal-600 px-8 py-3 rounded-full shadow-[0_10px_20px_-5px_rgba(13,148,136,0.5)] border-b-4 border-teal-700 relative">
                  {/* Ribbon tails */}
                  <div className="absolute -left-4 top-4 bottom-4 w-8 bg-teal-700 -z-10 rounded-l-md skew-x-[-15deg] shadow-inner" />
                  <div className="absolute -right-4 top-4 bottom-4 w-8 bg-teal-700 -z-10 rounded-r-md skew-x-[15deg] shadow-inner" />
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-wider uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                    LEVEL UP!
                  </h2>
                </div>
              </motion.div>

              {/* Level Number */}
              <motion.div
                initial={REDUCED_MOTION ? {} : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="relative z-10 flex flex-col items-center justify-center mb-4 md:[@media(max-height:820px)]:!mb-2"
              >
                <p className="text-lg font-bold text-teal-800 uppercase tracking-widest mb-[-10px]">Level</p>
                <div className="flex items-center justify-center gap-4">
                  {/* Left Laurel */}
                  <svg width="40" height="80" viewBox="0 0 40 80" className="text-teal-300/60 fill-current opacity-80 rotate-[-10deg]">
                    <path d="M35 10 C 20 30, 0 50, 10 75 C 10 50, 30 30, 35 10 Z" />
                    <path d="M25 25 C 15 35, 5 45, 12 60 C 15 45, 25 35, 25 25 Z" />
                    <path d="M18 40 C 10 45, 5 50, 15 65 C 15 55, 20 45, 18 40 Z" />
                  </svg>
                  
                  <span className="text-[100px] md:text-[120px] md:[@media(max-height:820px)]:!text-[76px] md:[@media(max-height:640px)]:!text-[60px] font-black text-teal-700 leading-none drop-shadow-[0_4px_10px_rgba(13,148,136,0.3)]">
                    {levelUpData.level}
                  </span>

                  {/* Right Laurel */}
                  <svg width="40" height="80" viewBox="0 0 40 80" className="text-teal-300/60 fill-current opacity-80 rotate-[10deg] scale-x-[-1]">
                    <path d="M35 10 C 20 30, 0 50, 10 75 C 10 50, 30 30, 35 10 Z" />
                    <path d="M25 25 C 15 35, 5 45, 12 60 C 15 45, 25 35, 25 25 Z" />
                    <path d="M18 40 C 10 45, 5 50, 15 65 C 15 55, 20 45, 18 40 Z" />
                  </svg>
                </div>
              </motion.div>

              {/* Message */}
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

              {/* Continue Button */}
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