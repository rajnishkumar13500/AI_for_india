import { Router } from 'express';
import { copilotController } from '../controllers/copilot.controller.js';

const router = Router();

// Non-streaming — existing endpoint (keep unchanged)
router.post('/ask', (req, res, next) => copilotController.ask(req, res, next));

// Streaming SSE — tokens arrive progressively; source='soundbox'|'dashboard'
router.post('/ask/stream', (req, res, next) => copilotController.askStream(req, res, next));

export default router;
