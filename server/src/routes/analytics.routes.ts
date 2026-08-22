import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next));
router.get('/revenue', (req, res, next) => analyticsController.getRevenue(req, res, next));
router.get('/insights', (req, res, next) => analyticsController.getInsights(req, res, next));
router.get('/products', (req, res, next) => analyticsController.getProducts(req, res, next));
router.get('/combinations', (req, res, next) => analyticsController.getCombinations(req, res, next));
router.get('/peak-hours', (req, res, next) => analyticsController.getPeakHours(req, res, next));
router.get('/inventory', (req, res, next) => analyticsController.getInventory(req, res, next));
router.get('/customers', (req, res, next) => analyticsController.getCustomers(req, res, next));
router.get('/lost-sales', (req, res, next) => analyticsController.getLostSales(req, res, next));

export default router;

