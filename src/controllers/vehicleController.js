import Vehicle from '../models/Vehicle.js';

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
export const getVehicles = async (req, res) => {
  try {
    const { province, district, station, isActive } = req.query;
    const filter = {};
    if (province) filter.province = province;
    if (district) filter.district = district;
    if (station) filter.station = station;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const vehicles = await Vehicle.find(filter)
      .populate('province', 'name code')
      .populate('district', 'name code')
      .populate('station', 'name code');
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
export const getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('province', 'name code')
      .populate('district', 'name code')
      .populate('station', 'name code');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register vehicle
// @route   POST /api/vehicles
// @access  Private (HQ_ADMIN, PROVINCIAL)
export const createVehicle = async (req, res) => {
  try {
    const {
      registrationNumber,
      deviceId,
      driverName,
      driverNIC,
      driverContact,
      province,
      district,
      station
    } = req.body;

    const vehicleExists = await Vehicle.findOne({
      $or: [{ registrationNumber }, { deviceId }, { driverNIC }]
    });

    if (vehicleExists) {
      return res.status(400).json({
        message: 'Vehicle with same registration, device ID or NIC already exists'
      });
    }

    const vehicle = await Vehicle.create({
      registrationNumber,
      deviceId,
      driverName,
      driverNIC,
      driverContact,
      province,
      district,
      station
    });

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (HQ_ADMIN, PROVINCIAL)
export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Deactivate vehicle
// @route   PUT /api/vehicles/:id/deactivate
// @access  Private (HQ_ADMIN only)
export const deactivateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deactivated', vehicle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (HQ_ADMIN only)
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};