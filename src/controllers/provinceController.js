import Province from '../models/Province.js';

// @desc    Get all provinces
// @route   GET /api/provinces
// @access  Private
export const getProvinces = async (req, res) => {
  try {
    const provinces = await Province.find();
    res.json(provinces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single province
// @route   GET /api/provinces/:id
// @access  Private
export const getProvince = async (req, res) => {
  try {
    const province = await Province.findById(req.params.id);
    if (!province) {
      return res.status(404).json({ message: 'Province not found' });
    }
    res.json(province);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create province
// @route   POST /api/provinces
// @access  Private (HQ_ADMIN only)
export const createProvince = async (req, res) => {
  try {
    const { name, code } = req.body;
    const province = await Province.create({ name, code });
    res.status(201).json(province);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update province
// @route   PUT /api/provinces/:id
// @access  Private (HQ_ADMIN only)
export const updateProvince = async (req, res) => {
  try {
    const province = await Province.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!province) {
      return res.status(404).json({ message: 'Province not found' });
    }
    res.json(province);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete province
// @route   DELETE /api/provinces/:id
// @access  Private (HQ_ADMIN only)
export const deleteProvince = async (req, res) => {
  try {
    const province = await Province.findByIdAndDelete(req.params.id);
    if (!province) {
      return res.status(404).json({ message: 'Province not found' });
    }
    res.json({ message: 'Province removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};