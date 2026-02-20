# Khatha Book - Website Blueprint & Flowcharts

## System Overview

**Khatha Book** is a comprehensive business management application for retailers with integrated customer-facing e-commerce features. It combines inventory management, billing, credit tracking (Khatha), and online ordering capabilities.

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Frontend - React Application"
        Landing[Landing Page]
        RetailerApp[Retailer Dashboard]
        CustomerApp[Customer Marketplace]
    end
    
    subgraph "Backend - Spring Boot API"
        API[REST API Layer]
        Auth[Authentication Service]
        BillSvc[Bill Service]
        OrderSvc[Order Service]
        ProductSvc[Product Service]
        NotifSvc[Notification Service]
    end
    
    subgraph "Data Layer"
        DB[(MySQL Database)]
        FileStore[File Storage<br/>Bill Images]
    end
    
    Landing --> RetailerApp
    Landing --> CustomerApp
    RetailerApp --> API
    CustomerApp --> API
    API --> Auth
    API --> BillSvc
    API --> OrderSvc
    API --> ProductSvc
    API --> NotifSvc
    BillSvc --> DB
    OrderSvc --> DB
    ProductSvc --> DB
    NotifSvc -.Email.-> Users[Users]
    BillSvc --> FileStore
    
    style RetailerApp fill:#e3f2fd
    style CustomerApp fill:#f3e5f5
    style DB fill:#fff3e0
```

---

## 👤 User Types & Access

```mermaid
graph LR
    Users[Users] --> Retailer[🏪 Retailer]
    Users --> Customer[🛒 Customer]
    
    Retailer --> RetailerFeatures["Dashboard<br/>Inventory<br/>Billing<br/>Customer Management<br/>Order Management<br/>Reports"]
    
    Customer --> CustomerFeatures["Browse Products<br/>Place Orders<br/>Track Orders<br/>View Bills<br/>Loyalty Points"]
    
    style Retailer fill:#4caf50,color:#fff
    style Customer fill:#2196f3,color:#fff
```

---

## 🔄 Retailer User Flow

```mermaid
flowchart TD
    Start([Retailer Opens App]) --> Login{Already<br/>Logged In?}
    Login -->|No| LoginForm[Enter Email/Password]
    LoginForm --> Auth[Authenticate]
    Auth --> Dashboard
    Login -->|Yes| Dashboard[📊 Dashboard]
    
    Dashboard --> Choice{Select Action}
    
    Choice --> Products[📦 Manage Products]
    Choice --> Billing[💳 Billing]
    Choice --> Customers[👥 Customers]
    Choice --> Orders[📋 Orders]
    Choice --> Bills[🧾 All Bills]
    
    Products --> ProdActions{Product Action}
    ProdActions --> AddProd[Add New Product]
    ProdActions --> EditProd[Edit Product]
    ProdActions --> ViewStock[View Stock]
    AddProd --> SaveProd[Save to DB]
    EditProd --> SaveProd
    
    Billing --> SelectCust{Select Customer?}
    SelectCust -->|Yes| CustBill[Customer Bill<br/>Credit/Cash]
    SelectCust -->|No| WalkIn[Walk-in Bill<br/>Cash/UPI]
    CustBill --> AddItems[Add Products]
    WalkIn --> AddItems
    AddItems --> Payment[Select Payment Mode]
    Payment --> CreateBill[Create Bill]
    CreateBill --> ReduceStock[Reduce Stock]
    ReduceStock --> GenReceipt[Generate Receipt]
    
    Customers --> CustActions{Customer Action}
    CustActions --> AddCust[Add Customer]
    CustActions --> ViewCust[View Details]
    CustActions --> ViewLedger[View Ledger]
    
    Orders --> OrderList[View Orders]
    OrderList --> OrderAction{Action}
    OrderAction --> MarkDelivered[Mark as Delivered]
    MarkDelivered --> AutoBill[Auto-create Bill]
    AutoBill --> StockReduce[Reduce Stock]
    StockReduce --> NotifyCustomer[Notify Customer]
    
    Bills --> ViewAllBills[View All Bills]
    ViewAllBills --> BillFilter{Filter}
    BillFilter --> InStore["In-Store Bills<br/>(BILL-xxx)"]
    BillFilter --> Online["Online Orders<br/>(ORD-xxx) 🛒"]
    BillFilter --> WalkInBills["Walk-in Bills"]
    
    style Dashboard fill:#4caf50,color:#fff
    style CreateBill fill:#ff9800,color:#fff
    style AutoBill fill:#2196f3,color:#fff
```

---

## 🛒 Customer User Flow

```mermaid
flowchart TD
    CustStart([Customer Opens App]) --> CustLogin{Logged In?}
    CustLogin -->|No| CustLoginForm[Login with<br/>Email/Password]
    CustLoginForm --> CustAuth[Authenticate]
    CustAuth --> SelectShop
    CustLogin -->|Yes| SelectShop[Select Retailer Shop]
    
    SelectShop --> Marketplace[🏬 Marketplace]
    
    Marketplace --> Browse[Browse Products]
    Browse --> ProductView{View Product}
    ProductView --> AddCart[Add to Cart 🛒]
    
    AddCart --> CartActions{Cart Action}
    CartActions --> ContinueShopping[Continue Shopping]
    CartActions --> Checkout[Proceed to Checkout]
    ContinueShopping --> Browse
    
    Checkout --> PaymentChoice{Payment Mode}
    PaymentChoice --> Online[Online Payment<br/>UPI/Card]
    PaymentChoice --> COD[Cash on Delivery]
    PaymentChoice --> Credit[Khatha Credit]
    
    Online --> PlaceOrder[Place Order]
    COD --> PlaceOrder
    Credit --> PlaceOrder
    
    PlaceOrder --> OrderPending[Order Status:<br/>PENDING]
    OrderPending --> NotifyRetailer[Notify Retailer]
    
    Marketplace --> NavChoice{Navigate To}
    NavChoice --> MyOrders[📦 My Orders]
    NavChoice --> MyProfile[👤 My Profile]
    
    MyOrders --> TrackOrder[Track Order Status]
    TrackOrder --> OrderStatus{Status}
    OrderStatus --> Pending[⏳ Pending]
    OrderStatus --> Delivered[✅ Delivered]
    OrderStatus --> Cancelled[❌ Cancelled]
    
    Delivered --> ViewBill[View Bill]
    ViewBill --> BillDetails[Bill Details<br/>Items, Amount, Payment]
    
    MyProfile --> ProfileActions{Action}
    ProfileActions --> ViewLoyalty[View Loyalty Points]
    ProfileActions --> ViewHistory[View Purchase History]
    ProfileActions --> UpdateProfile[Update Info]
    
    style Marketplace fill:#2196f3,color:#fff
    style PlaceOrder fill:#ff9800,color:#fff
    style Delivered fill:#4caf50,color:#fff
```

---

## 💾 Data Flow & Relationships

```mermaid
erDiagram
    RETAILER ||--o{ PRODUCT : manages
    RETAILER ||--o{ CUSTOMER : has
    RETAILER ||--o{ BILL : creates
    RETAILER ||--o{ ORDER : receives
    
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER ||--o{ BILL : has
    CUSTOMER {
        Long id
        String name
        String phone
        String email
        Double dueAmount
        Double totalReceived
        Int loyaltyPoints
    }
    
    PRODUCT {
        Long id
        String barcode
        String name
        Double price
        Double quantity
        String productType
        String bagSize
    }
    
    ORDER {
        Long id
        String items
        Double totalAmount
        String paymentMode
        String status
        DateTime orderDate
    }
    
    BILL {
        Long id
        String billNumber
        String items
        Double amount
        Double paidAmount
        Double dueAmount
        String status
        String paymentMode
        String type
        DateTime billDate
    }
    
    ORDER ||--|| BILL : generates_on_delivery
    BILL }o--|| CUSTOMER : belongs_to
    BILL }o--|| RETAILER : created_by
```

---

## 🎯 Core Features Module Map

```mermaid
mindmap
  root((Khatha Book))
    Retailer Side
      Dashboard
        Sales Overview
        Today's Revenue
        Stock Alerts
        Customer Stats
      Inventory Management
        Add Products
        Edit Products
        Stock Tracking
        Barcode Scanner
        AI Product Detection
      Billing System
        In-Store Billing
        Walk-in Customers
        Credit Bills Khatha
        Payment Modes
          Cash
          UPI
          Card
          Credit
        Receipt Generation
        Bill Image Upload
      Customer Management
        Add Customers
        Customer Ledger
        Due Amount Tracking
        Loyalty Points
        Contact Sync
      Order Management
        View Orders
        Update Status
        Auto Bill Generation
        Stock Reduction
      Reports
        All Bills List
        Daily Sales
        Monthly Reports
        Export to Excel
    Customer Side
      Marketplace
        Browse Products
        Search Products
        Product Details
        Shopping Cart
      Orders
        Place Orders
        Track Orders
        Order History
        Payment Options
          Online
          COD
          Khatha Credit
      Profile
        View Profile
        Loyalty Points
        Purchase History
        Bill History
    Shared Features
      Authentication
        Email/Password Login
        Session Management
        Role Based Access
      Notifications
        Email Alerts
        Order Updates
        Bill Notifications
      Multi-language
        English
        Hindi
        Telugu
```

---

## 🔐 Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    
    User->>Frontend: Enter Credentials
    Frontend->>API: POST /auth/login
    API->>Database: Validate User
    Database-->>API: User Data
    API-->>Frontend: JWT Token + User Info
    Frontend->>Frontend: Store in SessionStorage
    Frontend-->>User: Redirect to Dashboard
    
    Note over User,Database: Subsequent Requests
    
    User->>Frontend: Access Protected Resource
    Frontend->>API: GET /api/resource<br/>Header: X-Retailer-Id
    API->>API: Validate Retailer ID
    API->>Database: Fetch Data
    Database-->>API: Return Data
    API-->>Frontend: Response
    Frontend-->>User: Display Data
```

---

## 📦 Billing Process Flow

```mermaid
sequenceDiagram
    participant Retailer
    participant UI
    participant BillService
    participant ProductRepo
    participant Database
    participant Customer
    
    Retailer->>UI: Add Products to Cart
    Retailer->>UI: Select Customer (Optional)
    Retailer->>UI: Choose Payment Mode
    Retailer->>UI: Click "Place Order"
    
    alt Walk-in Customer
        UI->>BillService: createPaidBill()
    else Registered Customer
        UI->>BillService: createBill(customerId)
    end
    
    BillService->>BillService: Generate Bill Number
    BillService->>ProductRepo: reduceStockFromBill()
    
    loop For Each Product
        ProductRepo->>Database: Update Stock - Quantity
    end
    
    BillService->>Database: Save Bill
    
    alt Payment Mode = Khatha
        BillService->>Database: Update Customer Due Amount
    else Payment Mode = Cash/UPI
        BillService->>Database: Mark as PAID
    end
    
    Database-->>BillService: Bill Saved
    BillService-->>UI: Bill Generated
    UI-->>Retailer: Show Receipt
    
    opt Email Notification
        BillService->>Customer: Send Bill Email
    end
```

---

## 🛍️ Online Order Process Flow

```mermaid
sequenceDiagram
    participant Customer
    participant CustomerApp
    participant OrderController
    participant Database
    participant Retailer
    participant BillService
    
    Customer->>CustomerApp: Browse Products
    Customer->>CustomerApp: Add to Cart
    Customer->>CustomerApp: Checkout
    Customer->>CustomerApp: Select Payment Mode
    Customer->>OrderController: POST /orders/create
    
    OrderController->>Database: Save Order (Status: PENDING)
    OrderController->>Retailer: Email: New Order Alert
    OrderController-->>Customer: Order Placed Successfully
    
    Note over Customer,Retailer: Order Processing
    
    Retailer->>OrderController: View Orders
    Retailer->>OrderController: Mark as DELIVERED
    
    OrderController->>BillService: reduceStockFromBill()
    BillService->>Database: Update Product Stock
    
    OrderController->>OrderController: Auto-create Bill
    OrderController->>Database: Save Bill (ORD-xxx)
    
    alt Payment = Khatha
        OrderController->>Database: Update Customer Due
    else Payment = Online/COD
        OrderController->>Database: Mark Bill as PAID
    end
    
    OrderController->>Customer: Email: Order Delivered
    OrderController-->>Retailer: Status Updated
    
    Customer->>CustomerApp: View Orders
    CustomerApp-->>Customer: Show Bill Details
```

---

## 📊 Key Application Screens

### Retailer Dashboard
- **Sales Overview**: Today's sales, weekly trends
- **Quick Stats**: Total customers, pending orders, low stock alerts
- **Recent Activity**: Latest bills, orders, customer additions

### Products Module
- **Product List**: Grid/List view with stock levels
- **Add/Edit Product**: Barcode, name, price, quantity, type (Weight/Liquid/Unit)
- **Stock Management**: Real-time stock tracking with alerts
- **AI Scanner**: Camera-based product detection and auto-fill

### Billing Module  
- **Product Selection**: Search or scan barcode
- **Cart**: Quantity adjustment, remove items
- **Customer Selection**: Optional for loyalty/credit
- **Payment**: Cash, UPI, Card, Khatha (Credit)
- **Receipt**: Print or email bill

### Customer Management
- **Customer List**: Search, filter, sort
- **Customer Details**: Contact info, ledger, bills history
- **Ledger**: Credit/debit transactions, payments
- **Loyalty**: Points earned, redeemed

### Order Management (Retailer)
- **Order List**: Filter by status (Pending/Delivered/Cancelled)
- **Order Details**: Items, customer, payment mode
- **Actions**: Mark as delivered, update status
- **Auto-billing**: Bills generated on delivery with stock reduction

### All Bills
- **Bill List**: All transactions (in-store + online)
- **Filters**: Date range, customer, payment mode, status
- **Indicators**: 
  - Walk-in badge for bills without customer
  - 🛒 Online Order badge for bills from orders (ORD-xxx)
- **Export**: Download as Excel/CSV

### Customer Marketplace
- **Product Grid**: Browse retailer's catalog
- **Search/Filter**: Find products quickly
- **Product Card**: Image, price, add to cart
- **Cart**: Review items, proceed to checkout

### Customer Orders
- **Order History**: All past orders
- **Order Status**: Pending, Delivered, Cancelled
- **Track Order**: Real-time status updates
- **View Bill**: Detailed bill for delivered orders

### Customer Profile
- **Personal Info**: Name, email, phone
- **Loyalty Points**: Points balance, earn/redeem history
- **Purchase History**: All bills and orders
- **Due Amount**: Outstanding credit balance

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS (Vanilla CSS with custom properties)
- **Icons**: Lucide React
- **Routing**: React Router
- **State**: React Hooks (useState, useEffect)
- **API Client**: Axios

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 21
- **Database**: MySQL
- **ORM**: JPA/Hibernate
- **Build Tool**: Maven
- **Authentication**: Session-based with headers

### Features
- **Barcode Scanning**: Browser Camera API
- **AI Product Detection**: Image recognition
- **Email Notifications**: Spring Mail
- **File Upload**: Multipart file handling
- **Internationalization**: i18n (React i18next)

---

## 🎨 Design Highlights

- **Responsive**: Mobile-first design, works on all devices
- **Modern UI**: Clean, intuitive interface
- **Dark Mode**: System preference detection
- **Accessibility**: Semantic HTML, keyboard navigation
- **Performance**: Lazy loading, code splitting
- **PWA Ready**: Can be installed as mobile app

---

## 📱 Mobile Features

- **Bottom Navigation**: Easy thumb access on mobile
- **Swipe Actions**: Swipe to delete cart items
- **Touch-optimized**: Large tap targets
- **Scanner**: Camera integration for barcode scanning
- **Responsive Cards**: Adapted layouts for small screens

---

## 🔔 Notification System

- **Email Notifications**:
  - New order alerts to retailer
  - Order status updates to customer
  - Bill generation confirmations
- **Toast Notifications**: In-app success/error messages
- **Real-time Updates**: Automatic data refresh

---

## 🚀 Unique Features

1. **Khatha (Credit) System**: Traditional Indian accounting for credit sales
2. **Loyalty Points**: Earn on purchases, redeem for discounts
3. **Dual Interface**: Separate retailer and customer apps in one platform
4. **Stock Deduction**: Automatic inventory updates on billing
5. **Multi-payment**: Support for Cash, UPI, Card, and Credit
6. **AI Product Scan**: Smart product recognition from images
7. **Order-to-Bill**: Seamless conversion of orders to bills
8. **Walk-in Support**: Quick billing without customer registration
9. **Export Reports**: Excel export for accounting
10. **Multi-language**: Support for regional languages

---

This blueprint provides a comprehensive overview of the Khatha Book application architecture, user flows, and features. The system is designed to bridge traditional retail practices with modern e-commerce capabilities.
