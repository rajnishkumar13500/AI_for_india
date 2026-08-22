import { Router } from 'express';
import { demoController } from '../controllers/demo.controller.js';

const router = Router();

router.get('/scenarios', (req, res, next) => demoController.getScenarios(req, res, next));
router.post('/run-scenario/:id', (req, res, next) => demoController.runScenario(req, res, next));
router.post('/run', (req, res, next) => demoController.runScenario(req, res, next));
router.post('/reset', (req, res, next) => demoController.resetDemo(req, res, next));

export default router;

