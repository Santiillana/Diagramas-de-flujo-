export function createClock({ duration = Infinity, speed = 1, onChange = () => {} } = {}) {
  let time = 0;
  let rate = [0.5, 1, 2].includes(speed) ? speed : 1;
  let playing = false;
  const end = Number.isFinite(duration) ? Math.max(0, duration) : Infinity;
  const snapshot = () => ({ time, speed: rate, playing });
  const emit = () => onChange(snapshot());
  return {
    get time() { return time; },
    get speed() { return rate; },
    get playing() { return playing; },
    play() { if (time < end) playing = true; emit(); },
    pause() { playing = false; emit(); },
    advance(delta) {
      if (!playing || !Number.isFinite(delta) || delta <= 0) return time;
      time = Math.min(end, time + delta * rate);
      if (time >= end) playing = false;
      emit();
      return time;
    },
    step(amount = 1) { playing = false; time = Math.max(0, Math.min(end, time + amount)); emit(); return time; },
    seek(value) { playing = false; time = Math.max(0, Math.min(end, Number.isFinite(value) ? value : 0)); emit(); return time; },
    restart() { playing = false; time = 0; emit(); return time; },
    setSpeed(value) { if (![0.5, 1, 2].includes(value)) return false; rate = value; emit(); return true; }
  };
}
