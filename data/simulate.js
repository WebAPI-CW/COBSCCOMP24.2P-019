/**
 * data/simulate.js
 *
 * Live ping simulator — LOCAL USE ONLY.
 * Generates 200 pings every 30 seconds directly to MongoDB.
 *
 * Usage:
 *   npm run simulate      — standalone
 *   npm run dev           — alongside nodemon (via concurrently)
 *
 * IMPORTANT — never runs on hosted platforms:
 *   NODE_ENV=production guard at top of file exits immediately.
 *   Free-tier platforms restart often — each restart adds pings and
 *   fills Atlas storage rapidly. Historical data from seed.js is
 *   sufficient for the hosted version.
 */

import mongoose from 'mongoose';
import dotenv   from 'dotenv';

import TukTuk       from '../src/models/TukTuk.js';
import LocationPing from '../src/models/LocationPing.js';

import {
  toSLT, getPattern, assignAnomalies,
  generatePing, estimateStorageMB, randomBetween,
} from './simulationHelper.js';

dotenv.config();

// ── Safety Guards ─────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  console.warn('⚠️  simulate.js is blocked in production (NODE_ENV=production).');
  console.warn('   The hosted API serves collected location data only.');
  console.warn('   Run npm run simulate locally for live demonstration.');
  process.exit(0);
}

if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI is not set in .env');
  process.exit(1);
}

// ── Config ────────────────────────────────────────────────────────────────────

const PING_INTERVAL_MS = 30 * 1000; // 30 seconds

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatSLT = (date) => {
  const sltMs = date.getTime() + 330 * 60 * 1000;
  const d     = new Date(sltMs);
  return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}:${String(d.getUTCSeconds()).padStart(2,'0')} SLT`;
};

/** Approximate distance in km between two coordinates (haversine) */
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2
             + Math.cos(lat1 * Math.PI / 180)
             * Math.cos(lat2 * Math.PI / 180)
             * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Anomaly Detection ─────────────────────────────────────────────────────────

/**
 * Inspect a single ping against its tuktuk's previous state.
 * Returns an anomaly label string, or null if nothing unusual.
 *
 * @param {object} ping     The ping document just generated
 * @param {object} ts       The tuktuk's mutable state object
 * @param {number} sltHour  Current SLT hour
 */
const detectAnomaly = (ping, ts, sltHour) => {
  const isNight   = sltHour >= 0 && sltHour < 5;
  const isDay     = sltHour >= 6 && sltHour < 22;
  const prevLat   = ts.prevLat ?? ts.lat;
  const prevLng   = ts.prevLng ?? ts.lng;
  const prevSpeed = ts.prevSpeed ?? 0;

  // SPEEDING — over 60 km/h outside of dead night
  if (!isNight && ping.speed > 60) return 'SPEEDING';

  // NIGHT_MOVE — moving during dead night (00:00-05:00 SLT)
  if (isNight && ping.speed > 5) return 'NIGHT_MOVE';

  // BREAKDOWN — engine off during active daytime hours, only for breakdown-prone tuktuks
  if (isDay && ping.isEngineOn === false && ping.speed === 0) {
    ts.breakdownCount = (ts.breakdownCount || 0) + 1;
    if (ts.breakdownCount >= 3 && ts.anomalies.isBreakdownProne) return 'BREAKDOWN';
  } else {
    ts.breakdownCount = 0;
  }

  // ERRATIC — speed changed by more than 40 km/h from last ping
  if (Math.abs(ping.speed - prevSpeed) > 40) return 'ERRATIC';

  // IDLE_LONG — separate counter, speed=0 for 6+ consecutive batches (3 min) during daytime
  if (isDay && ping.speed === 0) {
    ts.idleCount = (ts.idleCount || 0) + 1;
    if (ts.idleCount >= 6) return 'IDLE_LONG';
  } else if (ping.speed > 0) {
    ts.idleCount = 0;
  }

  // JUMP — coordinate distance impossible at reported speed in 30s
  const actualKm = haversineKm(prevLat, prevLng, ping.latitude, ping.longitude);
  const maxKm    = Math.max(ping.speed, 5) * (30 / 3600) * 3; // generous 3× buffer
  if (actualKm > maxKm && actualKm > 2) return 'JUMP';

  return null;
};

// ── Main ──────────────────────────────────────────────────────────────────────

const runSimulator = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Load all active tuktuks
  const tuktuks = await TukTuk.find({ isActive: true }).lean();
  if (tuktuks.length === 0) {
    console.error('No active tuktuks found. Run npm run seed first.');
    process.exit(1);
  }

  // Load last known position per tuktuk (resume from where we left off)
  const tuktukStates = await Promise.all(
    tuktuks.map(async (t) => {
      const last = await LocationPing
        .findOne({ tukTuk: t._id })
        .sort({ timestamp: -1 })
        .lean();
      return {
        tuktuk:    t,
        anomalies: assignAnomalies(t.deviceId),
        lat:       last ? last.latitude  : randomBetween(5.9, 9.9),
        lng:       last ? last.longitude : randomBetween(79.7, 81.9),
        prevLat:       last ? last.latitude  : null,
        prevLng:       last ? last.longitude : null,
        prevSpeed:     last ? last.speed     : 0,
        idleCount:     0,
        breakdownCount: 0,
        state:         {},
      };
    })
  );

  // Last DB ping for startup display
  const lastDbPing = await LocationPing
    .findOne().sort({ timestamp: -1 }).lean();

  const now     = new Date();
  const { hour, minuteOfDay, dayOfWeek } = toSLT(now);
  const pattern = getPattern(hour, minuteOfDay, dayOfWeek);

  // ── Startup Banner ────────────────────────────────────────────────────────
  const started = formatSLT(now);
  console.log('');
  console.log('========================================');
  console.log('  TUKPATROL SIMULATOR');
  console.log(`  Started     : ${started}`);
  console.log(`  Pattern     : ${pattern.name}`);
  console.log(`  TukTuks     : ${tuktukStates.length} loaded`);
  console.log(`  Last ping   : ${lastDbPing ? formatSLT(new Date(lastDbPing.timestamp)) : 'none (fresh DB)'}`);
  console.log('========================================\n');

  // ── Session Tracking ──────────────────────────────────────────────────────
  const sessionStart  = Date.now();
  let   sessionPings  = 0;
  const anomalyCounts = {
    SPEEDING:   0,
    NIGHT_MOVE: 0,
    BREAKDOWN:  0,
    ERRATIC:    0,
    IDLE_LONG:  0,
    JUMP:       0,
  };

  // ── Ping Loop ─────────────────────────────────────────────────────────────
  const runBatch = async () => {
    const batchTime = new Date();
    const { hour: h, minuteOfDay: mod, dayOfWeek: dow } = toSLT(batchTime);
    const pat = getPattern(h, mod, dow);

    const pingDocs     = [];
    let   activeCount  = 0;
    const batchAnomalies = []; // anomalies detected this batch

    for (const ts of tuktukStates) {
      const { ping, newLat, newLng, newState } = generatePing({
        tuktuk:     ts.tuktuk,
        timestamp:  batchTime,
        lat:        ts.lat,
        lng:        ts.lng,
        anomalies:  ts.anomalies,
        elapsedMin: PING_INTERVAL_MS / 60000,
        state:      ts.state,
      });

      // Anomaly detection (using pre-update position)
      const anomalyType = detectAnomaly(ping, ts, h);
      if (anomalyType) {
        anomalyCounts[anomalyType]++;
        batchAnomalies.push({
          deviceId: ts.tuktuk.deviceId,
          type:     anomalyType,
          speed:    ping.speed,
          lat:      ping.latitude,
          lng:      ping.longitude,
        });
      }

      // Update state for next batch
      ts.prevLat   = ts.lat;
      ts.prevLng   = ts.lng;
      ts.prevSpeed = ping.speed;
      ts.lat       = newLat;
      ts.lng       = newLng;
      ts.state     = newState;

      pingDocs.push(ping);
      if (ping.speed > 0) activeCount++;
    }

    await LocationPing.insertMany(pingDocs);
    sessionPings += pingDocs.length;

    const avgSpeed = (pingDocs.reduce((s, p) => s + p.speed, 0) / pingDocs.length).toFixed(1);

    // Main status line (overwrite previous line if no anomalies, new line if anomalies)
    const statusLine =
      `[${formatSLT(batchTime)}] Pattern: ${pat.name.padEnd(18)} | ` +
      `Active: ${String(activeCount).padStart(3)}/${pingDocs.length} | ` +
      `Avg Speed: ${String(avgSpeed).padStart(5)} km/h | ` +
      `Batch: ${pingDocs.length} | Session: ${sessionPings.toLocaleString()}`;

    if (batchAnomalies.length === 0) {
      // No anomalies — overwrite same line
      process.stdout.write(`\r${statusLine}`);
    } else {
      // Anomalies detected — print on new line with anomaly details below
      console.log(`\n${statusLine}`);
      for (const a of batchAnomalies) {
        const lat = String(a.lat.toFixed(4)).padStart(8);
        const lng = String(a.lng.toFixed(4)).padStart(8);
        console.log(
          `  ⚠ ANOMALY | ${a.deviceId} | ${a.type.padEnd(10)} | ${String(a.speed.toFixed(1)).padStart(5)} km/h | ${lat}°N ${lng}°E`
        );
      }
    }
  };

  // ── Start Interval ────────────────────────────────────────────────────────
  await runBatch(); // first batch immediately
  const interval = setInterval(runBatch, PING_INTERVAL_MS);

  // ── Graceful Shutdown (Ctrl+C) ────────────────────────────────────────────
  process.on('SIGINT', async () => {
    clearInterval(interval);

    const durationMs  = Date.now() - sessionStart;
    const durationH   = Math.floor(durationMs / 3600000);
    const durationMin = Math.floor((durationMs % 3600000) / 60000);
    const durationSec = Math.floor((durationMs % 60000) / 1000);
    const durationStr = durationH > 0
      ? `${durationH}h ${durationMin}m ${durationSec}s`
      : `${durationMin}m ${durationSec}s`;

    console.log('\n\n--- SIMULATE SESSION ENDED ---');
    console.log(`Duration          : ${durationStr}`);
    console.log(`Total pings added : ${sessionPings.toLocaleString()}`);
    console.log('Anomalies detected this session:');
    console.log(`  SPEEDING    : ${String(anomalyCounts.SPEEDING).padStart(4)} instances`);
    console.log(`  NIGHT_MOVE  : ${String(anomalyCounts.NIGHT_MOVE).padStart(4)} instances`);
    console.log(`  BREAKDOWN   : ${String(anomalyCounts.BREAKDOWN).padStart(4)} instances`);
    console.log(`  ERRATIC     : ${String(anomalyCounts.ERRATIC).padStart(4)} instances`);
    console.log(`  IDLE_LONG   : ${String(anomalyCounts.IDLE_LONG).padStart(4)} instances`);
    console.log(`  JUMP        : ${String(anomalyCounts.JUMP).padStart(4)} instances`);
    console.log('Closing MongoDB connection...');

    await mongoose.connection.close();
    console.log('Done.\n');
    process.exit(0);
  });
};

runSimulator().catch(err => {
  console.error('Simulator failed to start:', err);
  process.exit(1);
});
