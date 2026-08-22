import { DemoScenario } from '../types/index.js';

export const DEMO_SCENARIOS: DemoScenario[] = [
  // ── Core scenarios ────────────────────────────────────────────────────────
  {
    id: 'scenario_1',
    title: 'Scenario 1: High Confidence Match (Maggi + Coke)',
    description: 'Customer orders 2 Maggi and 1 Coke, pays ₹80 via QR. Perfect match and instant reconciliation.',
    audioFileName: 'scenario_1_maggi_coke.wav',
    transcript: 'Bhaiya 2 Maggi aur ek Coke dena. Kitna hua? Assi rupaye.',
    language: 'hi',
    expectedProducts: [
      { name: 'Maggi 2-Min Noodles', quantity: 2, unitPrice: 15 },
      { name: 'Coca-Cola 500ml', quantity: 1, unitPrice: 50 },
    ],
    paymentAmount: 80,
    expectedOutcome: 'MATCHED',
    confidence: 97,
    notes: 'Amount exact (₹80), items resolved, confidence 97%.',
  },
  {
    id: 'scenario_2',
    title: 'Scenario 2: Multi-Item Basket (Pepsi + Chips + Chocolate)',
    description: 'Customer purchases 1 Pepsi, 2 Chips, and 1 Chocolate for ₹120.',
    audioFileName: 'scenario_2_pepsi_chips.wav',
    transcript: 'Ek Pepsi, do chips aur ek chocolate dena. Kitna hua bhaiya? Ek sau bees rupaye.',
    language: 'hi',
    expectedProducts: [
      { name: 'Pepsi 500ml', quantity: 1, unitPrice: 40 },
      { name: "Lay's Classic Salted", quantity: 2, unitPrice: 20 },
      { name: 'Cadbury Dairy Milk', quantity: 1, unitPrice: 40 },
    ],
    paymentAmount: 120,
    expectedOutcome: 'MATCHED',
    confidence: 95,
    notes: 'Multi-category basket matching total ₹120.',
  },
  {
    id: 'scenario_3',
    title: 'Scenario 3: Discrepancy & Low Confidence (Confirmation Required)',
    description: 'Customer orders 2 Pepsi + 1 Coke (₹130) but payment received is ₹180. Triggers merchant confirmation flag.',
    audioFileName: 'scenario_3_discrepancy.wav',
    transcript: 'Do Pepsi aur ek Coke dena.',
    language: 'hi',
    expectedProducts: [
      { name: 'Pepsi 500ml', quantity: 2, unitPrice: 40 },
      { name: 'Coca-Cola 500ml', quantity: 1, unitPrice: 50 },
    ],
    paymentAmount: 180,
    expectedOutcome: 'CONFIRMATION_REQUIRED',
    confidence: 65,
    notes: 'Demonstrates safeguard: expected ₹130, received ₹180. Flags confirmation.',
  },
  {
    id: 'scenario_4',
    title: 'Scenario 4: Lost Sales Signal (Pepsi Out of Stock)',
    description: 'Customer requests Pepsi, merchant says out of stock. Logs unfulfilled demand signal.',
    audioFileName: 'scenario_4_lost_sale.wav',
    transcript: 'Bhaiya Pepsi hai kya? Nahi, Pepsi khatam ho gayi.',
    language: 'hi',
    expectedProducts: [],
    paymentAmount: 0,
    expectedOutcome: 'LOST_SALE',
    confidence: 92,
    notes: 'Identifies lost sale event and increases Pepsi demand analytics.',
  },
  {
    id: 'scenario_5',
    title: 'Scenario 5: Essential Grocery (Bread + Milk)',
    description: 'Customer buys morning essentials: 1 packet Bread + 1 packet Amul Milk for ₹95.',
    audioFileName: 'scenario_5_bread_milk.wav',
    transcript: 'Ek packet bread aur ek packet Amul Taaza doodh dena.',
    language: 'hi',
    expectedProducts: [
      { name: 'Harvest Gold White Bread', quantity: 1, unitPrice: 45 },
      { name: 'Amul Taaza Milk 500ml', quantity: 1, unitPrice: 50 },
    ],
    paymentAmount: 95,
    expectedOutcome: 'MATCHED',
    confidence: 96,
    notes: 'Daily staple transaction reconciliation.',
  },

  // ── Real-world edge cases ─────────────────────────────────────────────────

  {
    id: 'scenario_6',
    title: 'Scenario 6: Two Customers at Counter (Multi-Customer)',
    description:
      'Two customers speak in sequence at the same counter. First asks for Coke + Parle-G; ' +
      'second interrupts asking for 2 Maggi. All items merged into one session (₹95 total).',
    audioFileName: 'scenario_6_multi_customer.wav',
    transcript:
      'Bhaiya ek Coke aur Parle-G dena. — Ruko bhai, pehle iska ho jaaye. — ' +
      'Han bhaiya, aur mujhe do Maggi bhi dena. Bhaiya kitna hua? Pachaanve rupaye.',
    language: 'hi',
    expectedProducts: [
      { name: 'Coca-Cola 500ml', quantity: 1, unitPrice: 50 },
      { name: 'Parle-G Gold Biscuits', quantity: 1, unitPrice: 10 },
      { name: 'Maggi 2-Min Noodles', quantity: 2, unitPrice: 15 },
    ],
    paymentAmount: 95,
    expectedOutcome: 'MATCHED',
    confidence: 91,
    notes:
      'Validates multiCustomer=true flag. All items from both customers are merged and ' +
      'reconciled as a single ₹95 session. Real kirana counter reality — shopkeeper serves the ' +
      'queue while the mic is open.',
  },

  {
    id: 'scenario_7',
    title: 'Scenario 7: Customer Changes Order Mid-Request (Order Amendment)',
    description:
      'Customer first asks for 1 Sprite, then changes to 2 Sprites. Extractor must reflect final quantity only.',
    audioFileName: 'scenario_7_order_change.wav',
    transcript:
      'Bhaiya ek Sprite dena. Nahi nahi, do Sprite dena — ek mera aur ek mere bhai ke liye. Aur ek Parle-G bhi. Kitna hua? Ek sau dasa.',
    language: 'hi',
    expectedProducts: [
      { name: 'Sprite 500ml', quantity: 2, unitPrice: 50 },
      { name: 'Parle-G Gold Biscuits', quantity: 1, unitPrice: 10 },
    ],
    paymentAmount: 110,
    expectedOutcome: 'MATCHED',
    confidence: 93,
    notes:
      'Validates orderAmended=true flag. Final quantity of Sprite is 2 (not 1). ' +
      'LLM must use the last stated intent, not the first.',
  },

  {
    id: 'scenario_8',
    title: 'Scenario 8: Credit / Udhar Purchase (Deferred Payment)',
    description:
      'Regular customer buys biscuits and asks to put on credit. No QR payment scanned. Session flagged as udhar.',
    audioFileName: 'scenario_8_udhar.wav',
    transcript:
      'Bhaiya do Parle-G aur ek Marie Gold dena. Bhaiya aaj udhar kar do, kal paise de deta hoon.',
    language: 'hi',
    expectedProducts: [
      { name: 'Parle-G Gold Biscuits', quantity: 2, unitPrice: 10 },
      { name: 'Britannia Marie Gold 250g', quantity: 1, unitPrice: 35 },
    ],
    paymentAmount: 0,
    expectedOutcome: 'CONFIRMATION_REQUIRED',
    confidence: 88,
    notes:
      'Validates isUdhar=true flag. No payment event fires. Merchant must manually confirm or log credit. ' +
      'Products are still extracted correctly for inventory deduction tracking.',
  },

  {
    id: 'scenario_9',
    title: 'Scenario 9: Heavy Hindi Accent + Mixed Language',
    description:
      'Customer uses strongly accented Hindi and local product name variants. Tests robustness of name matching and alias resolution.',
    audioFileName: 'scenario_9_heavy_accent.wav',
    transcript:
      'Bhaiya ek Bissleri paani ki botal dena, ek Kurkure aur ek choklet wala biscoot. Aur do Frooti bhi. Teen sau nahi banta? Saat rupaiye bachche hain wapis.',
    language: 'hi',
    expectedProducts: [
      { name: 'Bisleri Water 1L', quantity: 1, unitPrice: 20 },
      { name: 'Kurkure Masala Munch', quantity: 1, unitPrice: 20 },
      { name: 'Parle Hide & Seek Chocolate', quantity: 1, unitPrice: 50 },
      { name: 'Frooti 250ml', quantity: 2, unitPrice: 20 },
    ],
    paymentAmount: 130,
    expectedOutcome: 'MATCHED',
    confidence: 89,
    notes:
      '"Bissleri"→Bisleri, "choklet wala biscoot"→Hide & Seek Chocolate, "Frooti" resolved via product alias table. ' +
      'Customer mentions change (saat rupaiye wapis) — extractor ignores that and extracts items only.',
  },

  {
    id: 'scenario_10',
    title: 'Scenario 10: Partial Fulfillment (One Item Out of Stock)',
    description:
      'Customer requests Pepsi + Chips + Coke. Pepsi is out of stock; rest fulfilled. ' +
      'Lost sale logged for Pepsi AND transaction completes for Chips + Coke (₹70).',
    audioFileName: 'scenario_10_partial_lost.wav',
    transcript:
      'Bhaiya ek Pepsi, ek chips aur ek Coke dena. — Bhaiya Pepsi khatam ho gayi. — Theek hai, sirf chips aur Coke do. Kitna hua? Sattar rupaye.',
    language: 'hi',
    expectedProducts: [
      { name: "Lay's Classic Salted", quantity: 1, unitPrice: 20 },
      { name: 'Coca-Cola 500ml', quantity: 1, unitPrice: 50 },
    ],
    paymentAmount: 70,
    expectedOutcome: 'MATCHED',
    confidence: 94,
    notes:
      'isLostSale=true for Pepsi, but transaction still completes for available items. ' +
      'Validates that a lost sale signal does not block the session from reconciling.',
  },
];
