import District from '../models/District.js';

// @desc    Get all districts
// @route   GET /api/districts
// @access  Private
export const getDistricts = async (req, res) => {
  try {
    const { province } = req.query;
    const filter = province ? { province } : {};
    const districts = await District.find(filter).populate('province', 'name code');
    res.json(districts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single district
// @route   GET /api/districts/:id
// @access  Private
export const getDistrict = async (req, res) => {
  try {
    const district = await District.findById(req.params.id)
      .populate('province', 'name code');
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    res.json(district);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create district
// @route   POST /api/districts
// @access  Private (HQ_ADMIN only)
export const createDistrict = async (req, res) => {
  try {
    const { name, code, province } = req.body;
    const district = await District.create({ name, code, province });
    res.status(201).json(district);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update district
// @route   PUT /api/districts/:id
// @access  Private (HQ_ADMIN only)
export const updateDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    res.json(district);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete district
// @route   DELETE /api/districts/:id
// @access  Private (HQ_ADMIN only)
export const deleteDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndDelete(req.params.id);
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    res.json({ message: 'District removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};