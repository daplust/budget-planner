# 💰 Budget Planner IDR

A modern, mobile-first personal budget planning web application for managing your finances in Indonesian Rupiah (IDR). Track your income, set budgets, monitor expenses, and visualize your spending patterns—all stored locally on your device.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Mobile Optimized](https://img.shields.io/badge/Mobile-Optimized-success)

## ✨ Features

### 📊 Budget Management
- **Monthly Budget Allocation**: Set budget limits for different spending categories
- **Real-time Tracking**: Monitor your spending against allocated budgets
- **Budget Status Indicators**: Visual feedback (safe/warning/danger/over) for budget health
- **Category-based Organization**: Default categories (Daily Needs, Lifestyle, Investment) with custom colors

### 💸 Expense Tracking
- **Quick Expense Entry**: Add expenses with amount, category, description, and date
- **Recent Expenses View**: See your latest 5 transactions at a glance
- **Category Icons**: Visual identification with Lucide icons
- **IDR Currency Formatting**: Proper Indonesian Rupiah display (Rp 1.000.000)

### 📈 Analytics & Insights
- **Spending Pie Chart**: Visual breakdown of expenses by category
- **Monthly Overview Card**: Income, allocated budget, spent amount, and remaining balance
- **Days Remaining**: Countdown to end of month
- **Progress Bars**: Visual representation of budget usage
- **Savings Rate**: Track how much you're saving each month

### 📱 Mobile Optimized
- **Responsive Design**: Works seamlessly from 375px (iPhone SE) to desktop
- **Touch-Friendly**: Large tap targets and touch gestures
- **Mobile Keyboard**: Numeric keyboards for amount inputs
- **Smooth Scrolling**: Optimized for mobile browsers
- **PWA-Ready**: Meta tags for mobile web app installation

### 💾 Data Storage
- **Local-First**: All data stored in browser IndexedDB
- **Fast Performance**: Instant data access with Dexie.js
- **Privacy-Focused**: Your data never leaves your device
- **Persistent State**: Data survives browser restarts
- **Default Data**: Pre-populated with 3 common budget categories

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone or navigate to the project directory
cd "budget planner"

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Mobile Testing

To test on your mobile device (same WiFi network):

```bash
# Start dev server with network access
npm run dev -- --host

# Access from your phone at:
# http://[your-computer-ip]:5173
```

## 🛠️ Tech Stack

### Frontend Framework
- **React 18** - UI library with hooks
- **TypeScript 5** - Type-safe development
- **Vite 8** - Fast build tool with HMR

### UI & Styling
- **TailwindCSS 3** - Utility-first CSS framework
- **Shadcn UI** - High-quality accessible components
- **Radix UI** - Headless UI primitives
- **Lucide React** - Beautiful icon library
- **CVA** - Class variance authority for component variants

### Data & State
- **Zustand** - Lightweight state management
- **Dexie.js** - IndexedDB wrapper for local storage
- **date-fns** - Modern date utilities

### Charts & Visualization
- **Recharts** - Composable charting library built on D3

### Form Handling
- **React Hook Form** - Performant form validation
- **Zod** - TypeScript-first schema validation

## 📁 Project Structure

```
budget planner/
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── progress.tsx
│   │   │   └── select.tsx
│   │   ├── Dashboard.tsx           # Main app component
│   │   ├── BudgetCard.tsx          # Individual budget category
│   │   ├── MonthlyOverviewCard.tsx # Monthly summary
│   │   ├── ExpenseFormDialog.tsx   # Add expense modal
│   │   ├── BudgetAllocationDialog.tsx
│   │   ├── SpendingChart.tsx       # Pie chart visualization
│   │   └── RecentExpenses.tsx      # Recent transactions list
│   ├── lib/
│   │   ├── db.ts              # Dexie IndexedDB setup
│   │   ├── currency.ts        # IDR formatting utilities
│   │   ├── calculations.ts    # Budget calculations
│   │   └── utils.ts           # Helper functions
│   ├── store/
│   │   └── budgetStore.ts     # Zustand state management
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles + Tailwind
├── public/                     # Static assets
├── index.html                 # HTML entry point
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite configuration
├── MOBILE-OPTIMIZATIONS.md    # Mobile enhancement docs
└── package.json
```

## 🎨 Design System

### Color Palette
```typescript
// Budget Status Colors
Safe (< 70%):    hsl(142, 71%, 45%) // Green
Warning (70-90%): hsl(38, 92%, 50%)  // Yellow
Danger (90-100%): hsl(25, 95%, 53%)  // Orange
Over (> 100%):   hsl(0, 84%, 60%)    // Red

// Category Colors
Daily Needs:     hsl(221, 83%, 53%) // Blue
Lifestyle:       hsl(142, 71%, 45%) // Green
Investment:      hsl(262, 83%, 58%) // Purple
```

### Responsive Breakpoints
- **Mobile**: < 640px (default)
- **Tablet (sm)**: ≥ 640px
- **Desktop (md)**: ≥ 768px
- **Large Desktop (lg)**: ≥ 1024px

## 📋 Key Features Explained

### Monthly Budget Flow
1. **Set Budget**: Allocate amount per category for the month
2. **Track Expenses**: Add expenses as you spend
3. **Monitor Progress**: Real-time budget usage visualization
4. **Month Rollover**: Start fresh next month

### Budget Status System
```typescript
< 70% used:  ✅ Safe (green)
70-90% used: ⚠️ Warning (yellow)
90-100% used: 🔶 Danger (orange)
> 100% used: ❌ Over Budget (red)
```

### Currency Formatting
```typescript
formatIDR(1500000)        // "Rp 1.500.000"
formatCompactIDR(1500000) // "Rp 1,5jt"
parseIDR("Rp 1.500.000")  // 1500000
```

## 🔧 Configuration

### Path Aliases
```typescript
// tsconfig.app.json & vite.config.ts
"@/*" → "src/*"

// Usage:
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
```

### Tailwind Customization
Edit `tailwind.config.js` to customize:
- Theme colors
- Category colors
- Budget status colors
- Border radius
- Spacing scale

## 📦 Build & Deploy

### Build for Production
```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

### Deploy Options
- **Vercel**: `vercel deploy`
- **Netlify**: Connect Git repo or drag `dist/` folder
- **GitHub Pages**: Use `gh-pages` package
- **Any Static Host**: Upload `dist/` folder

## 🧪 Development

### Available Scripts
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run Oxlint
```

### Adding New Categories
Edit `src/lib/db.ts` → `initializeDefaultData()`:

```typescript
await db.categories.bulkAdd([
  { name: 'Transportation', color: 'hsl(39, 70%, 50%)', icon: 'Car' },
  // Add more...
])
```

### Customizing Components
All Shadcn UI components are in `src/components/ui/` and fully customizable.

## 🔒 Data Privacy

- **100% Local Storage**: All data stored in browser IndexedDB
- **No Backend**: No servers or external APIs
- **No Tracking**: No analytics or tracking scripts
- **Export Ready**: Data can be exported anytime (feature coming soon)

## 🐛 Known Issues & Limitations

### Current Limitations
- Single currency (IDR only)
- No recurring expenses automation
- No data export/import (planned)
- No cloud sync (local-only)
- No multi-user support
- No receipt photo upload

### Browser Support
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ❌ IE11 (not supported)

## 🗺️ Roadmap

### v1.1 - Enhanced Features
- [ ] Income tracking UI
- [ ] Savings goals UI
- [ ] Recurring expenses
- [ ] Multiple months navigation
- [ ] Data export (JSON/CSV)

### v1.2 - Cloud Features
- [ ] User authentication
- [ ] Cloud sync (Firebase/Supabase)
- [ ] Multi-device support
- [ ] Backup & restore

### v1.3 - Advanced Features
- [ ] Receipt photo upload
- [ ] Category customization UI
- [ ] Budget templates
- [ ] Spending trends & analytics
- [ ] Budget recommendations

### v2.0 - PWA & Offline
- [ ] Service worker
- [ ] Offline support
- [ ] Install prompt
- [ ] Push notifications
- [ ] Background sync

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on mobile & desktop
5. Submit a pull request

## 📄 License

MIT License - feel free to use this for your own personal budget tracking!

## 🙏 Acknowledgments

- **Shadcn UI** - For the beautiful component library
- **Radix UI** - For accessible primitives
- **Recharts** - For easy data visualization
- **Dexie.js** - For making IndexedDB painless
- **TailwindCSS** - For rapid UI development

## 📧 Support

For issues or questions, please open an issue on GitHub or contact the developer.

---

**Built with ❤️ for personal finance management in Indonesia** 🇮🇩
