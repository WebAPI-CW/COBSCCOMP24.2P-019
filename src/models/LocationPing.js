import mongoose from 'mongoose';

const locationPingSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
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

// index for faster queries on vehicle and timestamp
locationPingSchema.index({ vehicle: 1, timestamp: -1 });

export default mongoose.model('LocationPing', locationPingSchema);