import * as UserService from '../services/userService.js';

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (HQ_ADMIN only)
export const getUsers = async (req, res, next) => {
  try {
    const { role, isActive } = req.query;
    const filter = {};
    if (role)                  filter.role     = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const data = await UserService.getAllUsers(filter, req.query);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private (HQ_ADMIN only)
export const getUser = async (req, res, next) => {
  try {
    const user = await UserService.getUserById(req.params.id);
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
    const { name, email, password, role, province, district, station } = req.body;
    const user = await UserService.createUser({ name, email, password, role, province, district, station });

    res.status(201)
      .location(`/api/v1/users/${user._id}`)
      .json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PATCH /api/v1/users/:id
// @access  Private (HQ_ADMIN only)
export const updateUser = async (req, res, next) => {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

