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

import { v4 as uuidv4 } from 'uuid';
import { Product } from '../types/index.js';

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

router.post('/products', async (req, res, next) => {
  try {
    const { name, category = 'General', sellingPrice, costPrice, stock = 15, reorderLevel = 10, unit = 'pack', merchantId = 'M001' } = req.body;
    if (!name || !sellingPrice) {
      res.status(400).json({ success: false, error: 'Product name and selling price are required' });
      return;
    }
    const cleanName = String(name).trim();
    const newProduct: Product = {
      id: `PROD-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`,
      merchantId,
      sku: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 15),
      name: cleanName,
      aliases: [cleanName.toLowerCase(), ...cleanName.toLowerCase().split(/\s+/).filter(Boolean)],
      category,
      costPrice: Number(costPrice) || Math.round(Number(sellingPrice) * 0.75),
      sellingPrice: Number(sellingPrice),
      stock: Number(stock),
      reorderLevel: Number(reorderLevel),
      unit,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await productRepo.create(newProduct);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/restock', async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { quantity = 10 } = req.body;
    const product = await productRepo.restock(id, Number(quantity));
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
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
