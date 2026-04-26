import * as TukTukService from '../services/tuktukService.js';
import { validateIfMatch } from '../utils/etagHelper.js';

// @desc    Get all tuktuks
// @route   GET /api/v1/tuktuks
// @access  Private
export const getTukTuks = async (req, res, next) => {
  try {
    const { province, district, station, isActive, registrationNumber } = req.query;
    const filter = {};
    if (province)              filter.province = province;
    if (district)              filter.district = district;
    if (station)               filter.station  = station;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (registrationNumber)    filter.registrationNumber = { $regex: registrationNumber, $options: 'i' };

    const data = await TukTukService.getAllTukTuks(filter, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tuktuk
// @route   GET /api/v1/tuktuks/:id
// @access  Private
export const getTukTuk = async (req, res, next) => {
  try {
    const tukTuk = await TukTukService.getTukTukById(req.params.id);
    res.json(tukTuk);
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new tuktuk
// @route   POST /api/v1/tuktuks
// @access  Private (HQ_ADMIN, PROVINCIAL)
export const createTukTuk = async (req, res, next) => {
  try {
    const { registrationNumber, deviceId, driverName, driverNIC, driverContact, province, district, station } = req.body;
    const tukTuk = await TukTukService.createTukTuk({
      registrationNumber, deviceId, driverName, driverNIC, driverContact, province, district, station
    });
    res.status(201)
      .location(`/api/v1/tuktuks/${tukTuk._id}`)
      .json(tukTuk);
  } catch (error) {
    next(error);
  }
};

// @desc    Update tuktuk
// @route   PUT /api/v1/tuktuks/:id
// @access  Private (HQ_ADMIN, PROVINCIAL)
export const updateTukTuk = async (req, res, next) => {
  try {
    if (req.body.isActive !== undefined && req.user.role !== 'HQ_ADMIN') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only HQ_ADMIN can update isActive status' });
    }
    if (req.headers['if-match']) {
      const current = await TukTukService.getTukTukById(req.params.id);
      validateIfMatch(req, current);
    }
    const tukTuk = await TukTukService.updateTukTuk(req.params.id, req.body);
    res.json(tukTuk);
  } catch (error) {
    next(error);
  }
};


// @desc    Delete tuktuk
// @route   DELETE /api/v1/tuktuks/:id
// @access  Private (HQ_ADMIN only)
export const deleteTukTuk = async (req, res, next) => {
  try {
    await TukTukService.deleteTukTuk(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};