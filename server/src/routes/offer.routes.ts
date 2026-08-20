import { Router } from 'express';
import { offerController } from '../controllers/offer.controller.js';

const router = Router();

router.get('/', (req, res, next) => offerController.listOffers(req, res, next));
router.post('/prepare', (req, res, next) => offerController.prepareOffer(req, res, next));
router.put('/:id', (req, res, next) => offerController.updateOffer(req, res, next));

export default router;
