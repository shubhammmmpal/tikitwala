import express from 'express';
const router = express.Router();

import {
  createAgency,
  editAgency,
  deleteAgency,
  getAgencyList,
  getAgencyById,
  changeAgencyStatus
} from '../controllers/agency.controller.js';

// ─── Routes ──────────────────────────────────────────────────────────────

// Create a new agency
router.post('/', createAgency);

// Get all agencies (with pagination, search, filters)
router.get('/', getAgencyList);

// Change agency active/inactive status
router.patch('/:id/status', changeAgencyStatus);

// Get a single agency by ID
router.get('/:id', getAgencyById);

// Edit an existing agency
router.put('/:id', editAgency);

// Delete an agency
router.delete('/:id', deleteAgency);

export default router;