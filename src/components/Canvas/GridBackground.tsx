import React from 'react';

interface GridBackgroundProps {
  pan: { x: number; y: number };
  zoom: number;
}

export const GridBackground = React.memo<GridBackgroundProps>(({ pan, zoom }) => {
  const gridSize = 28 * zoom;
  const offsetX = pan.x % gridSize;
  const offsetY = pan.y % gridSize;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.18) 1.2px, transparent 1.2px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    />
  );
});

GridBackground.displayName = 'GridBackground';
