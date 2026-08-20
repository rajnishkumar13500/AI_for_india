import { Router } from 'express';
import { sessionController } from '../controllers/session.controller.js';
import { uploadAudio } from '../middleware/upload.js';

const router = Router();

router.post('/start', (req, res, next) => sessionController.startSession(req, res, next));
router.get('/', (req, res, next) => sessionController.listSessions(req, res, next));
router.get('/:id', (req, res, next) => sessionController.getSession(req, res, next));
router.post('/:id/audio', uploadAudio.single('audio'), (req, res, next) =>
  sessionController.uploadAudio(req, res, next)
);
router.post('/:id/transcript', (req, res, next) => sessionController.submitTranscript(req, res, next));

export default router;
