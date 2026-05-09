# 🏛️ Navanika Heritage — Classic Luxury E-commerce

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-blueviolet?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

**Navanika Heritage** is a premium, full-stack e-commerce platform dedicated to the timeless beauty of Indian hand-woven sarees and heritage craftsmanship. It merges centuries-old tradition with cutting-edge technology to provide a seamless, luxurious shopping experience for the modern connoisseur.

---

## ✨ Key Features

### 👗 Immersive Shopping
- **Heritage Discovery**: Curated collections of luxury sarees with high-resolution optimized imagery.
- **AI Modeling Studio**: Revolutionary personal studio where users can visualize pieces in a dedicated heritage environment.
- **Intelligent Search**: Real-time search and filtering system with price range controls and category sorting.

### 🛠️ Advanced Tech & UX
- **Manual Theme Engine**: Persistent Dark/Light mode switching with heritage-themed textures (`mandala.png`).
- **PWA Ready**: Installable as a native app on mobile and desktop with offline capabilities.
- **Global Responsiveness**: A liquid design system that scales perfectly from 4K displays to small mobile screens.
- **SEO Optimized**: Dynamic XML sitemaps, JSON-LD Schema.org markup for rich snippets, and meta-optimization.

### 🔐 Secure & Administrative
- **Firebase Infrastructure**: Secure authentication, real-time Firestore database, and optimized cloud storage.
- **Admin Command Center**: Role-based access (Admin/Moderator) with inventory management, bulk stock updates, and CSV order exporting.
- **Automated Notifications**: Professional email notification system via Nodemailer for order tracking and status updates.

---

## 🚀 Technical Stack

- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/) / `motion/react`
- **Backend**: Next.js API Routes (Node.js)
- **Database**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
- **Payments**: [Razorpay](https://razorpay.com/) & [Google Pay](https://pay.google.com/) Integration
- **Testing**: [Vitest](https://vitest.dev/) for financial and logic accuracy

---

## 📦 Getting Started

### Prerequisites
- Node.js 20+
- Firebase Project Credentials

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/satya893/Navanika-heritage.git
   ```

2. **Navigate to the project folder:**
   ```bash
   cd navanika-heritage/navanika-next
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Configure Environment Variables:**
   Create a `.env.local` file in the `navanika-next` directory and add:
   ```env
   NEXT_PUBLIC_BASE_URL=your_domain
   NEXT_PUBLIC_ADMIN_EMAILS=your_admin_email
   # Firebase Config
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   # Payment Keys
   RAZORPAY_KEY_ID=...
   ```

5. **Launch Development Server:**
   ```bash
   npm run dev
   ```

---

## 🏛️ Project Architecture

```text
navanika-next/
├── src/
│   ├── app/            # App Router (Pages & API)
│   ├── components/     # UI Design System
│   ├── context/        # Global State Management
│   ├── data/           # Product Catalog Logic
│   └── lib/            # Utilities, Logger & Tests
├── public/             # Optimized Heritage Assets
└── ...
```

---

## 🤝 Contribution & Feedback

Navanika is an evolving project. We welcome contributions from developers interested in:
- High-performance Next.js architectures.
- Luxury e-commerce UI/UX.
- Advanced AI-driven styling integrations.

Feel free to fork the repo and submit pull requests!

---

<div align="center">
  <p>Created with ❤️ for the Heritage of India.</p>
  <p><b>Navanika — Eternal Majesty.</b></p>
</div>
