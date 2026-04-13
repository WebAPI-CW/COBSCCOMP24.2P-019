import PoliceStation from '../models/PoliceStation.js';

// @desc    Get all stations
// @route   GET /api/stations
// @access  Private
export const getStations = async (req, res) => {
  try {
    const { province, district } = req.query;
    const filter = {};
    if (province) filter.province = province;
    if (district) filter.district = district;

    const stations = await PoliceStation.find(filter)
      .populate('province', 'name code')
      .populate('district', 'name code');
    res.json(stations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single station
// @route   GET /api/stations/:id
// @access  Private
export const getStation = async (req, res) => {
  try {
    const station = await PoliceStation.findById(req.params.id)
      .populate('province', 'name code')
      .populate('district', 'name code');
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    res.json(station);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create station
// @route   POST /api/stations
// @access  Private (HQ_ADMIN only)
export const createStation = async (req, res) => {
  try {
    const { name, code, district, province, address, contactNumber } = req.body;
    const station = await PoliceStation.create({
      name, code, district, province, address, contactNumber
    });
    res.status(201).json(station);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update station
// @route   PUT /api/stations/:id
// @access  Private (HQ_ADMIN only)
export const updateStation = async (req, res) => {
  try {
    const station = await PoliceStation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    res.json(station);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete station
// @route   DELETE /api/stations/:id
// @access  Private (HQ_ADMIN only)
export const deleteStation = async (req, res) => {
  try {
    const station = await PoliceStation.findByIdAndDelete(req.params.id);
    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }
    res.json({ message: 'Station removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};