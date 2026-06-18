import express from 'express';
import { confirmBooking } from '../controllers/bookingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authMiddleware as any, confirmBooking);

export default router;
