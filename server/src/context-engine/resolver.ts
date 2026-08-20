import { productRepo } from '../db/repositories/product.repo.js';
import { Product } from '../types/index.js';

export interface ResolutionResult {
  matched: boolean;
  product: Product | null;
  confidence: number;
  normalizedName: string;
}

export class ProductResolver {
  public async resolve(rawName: string, merchantId?: string): Promise<ResolutionResult> {
    const clean = rawName.toLowerCase().trim();
    if (!clean) {
      return { matched: false, product: null, confidence: 0, normalizedName: rawName };
    }

    const allProducts = await productRepo.findAll(merchantId);

    // 1. Direct exact match
    for (const p of allProducts) {
      if (p.name.toLowerCase() === clean) {
        return { matched: true, product: p, confidence: 1.0, normalizedName: p.name };
      }
    }

    // 2. Direct alias match
    for (const p of allProducts) {
      for (const alias of p.aliases) {
        if (alias.toLowerCase() === clean) {
          return { matched: true, product: p, confidence: 0.95, normalizedName: p.name };
        }
      }
    }

    // 3. Substring / Token overlap match
    const tokens = clean.split(/\s+/).filter((t) => t.length > 2);
    let bestMatch: Product | null = null;
    let highestScore = 0;

    for (const p of allProducts) {
      const pNameLower = p.name.toLowerCase();
      const pAliasesLower = p.aliases.map((a) => a.toLowerCase());

      // Check if product name is inside the raw string or vice versa
      if (clean.includes(pNameLower) || pNameLower.includes(clean)) {
        return { matched: true, product: p, confidence: 0.9, normalizedName: p.name };
      }

      // Check aliases
      for (const alias of pAliasesLower) {
        if (clean.includes(alias) || alias.includes(clean)) {
          return { matched: true, product: p, confidence: 0.85, normalizedName: p.name };
        }
      }

      // Token match scoring
      let matches = 0;
      for (const token of tokens) {
        if (pNameLower.includes(token) || pAliasesLower.some((a) => a.includes(token))) {
          matches++;
        }
      }

      const score = tokens.length > 0 ? matches / tokens.length : 0;
      if (score > highestScore && score >= 0.5) {
        highestScore = score;
        bestMatch = p;
      }
    }

    if (bestMatch) {
      return {
        matched: true,
        product: bestMatch,
        confidence: Math.min(0.8, 0.5 + highestScore * 0.3),
        normalizedName: bestMatch.name,
      };
    }

    return {
      matched: false,
      product: null,
      confidence: 0.2,
      normalizedName: rawName,
    };
  }
}

export const productResolver = new ProductResolver();
