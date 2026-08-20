import {
  ExtractionResult,
  PaymentEvent,
  ReconciliationResult,
  ReconciliationBreakdown,
  TransactionSession,
} from '../types/index.js';
import { productResolver } from './resolver.js';

export class ReconciliationEngine {
  public async reconcile(
    session: TransactionSession,
    payment: PaymentEvent,
    merchantId?: string
  ): Promise<ReconciliationResult> {
    const extraction = session.extraction;
    const rawProducts = extraction?.products || [];

    let totalExpectedAmount = 0;
    let catalogMatchedCount = 0;
    const matchedItems: ReconciliationResult['matchedItems'] = [];

    for (const item of rawProducts) {
      const resolved = await productResolver.resolve(item.name, merchantId);
      if (resolved.matched && resolved.product) {
        catalogMatchedCount++;
        const unitPrice = resolved.product.sellingPrice;
        const itemTotal = unitPrice * item.quantity;
        totalExpectedAmount += itemTotal;

        matchedItems.push({
          productId: resolved.product.id,
          productName: resolved.product.name,
          quantity: item.quantity,
          unitPrice,
          totalPrice: itemTotal,
        });
      } else {
        // Fallback to mentioned unit price or 0
        const unitPrice = item.unitPrice || 0;
        const itemTotal = unitPrice * item.quantity;
        totalExpectedAmount += itemTotal;

        matchedItems.push({
          productId: 'UNRESOLVED',
          productName: item.name,
          quantity: item.quantity,
          unitPrice,
          totalPrice: itemTotal,
        });
      }
    }

    const receivedAmount = payment.amount;
    const discrepancy = receivedAmount - totalExpectedAmount;

    // 1. Amount Match Score (max 40)
    let amountMatchScore = 0;
    if (totalExpectedAmount > 0) {
      if (Math.abs(discrepancy) === 0) {
        amountMatchScore = 40;
      } else if (Math.abs(discrepancy) <= totalExpectedAmount * 0.1) {
        amountMatchScore = 25;
      } else if (Math.abs(discrepancy) <= totalExpectedAmount * 0.25) {
        amountMatchScore = 15;
      } else {
        amountMatchScore = 0;
      }
    } else if (rawProducts.length === 0 && receivedAmount > 0) {
      // Payment received without audio extraction
      amountMatchScore = 20;
    }

    // 2. Session Match Score (max 25)
    let sessionMatchScore = 0;
    if (payment.sessionId && payment.sessionId === session.id) {
      sessionMatchScore = 25;
    } else {
      const sessionTime = new Date(session.startedAt).getTime();
      const paymentTime = new Date(payment.timestamp).getTime();
      const diffMinutes = Math.abs(paymentTime - sessionTime) / (1000 * 60);

      if (diffMinutes <= 3) {
        sessionMatchScore = 25;
      } else if (diffMinutes <= 10) {
        sessionMatchScore = 15;
      } else {
        sessionMatchScore = 5;
      }
    }

    // 3. Catalog Match Score (max 20)
    const catalogMatchRatio = rawProducts.length > 0 ? catalogMatchedCount / rawProducts.length : 0;
    const catalogMatchScore = Math.round(catalogMatchRatio * 20);

    // 4. Extraction Score (max 15)
    const extractionConfidence = extraction?.confidence || 0.5;
    const extractionScore = Math.round(extractionConfidence * 15);

    // Total Score (0 - 100)
    const totalScore = Math.min(100, Math.max(0, amountMatchScore + sessionMatchScore + catalogMatchScore + extractionScore));

    const breakdown: ReconciliationBreakdown = {
      amountMatchScore,
      sessionMatchScore,
      catalogMatchScore,
      extractionScore,
      totalScore,
    };

    const isAmountExact = Math.abs(discrepancy) === 0;
    const isHighConfidence = totalScore >= 80 && isAmountExact;

    let status: ReconciliationResult['status'] = 'MATCHED';
    let notes = 'Transaction successfully matched with payment.';

    if (!isHighConfidence) {
      status = 'CONFIRMATION_REQUIRED';
      if (!isAmountExact) {
        notes = `Amount mismatch: Expected ₹${totalExpectedAmount}, received ₹${receivedAmount} (Diff: ₹${Math.abs(discrepancy)}).`;
      } else {
        notes = 'Low confidence in product audio extraction. Merchant confirmation recommended.';
      }
    }

    return {
      isMatched: isHighConfidence,
      confidence: totalScore,
      expectedAmount: totalExpectedAmount,
      receivedAmount,
      discrepancy,
      breakdown,
      matchedItems,
      status,
      notes,
    };
  }
}

export const reconciler = new ReconciliationEngine();
