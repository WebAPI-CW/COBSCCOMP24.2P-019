import * as UserService from '../services/userService.js';
import * as ProvinceService from '../services/provinceService.js';
import * as DistrictService from '../services/districtService.js';
import * as StationService from '../services/stationService.js';

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (HQ_ADMIN only)
export const getUsers = async (req, res, next) => {
  try {
    const { role, isActive, email } = req.query;
    const filter = {};
    if (role)                  filter.role     = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (email)                 filter.email    = { $regex: email, $options: 'i' };

    const data = await UserService.getAllUsers(filter, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/v1/users/:email
// @access  Private (HQ_ADMIN only)
export const getUser = async (req, res, next) => {
  try {
    const user = await UserService.getUserByEmail(req.params.email);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private (HQ_ADMIN only)
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, province, district, station, registrationNumber } = req.body;
    const resolvedProvince = province ? (await ProvinceService.getProvinceByCode(province))._id : undefined;
    const resolvedDistrict = district ? (await DistrictService.getDistrictByCode(district))._id : undefined;
    const resolvedStation  = station  ? (await StationService.getStationByCode(station))._id   : undefined;
    const user = await UserService.createUser({ name, email, password, role,
      province: resolvedProvince, district: resolvedDistrict, station: resolvedStation, registrationNumber });

    res.status(201)
      .location(`/api/v1/users/${encodeURIComponent(user.email)}`)
      .json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PATCH /api/v1/users/:email
// @access  Private (HQ_ADMIN only)
export const updateUser = async (req, res, next) => {
  try {
    const current = await UserService.getUserByEmail(req.params.email);
    const body = { ...req.body };
    if (body.province) { const p = await ProvinceService.getProvinceByCode(body.province); body.province = p._id; }
    if (body.district) { const d = await DistrictService.getDistrictByCode(body.district); body.district = d._id; }
    if (body.station)  { const s = await StationService.getStationByCode(body.station);   body.station  = s._id; }
    const user = await UserService.updateUser(current._id, body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

