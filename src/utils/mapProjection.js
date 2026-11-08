/**
 * mapProjection.js
 *
 * Shared World-to-Screen Projection Engine for Pic2Speak Adventure Map.
 * Uses uniform Group scaling: screenX = worldX × scale, screenY = worldY × scale.
 * Both Admin and User sides share the same canonical world coordinate contract.
 *
 * Canonical world width: 800px
 * Scale: containerWidth / REFERENCE_WORLD_WIDTH
 * All elements (X, Y, width, height) are scaled uniformly.
 */

export const REFERENCE_WORLD_WIDTH = 800;
export const DEFAULT_CARD_WIDTH = 154;
export const DEFAULT_CARD_HEIGHT = 72;
export const DEFAULT_ROAD_WIDTH = 38;
export const DEFAULT_NODE_STEP_Y = 190;
export const DEFAULT_START_Y = 60;

/**
 * Calculates the uniform scale factor for any container width.
 *
 * @param {number} containerWidth - Actual measured container width in px.
 * @returns {number} Uniform scale factor (containerWidth / 800).
 */
export const getUniformScale = (containerWidth) => {
  const width = Math.max(300, Number(containerWidth) || REFERENCE_WORLD_WIDTH);
  return width / REFERENCE_WORLD_WIDTH;
};

/**
 * Returns a metrics object whose `scale` field is the uniform scale
 * (containerWidth / 800). Used by components that still receive a metrics object.
 *
 * @param {number} viewportWidth - Actual measured container width in px.
 * @returns {object} Metrics object with uniform scale.
 */
export const getResponsiveLayoutMetrics = (viewportWidth) => {
  const width = Math.max(300, Number(viewportWidth) || REFERENCE_WORLD_WIDTH);
  const scale = width / REFERENCE_WORLD_WIDTH;

  return {
    viewportWidth: width,
    containerWidth: width,
    scale,
    // Legacy corridor fields retained for safety but no longer used for rendering
    margin: 0,
    leftBound: 0,
    rightBound: width,
    corridorWidth: width,
    centerX: width / 2,
    ambientScale: scale,
    corridorInsetX: 0,
  };
};

/**
 * Projects a world X coordinate to screen X using uniform scaling.
 * screenX = worldX × scale
 *
 * @param {number} x - World X coordinate (canonical 0–800 space).
 * @param {object|number} metricsOrScale - Metrics object (uses .scale) or raw scale number.
 * @returns {number} Screen X coordinate in pixels.
 */
export const projectWorldXToScreen = (x, metricsOrScale) => {
  if (!Number.isFinite(x)) return 0;
  const scale = typeof metricsOrScale === 'number'
    ? metricsOrScale
    : (metricsOrScale?.scale ?? 1);
  return x * scale;
};

/**
 * Projects a world Y coordinate to screen Y using uniform scaling.
 * screenY = worldY × scale
 *
 * @param {number} y - World Y coordinate.
 * @param {object|number} metricsOrScale - Metrics object or raw scale number.
 * @returns {number} Screen Y coordinate in pixels.
 */
export const projectWorldYToScreen = (y, metricsOrScale) => {
  if (!Number.isFinite(y)) return 0;
  const scale = typeof metricsOrScale === 'number'
    ? metricsOrScale
    : (metricsOrScale?.scale ?? 1);
  return y * scale;
};

/**
 * Inverse projection: converts a screen X coordinate back to world X.
 * worldX = screenX / scale
 *
 * @param {number} screenX - Screen X coordinate (from drag/click).
 * @param {object|number} metricsOrScale - Metrics object or raw scale number.
 * @returns {number} World X coordinate compatible with existing MongoDB schema.
 */
export const projectScreenXToWorld = (screenX, metricsOrScale) => {
  if (!Number.isFinite(screenX)) return 400;
  const scale = typeof metricsOrScale === 'number'
    ? metricsOrScale
    : (metricsOrScale?.scale ?? 1);
  if (scale === 0) return 400;
  return Math.round((screenX / scale) * 100) / 100;
};

/**
 * Projects a complete item (building, tree, character, lesson card) to screen space.
 *
 * @param {object} item - Map item with x, y, width, height.
 * @param {object|number} metricsOrScale - Metrics object or raw scale number.
 * @returns {object} Projected item with screen coordinates.
 */
export const projectItemToScreen = (item, metricsOrScale) => {
  if (!item) return null;
  const scale = typeof metricsOrScale === 'number'
    ? metricsOrScale
    : (metricsOrScale?.scale ?? 1);

  const screenX = (Number(item.x) || 0) * scale;
  const screenY = (Number(item.y) || 0) * scale;

  const isCard = item.type === 'Lesson Cards';
  const width = isCard ? DEFAULT_CARD_WIDTH : (Number(item.width) || 40);
  const height = isCard ? DEFAULT_CARD_HEIGHT : (Number(item.height) || 40);

  return {
    ...item,
    screenX,
    screenY,
    screenWidth: width * scale,
    screenHeight: height * scale,
  };
};

/**
 * Projects a road path points array [x0, y0, x1, y1, ...] to screen space.
 * Both X and Y are scaled uniformly.
 *
 * @param {number[]} points - Flat array of road world coordinates.
 * @param {object|number} metricsOrScale - Metrics object or raw scale number.
 * @returns {number[]} Flat array of projected screen coordinates.
 */
export const projectRoadPointsToScreen = (points, metricsOrScale) => {
  if (!Array.isArray(points) || points.length < 2) return [];
  const scale = typeof metricsOrScale === 'number'
    ? metricsOrScale
    : (metricsOrScale?.scale ?? 1);

  const projected = new Array(points.length);
  for (let i = 0; i < points.length; i++) {
    projected[i] = points[i] * scale;
  }
  return projected;
};

/**
 * Generates an alternating serpentine winding pathway layout for any number of lessons.
 * Used ONLY when Admin has not yet published a map; never called to override saved Admin data.
 *
 * @param {number} lessonCount - Total number of lessons to position.
 * @param {object} options - Configuration overrides.
 * @returns {object} Generated nodes, road points, and recommended world height.
 */
export const generateSerpentineLayout = (lessonCount, options = {}) => {
  const count = Math.max(1, lessonCount || 5);
  const startY = options.startY ?? DEFAULT_START_Y;
  const stepY = options.stepY ?? DEFAULT_NODE_STEP_Y;
  const roadWidth = options.roadWidth ?? DEFAULT_ROAD_WIDTH;

  const nodes = [];
  const roadPoints = [];

  const leftRatio = 0.24;
  const rightRatio = 0.76;
  const centerRatio = 0.5;

  roadPoints.push(centerRatio * REFERENCE_WORLD_WIDTH, startY - 40);

  for (let i = 0; i < count; i++) {
    const isEven = i % 2 === 0;
    const stationRatio = isEven ? rightRatio : leftRatio;
    const cardRatio = isEven ? rightRatio + 0.05 : leftRatio - 0.28;
    const stationY = startY + i * stepY;

    if (i > 0) {
      const prevStationY = startY + (i - 1) * stepY;
      const midY = (prevStationY + stationY) / 2;
      const midRatio = centerRatio + (isEven ? -0.08 : 0.08);
      roadPoints.push(midRatio * REFERENCE_WORLD_WIDTH, midY);
    }

    const stationX = stationRatio * REFERENCE_WORLD_WIDTH;
    roadPoints.push(stationX, stationY);

    nodes.push({
      order: i + 1,
      stationX,
      stationY,
      cardX: Math.max(0, Math.min(cardRatio * REFERENCE_WORLD_WIDTH, REFERENCE_WORLD_WIDTH - DEFAULT_CARD_WIDTH)),
      cardY: stationY - DEFAULT_CARD_HEIGHT / 2,
      isRightSide: isEven,
    });
  }

  const lastY = startY + (count - 1) * stepY;
  roadPoints.push(centerRatio * REFERENCE_WORLD_WIDTH, lastY + 120);

  const totalHeight = lastY + 280;

  return {
    nodes,
    roadPoints,
    roadWidth,
    totalHeight,
  };
};
