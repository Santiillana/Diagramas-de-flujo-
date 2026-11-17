export function orthogonalPath(points) {
  if (!Array.isArray(points) || points.length < 2 || points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return false;
  return points.every((point, index) => index === 0 || point.x === points[index - 1].x || point.y === points[index - 1].y);
}

export function pathAvoidsRects(points, rectangles, margin = 0) {
  if (!orthogonalPath(points)) return false;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    for (const rect of rectangles) {
      const left = rect.x - margin, right = rect.x + rect.width + margin;
      const top = rect.y - margin, bottom = rect.y + rect.height + margin;
      const crosses = a.x === b.x
        ? a.x > left && a.x < right && Math.max(Math.min(a.y, b.y), top) < Math.min(Math.max(a.y, b.y), bottom)
        : a.y > top && a.y < bottom && Math.max(Math.min(a.x, b.x), left) < Math.min(Math.max(a.x, b.x), right);
      if (crosses) return false;
    }
  }
  return true;
}
