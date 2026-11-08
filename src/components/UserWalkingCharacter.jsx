// UserWalkingCharacter.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

import { getOptimizedImageUrl } from '../utils/imageOptimization';

/**
 * UserWalkingCharacter
 *
 * Rendered inside the objects <Group scaleX={scale} scaleY={scale}>.
 * Therefore `currentPos` is a world coordinate (not screen pixel) and
 * the parent Group applies the uniform scale. Do NOT multiply by scale here.
 */
export const UserWalkingCharacter = ({
  characterConfig,
  isWalking,
  isTransitionActive,
  currentPos,
  facingLeft,
  walkFrameIndex,
  // legacy props — no longer used for projection
  scale,
  metrics,
}) => {
  void scale; void metrics;

  const walkFrames = characterConfig?.walkFrames || [];
  const hasWalkFrames = walkFrames.length >= 2;
  const currentSrc = (hasWalkFrames && isWalking)
    ? walkFrames[walkFrameIndex % walkFrames.length]
    : (characterConfig?.src || '');

  const [img] = useImage(
    getOptimizedImageUrl(currentSrc, { width: (characterConfig?.width || 80) * 2 })
  );

  const lastLoadedImgRef = useRef(null);
  useEffect(() => {
    if (img) lastLoadedImgRef.current = img;
  }, [img]);
  // eslint-disable-next-line react-hooks/refs
  const displayImg = img || lastLoadedImgRef.current;

  const [bobOffset, setBobOffset] = useState(0);
  useEffect(() => {
    if (!isWalking || hasWalkFrames) return;
    const interval = setInterval(() => {
      setBobOffset((prev) => (prev === 0 ? -4 : 0));
    }, 200);
    return () => clearInterval(interval);
  }, [isWalking, hasWalkFrames]);

  useEffect(() => {
    if (!isWalking || !characterConfig?.stepSound) return;
    const audio = new Audio(characterConfig.stepSound);
    audio.loop = true;
    audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isWalking, characterConfig?.stepSound]);

  const w = characterConfig?.width || 40;
  const h = characterConfig?.height || 40;

  // currentPos is in world coordinates. The parent Group handles scaling.
  // Position the character center at world point, offset up by 88% of height.
  const renderX = currentPos ? currentPos.x - w / 2 : 0;
  const renderY = currentPos ? currentPos.y - h * 0.88 + bobOffset : 0;

  // eslint-disable-next-line react-hooks/refs
  if (!isTransitionActive || !currentPos || !displayImg) return null;

  return (
    <Group x={renderX} y={renderY}>
      <KonvaImage
        image={displayImg}
        width={w}
        height={h}
        offsetX={w / 2}
        x={w / 2}
        scaleX={facingLeft ? -1 : 1}
      />
    </Group>
  );
};
