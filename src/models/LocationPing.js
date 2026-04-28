import mongoose from 'mongoose';

const locationPingSchema = new mongoose.Schema({
  tukTuk: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TukTuk',
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  speed: {
    type: Number,
    default: 0
  },
  heading: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // ── Simulation telemetry fields ──────────────────────────────────────────────
  batteryLevel: {
    type: Number,       // 0–100 percent
    default: null
  },
  signalStrength: {
    type: String,
    enum: ['strong', 'moderate', 'weak', 'none', null],
    default: null
  },
  isEngineOn: {
    type: Boolean,
    default: null
  },
  passengerCount: {
    type: Number,       // 0–3
    default: null
  }
}, { timestamps: true });

// Compound index for the two most frequent query patterns:
//   1. getLastLocation  → most recent ping for one tuktuk
//   2. getLocationHistory → time-ordered pings for one tuktuk
locationPingSchema.index({ tukTuk: 1, timestamp: -1 });

export default mongoose.model('LocationPing', locationPingSchema);