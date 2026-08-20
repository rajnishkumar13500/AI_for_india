import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller.js';

const router = Router();

router.get('/', (req, res, next) => transactionController.listTransactions(req, res, next));
router.get('/:id', (req, res, next) => transactionController.getTransaction(req, res, next));
router.post('/:id/confirm', (req, res, next) => transactionController.confirmTransaction(req, res, next));

export default router;
