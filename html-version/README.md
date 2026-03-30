# M-Chama HTML/CSS/JS Version

This is a vanilla HTML, CSS, and JavaScript version of the M-Chama application - a comprehensive chama (savings group) management platform.

## 📁 Project Structure

```
html-version/
├── assets/
│   ├── css/
│   │   └── style.css          # Main stylesheet with all styles
│   └── js/
│       └── app.js              # Core JavaScript utilities
└── pages/
    ├── landing.html            # Landing/Home page
    ├── auth.html               # Login & Signup page
    ├── dashboard.html          # Main dashboard
    ├── chamas.html             # My Chamas page
    ├── contributions.html      # Contributions tracking
    ├── loans.html              # Loans management
    ├── wallet.html             # Digital wallets
    ├── investments.html        # Investments page
    ├── reports.html            # Financial reports
    ├── admin.html              # Admin dashboard
    ├── notifications.html      # Notifications center
    ├── settings.html           # Account settings
    ├── sidebar.html            # Sidebar component (reference)
    └── 404.html                # Not found page
```

## 🎨 Design & Features

### Color Scheme
- **Primary**: #1b6b4b (Forest Green)
- **Accent**: #d99d5c (Warm Orange)
- **Success**: #2d8f5e (Success Green)
- **Destructive**: #e63946 (Red)
- **Background**: #f7f3eb (Light Cream)
- **Sidebar**: #1f3d2f (Dark Green)

### Features Included

#### 1. **Landing Page** (`landing.html`)
- Hero section with CTA buttons
- Feature showcase grid (6 features)
- Statistics section
- Footer with links
- Fully responsive design

#### 2. **Authentication** (`auth.html`)
- Login form
- Sign up form with role selection
- Password visibility toggle
- Form validation
- Social auth button (placeholder)

#### 3. **Dashboard** (`dashboard.html`)
- Welcome greeting
- Stat cards (Balance, Chamas, Contributions, Loans)
- Contribution trend chart
- Loans overview chart
- Recent transactions table
- SVG-based mini charts

#### 4. **My Chamas** (`chamas.html`)
- Chama grid with cards
- Member count & balances
- Status badges
- Action buttons (View, Contribute)
- 5 sample chamas with mock data

#### 5. **Contributions** (`contributions.html`)
- All contributions table
- Status filters
- Date and amount tracking
- View/download options

#### 6. **Loans** (`loans.html`)
- Loan statistics cards
- Active & pending loans
- Repayment status
- Apply for loan button
- Loan management actions

#### 7. **Wallet** (`wallet.html`)
- Multiple wallet cards
- Balance display
- Contribution & withdrawal history
- Transaction table
- Withdrawal functionality

#### 8. **Investments** (`investments.html`)
- Investment statistics
- Project cards with returns
- Status tracking
- Investment details
- 4 sample investment projects

#### 9. **Reports** (`reports.html`)
- Financial summaries
- Report generation
- Date range selection
- PDF download options
- 4 sample reports

#### 10. **Admin Dashboard** (`admin.html`)
- Administrator statistics
- Pending approvals table
- Member applications
- System management buttons
- Role-based access

#### 11. **Notifications** (`notifications.html`)
- Notification list with icons
- Different notification types
- Filter options (All, Unread, Important)
- Mark as read functionality
- Timestamp display

#### 12. **Settings** (`settings.html`)
- Profile information form
- Security settings
- Two-factor authentication toggle
- Notification preferences
- Account deletion (danger zone)

## 🚀 Getting Started

### Installation
No installation required! Simply open any HTML file in your web browser.

### Usage
1. Open `pages/landing.html` in a web browser
2. Navigate through pages using the navigation links
3. The sidebar is available on all dashboard pages
4. Mobile navigation available with hamburger menu

### Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- All modern browsers supporting ES6

## 💥 Features & Interactivity

### JavaScript Functionality
- **Theme Management**: Light/Dark mode toggle (stored in localStorage)
- **Sidebar Toggle**: Mobile hamburger menu
- **Form Validation**: Client-side validation
- **Toast Notifications**: Success/error/info messages
- **Charts**: SVG-based mini charts on dashboard
- **Active Links**: Automatic highlighting of current page
- **Charts**: Native canvas-based bar charts
- **Modal Management**: Modal open/close functionality
- **Currency & Date Formatting**: Localization utilities

### Responsive Design
- Mobile-first approach
- Breakpoints: 480px, 768px, 1024px
- Hamburger menu for mobile
- Touch-friendly buttons
- Optimized tables & grids

## 📱 Navigation

### Sidebar Items
- Dashboard
- My Chamas
- Contributions
- Loans
- Wallet
- Investments
- Reports
- ---- (Admin Section)
- Admin Panel
- ---- 
- Settings
- Notifications
- ---- 
- Logout

## 🎯 Sample Data

All pages include realistic sample data:
- **Chamas**: Nairobi Farmers, Friends United, Tech Savers, Church Group, Business Collective
- **Members**: 12-15 members per chama
- **Balances**: KES 85,000 - KES 520,000
- **Transactions**: Recent contribution and loan records
- **Dates**: March-April 2026

## 🔄 Form Examples

The application includes interactive forms:
- Login/Signup form with role selection
- Profile edit form
- Settings page with preferences
- All with basic client-side validation

## 🎨 CSS Features

### Utility Classes
- Spacing utilities (mt, mb, p)
- Text utilities (text-center, text-right)
- Display utilities (hidden, block)
- Color utilities (text-primary, text-muted)
- Grid system (grid-cols-1 through grid-cols-4)
- Flexbox helpers

### Components
- Buttons (primary, secondary, outline, accent)
- Cards with shadows
- Tables with zebra striping
- Forms with labels
- Badges (success, warning, destructive, info)
- Stat cards
- Avatar components

### Animations
- Fade-in effect
- Slide-in animation
- Pulse animation
- Smooth transitions

## 📝 Notes

1. **No Backend**: All data is mocked/hardcoded for demonstration
2. **No Authentication**: Login redirects directly to dashboard
3. **Responsive**: All pages work on mobile, tablet, and desktop
4. **Customizable**: Easy to modify colors, text, and styling
5. **Production Ready**: Code is production-ready for static hosting

## 🔧 Customization

### Change Colors
Edit CSS variables in `assets/css/style.css`:
```css
:root {
  --primary: #1b6b4b;
  --accent: #d99d5c;
  /* ... modify other colors ... */
}
```

### Add More Pages
1. Create a new HTML file in `pages/`
2. Copy the sidebar and layout structure
3. Customize the content
4. Update sidebar links

### Modify Sample Data
Edit the HTML directly in each page's table or card sections.

## 📄 License

This is a demo/template project for educational purposes.

## 🤝 Support

For questions or customization needs, contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: March 30, 2026  
**Created for**: M-Chama Platform
