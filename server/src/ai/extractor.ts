import { ExtractionResult, ExtractedProduct } from '../types/index.js';
import { llmClient } from './llm.js';

const SYSTEM_PROMPT = `You are a precision transaction extraction engine for India's small kirana and retail stores.
Your task is to analyze conversational speech transcripts between customers and shopkeepers (in Hindi, Hinglish, or English) and extract structured transaction details.

Critical real-world scenarios you MUST handle:
1. MULTI-CUSTOMER: If the audio contains multiple customers speaking in sequence or interrupting each other
   (signals: "pehle iska", "phir mera", "ek second", "bhaiya mera bhi", "aur mujhe", "main bhi"),
   merge ALL items from ALL customers into one combined products list (it all goes on one counter/payment session).
   Set multiCustomer: true.
2. ORDER CHANGE: If a customer changes their mind ("nahi, ek zyada", "actually do chahiye", "ek wapas karo"),
   reflect the FINAL requested quantities only. Set orderAmended: true.
3. CREDIT / UDHAR: If customer asks to put on credit ("udhar kar do", "kal deta hoon", "credit"),
   set isUdhar: true. Still extract products.
4. PRICE NEGOTIATION: Ignore haggling/negotiation. Extract final agreed/asked price only.
5. Hindi numbers: "ek"=1, "do"=2, "teen"=3, "char"=4, "paanch"=5, "chhe"=6, "aadha"=0.5, "dedh"=1.5.
6. Mixed language: handle English product names said in Hindi accent ("biscoot"=biscuit, "choklet"=chocolate, "wafar"=wafer).
7. Detect if a product was requested but unavailable (Lost Sale): set isLostSale: true, lostSaleProduct to item name.

Output strictly valid JSON:
{
  "products": [
    { "name": "Maggi", "quantity": 2, "unitPrice": 15, "confidence": 0.95 }
  ],
  "mentionedAmount": 80,
  "customerRequest": "2 Maggi and 1 Coke",
  "isLostSale": false,
  "lostSaleProduct": null,
  "multiCustomer": false,
  "orderAmended": false,
  "isUdhar": false,
  "confidence": 0.95
}`;

export class TransactionExtractor {
  public async extract(transcript: string, language: string = 'hi'): Promise<ExtractionResult> {
    if (!transcript || transcript.trim().length === 0) {
      return {
        transcript: '',
        language,
        products: [],
        mentionedAmount: null,
        customerRequest: null,
        isLostSale: false,
        confidence: 0,
      };
    }

    try {
      const prompt = `Transcript: "${transcript}"\nExtract products and payment info into JSON:`;
      const llmOutput = await llmClient.generateText(prompt, {
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.1,
        responseFormatJson: true,
      });

      if (llmOutput && llmOutput.trim().length > 0) {
        const parsed = JSON.parse(llmOutput);
        return {
          transcript,
          language,
          products: (parsed.products || []).map((p: any) => ({
            name: p.name,
            quantity: Number(p.quantity) || 1,
            unitPrice: p.unitPrice ? Number(p.unitPrice) : undefined,
            confidence: Number(p.confidence) || 0.9,
          })),
          mentionedAmount: parsed.mentionedAmount ? Number(parsed.mentionedAmount) : null,
          customerRequest: parsed.customerRequest || null,
          isLostSale: Boolean(parsed.isLostSale),
          lostSaleProduct: parsed.lostSaleProduct || undefined,
          multiCustomer: Boolean(parsed.multiCustomer),
          orderAmended: Boolean(parsed.orderAmended),
          isUdhar: Boolean(parsed.isUdhar),
          confidence: Number(parsed.confidence) || 0.9,
          rawResponse: parsed,
        };
      }

    } catch (err) {
      console.warn('LLM extraction failed or returned invalid JSON. Using heuristic extractor:', err);
    }

    // Heuristic Fallback Extractor
    return this.heuristicExtract(transcript, language);
  }

  private heuristicExtract(transcript: string, language: string): ExtractionResult {
    const text = transcript.toLowerCase();
    const products: ExtractedProduct[] = [];
    let isLostSale = false;
    let lostSaleProduct: string | undefined;

    // Check for lost sales keywords
    if (
      text.includes('nahi hai') ||
      text.includes('khatam') ||
      text.includes('nahi mila') ||
      text.includes('out of stock')
    ) {
      isLostSale = true;
      if (text.includes('pepsi')) lostSaleProduct = 'Pepsi';
      else if (text.includes('maggi')) lostSaleProduct = 'Maggi';
      else if (text.includes('coke')) lostSaleProduct = 'Coke';
      else if (text.includes('bread')) lostSaleProduct = 'Bread';
    }

    // Hindi/English numeral maps
    const parseQty = (prefix: string): number => {
      const p = prefix.toLowerCase().trim();
      if (p.includes('1') || p.includes('ek') || p.includes('one') || p.includes('single')) return 1;
      if (p.includes('2') || p.includes('do') || p.includes('two') || p.includes('double')) return 2;
      if (p.includes('3') || p.includes('teen') || p.includes('three')) return 3;
      if (p.includes('4') || p.includes('char') || p.includes('chaar') || p.includes('four')) return 4;
      if (p.includes('5') || p.includes('paanch') || p.includes('five')) return 5;
      return 1;
    };

    // Rule-based item detection
    if (text.includes('maggi')) {
      const match = text.match(/(?:(\d+|ek|do|teen|char|chaar|paanch)\s*(?:packet|piece|pc)?\s*)?maggi/i);
      const qty = match && match[1] ? parseQty(match[1]) : 2;
      products.push({ name: 'Maggi', quantity: qty, confidence: 0.95 });
    }

    if (text.includes('coke') || text.includes('coca cola')) {
      const match = text.match(/(?:(\d+|ek|do|teen|char|chaar|paanch)\s*(?:bottle|can)?\s*)?(?:coke|coca cola)/i);
      const qty = match && match[1] ? parseQty(match[1]) : 1;
      products.push({ name: 'Coke', quantity: qty, confidence: 0.95 });
    }

    if (text.includes('pepsi') && !isLostSale) {
      const match = text.match(/(?:(\d+|ek|do|teen|char|chaar|paanch)\s*(?:bottle)?\s*)?pepsi/i);
      const qty = match && match[1] ? parseQty(match[1]) : 1;
      products.push({ name: 'Pepsi', quantity: qty, confidence: 0.95 });
    }

    if (text.includes('chips') || text.includes('lays')) {
      const match = text.match(/(?:(\d+|ek|do|teen|char|chaar|paanch)\s*(?:packet)?\s*)?(?:chips|lays)/i);
      const qty = match && match[1] ? parseQty(match[1]) : 2;
      products.push({ name: 'Chips', quantity: qty, confidence: 0.92 });
    }

    if (text.includes('chocolate') || text.includes('dairy milk')) {
      const match = text.match(/(?:(\d+|ek|do|teen|char|chaar|paanch)\s*)?(?:chocolate|dairy milk)/i);
      const qty = match && match[1] ? parseQty(match[1]) : 1;
      products.push({ name: 'Dairy Milk', quantity: qty, confidence: 0.92 });
    }

    if (text.includes('bread')) {
      const match = text.match(/(?:(\d+|ek|do|teen|char|chaar|paanch)\s*(?:packet)?\s*)?bread/i);
      const qty = match && match[1] ? parseQty(match[1]) : 1;
      products.push({ name: 'Bread', quantity: qty, confidence: 0.94 });
    }

    if (text.includes('doodh') || text.includes('milk') || text.includes('amul')) {
      const match = text.match(/(?:(\d+|ek|do|teen|char|chaar|paanch)\s*(?:packet|litre)?\s*)?(?:doodh|milk|amul)/i);
      const qty = match && match[1] ? parseQty(match[1]) : 1;
      products.push({ name: 'Amul Milk', quantity: qty, confidence: 0.94 });
    }

    // Mentioned Amount parsing
    let mentionedAmount: number | null = null;
    const amountMatch = text.match(/(?:₹|rs\.?|rupees|rupaye|rupayee?|assi|sau|ek sau|dedh sau)?\s*(\d{2,4})/i);
    if (amountMatch && amountMatch[1]) {
      mentionedAmount = parseInt(amountMatch[1], 10);
    } else if (text.includes('assi')) {
      mentionedAmount = 80;
    } else if (text.includes('sau')) {
      mentionedAmount = 100;
    }

    return {
      transcript,
      language,
      products,
      mentionedAmount,
      customerRequest: products.map((p) => `${p.quantity} ${p.name}`).join(', '),
      isLostSale,
      lostSaleProduct,
      confidence: products.length > 0 ? 0.92 : 0.4,
    };
  }
}

export const transactionExtractor = new TransactionExtractor();
