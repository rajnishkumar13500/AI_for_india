import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { offerRepo } from '../db/repositories/offer.repo.js';
import { Offer } from '../types/index.js';

export class OfferController {
  public async listOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.query.merchantId ? String(req.query.merchantId) : undefined;
      const offers = await offerRepo.findAll(merchantId);
      res.json({ success: true, data: offers });
    } catch (err) {
      next(err);
    }
  }

  public async prepareOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        merchantId = 'M001',
        title,
        description,
        targetSegment = 'INACTIVE',
        targetCount = 23,
        discountType = 'FLAT',
        discountValue = 20,
        minOrderValue = 200,
        validDays = 3,
        suggestedReason = 'Reactivate 23 inactive regular customers over the weekend.',
      } = req.body;

      const offer: Offer = {
        id: `OFFER-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`,
        merchantId,
        title: title || 'Weekend Kirana Reactivation ₹20 Off',
        description:
          description || 'Get ₹20 off on orders above ₹200 this Saturday & Sunday. Visit your local Rajesh Kirana Store!',
        targetSegment,
        targetCount,
        discountType,
        discountValue,
        minOrderValue,
        validDays,
        status: 'READY',
        suggestedReason,
        createdAt: new Date().toISOString(),
      };

      await offerRepo.create(offer);
      res.status(201).json({ success: true, data: offer });
    } catch (err) {
      next(err);
    }
  }

  public async updateOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await offerRepo.update(id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, error: 'Offer not found' });
        return;
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
}

export const offerController = new OfferController();
