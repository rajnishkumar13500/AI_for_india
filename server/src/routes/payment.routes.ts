import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';

const router = Router();

router.post('/simulate', (req, res, next) => paymentController.simulatePayment(req, res, next));
router.get('/', (req, res, next) => paymentController.listPayments(req, res, next));

export default router;
