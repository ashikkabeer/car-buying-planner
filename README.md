# ⚡ Smart Money Planner

A modern, comprehensive financial planning web application that helps users plan car loans and investments with beautiful visualizations and detailed analysis.

![Smart Money Planner](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Tech Stack](https://img.shields.io/badge/Tech-Vanilla%20JS%20%7C%20HTML%20%7C%20CSS-orange)

## 🎯 Overview

Smart Money Planner is a fintech-inspired web application that provides comprehensive financial planning tools for car loans and investment strategies. Built with modern web technologies and featuring a clean, minimalist design inspired by leading neobank applications.

## ✨ Key Features

### 📊 **Financial Planning Inputs**
- **Salary Configuration**: Monthly or annual salary input with growth projections
- **Expense Tracking**: Monthly expenses for accurate budget planning
- **Car Loan Parameters**: Price, interest rate, tenure, and payment options
- **Investment Planning**: SIP amounts, step-up percentages, and return expectations
- **Flexible Payment Modes**: Choose between fixed down payment or fixed EMI

### 💰 **Smart Calculations**
- **EMI Calculator**: Accurate monthly EMI calculations based on loan parameters
- **Down Payment Calculator**: Required down payment based on EMI budget
- **Loan Eligibility**: Maximum loan amount calculation
- **SIP Future Value**: Investment growth with step-up SIP calculations
- **Total Cost Analysis**: Complete car cost including interest payments

### 📈 **Interactive Visualizations**
- **EMI vs Salary Chart**: Monthly comparison showing affordability over time
- **Loan Outstanding**: Declining loan balance visualization
- **SIP Growth**: Investment portfolio growth projection
- **Cash Flow Analysis**: Annual salary, EMI, and SIP comparisons
- **Net Worth Tracking**: Investment value vs loan liability
- **Savings Analysis**: Remaining savings after all commitments

### 📋 **Detailed Reports**
- **Loan Amortization Schedule**: Year-wise EMI breakdown with interest and principal
- **SIP Investment Growth**: Yearly contribution and portfolio value tracking
- **Financial Breakdown**: Complete yearly financial overview
- **Export Options**: CSV and PDF export for all tables and reports

### 🔗 **Sharing & Collaboration**
- **URL Parameter Sharing**: Share complete financial plans via links
- **Auto-loading**: Recipients see pre-filled forms with your exact parameters
- **Native Sharing**: Mobile-optimized sharing with Web Share API
- **Clipboard Integration**: Automatic link copying with visual feedback

### 📱 **Modern Design**
- **Fintech-Inspired UI**: Clean, minimal design with neon green accents
- **Mobile-First**: Fully responsive design for all devices
- **Dark/Light Elements**: High contrast black text with white backgrounds
- **Smooth Animations**: Subtle hover effects and transitions
- **Professional Typography**: SF Pro Display font with proper hierarchy

### 📄 **Export Capabilities**
- **Comprehensive PDF Reports**: All inputs, charts, and tables in one document
- **Individual Table Exports**: PDF and CSV for specific data sets
- **Chart Visualizations**: High-quality chart exports in PDF reports
- **Professional Formatting**: Clean, printable layouts for presentations

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional for development)

### Installation
1. Clone or download the repository
2. Open `index.html` in a web browser, or
3. Serve via local server:
   ```bash
   python3 -m http.server 5173
   # Open http://localhost:5173
   ```

### Usage
1. **Enter Financial Details**: Fill in salary, expenses, and car loan parameters
2. **Choose Payment Mode**: Select either fixed down payment or fixed EMI
3. **Set Investment Goals**: Configure SIP amounts and expected returns
4. **Calculate Plan**: Click "Calculate Plan" to generate analysis
5. **Review Results**: Explore charts and tables across different tabs
6. **Share**: Use "Share Plan" to send your configuration to others
7. **Export**: Download PDF reports or CSV data for record-keeping

## 🛠 Technical Implementation

### Architecture
- **Static Web App**: Pure HTML, CSS, and JavaScript
- **Modular Design**: Separate utility modules for calculations and formatting
- **ES6 Modules**: Modern JavaScript with import/export
- **Chart.js Integration**: Professional chart rendering
- **PDF Generation**: Client-side PDF creation with jsPDF

### Key Technologies
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js 4.4.4
- **PDF Export**: jsPDF with AutoTable plugin
- **Fonts**: SF Pro Display, Inter fallbacks
- **Icons**: Unicode emoji for branding

### Browser Compatibility
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 📚 Feature Details

### Financial Calculations
```javascript
// EMI Calculation
calculateMonthlyEmi(principal, annualRate, tenureYears)

// SIP Future Value with Step-up
sipFutureValueMonthly(monthlyAmount, annualReturn, years, stepUpPercent)

// Comprehensive Breakdown
buildYearlyBreakdown({ years, salary, expenses, loan, sip })
```

### Chart Types
1. **Line Charts**: Trends over time (salary, EMI, SIP growth)
2. **Bar Charts**: Annual comparisons (savings, expenses)
3. **Multi-axis Charts**: EMI percentage vs absolute values
4. **Area Charts**: Portfolio growth visualization

### Export Formats
- **PDF**: Complete reports with charts and tables
- **CSV**: Tabular data for spreadsheet analysis
- **URL**: Shareable links with encoded parameters

### Responsive Breakpoints
- **Desktop**: 1200px+ (full layout)
- **Tablet**: 768px-1199px (stacked layout)
- **Mobile**: <768px (single column)

## 🎨 Design System

### Colors
- **Primary**: #00ff88 (Neon Green)
- **Secondary**: #ffff00 (Accent Yellow)
- **Text**: #000000 (High Contrast Black)
- **Background**: #ffffff (Pure White)
- **Borders**: #ececec (Light Gray)

### Typography
- **Headers**: 24px-32px, Weight 700-800
- **Body**: 14px-16px, Weight 500-600
- **Buttons**: 16px, Weight 700
- **Tables**: 13px-14px, Weight 500

### Spacing
- **Cards**: 24px-32px padding
- **Sections**: 32px gaps
- **Fields**: 16px-24px margins
- **Buttons**: 18px-20px padding

## 📖 Usage Examples

### Basic Car Loan Planning
```
Salary: ₹80,000/month
Car Price: ₹12,00,000
Interest: 9% annually
Tenure: 7 years
Down Payment: ₹2,00,000
→ EMI: ₹17,485/month
```

### Investment Planning
```
Monthly SIP: ₹15,000
Step-up: 10% yearly
Expected Returns: 12%
Duration: 7 years
→ Portfolio Value: ₹18,50,000
```

### Sharing Example
```
Share URL: https://yourapp.com/?salary=80000&carPrice=1200000&interest=9...
Recipients get pre-filled form with your exact parameters
```

## 🔧 Customization

### Modifying Calculations
Edit `src/utils/calculations.js` for custom financial formulas.

### Styling Changes
Update CSS custom properties in `styles.css`:
```css
:root {
  --primary: #00ff88;    /* Main accent color */
  --radius: 20px;        /* Border radius */
  --shadow: 0px 1px 16px rgba(0,0,0,0.06); /* Card shadows */
}
```

### Adding Chart Types
Extend chart configurations in `src/app.js` using Chart.js API.

## 📱 Mobile Features

- **Touch-Friendly**: 44px minimum touch targets
- **Native Sharing**: Web Share API integration
- **Responsive Charts**: Optimized chart sizing
- **Readable Typography**: Scaled font sizes
- **Swipe-Friendly**: Horizontal scroll tables

## 🔒 Privacy & Security

- **Client-Side Only**: No data sent to servers
- **Local Processing**: All calculations performed in browser
- **URL Sharing**: Optional sharing via URL parameters
- **No Tracking**: No analytics or user tracking

## 📄 License

MIT License - feel free to use, modify, and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

For issues or questions:
- Create GitHub issue
- Check documentation
- Review code comments

---

**Built with ❤️ for smarter financial decisions**

*Smart Money Planner - Professional financial planning made simple*
