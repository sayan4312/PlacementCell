const Company = require('../models/Company');

// Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ name: 1 });
    res.json({ companies });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching companies', error });
  }
};

// Get a single company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json({ company });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching company', error });
  }
};

// Create a new company
exports.createCompany = async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();

    // Notify all admins
    const Notification = require('../models/Notification');
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    const notifications = admins.map(admin => ({
      user: admin._id,
      title: 'New Company Registered',
      message: `A new company "${company.companyName}" has registered.`,
      actionUrl: '/admin/companies'
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
    res.status(201).json({ company });
  } catch (error) {
    res.status(400).json({ message: 'Error creating company', error });
  }
};

// Update a company
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json({ company });
  } catch (error) {
    res.status(400).json({ message: 'Error updating company', error });
  }
};

// Delete a company
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json({ message: 'Company deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting company', error });
  }
}; 