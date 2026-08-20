import { db } from '../database.js';
import { Customer } from '../../types/index.js';

export class CustomerRepository {
  public async findAll(merchantId?: string): Promise<Customer[]> {
    const customers = db.getState().customers;
    if (merchantId) {
      return customers.filter((c) => c.merchantId === merchantId);
    }
    return customers;
  }

  public async findById(id: string): Promise<Customer | null> {
    const customer = db.getState().customers.find((c) => c.id === id);
    return customer || null;
  }

  public async updateVisit(id: string, amount: number): Promise<Customer | null> {
    const customer = db.getState().customers.find((c) => c.id === id);
    if (!customer) return null;

    customer.visitCount += 1;
    customer.totalSpend += amount;
    customer.lastVisit = new Date().toISOString();
    await db.save();
    return customer;
  }

  public async upsertMany(customers: Customer[]): Promise<void> {
    const stateCustomers = db.getState().customers;
    for (const c of customers) {
      const idx = stateCustomers.findIndex((item) => item.id === c.id);
      if (idx >= 0) {
        stateCustomers[idx] = c;
      } else {
        stateCustomers.push(c);
      }
    }
    await db.save();
  }
}

export const customerRepo = new CustomerRepository();
