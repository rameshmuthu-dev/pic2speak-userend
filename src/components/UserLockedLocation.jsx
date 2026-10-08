import React from 'react';
import { Group, Ellipse, Path } from 'react-konva';

export const UserLockedLocation = ({ item }) => {
  const w = item.width || 80;
  const h = item.height || 80;

  return (
    <Group x={item.x} y={item.y} scaleX={item.scaleX || 1} scaleY={item.scaleY || 1} rotation={item.rotation || 0} listening={false}>
      {/* Blurred dark blob underneath */}
      <Ellipse
        x={w / 2}
        y={h / 2 + 10} // shifted slightly down for perspective
        radiusX={w * 0.45}
        radiusY={h * 0.3}
        fill="rgba(0, 30, 0, 0.4)"
        shadowColor="rgba(0, 20, 0, 0.6)"
        shadowBlur={20}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />
      
      {/* Soft overlay to blend */}
      <Ellipse
        x={w / 2}
        y={h / 2 + 10}
        radiusX={w * 0.35}
        radiusY={h * 0.2}
        fill="rgba(0, 20, 0, 0.3)"
        shadowColor="rgba(0, 0, 0, 0.8)"
        shadowBlur={10}
      />

      {/* Lock Icon Container */}
      <Group x={w / 2} y={h / 2}>
        {/* Subtle glow behind the lock */}
        <Ellipse
          x={0}
          y={0}
          radiusX={16}
          radiusY={16}
          fill="rgba(255, 255, 255, 0.15)"
          shadowColor="rgba(255, 255, 255, 0.3)"
          shadowBlur={15}
        />
        
        {/* SVG Path for the Lock Icon (filled, clean game-style) */}
        {/* Lock body and shackle */}
        <Path
          x={-9}
          y={-11}
          data="M14 7V5c0-2.76-2.24-5-5-5S4 2.24 4 5v2H3c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2h-1ZM6 5c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6V5Zm3 10.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2Z"
          fill="#f1f5f9"
          shadowColor="#000"
          shadowBlur={4}
          shadowOffsetY={2}
          shadowOpacity={0.6}
        />
      </Group>
    </Group>
  );
};

