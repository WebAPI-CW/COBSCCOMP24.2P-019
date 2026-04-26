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
  }
}, { timestamps: true });

// index for faster queries on tukTuk and timestamp
locationPingSchema.index({ tukTuk: 1, timestamp: -1 });

export default mongoose.model('LocationPing', locationPingSchema);