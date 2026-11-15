const numberOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export function freeRect(stageRect, panelRects = []) {
  const left = numberOr(stageRect.left, 0), top = numberOr(stageRect.top, 0);
  const right = numberOr(stageRect.right, left + numberOr(stageRect.width, 0));
  const bottom = numberOr(stageRect.bottom, top + numberOr(stageRect.height, 0));
  const centerX = (left + right) / 2, centerY = (top + bottom) / 2;
  const result = { left, top, right, bottom };
  for (const panel of panelRects) {
    if (!panel) continue;
    const pLeft = numberOr(panel.left, NaN), pTop = numberOr(panel.top, NaN);
    const pRight = numberOr(panel.right, pLeft + numberOr(panel.width, 0));
    const pBottom = numberOr(panel.bottom, pTop + numberOr(panel.height, 0));
    if (![pLeft, pTop, pRight, pBottom].every(Number.isFinite)) continue;
    if (pRight <= result.left || pLeft >= result.right || pBottom <= result.top || pTop >= result.bottom) continue;
    const overlapsCenter = pLeft < centerX && pRight > centerX && pTop < centerY && pBottom > centerY;
    if (overlapsCenter) {
      const candidates = [
        ["left", Math.abs(pRight - result.left)], ["right", Math.abs(result.right - pLeft)],
        ["top", Math.abs(pBottom - result.top)], ["bottom", Math.abs(result.bottom - pTop)]
      ].sort((a,b) => a[1] - b[1]);
      const edge = candidates[0][0];
      if (edge === "left") result.left = Math.max(result.left, pRight);
      if (edge === "right") result.right = Math.min(result.right, pLeft);
      if (edge === "top") result.top = Math.max(result.top, pBottom);
      if (edge === "bottom") result.bottom = Math.min(result.bottom, pTop);
    } else if (pRight <= centerX) result.left = Math.max(result.left, pRight);
    else if (pLeft >= centerX) result.right = Math.min(result.right, pLeft);
    else if (pBottom <= centerY) result.top = Math.max(result.top, pBottom);
    else if (pTop >= centerY) result.bottom = Math.min(result.bottom, pTop);
  }
  if (result.right < result.left) result.right = result.left;
  if (result.bottom < result.top) result.bottom = result.top;
  result.width = result.right - result.left; result.height = result.bottom - result.top;
  return result;
}

export function targetFor(nodeCenter, availableRect, zoom = 1) {
  const scale = Math.max(0.01, numberOr(zoom, 1));
  return {
    x: availableRect.left + availableRect.width / 2 - nodeCenter.x * scale,
    y: availableRect.top + availableRect.height / 2 - nodeCenter.y * scale
  };
}

export function step(current, target, dt, speed = 1) {
  const elapsed = Math.max(0, numberOr(dt, 0)), rate = Math.max(0.01, numberOr(speed, 1));
  const factor = 1 - Math.exp((-elapsed * rate) / 110);
  return { x: current.x + (target.x - current.x) * factor, y: current.y + (target.y - current.y) * factor };
}
