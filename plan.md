# Paytm Commerce Intelligence — Laptop-Only Hackathon Build Plan

## 0. Goal

Build the complete hackathon prototype using **only one laptop**.

For the **stage/judge demo**, we will use **pre-recorded transaction conversations** rather than asking a customer or merchant to act live.

Primary demo flow:

```text
Pre-recorded Conversation
        ↓
Upload Audio
        ↓
Speech-to-Text
        ↓
Transaction Extraction
        ↓
Demo Payment Event
        ↓
Reconciliation
        ↓
Commerce Intelligence
        ↓
Merchant Analytics
        ↓
AI Recommendation
```

No Raspberry Pi.
No ESP32.
No physical microphone.
No physical speaker.
No real Paytm hardware.
No real payment integration.
No external mobile device.

Everything runs on the laptop:

```text
Laptop
│
├── Merchant Device Web App
│   ├── Simulated QR Code
│   ├── Pre-recorded audio upload
│   ├── Optional browser microphone for development
│   ├── Laptop speakers
│   ├── Demo payment event
│   ├── Transaction status
│   └── Voice interaction
│
├── Merchant Analytics Web App
│   ├── Dashboard
│   ├── AI Insights
│   ├── Products
│   ├── Inventory
│   ├── Customers
│   ├── Offers
│   └── AI Copilot
│
└── Backend
    ├── Audio processing
    ├── Sarvam STT
    ├── Transaction extraction
    ├── Payment simulator
    ├── Transaction reconciliation
    ├── Analytics
    ├── Forecasting
    ├── Recommendations
    └── AI Copilot
```

The final demo should feel as though the laptop contains a complete merchant payment device plus a merchant business platform.

---

# 1. Product Name

Working name:

# Paytm Commerce Intelligence

Alternative:

# Paytm Vyapar AI

Tagline:

> **Every payment tells you how much. Every conversation tells you what. We connect both.**

Core product statement:

> A transaction-aware AI platform that combines contextual merchant-counter conversation with payment events to automatically understand what was sold, build product-level commerce data, and turn it into business insights, forecasts, recommendations, and actions.

---

# 2. Critical Product Positioning

Do NOT pitch this as:

> "We built an AI Soundbox."

Paytm already has AI Soundbox capabilities.

Instead pitch:

> **We are building a transaction-aware commerce intelligence layer that connects what was said at the counter with what was paid.**

The important innovation is:

```text
Conversation
      +
Payment Event
      ↓
Transaction Context Engine
      ↓
Product + Quantity + Price
      ↓
Reconciliation + Confidence
      ↓
Structured Commerce Data
      ↓
AI Analytics
      ↓
Forecasting
      ↓
Recommendations
      ↓
Merchant Actions
```

---

# 3. Laptop-Only Product Architecture

The entire system runs locally/deployed from the laptop.

```text
                         LAPTOP
                           │
          ┌────────────────┴─────────────────┐
          │                                  │
          ▼                                  ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│  DEVICE WEB APP         │      │  MERCHANT WEB APP       │
│                         │      │                         │
│  QR Code                │      │  Dashboard              │
│  Microphone             │      │  AI Insights            │
│  Speaker                │      │  Products               │
│  Payment Simulator      │      │  Inventory              │
│  Device Status          │      │  Customers               │
│  Voice Interaction      │      │  Offers                  │
└────────────┬────────────┘      │  Ask AI                 │
             │                   └────────────┬────────────┘
             │                                │
             └───────────────┬────────────────┘
                             ▼
                  ┌─────────────────────────┐
                  │       BACKEND API       │
                  │                         │
                  │ Node.js + Express       │
                  │                         │
                  │ Audio Processing        │
                  │ Payment Simulation      │
                  │ Transaction Extraction  │
                  │ Reconciliation          │
                  │ Analytics               │
                  │ Forecasting             │
                  │ Recommendations         │
                  │ AI Copilot              │
                  └────────────┬────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
             MongoDB / SQLite       AI APIs
                                   Sarvam + LLM
```

---

# 4. Two Frontend Applications

We should build two separate web applications inside one monorepo.

## App A — Merchant Device

Purpose:

Simulate the Paytm-like merchant device entirely on the laptop.

Route/domain:

```text
http://localhost:5173
```

or:

```text
http://localhost:5173/device
```

This application should be designed to run fullscreen.

It should visually resemble a compact merchant device.

---

## App B — Merchant Analytics

Purpose:

The actual business intelligence dashboard.

Route/domain:

```text
http://localhost:5174
```

This can be opened in another browser tab/window.

During the demo:

```text
Window 1:
Merchant Device

Window 2:
Merchant Analytics
```

This makes the product feel like a real hardware + software ecosystem while requiring zero physical hardware.

---

# 5. Merchant Device Web App

## Screen Layout

The device should look like a physical product.

```text
┌─────────────────────────────────────┐
│                                     │
│          PAYTM VYAPAR AI            │
│                                     │
│        ┌───────────────────┐        │
│        │                   │        │
│        │      QR CODE      │        │
│        │                   │        │
│        └───────────────────┘        │
│                                     │
│        READY FOR PAYMENT            │
│                                     │
│              🎤                     │
│         Tap to Speak                │
│                                     │
│     ● Connected                     │
└─────────────────────────────────────┘
```

The QR should be a real generated QR code, but it does not need to process a real payment.

The QR payload can simply contain:

```text
paytm-demo://merchant/M001
```

or a demo UPI-like payload.

The purpose is visual realism.

---

# 6. Device Microphone

The browser should use:

```javascript
navigator.mediaDevices.getUserMedia({
  audio: true
})
```

The user can click:

```text
START TRANSACTION
```

Then the browser requests microphone access.

Show:

```text
🎤 Listening...
```

The user speaks into the laptop microphone.

Example:

> "Bhaiya do Maggi aur ek Coke dena."

Then click:

```text
STOP
```

The audio blob is sent to the backend.

---

# 7. Device Speaker

Use browser audio APIs.

The device should be able to speak responses.

Preferred implementation:

1. Use browser `SpeechSynthesis` as a reliable demo fallback.
2. Optionally use a TTS API if available.
3. Keep the fallback because internet/API failure must not break the demo.

Example:

Payment arrives.

Device speaks:

> "Payment of eighty rupees received."

UI:

```text
₹80
PAYMENT RECEIVED
```

---

# 8. Payment Simulator

We must NOT depend on real Paytm payment APIs.

Build a payment simulator directly into the device app.

Example:

```text
┌──────────────────────────────┐
│ PAYMENT SIMULATOR             │
│                              │
│ Amount                       │
│ ₹80                          │
│                              │
│ [ SIMULATE PAYMENT ]         │
└──────────────────────────────┘
```

When clicked:

```text
POST /api/payments/simulate
```

Backend creates:

```json
{
  "transactionId": "TXN-1001",
  "merchantId": "M001",
  "amount": 80,
  "status": "SUCCESS",
  "timestamp": "..."
}
```

The device receives the event and announces:

> ₹80 received.

This is explicitly a prototype simulation.

---

# 9. Transaction Session

Every transaction should have a session.

Example:

```text
Session ID:
SESSION-2026-001

Started:
14:32:10

Audio:
captured

Payment:
pending

Status:
WAITING
```

After payment:

```text
Audio:
processed

Payment:
₹80

Extraction:
2 Maggi + 1 Coke

Confidence:
97%

Status:
MATCHED
```

This transaction-session concept is critical because it connects the audio and payment.

---

# 10. Transaction Flow

The complete transaction should work like this:

```text
Merchant presses START TRANSACTION
             ↓
Device creates session
             ↓
Microphone starts
             ↓
Customer/merchant speaks
             ↓
Audio recording
             ↓
Merchant stops recording
             ↓
Audio sent to backend
             ↓
Sarvam STT
             ↓
Transcript
             ↓
LLM extraction
             ↓
Products + quantities
             ↓
Merchant clicks SIMULATE PAYMENT
             ↓
Payment event
             ↓
Reconciliation engine
             ↓
Confidence score
             ↓
Transaction saved
             ↓
Analytics updated
             ↓
Merchant dashboard updates
```

---

# 11. Example Demo Transaction

Audio:

> "Bhaiya 2 Maggi aur ek Coke dena."

Merchant:

> "₹80."

Payment:

```text
₹80
SUCCESS
```

Extracted:

```text
Maggi × 2
Coke × 1
```

Reconciliation:

```text
Expected:
₹80

Received:
₹80

Confidence:
97%

MATCHED
```

Dashboard immediately updates:

```text
Revenue +₹80
Maggi +2
Coke +1
Transactions +1
```

---

# 12. Speech-to-Text

Use Sarvam AI if the hackathon credentials/API are available.

Backend endpoint:

```text
POST /api/audio/transcribe
```

Input:

```text
audio/multipart
```

Output:

```json
{
  "transcript": "Bhaiya 2 Maggi aur ek Coke dena.",
  "language": "hi"
}
```

If Sarvam is unavailable during development:

Create a development fallback:

```text
Demo transcript:
"Bhaiya 2 Maggi aur ek Coke dena."
```

Never make the whole application unusable because of one external API.

---

# 13. Transaction Extraction

Send transcript to the LLM.

Prompt concept:

```text
You are a transaction extraction engine.

Extract only explicitly mentioned products and quantities.

Return valid JSON.

Schema:
{
  "products": [
    {
      "name": string,
      "quantity": number
    }
  ],
  "mentioned_amount": number | null,
  "customer_request": string | null,
  "confidence": number
}

Do not invent products.
If information is ambiguous, lower confidence.
```

Example output:

```json
{
  "products": [
    {
      "name": "Maggi",
      "quantity": 2
    },
    {
      "name": "Coke",
      "quantity": 1
    }
  ],
  "mentioned_amount": null,
  "customer_request": null,
  "confidence": 0.95
}
```

---

# 14. Product Entity Resolution

The merchant has a product catalog.

Example:

```text
Maggi
Coke
Pepsi
Bread
Parle-G
Chips
```

If transcript says:

> "Coca Cola"

Normalize to:

```text
Coke
```

If transcript says:

> "Maggi noodles"

Normalize to:

```text
Maggi
```

Use the merchant's product catalog before creating a new product.

---

# 15. Payment Reconciliation

This is the key intelligence engine.

Input:

```text
Extracted products
+
Product prices
+
Payment amount
+
Transaction timestamp
+
Session ID
```

Example:

```text
Maggi ×2 = ₹30
Coke ×1 = ₹50

Expected:
₹80

Payment:
₹80
```

Confidence:

```text
97%
```

Result:

```text
MATCHED
```

---

# 16. Reconciliation Rules

The reconciliation engine should be deterministic.

Do not ask the LLM to decide the final payment match.

Use:

### Amount match

```text
expectedAmount === paymentAmount
```

### Time proximity

Audio and payment should happen in the same session/window.

### Session match

Same transaction session.

### Product availability

Products must exist in merchant catalog.

### Confidence

Combine:

- STT confidence if available
- extraction confidence
- amount match
- session match
- catalog match

Example:

```text
Amount Match       +40
Session Match      +25
Product Catalog    +20
Extraction         +15
----------------------
Total              100
```

---

# 17. Low-Confidence Handling

If confidence is low:

```text
⚠ Transaction needs confirmation

Detected:
2 Pepsi
1 Coke

Payment:
₹180

Expected:
₹120

[ CONFIRM ] [ EDIT ]
```

The merchant can correct the transaction.

This correction should be saved and can later improve product mappings.

---

# 18. Merchant Analytics App

The second web application is the main product.

Use a professional merchant dashboard.

Sidebar:

```text
Paytm Vyapar AI

🏠 Overview
🧠 AI Insights
📦 Products
📊 Analytics
📦 Inventory
👥 Customers
🎯 Offers
🎤 Ask AI
⚙ Settings
```

---

# 19. Dashboard

Hero section:

```text
Good evening, Rajesh 👋

Here's what happened today.

₹18,420
Today's Revenue
↑ 12%

137
Transactions

₹134
Avg Transaction

23
Returning Customers
```

Then:

```text
AI detected 3 important things
```

Cards:

### 🔥 Opportunity

Coke demand increased 31%.

### ⚠️ Risk

Maggi may run low before weekend.

### 📉 Concern

Bread sales decreased 18%.

---

# 20. AI Insights Page

Each insight should have:

```text
What happened?
Why?
Impact?
What should I do?
```

Example:

```text
SALES DROP DETECTED

Revenue is 18% below your usual Thursday.

WHY?

Returning customers decreased by 26%.

AI RECOMMENDATION

Prepare a weekend offer for inactive customers.

[ PREPARE OFFER ]
```

---

# 21. Product Intelligence Page

Show:

- Top products
- Revenue by product
- Quantity sold
- Growth %
- Product combinations
- Demand trend

Example:

```text
Product     Units     Growth

Coke        43        +31%
Maggi       38        +27%
Pepsi       27        +8%
Bread       14        -18%
```

---

# 22. Inventory Page

Use estimated stock for the demo.

Example:

```text
MAGGI

Estimated Stock
32 units

Daily Demand
17 units

Estimated Remaining
1.9 days

Risk
HIGH

Recommendation:
Order additional stock before weekend.
```

Use a visual stock-risk indicator.

---

# 23. Customer Page

Use demo customer IDs/names rather than exposing sensitive real data.

Segments:

```text
New
Regular
High Value
At Risk
Inactive
```

Example:

```text
23 regular customers
have not purchased recently.
```

AI recommendation:

```text
Create a weekend reactivation offer.
```

---

# 24. Offer Page

Show AI-generated recommendations.

Example:

```text
WEEKEND REACTIVATION

Target:
23 inactive regular customers

Suggested Offer:
₹20 off above ₹200

Reason:
These customers previously purchased
on weekends but have not returned recently.

[ PREPARE OFFER ]
```

The prototype should prepare the action.

Do not claim real campaign execution without a real integration.

---

# 25. Ask AI Page

Make this one visually impressive.

Center:

```text
          🎤

      ASK YOUR BUSINESS

"Just speak naturally"
```

Suggested questions:

```text
Aaj business kaisa raha?
Meri sales kyun giri?
Sabse zyada kya bika?
Kal kya stock karu?
Kaunsa product slow chal raha hai?
Agle weekend kya offer doon?
```

The user can type or speak.

---

# 26. Copilot Backend

Endpoint:

```text
POST /api/copilot/ask
```

Input:

```json
{
  "merchantId": "M001",
  "question": "Meri sales kyun giri?"
}
```

The backend should first determine what data is required.

Example:

```text
Question:
Meri sales kyun giri?

Intent:
SALES_ROOT_CAUSE
```

Then fetch relevant analytics.

Example:

```json
{
  "revenueChange": -18,
  "returningCustomerChange": -26,
  "topNegativeProducts": [
    "Bread"
  ],
  "peakHourChange": -8
}
```

Then send only relevant structured data to the LLM.

The LLM explains the result.

---

# 27. Do Not Let the LLM Become the Database

Important architecture rule:

```text
Database
    ↓
Deterministic analytics
    ↓
Structured facts
    ↓
LLM explanation
```

Not:

```text
Database
    ↓
LLM
    ↓
Hope the answer is correct
```

Revenue, transaction count, product totals, percentages and forecasts should be calculated programmatically.

---

# 28. Analytics Engine

Implement functions:

```text
getDailyRevenue()
getTransactionCount()
getAverageTransactionValue()
getTopProducts()
getProductGrowth()
getPeakHours()
getCustomerSegments()
getInactiveCustomers()
getLostSalesSignals()
getInventoryRisk()
getRevenueTrend()
```

All of these should be deterministic.

---

# 29. Demo Dataset

Pre-populate the database with approximately:

```text
1 merchant
50 products
500–2000 transactions
100 demo customers
30 days of history
```

Do not manually generate everything.

Create a seed script:

```text
npm run seed
```

The data should have intentional patterns:

- Coke is a top seller
- Maggi is growing
- Bread is declining
- Weekend demand is higher
- Some customers are inactive
- Some products experience stock-outs
- Some product combinations occur frequently

This ensures the AI has something meaningful to discover.

---

# 30. Demo Data Should Tell a Story

The dataset should intentionally contain:

### Product trend

```text
Maggi
+27%
```

### Customer issue

```text
Returning customers
-26%
```

### Inventory issue

```text
Maggi
high stock-out risk
```

### Lost sales

```text
Pepsi requested 8 times while unavailable
```

### Opportunity

```text
Maggi + Coke
frequent combination
```

This makes the demo predictable and impressive.

---

# 31. Database

For hackathon simplicity use MongoDB.

Collections:

```text
merchants
products
transactions
customers
transactionSessions
insights
offers
paymentEvents
audioSessions
```

If MongoDB setup becomes a blocker, use SQLite for the local prototype.

The architecture should keep the database layer abstract enough to switch later.

---

# 32. Recommended Tech Stack

## Frontend

```text
React
TypeScript
Vite
Tailwind CSS
shadcn/ui
Recharts
Lucide React
React Router
```

## Device App

Same React stack.

Use:

```text
MediaRecorder API
getUserMedia()
Web Speech / SpeechSynthesis fallback
```

## Backend

```text
Node.js
Express
TypeScript
Multer
Zod
```

## Database

```text
MongoDB
Mongoose
```

## AI

```text
Sarvam AI
LLM API
```

## Optional ML

```text
Python
Pandas
Scikit-learn
```

Do not introduce Python unless required.

---

# 33. Monorepo Structure

Use one repository.

```text
paytm-commerce-intelligence/
│
├── apps/
│   │
│   ├── device/
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── merchant/
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── analytics/
│   │   ├── ai/
│   │   ├── simulator/
│   │   ├── middleware/
│   │   └── server.ts
│   │
│   ├── scripts/
│   │   └── seed.ts
│   │
│   └── package.json
│
├── shared/
│   ├── types/
│   └── constants/
│
├── .env.example
├── package.json
├── README.md
└── docker-compose.yml
```

---

# 34. API Design

## Device APIs

```text
POST /api/sessions/start
POST /api/sessions/:id/audio
POST /api/payments/simulate
GET  /api/sessions/:id
```

## Transaction APIs

```text
GET  /api/transactions
GET  /api/transactions/:id
POST /api/transactions/:id/confirm
PUT  /api/transactions/:id
```

## Analytics APIs

```text
GET /api/analytics/overview
GET /api/analytics/products
GET /api/analytics/revenue
GET /api/analytics/customers
GET /api/analytics/inventory
```

## AI APIs

```text
POST /api/ai/transcribe
POST /api/ai/extract
POST /api/ai/copilot
POST /api/ai/insights
POST /api/ai/recommendations
```

## Offer APIs

```text
GET  /api/offers
POST /api/offers/prepare
PUT  /api/offers/:id
```

---

# 35. Environment Variables

Create:

```text
PORT=5000
MONGODB_URI=
SARVAM_API_KEY=
LLM_API_KEY=
LLM_MODEL=
```

Do not commit secrets.

Provide:

```text
.env.example
```

with empty values.

---

# 36. Authentication

Do NOT build full authentication for the hackathon.

Use:

```text
Demo Merchant
Merchant ID: M001
```

Optional simple login:

```text
merchant@example.com
password
```

The goal is the product experience, not authentication infrastructure.

---

# 37. Error Handling

Every external AI API must have a fallback.

### Sarvam fails

Show:

```text
Demo transcription mode
```

### LLM fails

Use predefined insight responses for the demo.

### MongoDB fails

Optionally use an in-memory demo dataset.

### Internet fails

The app should still demonstrate:

- dashboard
- seed data
- simulated payment
- deterministic analytics
- preloaded AI responses

This is essential for a hackathon.

---

# 38. Stage Demo Mode

The stage demo should be a first-class product mode.

Create:

```text
DEMO MODE
```

with a prepared transaction library.

Example:

```text
PREPARED TRANSACTIONS

01  Maggi + Coke          ₹80
02  Pepsi + Chips         ₹120
03  Bread + Milk          ₹95
04  Multiple products     ₹240
05  Lost-sales request    —
```

Each prepared transaction should have:

- Pre-recorded audio
- Expected transcript
- Expected products
- Demo payment amount where applicable
- Expected reconciliation result

The presenter selects one and clicks:

```text
[ UPLOAD & ANALYZE ]
```

The system performs the complete pipeline.

Controls:

```text
[ Simulate Payment ]
[ Show Transcript ]
[ Show AI Extraction ]
[ Show Reconciliation ]
[ Open Merchant Dashboard ]
[ Reset Demo ]
```

Also provide:

```text
[ RUN FULL DEMO ]
```

The prepared recordings are the source of truth for the stage demonstration.

This guarantees a predictable presentation even if:

- the room is noisy
- the judge does not want to participate
- microphone permissions fail
- network conditions are poor
- speech recognition behaves unexpectedly

# 39. One-Click Demo Scenario

Create a button:

```text
RUN FULL DEMO
```

It should automatically execute:

```text
1. Start transaction
2. Show audio capture
3. Use demo transcript
4. Extract 2 Maggi + 1 Coke
5. Simulate ₹80 payment
6. Reconcile
7. Add transaction
8. Update dashboard
9. Trigger insight
10. Show inventory recommendation
```

This can be used if the live microphone/API demo fails.

---

# 40. Visual Design

The UI should feel like a real fintech product.

Use:

- Clean white/light background
- Paytm-inspired blue accents without pretending to be an official Paytm product
- Large typography
- Rounded cards
- Clear financial numbers
- Simple charts
- Minimal clutter
- Strong status indicators
- Mobile-responsive dashboard even though the main demo is on laptop

The device UI should look physically believable.

---

# 41. Device UI States

Implement these states:

```text
IDLE

READY FOR PAYMENT

LISTENING

PROCESSING

PAYMENT RECEIVED

ANALYZING

MATCHED

CONFIRMATION REQUIRED

ERROR
```

Example:

```text
LISTENING

🎤
Listening to transaction...

"2 Maggi aur ek Coke"
```

Then:

```text
PAYMENT RECEIVED

₹80

✓ Payment successful
```

Then:

```text
TRANSACTION UNDERSTOOD

2 × Maggi
1 × Coke

Confidence 97%

✓ Matched
```

---

# 42. Merchant App Real-Time Updates

When a transaction is completed on the Device App, the Analytics App should update automatically.

Preferred:

```text
WebSocket / Socket.IO
```

If time is limited:

```text
Polling every 2–3 seconds
```

For hackathon simplicity, Socket.IO is recommended but polling is acceptable.

---

# 43. Recommended Build Order

Do not build everything simultaneously.

## Phase 1 — Skeleton

Build:

```text
Device frontend
Merchant frontend
Backend
MongoDB
```

Make sure all three communicate.

---

## Phase 2 — Seed Data

Create:

```text
merchant
products
customers
transactions
```

Then build dashboard from real database queries.

---

## Phase 3 — Payment Simulator

Make:

```text
SIMULATE PAYMENT
```

create a transaction event.

---

## Phase 4 — Audio

Implement:

```text
Start recording
Stop recording
Upload audio
```

---

## Phase 5 — Sarvam

Implement:

```text
Audio
 ↓
Sarvam
 ↓
Transcript
```

---

## Phase 6 — Extraction

Implement:

```text
Transcript
 ↓
LLM
 ↓
Products + quantities
```

---

## Phase 7 — Reconciliation

Implement:

```text
Products
+
Payment
 ↓
Confidence
 ↓
Transaction
```

---

## Phase 8 — Analytics

Build:

- revenue
- transactions
- products
- trends

---

## Phase 9 — AI Insights

Build:

- sales explanation
- inventory recommendation
- customer insight

---

## Phase 10 — Copilot

Add:

```text
Ask AI
```

---

## Phase 11 — Polish

Add:

- animations
- loading states
- device transitions
- sound
- charts
- confidence visualization
- demo mode

---

# 44. Time Allocation

For a one-day hackathon:

## Hour 0–1

Architecture + repo + frontend skeleton.

## Hour 1–2

Database + seed data.

## Hour 2–3

Dashboard + analytics.

## Hour 3–4

Device UI + QR + payment simulator.

## Hour 4–5

Microphone + Sarvam STT.

## Hour 5–6

Extraction + reconciliation.

## Hour 6–7

AI insights + Ask AI.

## Hour 7–8

Integration + demo mode + polishing.

If something goes wrong, prioritize:

```text
Dashboard
+
Device
+
Payment simulation
+
Transaction extraction
+
AI insight
```

before advanced features.

---

# 45. Definition of Done

The project is considered MVP-complete when this exact flow works:

```text
OPEN DEVICE APP
       ↓
SHOW QR
       ↓
START TRANSACTION
       ↓
SPEAK:
"2 Maggi aur ek Coke"
       ↓
STOP
       ↓
TRANSCRIPT
       ↓
EXTRACT:
2 Maggi
1 Coke
       ↓
SIMULATE ₹80 PAYMENT
       ↓
RECONCILE
       ↓
97% CONFIDENCE
       ↓
TRANSACTION SAVED
       ↓
MERCHANT DASHBOARD UPDATES
       ↓
AI INSIGHT APPEARS
       ↓
MERCHANT ASKS:
"Kal kya stock karu?"
       ↓
AI RECOMMENDS:
Increase Maggi inventory
```

If this works flawlessly, the hackathon project is already strong.

---

# 46. Stretch Features

Only build these after MVP works.

## Stretch 1

Voice AI response.

## Stretch 2

Regional-language responses.

## Stretch 3

Lost-sales detection.

## Stretch 4

Product bundle detection.

## Stretch 5

Customer reactivation.

## Stretch 6

Offer preparation.

## Stretch 7

Demand forecasting.

## Stretch 8

Animated device simulation.

---

# 47. Security Rules

Never expose:

```text
SARVAM_API_KEY
LLM_API_KEY
MONGODB_URI
```

to frontend.

All API keys stay in backend environment variables.

Frontend communicates only with backend.

---

# 48. Production Architecture Later

The hackathon architecture should be easy to extend.

```text
Hackathon:

Browser Device
     ↓
Backend
     ↓
MongoDB
     ↓
AI APIs
```

Production:

```text
Physical Merchant Device
          ↓
Secure Device Gateway
          ↓
Event Streaming
          ↓
Transaction Context Engine
          ↓
Commerce Intelligence Platform
          ↓
Merchant App
```

The laptop implementation is therefore a **functional simulation of the production architecture**, not throwaway code.

---

# 49. Judge Narrative

The demo should start with the problem.

Say:

> "A digital payment tells a merchant that ₹80 was received. But it doesn't necessarily tell the merchant what was sold."

Then demonstrate:

> "Bhaiya 2 Maggi aur ek Coke."

Payment:

> ₹80 received.

System:

> 2 Maggi + 1 Coke.

Then:

> "Now that we know what actually happened at the counter, we can build intelligence that most small merchants never had."

Show:

- top products
- demand trend
- stock risk
- lost sales
- customer opportunities

Then:

> "And the merchant doesn't need to learn analytics. They can simply ask."

Ask:

> "Kal kya karna chahiye?"

AI answers.

Finish:

> **"We are not building another dashboard. We are turning the payment interaction into an intelligent business operating layer."**

---

# 50. Final Product Architecture

```text
                         ┌──────────────────────────┐
                         │      LAPTOP DEVICE       │
                         │                          │
                         │   QR      🎤     🔊      │
                         │                          │
                         │  Device Web Application  │
                         └────────────┬─────────────┘
                                      │
                            Audio + Payment
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │       BACKEND API        │
                         │                          │
                         │   Transaction Sessions   │
                         │   Payment Simulator      │
                         │   Audio Processing       │
                         └────────────┬─────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
                Sarvam STT       Transaction       Product
                                 Extraction        Catalog
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │ TRANSACTION CONTEXT      │
                         │ ENGINE                   │
                         │                          │
                         │ Matching                 │
                         │ Reconciliation           │
                         │ Confidence               │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │     COMMERCE DATABASE    │
                         └────────────┬─────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
        Analytics Engine       Forecasting Engine       Customer Engine
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      ▼
                         ┌──────────────────────────┐
                         │     AI BUSINESS         │
                         │       COPILOT            │
                         └────────────┬─────────────┘
                                      │
                         Insights / Recommendations
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │ MERCHANT ANALYTICS APP  │
                         │                          │
                         │ Overview                 │
                         │ AI Insights              │
                         │ Products                 │
                         │ Inventory                │
                         │ Customers                │
                         │ Offers                   │
                         │ Ask AI                   │
                         └──────────────────────────┘
```

---

# 51. Final AI Coding Instruction

When giving this `plan.md` to an AI coding agent, instruct it to follow these principles:

1. Build the MVP end-to-end before adding advanced features.
2. Keep the entire system runnable on one laptop.
3. Do not require physical hardware.
4. Use browser microphone and speakers.
5. Use a generated QR code.
6. Use a payment simulator instead of real payment APIs.
7. Keep all AI API keys on the backend.
8. Provide mock/fallback modes for every external AI service.
9. Seed realistic deterministic demo data.
10. Make the demo reproducible with one-click "Run Full Demo".
11. Never fabricate real Paytm API integration.
12. Clearly label simulated payment events as demo events.
13. Keep deterministic calculations outside the LLM.
14. Use the LLM for extraction, reasoning and natural-language explanations.
15. Add confidence scores to AI-extracted transactions.
16. Never invent products or transactions when confidence is low.
17. Make the device and merchant dashboard visually polished.
18. Prioritize reliability over feature count.
19. Keep the code modular enough to replace simulation with real integrations later.
20. Make the final demo work even if an external AI API is temporarily unavailable.

---

# 52. Final Build Target

The final laptop should be capable of running:

```bash
npm run dev
```

and starting:

```text
Device App:
http://localhost:5173

Merchant App:
http://localhost:5174

Backend:
http://localhost:5000
```

The judge should be able to watch:

```text
PREPARED AUDIO
      ↓
UPLOAD
      ↓
SPEECH-TO-TEXT
      ↓
AI TRANSACTION EXTRACTION
      ↓
DEMO PAYMENT EVENT
      ↓
RECONCILIATION
      ↓
STRUCTURED TRANSACTION
      ↓
MERCHANT ANALYTICS
      ↓
AI INSIGHT
      ↓
RECOMMENDATION
      ↓
ACTION
```

Everything happens on the laptop.

No additional physical device is required.


---

# 52. Mandatory Stage Demo Requirements

The **primary demo path must be upload-based**.

Do not design the main presentation around live acting, live microphone input, or real payments.

## Required stage flow

```text
Device App
   ↓
Choose Prepared Recording
   ↓
Upload & Analyze
   ↓
Show Transcript
   ↓
Show Extracted Products
   ↓
Create/Select Demo Payment
   ↓
Reconcile
   ↓
Show Confidence
   ↓
Save Transaction
   ↓
Open Merchant Analytics
   ↓
Show Updated KPIs
   ↓
Ask AI
   ↓
Show Recommendation
```

## Prepared recordings

Before the hackathon, create at least five short recordings:

### Recording 1 — Successful match

> "Bhaiya 2 Maggi aur ek Coke dena. ₹80."

Expected:
```text
2 × Maggi
1 × Coke
Payment ₹80
High confidence
```

### Recording 2 — Multiple products

> "Ek Pepsi, do chips aur ek chocolate dena. ₹120."

Expected:
```text
1 × Pepsi
2 × Chips
1 × Chocolate
Payment ₹120
```

### Recording 3 — Reconciliation failure

Create a recording whose expected amount differs from the demo payment.

Expected:
```text
⚠ Confirmation required
```

This demonstrates that the system does not blindly trust AI extraction.

### Recording 4 — Lost-sales signal

> "Pepsi hai?"

> "Nahi, Pepsi khatam ho gayi."

This should contribute to the lost-sales intelligence.

### Recording 5 — Hindi/Hinglish interaction

Use natural Indian-language conversation to demonstrate the India-first experience.

## Reliability requirements

1. Never require a judge to act as the customer.
2. Never require a live merchant role-play.
3. Never require a live microphone.
4. Never require a real payment.
5. Never require a real Paytm API.
6. Keep prepared recordings locally available.
7. Keep expected transcripts as a fallback.
8. Keep deterministic demo payment events.
9. Keep seeded analytics data.
10. Provide one-click demo mode.
11. Provide fallback responses if external AI APIs fail.
12. Reset demo state before every presentation.

The goal is:

> **The judge should see AI understanding a realistic merchant transaction, not watch us troubleshoot a microphone.**

---

# 53. Final Judge Story

Start with:

> "A digital payment tells a merchant that ₹80 was received. But it doesn't necessarily tell the merchant what was sold."

Then select a prepared recording.

Show:

```text
Customer:
"2 Maggi aur ek Coke dena."

Merchant:
"₹80."
```

Upload it.

The system shows:

```text
2 × Maggi
1 × Coke
```

Then:

```text
Demo Payment
₹80 RECEIVED
```

Then:

```text
Expected: ₹80
Received: ₹80
Confidence: 97%
✓ MATCHED
```

Open the merchant analytics app.

The transaction appears immediately.

Then ask:

> "Aaj business kaisa raha?"

Then:

> "Kal kya stock karu?"

Then:

> "Koi opportunity hai?"

Finish with:

> **"We don't just record the payment. We understand the commerce behind it."**
