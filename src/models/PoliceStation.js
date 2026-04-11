import mongoose from 'mongoose';

const policeStationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: true
  },
  province: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Province',
    required: true
  },
  address: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  }
}, { timestamps: true });

export default mongoose.model('PoliceStation', policeStationSchema);