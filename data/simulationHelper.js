/**
 * data/simulationHelper.js
 *
 * Shared pattern engine for seed.js (historical) and simulate.js (live).
 * Keep this file in /data — simulation logic must never live in /src.
 */

// ── Utilities ─────────────────────────────────────────────────────────────────

export const randomBetween = (min, max) => Math.random() * (max - min) + min;
export const randomInt     = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Convert any UTC Date to Sri Lanka Time (UTC+5:30) components */
export const toSLT = (date) => {
  const sltMs  = date.getTime() + 330 * 60 * 1000; // +5h30m
  const slt    = new Date(sltMs);
  const hour   = slt.getUTCHours();
  const minute = slt.getUTCMinutes();
  return {
    hour,
    minute,
    minuteOfDay: hour * 60 + minute,
    dayOfWeek: slt.getUTCDay(),   // 0=Sun, 6=Sat
  };
};

// ── Pattern Engine ────────────────────────────────────────────────────────────

/**
 * Returns the traffic pattern for a given SLT time.
 * @param {number} hour        SLT hour 0-23
 * @param {number} minuteOfDay SLT minutes from midnight (0-1439)
 * @param {number} dayOfWeek   0=Sun … 6=Sat
 */
export const getPattern = (hour, minuteOfDay, dayOfWeek) => {
  const isWeekend  = dayOfWeek === 0 || dayOfWeek === 6;
  const isSunday   = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;

  // Dead night is the same every day
  if (hour >= 0 && hour < 5) {
    return { name: 'DEAD_NIGHT', activePercent: 0.05, speedMin: 20, speedMax: 35, passengerMax: 1, batteryBase: 15 };
  }

  // ── Weekend paths ───────────────────────────────────────────────────────────
  if (isWeekend) {
    if (isSunday && hour >= 5 && hour < 9) {
      return { name: 'SUNDAY_RELIGIOUS', activePercent: 0.65, speedMin: 15, speedMax: 25, passengerMax: 3, batteryBase: 88, isRaining: false };
    }
    if (isSaturday && hour >= 5 && hour < 9) {
      return { name: 'SATURDAY_MARKET', activePercent: 0.75, speedMin: 20, speedMax: 35, passengerMax: 2, batteryBase: 88, isRaining: false };
    }
    if (hour >= 9 && hour < 12) {
      return { name: 'WEEKEND_MID_MORNING', activePercent: 0.70, speedMin: 25, speedMax: 45, passengerMax: 2, batteryBase: 72, isRaining: false };
    }
    if (hour >= 12 && hour < 14) {
      return { name: 'WEEKEND_LUNCH', activePercent: 0.55, speedMin: 15, speedMax: 25, passengerMax: 2, batteryBase: 60, isRaining: false };
    }
    if (hour >= 14 && hour < 17) {
      // April afternoon rain still applies on weekends
      return { name: 'WEEKEND_AFTERNOON', activePercent: 0.60, speedMin: 15, speedMax: 30, passengerMax: 3, batteryBase: 48, isRaining: true };
    }
    if (isSunday && hour >= 17 && hour < 21) {
      return { name: 'SUNDAY_EVENING', activePercent: 0.55, speedMin: 25, speedMax: 40, passengerMax: 2, batteryBase: 30, isRaining: false };
    }
    if (isSaturday && hour >= 17 && hour < 22) {
      return { name: 'SATURDAY_EVENING', activePercent: 0.78, speedMin: 25, speedMax: 42, passengerMax: 2, batteryBase: 30, isRaining: false };
    }
    return { name: 'LATE_NIGHT', activePercent: 0.30, speedMin: 35, speedMax: 50, passengerMax: 1, batteryBase: 18, isRaining: false };
  }

  // ── Weekday paths ───────────────────────────────────────────────────────────
  if (hour >= 5 && hour < 6) {
    return { name: 'PRE_DAWN', activePercent: 0.60, speedMin: 15, speedMax: 25, passengerMax: 1, batteryBase: 92, isRaining: false };
  }
  if (hour === 6) {
    return { name: 'EARLY_MORNING', activePercent: 0.70, speedMin: 25, speedMax: 40, passengerMax: 1, batteryBase: 85, isRaining: false };
  }
  if (minuteOfDay >= 420 && minuteOfDay < 450) {   // 07:00-07:30
    return { name: 'SCHOOL_RUSH', activePercent: 0.85, speedMin: 5, speedMax: 15, passengerMax: 2, batteryBase: 80, isRaining: false };
  }
  if (minuteOfDay >= 450 && minuteOfDay < 540) {   // 07:30-09:00
    return { name: 'OFFICE_RUSH', activePercent: 0.90, speedMin: 10, speedMax: 25, passengerMax: 3, batteryBase: 78, isRaining: false };
  }
  if (hour >= 9 && hour < 12) {
    return { name: 'MID_MORNING', activePercent: 0.75, speedMin: 30, speedMax: 45, passengerMax: 2, batteryBase: 68, isRaining: false };
  }
  if (hour === 12) {
    return { name: 'LUNCH', activePercent: 0.60, speedMin: 15, speedMax: 25, passengerMax: 2, batteryBase: 58, isRaining: false };
  }
  if (minuteOfDay >= 780 && minuteOfDay < 810) {   // 13:00-13:30
    return { name: 'EARLY_AFTERNOON', activePercent: 0.70, speedMin: 25, speedMax: 40, passengerMax: 2, batteryBase: 54, isRaining: false };
  }
  if (minuteOfDay >= 810 && minuteOfDay < 870) {   // 13:30-14:30
    return { name: 'SCHOOL_PICKUP', activePercent: 0.80, speedMin: 5, speedMax: 15, passengerMax: 2, batteryBase: 50, isRaining: false };
  }
  if (minuteOfDay >= 870 && minuteOfDay < 900) {   // 14:30-15:00
    return { name: 'POST_SCHOOL', activePercent: 0.65, speedMin: 30, speedMax: 45, passengerMax: 1, batteryBase: 46, isRaining: false };
  }
  if (hour >= 15 && hour < 17) {                   // April afternoon rain
    return { name: 'MONSOON_WINDOW', activePercent: 0.65, speedMin: 12, speedMax: 28, passengerMax: 1, batteryBase: 42, isRaining: true };
  }
  if (hour >= 17 && hour < 19) {
    return { name: 'EVENING_RUSH', activePercent: 0.90, speedMin: 10, speedMax: 25, passengerMax: 3, batteryBase: 35, isRaining: false };
  }
  if (hour >= 19 && hour < 22) {
    return { name: 'EVENING', activePercent: 0.70, speedMin: 30, speedMax: 40, passengerMax: 2, batteryBase: 25, isRaining: false };
  }
  // 22:00-00:00
  return { name: 'LATE_NIGHT', activePercent: 0.40, speedMin: 35, speedMax: 50, passengerMax: 1, batteryBase: 18, isRaining: false };
};

// ── Anomaly Assignment ────────────────────────────────────────────────────────

/** Simple deterministic hash: same deviceId always produces the same float 0-1 */
const detFloat = (deviceId, salt) => {
  const s = deviceId + salt;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 10000) / 10000;
};

/**
 * Assign consistent anomaly flags per tuktuk.
 * Using deviceId as seed ensures the same tuktuk is always a speeder, etc.
 */
export const assignAnomalies = (deviceId) => ({
  isNightRunner:    detFloat(deviceId, 'nr')  < 0.03,
  isSpeeder:        detFloat(deviceId, 'sp')  < 0.02,
  isFrequentIdler:  detFloat(deviceId, 'id')  < 0.05,
  isErratic:        detFloat(deviceId, 'er')  < 0.02,
  isLocationJumper: detFloat(deviceId, 'jmp') < 0.01,
  isBreakdownProne: detFloat(deviceId, 'bd')  < 0.02,
});

// ── Movement Calculator ───────────────────────────────────────────────────────

const SL_LAT = { min: 5.9,  max: 9.9  };
const SL_LNG = { min: 79.7, max: 81.9 };

/**
 * Calculate next GPS position from current position + speed + heading.
 * @param {number} lat           Current latitude
 * @param {number} lng           Current longitude
 * @param {number} speed         Speed in km/h
 * @param {number} heading       Heading in degrees (0=North)
 * @param {number} elapsedMin    Minutes elapsed since last ping
 * @returns {{ latitude: number, longitude: number }}
 */
export const calcNextPosition = (lat, lng, speed, heading, elapsedMin) => {
  if (speed <= 0) return { latitude: lat, longitude: lng };
  const distKm    = speed * (elapsedMin / 60);
  const distDeg   = distKm / 111;
  const rad       = heading * (Math.PI / 180);
  let newLat = lat + Math.cos(rad) * distDeg;
  let newLng = lng + Math.sin(rad) * distDeg;
  newLat = Math.min(Math.max(newLat, SL_LAT.min), SL_LAT.max);
  newLng = Math.min(Math.max(newLng, SL_LNG.min), SL_LNG.max);
  return { latitude: Number(newLat.toFixed(6)), longitude: Number(newLng.toFixed(6)) };
};

// ── Ping Generator ────────────────────────────────────────────────────────────

/**
 * Generate one ping's data for a single tuktuk at a given timestamp.
 *
 * @param {object} opts
 * @param {object} opts.tuktuk         Tuktuk document (needs _id, deviceId)
 * @param {Date}   opts.timestamp      UTC timestamp for this ping
 * @param {number} opts.lat            Current latitude
 * @param {number} opts.lng            Current longitude
 * @param {object} opts.anomalies      Result of assignAnomalies()
 * @param {number} opts.elapsedMin     Minutes since last ping (for position calc)
 * @param {object} opts.state          Mutable per-tuktuk state (breakdown, jam, etc.)
 * @returns {{ ping: object, newLat: number, newLng: number, newState: object }}
 */
export const generatePing = ({ tuktuk, timestamp, lat, lng, anomalies, elapsedMin, state }) => {
  const { hour, minuteOfDay, dayOfWeek } = toSLT(timestamp);
  const pattern = getPattern(hour, minuteOfDay, dayOfWeek);

  // ── Resolve state carry-overs ─────────────────────────────────────────────
  let { breakdownUntil, jamUntil } = state || {};
  const inBreakdown = breakdownUntil && timestamp < breakdownUntil;
  const inJam       = jamUntil       && timestamp < jamUntil;

  // ── Determine if active ───────────────────────────────────────────────────
  const isNight = hour >= 0 && hour < 5;
  let active = Math.random() < pattern.activePercent;

  // Night runner override
  if (isNight && anomalies.isNightRunner) active = true;
  if (isNight && !anomalies.isNightRunner) active = false;

  // Breakdown overrides activity
  if (inBreakdown) active = false;

  // ── Speed + heading ───────────────────────────────────────────────────────
  let speed   = 0;
  let heading = randomInt(0, 359);

  if (active) {
    speed = randomBetween(pattern.speedMin, pattern.speedMax);

    // Random events
    const roll = Math.random();
    if (!inJam && roll < 0.005) {
      // Traffic jam
      speed = randomBetween(3, 8);
      jamUntil = new Date(timestamp.getTime() + randomInt(2, 6) * 60 * 1000);
    } else if (!inBreakdown && roll < (anomalies.isBreakdownProne ? 0.05 : 0.008)) {
      // Breakdown (isBreakdownProne tuktuks are ~6× more likely to break down)
      speed = 0;
      breakdownUntil = new Date(timestamp.getTime() + randomInt(10, 20) * 60 * 1000);
      active = false;
    } else if (anomalies.isSpeeder && roll < 0.03) {
      speed = randomBetween(65, 80);
    } else if (roll < 0.01) {
      // Clear road speeding
      speed = randomBetween(65, 80);
    }

    if (inJam) speed = randomBetween(3, 8);

    // Erratic movement
    if (anomalies.isErratic && Math.random() < 0.1) {
      speed = speed > 25 ? randomBetween(3, 12) : randomBetween(50, 65);
    }

    // Frequent idler — engine on but stationary (long passenger pickups, waiting)
    if (anomalies.isFrequentIdler && Math.random() < 0.15) {
      speed = 0;
    }

    // Location jumper — abrupt heading + speed change (GPS anomaly behaviour)
    if (anomalies.isLocationJumper && Math.random() < 0.08) {
      heading = randomInt(0, 359);
      speed   = randomBetween(45, 70);
    }
  }

  // ── Telemetry ─────────────────────────────────────────────────────────────
  const batteryLevel    = Math.max(0, Math.min(100,
    pattern.batteryBase + randomInt(-5, 5)));
  const signalStrength  = pattern.isRaining
    ? (Math.random() < 0.4 ? 'weak' : 'moderate')
    : (speed === 0 ? 'moderate' : 'strong');
  const isEngineOn      = active && speed >= 0;
  const passengerCount  = active ? randomInt(0, pattern.passengerMax) : 0;

  // ── New position ──────────────────────────────────────────────────────────
  const { latitude, longitude } = calcNextPosition(lat, lng, speed, heading, elapsedMin);

  const ping = {
    tukTuk:         tuktuk._id,
    latitude,
    longitude,
    speed:          Number(speed.toFixed(1)),
    heading:        active ? heading : 0,
    timestamp,
    batteryLevel,
    signalStrength,
    isEngineOn,
    passengerCount,
    createdAt:      timestamp,
    updatedAt:      timestamp,
  };

  return {
    ping,
    newLat:   latitude,
    newLng:   longitude,
    newState: { breakdownUntil, jamUntil },
  };
};

// ── Storage Estimator ─────────────────────────────────────────────────────────

/** Estimate Atlas storage in MB given a ping count */
export const estimateStorageMB = (pingCount) =>
  ((pingCount * 350) / (1024 * 1024)).toFixed(1);
