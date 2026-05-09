# Navanika - Classic Heritage: Technical Audit & Blueprint

## 1. Project Overview & History
**Navanika** is a premium, full-stack e-commerce platform dedicated to Indian heritage, specializing in high-end sarees, lehengas, and jewelry. 

### The Journey
The project originated as a high-fidelity design portfolio and evolved into a robust, professional-grade store. The core mission is to provide a seamless, luxury discovery experience for traditional Indian craftsmanship, bridging the gap between centuries-old weaving traditions and modern digital commerce.

---

## 2. Full-Stack Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), Tailwind CSS, Framer Motion, React-device-detect, Lucide Icons |
| **Backend** | Next.js API Routes (Serverless), Node.js |
| **Database** | Firebase (Authentication, Firestore NoSQL, Cloud Storage) |
| **Integrations** | Nodemailer (SMTP Notifications), Razorpay (UPI Intent, Cards, QR), GPay Intent |
| **Performance** | Next.js Image CDN, PWA (Progressive Web App), SEO Optimized |

---

## 3. Site Architecture

### Public Routes
- `/`: Homepage with Hero, Trending Collections, and Artisan features.
- `/category/[category]`: Filtered storefronts for Sarees, Lehengas, Jewelry, etc.
- `/product/[productId]`: Detailed product pages with JSON-LD Schema.
- `/cart`: Real-time shopping bag management.
- `/checkout`: Secure payment and shipping address interface.

### Protected User Routes
- `/profile`: Personal dashboard, profile management, and order history.
- `/order/[orderId]`: Live order tracking, invoice generation, and cancellation/return controls.

### Protected Admin & Moderator Routes
- `/admin`: Unified command center for analytics, order management, and stock control.
- `/admin/inventory`: (Handled via Admin Tabs) Bulk stock updates and product CRUD operations.
- `/admin/orders`: (Handled via Admin Tabs) Order lifecycle management and notification broadcasting.

---

## 4. Core Features & Functions

### Order Lifecycle Management
The platform tracks every order through a detailed state machine:
`Pending` → `Confirmed` → `Processing` → `Shipped` → `Delivered`

### User Controls & Retention
- **Intelligent Cancellation**: Users can request cancellations with specific reasons (e.g., Sizing, Defective).
- **Return & Exchange System**: A 7-day window for post-delivery requests (Return/Refund or Exchange) with automated review notifications.
- **Invoice Generation**: One-click PDF invoice generation using `jsPDF`.

### Admin Operational Tools
- **Moderator Role**: Distinct roles for full 'Admin' vs 'Moderator' access levels.
- **Bulk stock update**: Efficient inventory management across all heritage collections.
- **CSV Export**: Financial reporting tool for sales and order distribution.
- **Broadcast System**: Targeted and site-wide messaging to all users.

### Unified Payment Flow
- **Mobile Experience**: Direct UPI Intent (GPay, PhonePe) integration for one-tap payments.
- **Desktop Experience**: Secure Razorpay QR and Card gateway.

---

## 5. Advanced Implementations (PWA & SEO)

### Progressive Web App (PWA)
- **Manifest**: Branded splash screen, heritage icons, and "Standalone" display mode.
- **Retention**: Installable on iOS/Android for native-like home screen access.

### Search Engine Optimization (SEO)
- **Dynamic Sitemap**: Real-time XML sitemap indexing all products and categories.
- **JSON-LD Schema**: `Schema.org/Product` markup on all detail pages for Google Rich Snippets (Price, Stock, Images).
- **Robots.txt**: Strategic crawling instructions for search engines.

---

## 6. Database Schema (Firestore)

### `Products` Collection
```json
{
  "name": "Silk Kanchipuram Saree",
  "price": 25000,
  "category": "Sarees",
  "description": "...",
  "image": "https://...",
  "stock": 10,
  "isTrending": true,
  "createdAt": "ISO-8601"
}
```

### `Orders` Collection
```json
{
  "userId": "firebase_uid",
  "items": [],
  "total": 25000,
  "status": "pending | confirmed | shipped | delivered | cancelled",
  "shipping": { "fullName": "", "address": "", "phone": "" },
  "cancellationRequest": { "reason": "", "requestedAt": "" },
  "returnRequest": { "type": "return | exchange", "reason": "", "status": "pending" },
  "createdAt": "serverTimestamp"
}
```

### `Users` Collection
```json
{
  "displayName": "Heritage Connoisseur",
  "email": "...",
  "role": "user | moderator | admin",
  "cart": [],
  "wishlist": [],
  "notifications": []
}
```

---

## 7. Implementation History & Evolution

1. **Phase 1: Portfolio Roots**: Initial static site focusing on UI/UX and heritage aesthetics.
2. **Phase 2: Full-Stack Shift**: Integration of Firebase and Next.js API routes for persistent storage.
3. **Phase 3: Payment Transformation**: Transitioned from basic COD (Cash on Delivery) to a sophisticated **Razorpay + UPI Intent** system for faster settlement.
4. **Phase 4: Notification Overhaul**: Migration from Twilio-centric SMS to a robust **Nodemailer-heavy** system for rich HTML order updates and status alerts.
5. **Phase 5: Production Hardening**: Implementation of PWA, SEO schemas, and Admin operational tools (CSV, Bulk Updates).

---
*This document serves as the authoritative technical reference for the Navanika platform.*
