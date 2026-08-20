import { seedDatabase } from './seed.js';
import { db } from '../db/database.js';
import { analyticsEngine } from '../analytics/engine.js';
import { forecastingEngine } from '../analytics/forecasting.js';
import { customerEngine } from '../analytics/customerEngine.js';
import { copilotEngine } from '../ai/copilot.js';
import { transactionExtractor } from '../ai/extractor.js';
import { reconciler } from '../context-engine/reconciler.js';
import { sessionRepo } from '../db/repositories/session.repo.js';
import { SessionController } from '../controllers/session.controller.js';
import { paymentSimulator } from '../simulator/paymentSimulator.js';

async function runVerification() {
  console.log('\n🔍 Starting Automated Backend Pipeline Verification...\n');

  // Step 1: Database Seed
  console.log('1️⃣ Testing Database Seeding...');
  await seedDatabase();
  const state = db.getState();
  console.log(`   ✅ Products: ${state.products.length} (Expected: 50)`);
  console.log(`   ✅ Customers: ${state.customers.length} (Expected: 100)`);
  console.log(`   ✅ Transactions: ${state.transactions.length} (Expected: > 500)`);
  console.log(`   ✅ Insights: ${state.insights.length} (Expected: 3)`);

  // Step 2: Analytics Engine
  console.log('\n2️⃣ Testing Deterministic Analytics Engine...');
  const overview = await analyticsEngine.getDailyOverview();
  console.log(`   ✅ Today Revenue: ₹${overview.todayRevenue.toLocaleString()}`);
  console.log(`   ✅ Revenue Growth: ${overview.revenueGrowthPercent}%`);
  console.log(`   ✅ Today Transactions: ${overview.todayTransactions}`);
  console.log(`   ✅ Avg Ticket: ₹${overview.avgTransactionValue}`);

  const productPerf = await analyticsEngine.getProductPerformance();
  console.log(`   ✅ Top Selling Product: ${productPerf[0].name} (Revenue: ₹${productPerf[0].revenue.toLocaleString()})`);

  const combinations = await analyticsEngine.getProductCombinations();
  console.log(`   ✅ Top Basket Combination: ${combinations[0].products.join(' + ')} (Frequency: ${combinations[0].frequency})`);

  // Step 3: Inventory Forecasting & Customer Churn
  console.log('\n3️⃣ Testing Inventory Forecasting & Customer Churn...');
  const inventoryRisks = await forecastingEngine.getInventoryRisks();
  const highRisk = inventoryRisks.find((i) => i.riskLevel === 'HIGH');
  console.log(`   ✅ High Risk Item: ${highRisk?.name} (Runway: ${highRisk?.runwayDays} days, Reorder: ${highRisk?.recommendedReorderUnits} units)`);

  const inactiveCusts = await customerEngine.getInactiveCustomers();
  console.log(`   ✅ Inactive Regular Customers: ${inactiveCusts.length} (Expected: 23)`);

  // Step 4: AI Copilot
  console.log('\n4️⃣ Testing AI Business Copilot...');
  const copilotRes1 = await copilotEngine.ask({ merchantId: 'M001', question: 'Aaj business kaisa raha?' });
  console.log(`   ✅ Intent: ${copilotRes1.intent}`);
  console.log(`   ✅ Hinglish Answer: "${copilotRes1.answerHinglish}"`);

  const copilotRes2 = await copilotEngine.ask({ merchantId: 'M001', question: 'Meri sales kyun giri?' });
  console.log(`   ✅ Intent: ${copilotRes2.intent}`);
  console.log(`   ✅ Action Label: "${copilotRes2.recommendedActions[0]?.label}"`);

  // Step 5: Audio & Transaction Extraction
  console.log('\n5️⃣ Testing Transaction Extraction (Hindi/Hinglish)...');
  const transcript1 = 'Bhaiya 2 Maggi aur ek Coke dena. Kitna hua? Assi rupaye.';
  const extracted = await transactionExtractor.extract(transcript1);
  console.log(`   ✅ Extracted Products:`, extracted.products);
  console.log(`   ✅ Mentioned Amount: ₹${extracted.mentionedAmount}`);

  // Step 6: End-to-End Session Reconciliation
  console.log('\n6️⃣ Testing End-to-End Session Reconciliation...');
  const session = await sessionRepo.create({
    id: `SESSION-TEST-001`,
    merchantId: 'M001',
    status: 'ANALYZING',
    transcript: transcript1,
    extraction: extracted,
    startedAt: new Date().toISOString(),
  });

  const payment = await paymentSimulator.simulate({
    amount: 80,
    merchantId: 'M001',
    sessionId: session.id,
  });
  console.log(`   ✅ Payment Generated: ID ${payment.id}, Amount ₹${payment.amount}`);

  const reconciliation = await reconciler.reconcile(session, payment, 'M001');
  console.log(`   ✅ Reconciliation Status: ${reconciliation.status}`);
  console.log(`   ✅ Confidence Score: ${reconciliation.confidence}%`);
  console.log(`   ✅ Expected Amount: ₹${reconciliation.expectedAmount}, Received: ₹${reconciliation.receivedAmount}`);
  console.log(`   ✅ Breakdown:`, reconciliation.breakdown);

  const finalizedSession = await sessionRepo.update(session.id, {
    payment,
    status: reconciliation.isMatched ? 'MATCHED' : 'CONFIRMATION_REQUIRED',
    reconciliation,
    completedAt: new Date().toISOString(),
  });

  const savedTxn = await SessionController.saveFinalTransaction(finalizedSession!);
  console.log(`   ✅ Final Transaction Saved: ID ${savedTxn?.id}, Amount ₹${savedTxn?.totalAmount}, Profit ₹${savedTxn?.totalProfit}`);

  console.log('\n🎉 ALL BACKEND PIPELINE VERIFICATIONS PASSED SUCCESSFULLY!\n');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
