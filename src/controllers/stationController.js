import * as StationService from '../services/stationService.js';

// @desc    Get all stations
// @route   GET /api/v1/stations
// @access  Private
export const getStations = async (req, res, next) => {
  try {
    const { province, district } = req.query;
    const filter = {};
    if (province) filter.province = province;
    if (district) filter.district = district;
    const data = await StationService.getAllStations(filter, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single station
// @route   GET /api/v1/stations/:id
// @access  Private
export const getStation = async (req, res, next) => {
  try {
    const station = await StationService.getStationById(req.params.id);
    res.json(station);
  } catch (error) {
    next(error);
  }
};

// @desc    Create station
// @route   POST /api/v1/stations
// @access  Private (HQ_ADMIN only)
export const createStation = async (req, res, next) => {
  try {
    const { name, code, district, province, address, contactNumber } = req.body;
    const station = await StationService.createStation({ name, code, district, province, address, contactNumber });
    res.status(201)
      .location(`/api/v1/stations/${station._id}`)
      .json(station);
  } catch (error) {
    next(error);
  }
};

// @desc    Update station
// @route   PUT /api/v1/stations/:id
// @access  Private (HQ_ADMIN only)
export const updateStation = async (req, res, next) => {
  try {
    const { name, code, district, province, address, contactNumber } = req.body;
    const station = await StationService.updateStation(req.params.id, {
      name, code, district, province, address, contactNumber
    });
    res.json(station);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete station
// @route   DELETE /api/v1/stations/:id
// @access  Private (HQ_ADMIN only)
export const deleteStation = async (req, res, next) => {
  try {
    await StationService.deleteStation(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};