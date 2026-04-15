import LocationPing from '../models/LocationPing.js';
import Vehicle from '../models/Vehicle.js';

// @desc    Post location ping
// @route   POST /api/vehicles/:id/ping
// @access  Private (DEVICE only)
export const postPing = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (!vehicle.isActive) {
      return res.status(400).json({ message: 'Vehicle is not active' });
    }

    const { latitude, longitude, speed, heading } = req.body;

    const ping = await LocationPing.create({
      vehicle: req.params.id,
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      timestamp: new Date()
    });

    res.status(201).json(ping);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get last known location of a vehicle
// @route   GET /api/vehicles/:id/location
// @access  Private
export const getLastLocation = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('province', 'name code')
      .populate('district', 'name code')
      .populate('station', 'name code');

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const lastPing = await LocationPing.findOne({ vehicle: req.params.id })
      .sort({ timestamp: -1 });

    if (!lastPing) {
      return res.status(404).json({ message: 'No location data found' });
    }

    res.json({
      vehicle: {
        _id: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        driverName: vehicle.driverName,
        province: vehicle.province,
        district: vehicle.district,
        station: vehicle.station
      },
      lastLocation: {
        latitude: lastPing.latitude,
        longitude: lastPing.longitude,
        speed: lastPing.speed,
        heading: lastPing.heading,
        timestamp: lastPing.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get location history of a vehicle
// @route   GET /api/vehicles/:id/history
// @access  Private
export const getLocationHistory = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const { from, to, limit = 100 } = req.query;

    const filter = { vehicle: req.params.id };

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const history = await LocationPing.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      vehicle: {
        _id: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        driverName: vehicle.driverName
      },
      total: history.length,
      history
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all active vehicle locations
// @route   GET /api/locations/live
// @access  Private
export const getLiveLocations = async (req, res) => {
  try {
    const { province, district } = req.query;

    const vehicleFilter = { isActive: true };
    if (province) vehicleFilter.province = province;
    if (district) vehicleFilter.district = district;

    const vehicles = await Vehicle.find(vehicleFilter)
      .populate('province', 'name code')
      .populate('district', 'name code')
      .populate('station', 'name code');

    const liveData = await Promise.all(
      vehicles.map(async (vehicle) => {
        const lastPing = await LocationPing.findOne({
          vehicle: vehicle._id
        }).sort({ timestamp: -1 });

        return {
          vehicle: {
            _id: vehicle._id,
            registrationNumber: vehicle.registrationNumber,
            driverName: vehicle.driverName,
            province: vehicle.province,
            district: vehicle.district,
            station: vehicle.station
          },
          lastLocation: lastPing ? {
            latitude: lastPing.latitude,
            longitude: lastPing.longitude,
            speed: lastPing.speed,
            heading: lastPing.heading,
            timestamp: lastPing.timestamp
          } : null
        };
      })
    );

    res.json({
      total: liveData.length,
      data: liveData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};