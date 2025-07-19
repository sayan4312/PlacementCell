const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

// Allow admin, tpo, or company
const allowAdminTPOCompany = (req, res, next) => {
  if (req.currentUser?.role === 'admin' || req.currentUser?.role === 'tpo' || req.currentUser?.role === 'company') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Required roles: admin, tpo, or company' });
};

// Get all companies
router.get('/', allowAdminTPOCompany, companyController.getAllCompanies);

// Get a single company
router.get('/:id', allowAdminTPOCompany, companyController.getCompanyById);

// Create a new company
router.post('/', allowAdminTPOCompany, companyController.createCompany);

// Update a company
router.put('/:id', allowAdminTPOCompany, companyController.updateCompany);

// Delete a company
router.delete('/:id', allowAdminTPOCompany, companyController.deleteCompany);

module.exports = router; 