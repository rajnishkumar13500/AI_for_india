import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import {
  Merchant,
  Product,
  Customer,
  Transaction,
  TransactionItem,
  Insight,
  Offer,
  LostSalesSignal,
} from '../types/index.js';

export async function seedDatabase(): Promise<void> {
  console.log('[Seed] Initializing database seed...');
  await db.reset();

  const merchant: Merchant = {
    id: 'M001',
    name: 'Rajesh Sharma',
    storeName: 'Rajesh Kirana & General Store',
    phone: '+91 98765 43210',
    upiId: 'rajeshkirana@paytm',
    category: 'Grocery & FMCG',
    city: 'Jaipur',
    currency: 'INR',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  };

  // 50 Realistic Kirana Products
  const products: Product[] = [
    // Beverages
    { id: 'PROD-001', merchantId: 'M001', sku: 'COKE-500', name: 'Coca-Cola 500ml', aliases: ['coke', 'coca cola', 'cold drink', 'chhoti coke'], category: 'Beverages', costPrice: 38, sellingPrice: 50, stock: 45, reorderLevel: 20, unit: 'bottle', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-002', merchantId: 'M001', sku: 'PEPSI-500', name: 'Pepsi 500ml', aliases: ['pepsi', 'pepsi bottle'], category: 'Beverages', costPrice: 30, sellingPrice: 40, stock: 6, reorderLevel: 15, unit: 'bottle', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-003', merchantId: 'M001', sku: 'THUMS-500', name: 'Thums Up 500ml', aliases: ['thums up', 'thumps up', 'thumbs up'], category: 'Beverages', costPrice: 38, sellingPrice: 50, stock: 32, reorderLevel: 15, unit: 'bottle', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-004', merchantId: 'M001', sku: 'SPRITE-500', name: 'Sprite 500ml', aliases: ['sprite'], category: 'Beverages', costPrice: 38, sellingPrice: 50, stock: 28, reorderLevel: 15, unit: 'bottle', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-005', merchantId: 'M001', sku: 'FROO-250', name: 'Frooti 250ml', aliases: ['frooti', 'mango frooti', 'fruty'], category: 'Beverages', costPrice: 15, sellingPrice: 20, stock: 50, reorderLevel: 20, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-006', merchantId: 'M001', sku: 'MAAZA-600', name: 'Maaza 600ml', aliases: ['maaza', 'maza'], category: 'Beverages', costPrice: 32, sellingPrice: 42, stock: 24, reorderLevel: 10, unit: 'bottle', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-007', merchantId: 'M001', sku: 'RED-BULL', name: 'Red Bull 250ml', aliases: ['red bull', 'energy drink'], category: 'Beverages', costPrice: 100, sellingPrice: 125, stock: 18, reorderLevel: 10, unit: 'can', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-008', merchantId: 'M001', sku: 'BISLERI-1L', name: 'Bisleri Water 1L', aliases: ['bisleri', 'pani ki bottle', 'water bottle', 'mineral water'], category: 'Beverages', costPrice: 12, sellingPrice: 20, stock: 80, reorderLevel: 30, unit: 'bottle', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // Packaged Foods & Noodles
    { id: 'PROD-009', merchantId: 'M001', sku: 'MAGGI-2MIN', name: 'Maggi 2-Min Noodles', aliases: ['maggi', 'maggie', 'maggi noodles', 'maggi packet'], category: 'Instant Food', costPrice: 11, sellingPrice: 15, stock: 18, reorderLevel: 40, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-010', merchantId: 'M001', sku: 'YIPPEE-NOODLES', name: 'Sunfeast Yippee Noodles', aliases: ['yippee', 'yippee noodles'], category: 'Instant Food', costPrice: 11, sellingPrice: 15, stock: 35, reorderLevel: 20, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-011', merchantId: 'M001', sku: 'CHINGS-NOODLES', name: 'Ching’s Secret Schezwan Noodles', aliases: ['chings noodles', 'schezwan noodles'], category: 'Instant Food', costPrice: 15, sellingPrice: 20, stock: 22, reorderLevel: 15, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-012', merchantId: 'M001', sku: 'KNORR-SOUP', name: 'Knorr Mixed Veg Soup', aliases: ['knorr soup', 'soup packet'], category: 'Instant Food', costPrice: 42, sellingPrice: 55, stock: 16, reorderLevel: 10, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // Snacks & Biscuits
    { id: 'PROD-013', merchantId: 'M001', sku: 'LAYS-SALTED', name: 'Lay’s Classic Salted', aliases: ['chips', 'lays', 'lays blue', 'salted chips'], category: 'Snacks', costPrice: 15, sellingPrice: 20, stock: 40, reorderLevel: 20, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-014', merchantId: 'M001', sku: 'LAYS-MAGIC', name: 'Lay’s India’s Magic Masala', aliases: ['lays green', 'masala chips', 'magic masala'], category: 'Snacks', costPrice: 15, sellingPrice: 20, stock: 45, reorderLevel: 20, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-015', merchantId: 'M001', sku: 'KURKURE-MASALA', name: 'Kurkure Masala Munch', aliases: ['kurkure', 'tedhe medhe'], category: 'Snacks', costPrice: 15, sellingPrice: 20, stock: 50, reorderLevel: 25, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-016', merchantId: 'M001', sku: 'BINGO-MAD', name: 'Bingo Mad Angles', aliases: ['bingo', 'mad angles'], category: 'Snacks', costPrice: 15, sellingPrice: 20, stock: 30, reorderLevel: 15, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-017', merchantId: 'M001', sku: 'PARLE-G-10', name: 'Parle-G Gold Biscuits', aliases: ['parle g', 'parle-g', 'biscuit'], category: 'Biscuits', costPrice: 8, sellingPrice: 10, stock: 75, reorderLevel: 30, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-018', merchantId: 'M001', sku: 'GOOD-DAY-CASHEW', name: 'Britannia Good Day Cashew', aliases: ['good day', 'goodday', 'cashew biscuit'], category: 'Biscuits', costPrice: 22, sellingPrice: 30, stock: 40, reorderLevel: 15, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-019', merchantId: 'M001', sku: 'OREO-VANILLA', name: 'Cadbury Oreo Original 120g', aliases: ['oreo', 'oreo biscuit'], category: 'Biscuits', costPrice: 28, sellingPrice: 35, stock: 32, reorderLevel: 15, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-020', merchantId: 'M001', sku: 'MARIE-GOLD', name: 'Britannia Marie Gold 250g', aliases: ['marie gold', 'marie biscuit', 'chai biscuit'], category: 'Biscuits', costPrice: 28, sellingPrice: 35, stock: 38, reorderLevel: 15, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-021', merchantId: 'M001', sku: 'HIDE-SEEK', name: 'Parle Hide & Seek Chocolate', aliases: ['hide and seek', 'hide seek', 'choco chip'], category: 'Biscuits', costPrice: 38, sellingPrice: 50, stock: 25, reorderLevel: 10, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-022', merchantId: 'M001', sku: 'BRITANNIA-RUSK', name: 'Britannia Toastea Premium Rusk', aliases: ['rusk', 'toast', 'rusk packet'], category: 'Bakery', costPrice: 36, sellingPrice: 45, stock: 20, reorderLevel: 10, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // Dairy & Daily Staples
    { id: 'PROD-023', merchantId: 'M001', sku: 'AMUL-MILK-500', name: 'Amul Taaza Milk 500ml', aliases: ['amul doodh', 'amul milk', 'milk', 'doodh', 'taaza milk'], category: 'Dairy', costPrice: 25, sellingPrice: 28, stock: 55, reorderLevel: 25, unit: 'pouch', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-024', merchantId: 'M001', sku: 'AMUL-GOLD-500', name: 'Amul Gold Milk 500ml', aliases: ['amul gold', 'gold doodh', 'full cream milk'], category: 'Dairy', costPrice: 31, sellingPrice: 34, stock: 45, reorderLevel: 20, unit: 'pouch', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-025', merchantId: 'M001', sku: 'AMUL-CURD-400', name: 'Amul Masti Dahi 400g', aliases: ['amul dahi', 'dahi', 'curd', 'masti dahi'], category: 'Dairy', costPrice: 32, sellingPrice: 40, stock: 20, reorderLevel: 10, unit: 'cup', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-026', merchantId: 'M001', sku: 'AMUL-BUTTER-100', name: 'Amul Butter 100g', aliases: ['butter', 'amul butter', 'makhan'], category: 'Dairy', costPrice: 48, sellingPrice: 56, stock: 15, reorderLevel: 10, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-027', merchantId: 'M001', sku: 'AMUL-PANEER-200', name: 'Amul Fresh Paneer 200g', aliases: ['paneer', 'amul paneer'], category: 'Dairy', costPrice: 78, sellingPrice: 90, stock: 12, reorderLevel: 8, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-028', merchantId: 'M001', sku: 'AMUL-CHEESE-SLICES', name: 'Amul Cheese Slices 200g', aliases: ['cheese', 'cheese slice', 'amul cheese'], category: 'Dairy', costPrice: 118, sellingPrice: 140, stock: 10, reorderLevel: 6, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-029', merchantId: 'M001', sku: 'BREAD-WHITE', name: 'Harvest Gold White Bread', aliases: ['bread', 'white bread', 'bread packet'], category: 'Bakery', costPrice: 36, sellingPrice: 45, stock: 14, reorderLevel: 15, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-030', merchantId: 'M001', sku: 'BREAD-BROWN', name: 'Harvest Gold Brown Bread', aliases: ['brown bread', 'wheat bread'], category: 'Bakery', costPrice: 42, sellingPrice: 55, stock: 8, reorderLevel: 10, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-031', merchantId: 'M001', sku: 'EGGS-TRAY-6', name: 'Fresh Farm Eggs 6 Pcs', aliases: ['ande', 'eggs', 'egg tray', '6 ande'], category: 'Staples', costPrice: 38, sellingPrice: 48, stock: 30, reorderLevel: 15, unit: 'box', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // Chocolates & Confectionery
    { id: 'PROD-032', merchantId: 'M001', sku: 'DAIRY-MILK-40', name: 'Cadbury Dairy Milk', aliases: ['chocolate', 'dairy milk', 'cadbury'], category: 'Chocolates', costPrice: 32, sellingPrice: 40, stock: 35, reorderLevel: 15, unit: 'bar', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-033', merchantId: 'M001', sku: 'DAIRY-SILK-80', name: 'Cadbury Dairy Milk Silk', aliases: ['silk', 'dairy milk silk'], category: 'Chocolates', costPrice: 70, sellingPrice: 85, stock: 20, reorderLevel: 10, unit: 'bar', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-034', merchantId: 'M001', sku: 'KITKAT-25', name: 'Nestle KitKat 4 Finger', aliases: ['kitkat', 'kit kat'], category: 'Chocolates', costPrice: 20, sellingPrice: 25, stock: 40, reorderLevel: 15, unit: 'bar', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-035', merchantId: 'M001', sku: '5-STAR-10', name: 'Cadbury 5 Star 20g', aliases: ['5 star', 'five star'], category: 'Chocolates', costPrice: 8, sellingPrice: 10, stock: 60, reorderLevel: 25, unit: 'bar', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // Staples & Spices
    { id: 'PROD-036', merchantId: 'M001', sku: 'AASHIRVAAD-AATA-5K', name: 'Aashirvaad Shudh Chakki Atta 5kg', aliases: ['aashirvaad atta', 'atta 5kg', 'gehu ka aata'], category: 'Staples', costPrice: 215, sellingPrice: 250, stock: 25, reorderLevel: 10, unit: 'bag', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-037', merchantId: 'M001', sku: 'FORTUNE-OIL-1L', name: 'Fortune Sunlite Refined Oil 1L', aliases: ['fortune oil', 'refined tel', 'cooking oil', 'tel 1 litre'], category: 'Staples', costPrice: 130, sellingPrice: 150, stock: 28, reorderLevel: 12, unit: 'pouch', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-038', merchantId: 'M001', sku: 'TATA-SALT-1K', name: 'Tata Salt Vacuum Evaporated 1kg', aliases: ['tata salt', 'namak', 'tata namak'], category: 'Staples', costPrice: 22, sellingPrice: 28, stock: 60, reorderLevel: 25, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-039', merchantId: 'M001', sku: 'SUGAR-1K', name: 'Madhur Pure & Hygienic Sugar 1kg', aliases: ['sugar', 'cheeni', 'madhur sugar'], category: 'Staples', costPrice: 42, sellingPrice: 50, stock: 45, reorderLevel: 20, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-040', merchantId: 'M001', sku: 'TATA-TEA-250', name: 'Tata Tea Premium 250g', aliases: ['tata tea', 'chai patti', 'tata chai'], category: 'Beverages', costPrice: 115, sellingPrice: 140, stock: 30, reorderLevel: 12, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-041', merchantId: 'M001', sku: 'RED-LABEL-250', name: 'Brooke Bond Red Label Tea 250g', aliases: ['red label', 'red label chai'], category: 'Beverages', costPrice: 120, sellingPrice: 145, stock: 25, reorderLevel: 10, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-042', merchantId: 'M001', sku: 'NESCAFE-CLASSIC-50', name: 'Nescafe Classic Instant Coffee 50g', aliases: ['nescafe', 'coffee', 'nescafe coffee'], category: 'Beverages', costPrice: 155, sellingPrice: 185, stock: 15, reorderLevel: 8, unit: 'jar', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-043', merchantId: 'M001', sku: 'MDH-DEGGI-MIRCH', name: 'MDH Deggi Mirch 100g', aliases: ['deggi mirch', 'mdh mirch', 'lal mirch'], category: 'Spices', costPrice: 75, sellingPrice: 90, stock: 20, reorderLevel: 8, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-044', merchantId: 'M001', sku: 'EVEREST-TURMERIC-100', name: 'Everest Turmeric Powder 100g', aliases: ['haldi', 'everest haldi', 'turmeric'], category: 'Spices', costPrice: 32, sellingPrice: 40, stock: 25, reorderLevel: 10, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-045', merchantId: 'M001', sku: 'CATCH-CHAT-MASALA', name: 'Catch Chat Masala Sprinkler 100g', aliases: ['chat masala', 'catch masala'], category: 'Spices', costPrice: 54, sellingPrice: 68, stock: 18, reorderLevel: 8, unit: 'can', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

    // Personal Care & Hygiene
    { id: 'PROD-046', merchantId: 'M001', sku: 'DETTOL-SOAP-75', name: 'Dettol Original Soap 75g', aliases: ['dettol', 'dettol soap', 'sabun'], category: 'Personal Care', costPrice: 32, sellingPrice: 40, stock: 40, reorderLevel: 15, unit: 'bar', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-047', merchantId: 'M001', sku: 'DOVE-SOAP-100', name: 'Dove Cream Beauty Bar 100g', aliases: ['dove soap', 'dove'], category: 'Personal Care', costPrice: 58, sellingPrice: 70, stock: 22, reorderLevel: 10, unit: 'bar', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-048', merchantId: 'M001', sku: 'COLGATE-STRONG-100', name: 'Colgate Strong Teeth Toothpaste 100g', aliases: ['colgate', 'toothpaste', 'dant manjan'], category: 'Personal Care', costPrice: 52, sellingPrice: 65, stock: 35, reorderLevel: 15, unit: 'tube', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-049', merchantId: 'M001', sku: 'SURF-EXCEL-EASY-1K', name: 'Surf Excel Easy Wash Detergent 1kg', aliases: ['surf excel', 'surf', 'detergent', 'kapde dhone ka powder'], category: 'Household', costPrice: 125, sellingPrice: 145, stock: 20, reorderLevel: 10, unit: 'pack', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'PROD-050', merchantId: 'M001', sku: 'VIM-BAR-200', name: 'Vim Dishwash Bar 200g', aliases: ['vim bar', 'vim', 'bartan sabun'], category: 'Household', costPrice: 18, sellingPrice: 25, stock: 50, reorderLevel: 20, unit: 'bar', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  // 100 Customers (with 23 Inactive regulars to match hackathon story)
  const customers: Customer[] = [];
  const names = [
    'Aarav Patel', 'Neha Sharma', 'Rohan Gupta', 'Pooja Verma', 'Amit Kumar', 'Vikas Singh', 'Sunita Devi',
    'Ramesh Choudhary', 'Ananya Roy', 'Deepak Yadav', 'Priya Nair', 'Suresh Jain', 'Manish Agarwal', 'Kavita Joshi',
    'Rajiv Mishra', 'Alok Mehta', 'Simran Kaur', 'Harish Rao', 'Sneha Pillai', 'Manoj Tiwari', 'Kiran Bedi',
    'Dinesh Reddy', 'Gita Saxena', 'Naveen Bhatt', 'Tarun Sethi', 'Rekha Goyal', 'Sanjay Dubey', 'Swati Deshmukh',
    'Mohit Rawat', 'Preeti Bajaj', 'Ashok Singhal', 'Meena Menon', 'Pradeep Kapoor', 'Shilpa Shetty', 'Ritu Mathur',
    'Anil Kulkarni', 'Bhavna Chauhan', 'Gaurav Gill', 'Anita Sen', 'Sunil Narang', 'Monika Das', 'Vivek Bhasin',
    'Archana Kaul', 'Hemant Tripathi', 'Pallavi Shinde', 'Jitendra Soni', 'Divya Ahuja', 'Nitin Gadre', 'Payal Ghosh',
    'Chetan Bhatt', 'Rashmi Dewan', 'Om Prakash', 'Lata Aggarwal', 'Kamal Nanda', 'Bela Trivedi', 'Vijay Mahajan',
    'Usha Pandey', 'Siddharth Roy', 'Sarita Mittal', 'Bharat Chawla', 'Megha Vora', 'Yogesh Khatri', 'Juhi Chawla',
    'Arun Grover', 'Sapna Puri', 'Pawan Wadhwa', 'Seema Nagpal', 'Mahesh Bhardwaj', 'Kusum Goel', 'Sudhir Lamba',
    'Neelam Talwar', 'Devendra Ahuja', 'Vandana Oberoi', 'Gopal Biyani', 'Indu Thapar', 'Subhash Chandra', 'Kajal Somani',
    'Nand Kishore', 'Leela Mani', 'Rajnish Kumar', 'Dhairya Garg', 'Abhishek Lodha', 'Tanvi Singla', 'Akash Murthy',
    'Bindiya Parekh', 'Chirag Sanghvi', 'Geetanjali Rao', 'Irfan Khan', 'Jaspreet Singh', 'Kanika Batra', 'Lalit Modi',
    'Madhu Bala', 'Naman Jain', 'Parul Bansal', 'Qasim Ali', 'Rupal Shah', 'Sahil Mehra', 'Tanya Sehgal', 'Umesh Pal'
  ];

  for (let i = 0; i < 100; i++) {
    const name = names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : '');
    let segment: Customer['segment'] = 'REGULAR';
    let daysAgoLastVisit = Math.floor(Math.random() * 5);

    // Explicitly create 23 INACTIVE customers who were regular before
    if (i < 23) {
      segment = 'INACTIVE';
      daysAgoLastVisit = 15 + Math.floor(Math.random() * 15); // 15-30 days ago
    } else if (i < 35) {
      segment = 'HIGH_VALUE';
    } else if (i < 50) {
      segment = 'NEW';
      daysAgoLastVisit = Math.floor(Math.random() * 4);
    } else if (i < 65) {
      segment = 'AT_RISK';
      daysAgoLastVisit = 8 + Math.floor(Math.random() * 6);
    }

    const lastVisitDate = new Date(Date.now() - daysAgoLastVisit * 86400000);
    const visitCount = segment === 'NEW' ? 1 : segment === 'HIGH_VALUE' ? 24 : 8 + Math.floor(Math.random() * 12);
    const totalSpend = segment === 'HIGH_VALUE' ? 4800 + Math.floor(Math.random() * 2000) : visitCount * 140;

    customers.push({
      id: `CUST-${String(i + 1).padStart(3, '0')}`,
      merchantId: 'M001',
      name,
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      segment,
      totalSpend,
      visitCount,
      lastVisit: lastVisitDate.toISOString(),
      favoriteProducts: ['Coca-Cola 500ml', 'Maggi 2-Min Noodles'],
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    });
  }

  // 600 Realistic Transactions across 30 days
  const transactions: Transaction[] = [];
  const now = Date.now();

  for (let day = 30; day >= 0; day--) {
    const dayTimestamp = now - day * 86400000;
    const isWeekend = new Date(dayTimestamp).getDay() === 0 || new Date(dayTimestamp).getDay() === 6;
    const txnCount = isWeekend ? 22 + Math.floor(Math.random() * 6) : 16 + Math.floor(Math.random() * 5);

    for (let t = 0; t < txnCount; t++) {
      const hour = 8 + Math.floor(Math.random() * 14); // 8 AM to 10 PM
      const minute = Math.floor(Math.random() * 60);
      const txnDate = new Date(dayTimestamp);
      txnDate.setHours(hour, minute, 0, 0);

      // Ensure seed transaction timestamp is strictly in the past (before now)
      if (txnDate.getTime() >= now) {
        txnDate.setTime(now - (txnCount - t + 1) * 20 * 60000);
      }

      const items: TransactionItem[] = [];
      let totalAmount = 0;
      let totalCost = 0;

      // Select 1 to 3 items
      const numItems = Math.random() > 0.4 ? 2 : Math.random() > 0.7 ? 3 : 1;
      const selectedProds: Product[] = [];

      // Bias towards Coke & Maggi combinations
      if (Math.random() < 0.35) {
        selectedProds.push(products[0]); // Coke
        selectedProds.push(products[8]); // Maggi
      } else {
        while (selectedProds.length < numItems) {
          const randomP = products[Math.floor(Math.random() * products.length)];
          if (!selectedProds.some((p) => p.id === randomP.id)) {
            selectedProds.push(randomP);
          }
        }
      }

      for (const p of selectedProds) {
        const qty = p.category === 'Staples' ? 1 : Math.random() > 0.6 ? 2 : 1;
        const itemTotal = p.sellingPrice * qty;
        const itemCost = p.costPrice * qty;

        items.push({
          productId: p.id,
          productName: p.name,
          category: p.category,
          quantity: qty,
          unitPrice: p.sellingPrice,
          costPrice: p.costPrice,
          totalPrice: itemTotal,
          profit: itemTotal - itemCost,
        });

        totalAmount += itemTotal;
        totalCost += itemCost;
      }

      const randomCust = customers[Math.floor(Math.random() * customers.length)];

      transactions.push({
        id: `TXN-${txnDate.getTime()}-${Math.floor(Math.random() * 1000)}`,
        merchantId: 'M001',
        customerId: randomCust.id,
        customerName: randomCust.name,
        items,
        totalAmount,
        totalCost,
        totalProfit: totalAmount - totalCost,
        paymentMethod: 'QR',
        paymentReference: `UPI-${uuidv4().substring(0, 8).toUpperCase()}`,
        confidence: 95 + Math.floor(Math.random() * 5),
        isConfirmed: true,
        timestamp: txnDate.toISOString(),
      });
    }
  }

  // Pre-generated Hackathon AI Insights
  const insights: Insight[] = [
    {
      id: 'INSIGHT-001',
      merchantId: 'M001',
      type: 'OPPORTUNITY',
      category: 'PRODUCT',
      title: 'Coca-Cola Surge (+31%)',
      whatHappened: 'Coca-Cola 500ml sales surged by 31% over the last 5 days.',
      why: 'Strong afternoon demand paired frequently with snacks and Maggi noodles.',
      impact: 'Generated ₹3,400 in incremental revenue this week.',
      recommendation: 'Place Coca-Cola prominently next to snack counters and ensure chiller is fully stocked.',
      actionType: 'VIEW_REPORT',
      isDismissed: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'INSIGHT-002',
      merchantId: 'M001',
      type: 'RISK',
      category: 'INVENTORY',
      title: 'Maggi Stock Depletion Risk (1.9 Days Runway)',
      whatHappened: 'Maggi 2-Min Noodles has only 18 packs remaining with daily sales averaging 9.5 packs.',
      why: 'High sales growth (+27%) without recent supplier restock.',
      impact: 'High probability of stock-out before Saturday peak rush, risking ~₹950 in lost revenue.',
      recommendation: 'Reorder at least 50 packs of Maggi immediately.',
      actionType: 'REORDER_STOCK',
      actionPayload: { productId: 'PROD-009', recommendedUnits: 50 },
      isDismissed: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'INSIGHT-003',
      merchantId: 'M001',
      type: 'CONCERN',
      category: 'CUSTOMER',
      title: '23 Inactive Regular Customers',
      whatHappened: '23 regular customers have not visited the store for more than 14 days.',
      why: 'Returning customer footfall dropped by 26% compared to previous monthly baseline.',
      impact: 'Estimated ongoing monthly revenue leakage of ~₹9,200.',
      recommendation: 'Send a personalized weekend WhatsApp/SMS reactivation offer of ₹20 off on orders above ₹200.',
      actionType: 'PREPARE_OFFER',
      actionPayload: { targetSegment: 'INACTIVE', discountValue: 20, minOrderValue: 200 },
      isDismissed: false,
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
  ];

  // Pre-configured Offers
  const offers: Offer[] = [
    {
      id: 'OFFER-001',
      merchantId: 'M001',
      title: 'Weekend Inactive Reactivation ₹20 Off',
      description: 'Get ₹20 off on all grocery orders above ₹200 this Saturday & Sunday!',
      targetSegment: 'INACTIVE',
      targetCount: 23,
      discountType: 'FLAT',
      discountValue: 20,
      minOrderValue: 200,
      validDays: 3,
      status: 'READY',
      suggestedReason: 'AI recommended to reactivate 23 regular customers with 0 visits in 14+ days.',
      createdAt: new Date().toISOString(),
    },
  ];

  // Lost Sales Signals
  const lostSales: LostSalesSignal[] = [
    {
      productName: 'Pepsi 500ml',
      requestCount: 8,
      estimatedLostRevenue: 320,
      lastRequested: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      productName: 'Amul Butter 100g',
      requestCount: 4,
      estimatedLostRevenue: 224,
      lastRequested: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  db.getState().merchants = [merchant];
  db.getState().products = products;
  db.getState().customers = customers;
  db.getState().transactions = transactions;
  db.getState().insights = insights;
  db.getState().offers = offers;
  db.getState().lostSales = lostSales;

  await db.save();
  console.log(`[Seed] Seeded 1 Merchant, ${products.length} Products, ${customers.length} Customers, ${transactions.length} Transactions, ${insights.length} Insights.`);
}

// Allow direct execution: tsx src/scripts/seed.ts
if (process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
