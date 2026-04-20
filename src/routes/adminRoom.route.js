import express from 'express';
import {
  createRoom,
  updateRoom,
  deleteRoom
} from '../controllers/room.controller.js';
// import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// router.use(protect);
// router.use(restrictTo('ADMIN'));

router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);

export default router;