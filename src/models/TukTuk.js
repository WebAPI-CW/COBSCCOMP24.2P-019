import mongoose from 'mongoose';

const tukTukSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  driverName: {
    type: String,
    required: true,
    trim: true
  },
  driverNIC: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  driverContact: {
    type: String,
    trim: true
  },
  province: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Province',
    required: true
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: true
  },
  station: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PoliceStation',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('TukTuk', tukTukSchema);