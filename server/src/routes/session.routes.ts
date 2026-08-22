import { Router } from 'express';
import { sessionController } from '../controllers/session.controller.js';
import { transactionController } from '../controllers/transaction.controller.js';
import { uploadAudio } from '../middleware/upload.js';

const router = Router();

router.post('/start', (req, res, next) => sessionController.startSession(req, res, next));
router.get('/', (req, res, next) => sessionController.listSessions(req, res, next));

// Returns the most recent non-completed session for a merchant — used by device UI on reconnect
router.get('/active', (req, res, next) => sessionController.getActiveSession(req, res, next));

router.get('/:id', (req, res, next) => sessionController.getSession(req, res, next));
router.post('/:id/audio', uploadAudio.single('audio'), (req, res, next) =>
  sessionController.uploadAudio(req, res, next)
);
// Primary transcript endpoint
router.post('/:id/transcript', (req, res, next) => sessionController.submitTranscript(req, res, next));
// Voice alias: accepts { text, language } from Web Speech API directly (maps text -> transcript)
router.post('/:id/voice', (req, res, next) => {
  // normalize Web Speech API shape { text, lang } to { transcript, language }
  if (req.body.text && !req.body.transcript) {
    req.body.transcript = req.body.text;
  }
  if (req.body.lang && !req.body.language) {
    req.body.language = req.body.lang;
  }
  return sessionController.submitTranscript(req, res, next);
});
router.post('/:id/confirm', (req, res, next) => transactionController.confirmTransaction(req, res, next));

export default router;

