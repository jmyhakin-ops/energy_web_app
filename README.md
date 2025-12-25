# 🚀 EnergyStation Pro - Fuel Station Management

A super modern, professional web application for managing multi-station fuel operations with M-Pesa integration, real-time analytics, and powerful reporting.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)

## ✨ Features

### 📊 Dashboard
- Real-time revenue tracking
- Station performance monitoring
- Active shift management
- Quick action shortcuts

### 🏢 Station Management
- Multi-station support
- Online/offline status tracking
- Staff and pump assignments
- Location-based organization

### ⛽ Pump Management
- Pump status monitoring
- Fuel type tracking
- Sales per pump analytics
- Maintenance status

### 👥 Attendant Management
- Staff profiles and ratings
- Performance tracking
- Shift assignments
- Sales by attendant

### ⏰ Shift Management
- Day/Night shift support
- Opening/closing readings
- Automatic reconciliation
- Shift performance analytics

### 💰 Sales & Transactions
- Real-time transaction tracking
- Payment status monitoring
- Receipt management
- Export capabilities

### 📱 M-Pesa Integration
- STK Push payments
- Transaction status tracking
- Receipt confirmation
- Payment history

### 📈 Powerful Reports
- **Charts**: Line, Bar, Area, Pie charts
- **Filters**: Date, Station, Pump, Shift, Status, Payment type
- **Deviation Analysis**: Target vs Actual comparison
- **Monthly Comparison**: Year-over-year analytics
- **Excel Export**: Colorful formatted reports with emojis

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/terrencebeaker-maker/energy_web_app.git
cd energy_web_app
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

4. **Run development server**
```bash
npm run dev
```

5. **Open browser**
```
http://localhost:3000
```

## 🌐 Deployment to Vercel (FREE)

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/terrencebeaker-maker/energy_web_app)

### Option 2: Manual Deploy

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Add Environment Variables in Vercel Dashboard**
- Go to: Project Settings → Environment Variables
- Add `NEXT_PUBLIC_SUPABASE_URL`
- Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. **Redeploy**
```bash
vercel --prod
```

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Authentication |
| `/dashboard` | Main dashboard |
| `/dashboard/stations` | Station management |
| `/dashboard/pumps` | Pump management |
| `/dashboard/attendants` | Staff management |
| `/dashboard/shifts` | Shift management |
| `/dashboard/sales` | Sales & transactions |
| `/dashboard/mpesa` | M-Pesa payments |
| `/dashboard/reports` | Analytics & reports |
| `/dashboard/settings` | System settings |

## 🗄️ Database Schema

The app connects to Supabase with the following main tables:
- `stations` - Fuel stations
- `pumps` - Fuel pumps
- `users_new` - Staff/attendants
- `shifts` - Shift definitions
- `pump_shifts` - Active shifts
- `sales` - Sales transactions
- `mpesa_transactions` - M-Pesa payments
- `station_daily_summaries` - Daily aggregates

## 🔐 Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run your database schema
3. Get API keys from: Settings → API
4. Add keys to `.env.local`

## 📄 License

MIT License - Free to use for personal and commercial projects.

## 👨‍💻 Author

Built with ❤️ for Kenya's fuel station industry.

---

⭐ Star this repo if you find it useful!
