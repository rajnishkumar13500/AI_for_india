import { db } from '../database.js';
import { Product } from '../../types/index.js';

export class ProductRepository {
  public async findAll(merchantId?: string): Promise<Product[]> {
    const products = db.getState().products;
    if (merchantId) {
      return products.filter((p) => p.merchantId === merchantId && p.isActive);
    }
    return products.filter((p) => p.isActive);
  }

  public async findById(id: string): Promise<Product | null> {
    const product = db.getState().products.find((p) => p.id === id);
    return product || null;
  }

  public async findByNameOrAlias(query: string, merchantId?: string): Promise<Product | null> {
    const normalized = query.toLowerCase().trim();
    const products = await this.findAll(merchantId);

    // 1. Exact name match
    const exact = products.find((p) => p.name.toLowerCase() === normalized);
    if (exact) return exact;

    // 2. Alias match
    const aliasMatch = products.find((p) =>
      p.aliases.some((a) => a.toLowerCase() === normalized)
    );
    if (aliasMatch) return aliasMatch;

    // 3. Partial substring match
    const partial = products.find(
      (p) =>
        p.name.toLowerCase().includes(normalized) ||
        normalized.includes(p.name.toLowerCase()) ||
        p.aliases.some((a) => a.toLowerCase().includes(normalized) || normalized.includes(a.toLowerCase()))
    );
    return partial || null;
  }

  public async updateStock(id: string, quantitySold: number): Promise<Product | null> {
    const product = db.getState().products.find((p) => p.id === id);
    if (!product) return null;

    product.stock = Math.max(0, product.stock - quantitySold);
    product.updatedAt = new Date().toISOString();
    await db.save();
    return product;
  }

  public async upsertMany(products: Product[]): Promise<void> {
    const stateProducts = db.getState().products;
    for (const p of products) {
      const idx = stateProducts.findIndex((item) => item.id === p.id);
      if (idx >= 0) {
        stateProducts[idx] = p;
      } else {
        stateProducts.push(p);
      }
    }
    await db.save();
  }
}

export const productRepo = new ProductRepository();
