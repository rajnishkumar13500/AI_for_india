import { Router } from 'express';
import { copilotController } from '../controllers/copilot.controller.js';

const router = Router();

router.post('/ask', (req, res, next) => copilotController.ask(req, res, next));

export default router;
