# Paytm Commerce Intelligence (Paytm Vyapar AI) — System Flows & Architecture

This document outlines the complete architectural, transactional, and AI flows of the **Paytm Commerce Intelligence** platform using Mermaid diagrams.

---

## 1. High-Level System Architecture & Component Interactions

This diagram illustrates how the Merchant Soundbox Device, Backend API, AI Services, Storage, and Merchant Dashboard interact in real-time.

```mermaid
graph TB
    %% Styling Definitions
    classDef client fill:#E0F2FE,stroke:#0284C7,stroke-width:2px,color:#0369A1;
    classDef backend fill:#F1F5F9,stroke:#475569,stroke-width:2px,color:#1E293B;
    classDef ai fill:#FEF3C7,stroke:#D97706,stroke-width:2px,color:#92400E;
    classDef engine fill:#F3E8FF,stroke:#9333EA,stroke-width:2px,color:#6B21A8;
    classDef storage fill:#DCFCE7,stroke:#16A34A,stroke-width:2px,color:#15803D;

    subgraph Frontends ["🖥️ Frontend Ecosystem (React + Vite)"]
        Soundbox["📱 Soundbox Device Simulator\n(/device)\n• QR Acceptance\n• Voice Audio Capture\n• Web Speech STT/TTS\n• Voice Copilot Mode"]:::client
        Dashboard["📊 Merchant Analytics Dashboard\n(/dashboard)\n• Daily KPIs & Growth\n• Inventory Runway\n• Customer RFM & Reactivation\n• Proactive AI Insights\n• Streaming Ask AI Copilot"]:::client
    end

    subgraph Backend ["⚙️ Backend Server (Express + TypeScript - Port 5000)"]
        Router["🌐 API Router (/api)\n• /sessions\n• /payments\n• /copilot\n• /analytics\n• /demo"]:::backend
        SocketHub["📡 Socket.IO Real-Time Hub\n(session:reconciled, payment:received, etc.)"]:::backend
        
        subgraph AILayer ["🤖 AI & Speech Intelligence Layer"]
            STT["🎙️ Sarvam STT Client\n(saaras:v3, saaras:v4, saarika)"]:::ai
            Extractor["📝 Transaction Extractor\n(Sarvam LLM / Heuristic Engine)"]:::ai
            CopilotEngine["🧠 AI Business Copilot\n(Intent Classifier + Grounded LLM)"]:::ai
        end

        subgraph ContextCore ["⚡ Context & Commerce Engines"]
            Resolver["🔍 Product Entity Resolver\n(Fuzzy Aliases & Token Matcher)"]:::engine
            Reconciler["⚖️ Deterministic Reconciler\n(Confidence Scoring: 0-100%)"]:::engine
            Analytics["📈 Analytics Engine\n(Revenue, Combos, Peak Hours)"]:::engine
            Forecasting["📦 Inventory Forecasting\n(Runway Days, Stockout Risks)"]:::engine
            CustomerEngine["👥 Customer & Lost Sales Engine\n(RFM Segments, Demand Signals)"]:::engine
            Simulator["💳 Payment & Scenario Simulator\n(Simulated UPI QR Payments)"]:::engine
        end

        subgraph StorageLayer ["💾 Persistent Data Layer"]
            DB[("🗄️ Atomic JSON Store\n(store.json / MongoDB)\n• Products & Catalog\n• Transactions\n• Customers & RFM\n• Sessions & Payments\n• Offers & Lost Sales")]:::storage
        end
    end

    %% Interactions
    Soundbox -->|"1. Audio Stream / Voice Text"| Router
    Soundbox -->|"2. Simulate QR Payment"| Router
    Dashboard -->|"Fetch Analytics & Ask Copilot"| Router

    Router --> STT
    Router --> Extractor
    Router --> CopilotEngine
    Router --> Analytics
    Router --> Simulator

    STT --> Extractor
    Extractor --> Resolver
    Resolver --> Reconciler
    Simulator --> Reconciler

    Reconciler --> DB
    Reconciler -->|"Emit session:reconciled"| SocketHub
    Simulator -->|"Emit payment:received"| SocketHub

    Analytics --> DB
    Forecasting --> DB
    CustomerEngine --> DB

    CopilotEngine --> Analytics
    CopilotEngine --> Forecasting
    CopilotEngine --> CustomerEngine

    SocketHub -.->|"Real-time WebSocket Push"| Soundbox
    SocketHub -.->|"Real-time WebSocket Push"| Dashboard
```

---

## 2. End-to-End Transaction & Audio Reconciliation Flow

This sequence diagram depicts what happens when a customer orders at the counter, how the audio is processed, matched with the payment, and broadcast to the dashboard.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as 👤 Customer
    actor Merchant as 👨‍💼 Shopkeeper (Rajesh)
    participant Soundbox as 📱 Soundbox Device
    participant API as 🌐 Express API Server
    participant Sarvam as 🎙️ Sarvam AI (STT & LLM)
    participant Engine as ⚙️ Context & Reconciler
    participant DB as 💾 Database (store.json)
    participant Sockets as 📡 Socket.IO Hub
    participant Dashboard as 📊 Merchant Dashboard

    Note over Customer, Merchant: Customer: "Bhaiya 2 Maggi aur ek Coke dena"<br/>Merchant: "Assi rupaye (₹80)"

    Merchant->>Soundbox: Tap "Start Transaction" (or Scenario)
    Soundbox->>API: POST /api/sessions/start
    API->>DB: Create Session (status: LISTENING)
    API-->>Soundbox: Return Session ID (e.g., SESSION-101)

    Note over Soundbox: Audio is captured via Mic or Demo Scenario
    Merchant->>Soundbox: Tap "Stop & Process"
    Soundbox->>API: POST /api/sessions/:id/audio (multipart/form-data)
    
    API->>Sockets: Emit 'session:processing'
    Sockets-->>Dashboard: Show processing state
    
    API->>Sarvam: Send Audio to Speech-to-Text API
    Sarvam-->>API: Transcript: "Bhaiya 2 Maggi aur ek Coke dena..."

    API->>Sarvam: Send Transcript to Transaction Extractor (LLM Prompt)
    Sarvam-->>API: Extracted JSON: { items: [Maggi x2, Coke x1], amount: 80 }
    
    API->>Sockets: Emit 'session:extracted'
    Sockets-->>Soundbox: Update Screen: Items detected!

    Note over Customer, Soundbox: Customer scans Soundbox QR & pays ₹80
    Soundbox->>API: POST /api/payments/simulate { amount: 80, sessionId: 'SESSION-101' }
    API->>Sockets: Emit 'payment:received'

    API->>Engine: Reconcile Session (Audio Items vs Payment Event)
    Engine->>Engine: Product Catalog Lookup & Fuzzy Price Match
    Engine->>Engine: Calculate Confidence Score (e.g. 97%)
    
    alt Confidence >= 80% & Exact Amount Match
        Engine->>DB: Save Final Transaction, Deduct Inventory Stock
        API->>Sockets: Emit 'session:reconciled' (Status: MATCHED)
        Sockets-->>Soundbox: 🟢 Play "₹80 received for 2 Maggi & 1 Coke"
        Sockets-->>Dashboard: 📈 Live Refresh KPIs, Charts & Activity Feed
    else Amount Mismatch or Low Confidence
        API->>Sockets: Emit 'session:reconciled' (Status: CONFIRMATION_REQUIRED)
        Sockets-->>Soundbox: 🟡 Prompt Merchant for 1-Tap Confirmation
    end
```

---

## 3. Product Entity Resolution & Reconciliation Logic

How the system maps spoken informal terms to the inventory catalog and calculates match confidence.

```mermaid
flowchart TD
    Start(["Raw Spoken Transcript"]) --> Extract["Transaction Extractor (LLM / Heuristics)"]
    
    Extract --> ParseItems["Extracted Items:\n• Product Name (e.g. 'Bissleri', 'choklet wala biscoot')\n• Quantity\n• Spoken Price"]
    
    ParseItems --> Resolver{"Product Entity Resolver"}
    
    Resolver -->|1. Exact Name Match| MatchedCatalog["Catalog Item Found (100% Match)"]
    Resolver -->|2. Known Aliases Match| MatchedCatalog
    Resolver -->|3. Substring & Token Overlap| FuzzyMatch["Fuzzy Overlap Match (85-90%)"]
    Resolver -->|4. No Match| Unresolved["Unresolved Item Tag"]

    MatchedCatalog --> PriceCalc["Calculate Expected Basket Total:\nΣ (Catalog Selling Price × Quantity)"]
    FuzzyMatch --> PriceCalc
    Unresolved --> PriceCalc

    PriceCalc --> Compare{"Compare with Received Payment"}
    
    Compare --> ScoreAmount["1. Amount Match Score (0 - 40 pts)"]
    Compare --> ScoreSession["2. Session Time Window (0 - 25 pts)"]
    Compare --> ScoreCatalog["3. Catalog Match Ratio (0 - 20 pts)"]
    Compare --> ScoreExtraction["4. STT Extraction Score (0 - 15 pts)"]

    ScoreAmount & ScoreSession & ScoreCatalog & ScoreExtraction --> TotalConfidence["Total Confidence Score (0 - 100%)"]

    TotalConfidence --> DecisionRule{Confidence >= 80%\nAND Exact Amount?}
    
    DecisionRule -->|Yes| AutoMatch["✅ MATCHED (Auto-Saved to DB & Stock Deducted)"]
    DecisionRule -->|No| FlagConfirm["⚠️ CONFIRMATION_REQUIRED (Flagged to Merchant)"]
```

---

## 4. AI Business Copilot & Intelligence Engine Flow

This diagram illustrates how natural language questions (in Hinglish or English) are answered using strictly grounded business facts.

```mermaid
flowchart LR
    subgraph MerchantInput ["Merchant Query"]
        Q["'Aaj sales kyun giri?'\n'Sabse zyada kya bika?'\n'Kal kya stock karu?'"]
    end

    subgraph GroundingPipeline ["Context Aggregation Pipeline"]
        Classifier["Intent Classifier\n• SALES_SUMMARY\n• SALES_ROOT_CAUSE\n• STOCK_RECOMMENDATION\n• CUSTOMER_CHURN\n• LOST_SALES"]
        
        Engines["Structured Fact Harvesters"]
        E1["Analytics Engine\n(Daily Revenue, Margin, Top Sellers)"]
        E2["Forecasting Engine\n(Stock Runway Days, Stockouts)"]
        E3["Customer Engine\n(RFM Inactive Count, Lost Demand)"]
    end

    subgraph Synthesis ["Grounded AI Synthesis"]
        LLM["Grounded LLM Prompting\n(Sarvam-105B / Gemini / Heuristics)"]
    end

    subgraph OutputModes ["Bilingual & Multi-Modal Output"]
        VoiceOut["🔊 Spoken Voice TTS\n(Concise Hinglish for Soundbox Speaker)"]
        DashOut["💬 Interactive Chat Stream (SSE)\n• Hinglish & English Explanations\n• 1-Click Action Buttons (e.g. 'Reorder Stock', 'Send Offer')"]
    end

    Q --> Classifier
    Classifier --> Engines
    Engines --> E1 & E2 & E3
    E1 & E2 & E3 --> LLM
    LLM --> VoiceOut
    LLM --> DashOut
```

---

## 5. Soundbox Device State Machine

The complete lifecycle of states managed on the Soundbox device simulator.

```mermaid
stateDiagram-v2
    [*] --> IDLE

    IDLE --> RECORDING : Tap "Start Transaction"
    RECORDING --> PROCESSING : Tap "Stop Recording" (or Auto-Stop)
    
    PROCESSING --> EXTRACTED : Products Detected
    PROCESSING --> NO_ITEMS_DETECTED : Casual Chat / Greetings / Silence (0 Items)
    PROCESSING --> LOST_SALE : Out of Stock Item Requested

    NO_ITEMS_DETECTED --> IDLE : Reset / Return to QR
    NO_ITEMS_DETECTED --> RECORDING : Tap "Record New Order"
    LOST_SALE --> IDLE : Logged & Reset
    
    EXTRACTED --> PAYMENT_PENDING : Select Payment Mode / Adjust Items (+/-)
    
    EXTRACTED --> PAYMENT_SUCCESS : Tap "Cash Received" (method: CASH)
    EXTRACTED --> PAYMENT_SUCCESS : Tap "Record to Khata" (method: UDHAR)
    EXTRACTED --> PAYMENT_PENDING : Tap "Paytm QR / Online"

    PAYMENT_PENDING --> PAYMENT_SUCCESS : Customer Scans QR / UPI Payment
    PAYMENT_PENDING --> PAYMENT_SUCCESS : Merchant Accepts Cash at Counter

    PAYMENT_SUCCESS --> RECONCILING : Voice Announcement & Audio TTS
    
    RECONCILING --> MATCHED : Confidence >= 80% & Exact Amount
    RECONCILING --> CONFIRM_REQUIRED : Mismatch in Amount or Low Confidence
    
    CONFIRM_REQUIRED --> MATCHED : Merchant Taps "Confirm & Save Transaction"
    
    MATCHED --> IDLE : Reset / Next Customer

    %% Voice Copilot Sub-Flow
    IDLE --> COPILOT_LISTENING : Tap "Voice Copilot" Mic
    COPILOT_LISTENING --> COPILOT_THINKING : Speech Query Captured
    COPILOT_THINKING --> COPILOT_SPEAKING : Streaming Response from Backend
    COPILOT_SPEAKING --> IDLE : Audio Finished / Close
```

---

## 6. Entity Relationship Diagram (Data Models)

The core data schema maintained in the persistent database:

```mermaid
erDiagram
    MERCHANT ||--o{ PRODUCT : owns
    MERCHANT ||--o{ TRANSACTION_SESSION : opens
    MERCHANT ||--o{ TRANSACTION : records
    MERCHANT ||--o{ CUSTOMER : serves
    MERCHANT ||--o{ OFFER : creates

    MERCHANT {
        string id PK
        string name
        string storeType
        string phone
        string upiId
    }

    PRODUCT {
        string id PK
        string merchantId FK
        string name
        string category
        float costPrice
        float sellingPrice
        int stock
        int reorderLevel
        string[] aliases
    }

    TRANSACTION_SESSION {
        string id PK
        string merchantId FK
        string status
        string transcript
        json extraction
        json payment
        json reconciliation
        datetime startedAt
        datetime completedAt
    }

    TRANSACTION {
        string id PK
        string merchantId FK
        string sessionId FK
        string customerId FK
        float totalAmount
        float totalCost
        float totalProfit
        string paymentMethod
        json items
        datetime timestamp
    }

    CUSTOMER {
        string id PK
        string merchantId FK
        string name
        string phone
        string segment
        float totalSpend
        int visitCount
        datetime lastVisit
        string[] favoriteProducts
    }

    OFFER {
        string id PK
        string merchantId FK
        string title
        string description
        string targetSegment
        string discountType
        float discountValue
        float minOrderValue
        string status
    }
```

---

*Feel free to review, edit, or ask for adjustments to any part of this flow!*
