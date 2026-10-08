export const catmullRomInterpolate = (p0, p1, p2, p3, t) => {
  const t2 = t * t;
  const t3 = t2 * t;
  const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  return { x, y };
};

export const buildRoadSegmentCurve = (points, segIndex, tension = 0.4, samples = 24) => {
  if (!points || points.length < 2) return [];
  const p0 = points[segIndex - 1] || points[segIndex];
  const p1 = points[segIndex];
  const p2 = points[segIndex + 1] || points[segIndex];
  const p3 = points[segIndex + 2] || p2;
  const out = [];
  for (let s = 0; s <= samples; s++) {
    const t = s / samples;
    const curved = catmullRomInterpolate(p0, p1, p2, p3, t);
    const linear = { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
    out.push({
      x: linear.x + (curved.x - linear.x) * tension,
      y: linear.y + (curved.y - linear.y) * tension
    });
  }
  return out;
};

export const findNearestPointIndex = (points, x, y, minIndex = 0) => {
  let bestIdx = Math.min(minIndex, points.length - 1);
  let bestDist = Infinity;
  for (let idx = minIndex; idx < points.length; idx++) {
    const p = points[idx];
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = idx;
    }
  }
  return bestIdx;
};

export const buildChainedRoadCurve = (points, fromIndex, toIndex) => {
  if (!points || points.length < 2 || fromIndex === toIndex) {
    const single = points?.[toIndex] ?? points?.[fromIndex];
    return single ? [single, single] : [];
  }
  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);
  const out = [];
  for (let i = start; i < end; i++) {
    const seg = buildRoadSegmentCurve(points, i);
    if (out.length) seg.shift();
    out.push(...seg);
  }
  return out;
};