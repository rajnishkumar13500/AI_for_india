import { Router } from 'express';
import sessionRoutes from './session.routes.js';
import paymentRoutes from './payment.routes.js';
import transactionRoutes from './transaction.routes.js';
import analyticsRoutes from './analytics.routes.js';
import copilotRoutes from './copilot.routes.js';
import offerRoutes from './offer.routes.js';
import demoRoutes from './demo.routes.js';
import { productRepo } from '../db/repositories/product.repo.js';
import { customerRepo } from '../db/repositories/customer.repo.js';
import { merchantRepo } from '../db/repositories/merchant.repo.js';

const router = Router();

// Sub-routes
router.use('/sessions', sessionRoutes);
router.use('/payments', paymentRoutes);
router.use('/transactions', transactionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/copilot', copilotRoutes);
router.use('/offers', offerRoutes);
router.use('/demo', demoRoutes);

// Quick resource endpoints
router.get('/products', async (req, res, next) => {
  try {
    const merchantId = req.query.merchantId as string;
    const products = await productRepo.findAll(merchantId);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

router.get('/customers', async (req, res, next) => {
  try {
    const merchantId = req.query.merchantId as string;
    const customers = await customerRepo.findAll(merchantId);
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

router.get('/merchant', async (_req, res, next) => {
  try {
    const merchant = await merchantRepo.getFirst();
    res.json({ success: true, data: merchant });
  } catch (err) {
    next(err);
  }
});

export default router;
