import React from 'react';
import { Group, Ellipse, Path } from 'react-konva';

/**
 * UserLockedLocation — renders a locked/placeholder location icon on the map.
 *
 * Uses raw world coordinates (item.x, item.y).
 * The parent <Group scaleX={scale} scaleY={scale}> in AdventureMap handles uniform scaling.
 * Do NOT multiply by scale here — that would double-scale.
 */
export const UserLockedLocation = ({ item }) => {
  const w = item.width || 80;
  const h = item.height || 80;
  // Clamp negative world X coordinates to 0 for rendering; never mutate saved data
  const worldX = Math.max(0, Number(item.x) || 0);
  const worldY = Number(item.y) || 0;

  return (
    <Group
      x={worldX}
      y={worldY}
      scaleX={item.scaleX || 1}
      scaleY={item.scaleY || 1}
      rotation={item.rotation || 0}
      listening={false}
    >
      {/* Dark Navy Shadow Blob */}
      <Ellipse
        x={w / 2}
        y={h / 2 + 10}
        radiusX={w * 0.45}
        radiusY={h * 0.3}
        fill="rgba(5, 13, 26, 0.6)"
        shadowColor="rgba(0, 240, 255, 0.25)"
        shadowBlur={18}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />

      {/* Soft Mystery Mist */}
      <Ellipse
        x={w / 2}
        y={h / 2 + 10}
        radiusX={w * 0.35}
        radiusY={h * 0.2}
        fill="rgba(15, 23, 42, 0.4)"
        shadowColor="rgba(139, 92, 246, 0.3)"
        shadowBlur={12}
      />

      {/* Lock Icon Container with Cyan/Purple Glow */}
      <Group x={w / 2} y={h / 2}>
        <Ellipse
          x={0}
          y={0}
          radiusX={16}
          radiusY={16}
          fill="rgba(7, 20, 38, 0.85)"
          stroke="#8b5cf6"
          strokeWidth={1.5}
          shadowColor="#00f0ff"
          shadowBlur={12}
        />

        {/* SVG Path for the Lock Icon */}
        <Path
          x={-8}
          y={-10}
          data="M14 7V5c0-2.76-2.24-5-5-5S4 2.24 4 5v2H3c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2h-1ZM6 5c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6V5Zm3 10.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2Z"
          fill="#38bdf8"
          scaleX={0.9}
          scaleY={0.9}
          shadowColor="#000"
          shadowBlur={3}
          shadowOffsetY={1}
          shadowOpacity={0.6}
        />
      </Group>
    </Group>
  );
};
