import express from 'express';
import { reserveSeats } from '../controllers/reserveController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authMiddleware as any, reserveSeats);

export default router;
