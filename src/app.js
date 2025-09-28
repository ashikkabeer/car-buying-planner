import { formatCurrencyINR, formatNumber } from './utils/format.js';
import { calculateMonthlyEmi, calculatePrincipalFromEmi, calculateEmiFromDownPayment, calculateDownPaymentFromEmi, amortizationScheduleYearly, sipFutureValueMonthly, buildYearlyBreakdown } from './utils/calculations.js';

let charts = {};

function $(id) { return document.getElementById(id); }

function setText(id, value) { const el = $(id); if (el) el.textContent = value; }

function toggleMode(mode) {
  const dpToggle = $('toggle-down-payment');
  const emiToggle = $('toggle-emi');
  const dpInput = $('down-payment');
  const emiInput = $('emi-budget');

  if (mode === 'dp') {
    dpToggle.checked = true; emiToggle.checked = false; dpInput.disabled = false; emiInput.disabled = true; emiInput.value = '';
  } else if (mode === 'emi') {
    emiToggle.checked = true; dpToggle.checked = false; emiInput.disabled = false; dpInput.disabled = true; dpInput.value = '';
  }
}

function initToggles() {
  $('toggle-down-payment').addEventListener('change', (e) => {
    if (e.target.checked) toggleMode('dp'); else toggleMode('emi');
  });
  $('toggle-emi').addEventListener('change', (e) => {
    if (e.target.checked) toggleMode('emi'); else toggleMode('dp');
  });
}

function initTabs() {
  const tabs = Array.from(document.querySelectorAll('.tab'));
  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const panel = $('tab-' + tabId);
    panel.classList.add('active');
    // Reflow animation
    panel.style.animation = 'none';
    // force reflow
    void panel.offsetWidth;
    panel.style.animation = '';
    // Resize charts when switching
    Object.values(charts).forEach(ch => ch?.resize());
  }));
}

function readInputs() {
  const salaryRaw = Number($('salary').value || 0);
  const salaryPeriod = $('salary-period').value;
  const salaryMonthly = salaryPeriod === 'annual' ? salaryRaw / 12 : salaryRaw;
  const salaryGrowth = Number($('salary-growth').value || 0);
  const monthlyExpenses = Number($('monthly-expenses').value || 0);

  const carPrice = Number($('car-price').value || 0);
  const interest = Number($('interest-rate').value || 0);
  const tenure = Number($('loan-tenure').value || 0);

  const dpMode = $('toggle-down-payment').checked;
  const emiMode = $('toggle-emi').checked;
  const downPayment = Number($('down-payment').value || 0);
  const emiBudget = Number($('emi-budget').value || 0);

  const sipMonthly = Number($('sip-monthly').value || 0);
  const sipStepup = Number($('sip-stepup').value || 0);
  const investReturn = Number($('investment-return').value || 0);

  return { salaryMonthly, salaryGrowth, monthlyExpenses, carPrice, interest, tenure, dpMode, emiMode, downPayment, emiBudget, sipMonthly, sipStepup, investReturn };
}

function csvFromRows(headers, rows) {
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) lines.push(row.map(escape).join(','));
  return lines.join('\n');
}

function download(filename, content, type = 'text/csv') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportTableToCSV(tableId, filename) {
  const table = $(tableId);
  const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
  const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => Array.from(tr.children).map(td => td.textContent.trim()));
  const csv = csvFromRows(headers, rows);
  download(filename, csv, 'text/csv');
}

async function exportComprehensivePDF() {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF || !window.jspdf) {
    alert('PDF export not available. Please check your internet connection.');
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let currentY = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Helper functions
  const addTitle = (text, size = 16) => {
    doc.setFontSize(size);
    doc.setFont(undefined, 'bold');
    doc.text(text, margin, currentY);
    currentY += size * 0.5 + 5;
  };

  const addSubtitle = (text, size = 12) => {
    doc.setFontSize(size);
    doc.setFont(undefined, 'bold');
    doc.text(text, margin, currentY);
    currentY += size * 0.5 + 3;
  };

  const addText = (text, size = 10) => {
    doc.setFontSize(size);
    doc.setFont(undefined, 'normal');
    doc.text(text, margin, currentY);
    currentY += size * 0.5 + 2;
  };

  const addNewPage = () => {
    doc.addPage();
    currentY = 20;
  };

  const checkPageBreak = (neededSpace = 30) => {
    if (currentY + neededSpace > pageHeight - margin) {
      addNewPage();
    }
  };

  // Header
  addTitle('Smart Money Planner - Financial Report', 18);
  addText(`Generated on: ${new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, 10);
  currentY += 10;

  // Get current input values
  const inputs = readInputs();
  
  // Input Summary Section
  addSubtitle('Financial Planning Inputs');
  currentY += 5;

  // Helper function for PDF-compatible currency formatting
  const formatPDFCurrency = (value) => {
    if (!isFinite(value)) return '—';
    return `Rs ${Math.round(value).toLocaleString('en-IN')}`;
  };

  const inputData = [
    ['Parameter', 'Value'],
    ['Salary', `${formatPDFCurrency(inputs.salaryMonthly * 12)} (Annual)`],
    ['Salary Growth', `${inputs.salaryGrowth}% per year`],
    ['Monthly Expenses', formatPDFCurrency(inputs.monthlyExpenses)],
    ['Car Price', formatPDFCurrency(inputs.carPrice)],
    ['Interest Rate', `${inputs.interest}% per annum`],
    ['Loan Tenure', `${inputs.tenure} years`],
    ['Down Payment Mode', inputs.dpMode ? 'Fixed Down Payment' : 'Fixed EMI'],
    ['Down Payment', inputs.dpMode ? formatPDFCurrency(inputs.downPayment) : 'Calculated'],
    ['EMI Budget', inputs.emiMode ? formatPDFCurrency(inputs.emiBudget) : 'Calculated'],
    ['Monthly SIP', formatPDFCurrency(inputs.sipMonthly)],
    ['SIP Step-up', `${inputs.sipStepup}% per year`],
    ['Expected Returns', `${inputs.investReturn}% per annum`]
  ];

  doc.autoTable({
    head: [inputData[0]],
    body: inputData.slice(1),
    startY: currentY,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [14, 165, 233], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin }
  });

  currentY = doc.lastAutoTable.finalY + 15;
  checkPageBreak(50);

  // Summary Results Section
  addSubtitle('Key Financial Results');
  currentY += 5;

  const loanAmount = parseFloat($('card-loan-amount').textContent.replace(/[₹,]/g, '')) || 0;
  const emi = parseFloat($('card-emi').textContent.replace(/[₹,]/g, '')) || 0;
  const downPayment = parseFloat($('card-dp').textContent.replace(/[₹,]/g, '')) || 0;
  const totalCost = parseFloat($('card-total-cost').textContent.replace(/[₹,]/g, '')) || 0;

  const summaryData = [
    ['Metric', 'Amount'],
    ['Loan Amount', formatPDFCurrency(loanAmount)],
    ['Monthly EMI', formatPDFCurrency(emi)],
    ['Down Payment Required', formatPDFCurrency(downPayment)],
    ['Total Car Cost', formatPDFCurrency(totalCost)],
    ['Total Interest Paid', formatPDFCurrency(totalCost - loanAmount - downPayment)]
  ];

  doc.autoTable({
    head: [summaryData[0]],
    body: summaryData.slice(1),
    startY: currentY,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 253, 250] },
    margin: { left: margin, right: margin }
  });

  currentY = doc.lastAutoTable.finalY + 15;

  // Add charts if they exist
  const chartIds = ['chart-outstanding', 'chart-sip', 'chart-emi-salary', 'chart-cashflows', 'chart-networth', 'chart-savings'];
  
  for (const chartId of chartIds) {
    const canvas = $(chartId);
    if (canvas && charts[chartId]) {
      checkPageBreak(80);
      
      let chartTitle = '';
      switch(chartId) {
        case 'chart-outstanding': chartTitle = 'Loan Outstanding Over Time'; break;
        case 'chart-sip': chartTitle = 'SIP Investment Growth'; break;
        case 'chart-emi-salary': chartTitle = 'Monthly EMI vs Salary Comparison'; break;
        case 'chart-cashflows': chartTitle = 'Annual Cash Flows'; break;
        case 'chart-networth': chartTitle = 'Net Worth Comparison'; break;
        case 'chart-savings': chartTitle = 'Annual Savings Left'; break;
      }
      
      addSubtitle(chartTitle);
      
      try {
        // Ensure chart is rendered and visible
        if (charts[chartId] && charts[chartId].canvas) {
          // Force chart update and render
          charts[chartId].update('none');
          
          // Wait a moment for chart to render
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const chartCanvas = charts[chartId].canvas;
          const chartDataURL = chartCanvas.toDataURL('image/png', 1.0);
          
          // Check if we got a valid image (not blank)
          if (chartDataURL && chartDataURL !== 'data:,') {
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = 70;
            doc.addImage(chartDataURL, 'PNG', margin, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 10;
          } else {
            addText('Chart visualization included in web version only', 9);
            currentY += 5;
          }
        } else {
          addText('Chart visualization included in web version only', 9);
          currentY += 5;
        }
      } catch (error) {
        console.log('Chart export error:', error);
        addText('Chart visualization included in web version only', 9);
        currentY += 5;
      }
    }
  }

  // Add tables
  const tables = [
    { id: 'table-loan', title: 'Loan Amortization Schedule' },
    { id: 'table-sip', title: 'SIP Investment Growth Details' },
    { id: 'table-breakdown', title: 'Yearly Financial Breakdown' }
  ];

  for (const tableInfo of tables) {
    const table = $(tableInfo.id);
    if (table && table.querySelector('tbody tr')) {
      checkPageBreak(50);
      addSubtitle(tableInfo.title);
      
      // Extract table data and convert currency formatting
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
      const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => 
        Array.from(tr.children).map(td => {
          let text = td.textContent.trim();
          // Replace ₹ symbol with Rs for PDF compatibility
          if (text.includes('₹')) {
            text = text.replace(/₹/g, 'Rs ');
          }
          return text;
        })
      );
      
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: currentY,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [14, 165, 233], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { halign: 'left' }
        }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
    }
  }

  // Footer
  checkPageBreak(20);
  doc.setFontSize(8);
  doc.setFont(undefined, 'italic');
  doc.text(
    'This report is generated by Smart Money Planner for financial planning purposes only.',
    margin,
    currentY
  );

  // Save the PDF
  const timestamp = new Date().toISOString().slice(0, 10);
  doc.save(`smart-money-planner-report-${timestamp}.pdf`);
}

async function exportTableToPDF(tableId, title, filename) {
  const table = $(tableId);
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF || !window.jspdf || !table) return;
  
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  
  // Extract table data and convert currency formatting
  const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
  const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => 
    Array.from(tr.children).map(td => {
      let text = td.textContent.trim();
      // Replace ₹ symbol with Rs for PDF compatibility
      if (text.includes('₹')) {
        text = text.replace(/₹/g, 'Rs ');
      }
      return text;
    })
  );
  
  doc.autoTable({ 
    head: [headers],
    body: rows,
    startY: 22, 
    styles: { fontSize: 8 },
    headStyles: { fillColor: [14, 165, 233], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });
  doc.save(filename);
}

async function exportSummaryCSV() {
  const inputs = readInputs();
  const loanAmount = parseFloat($('card-loan-amount').textContent.replace(/[₹,]/g, '')) || 0;
  const emi = parseFloat($('card-emi').textContent.replace(/[₹,]/g, '')) || 0;
  const downPayment = parseFloat($('card-dp').textContent.replace(/[₹,]/g, '')) || 0;
  const totalCost = parseFloat($('card-total-cost').textContent.replace(/[₹,]/g, '')) || 0;

  const summaryData = [
    ['Parameter', 'Value'],
    ['Annual Salary', formatPDFCurrency(inputs.salaryMonthly * 12)],
    ['Salary Growth', `${inputs.salaryGrowth}%`],
    ['Monthly Expenses', formatPDFCurrency(inputs.monthlyExpenses)],
    ['Car Price', formatPDFCurrency(inputs.carPrice)],
    ['Interest Rate', `${inputs.interest}%`],
    ['Loan Tenure', `${inputs.tenure} years`],
    ['Loan Amount', formatPDFCurrency(loanAmount)],
    ['Monthly EMI', formatPDFCurrency(emi)],
    ['Down Payment', formatPDFCurrency(downPayment)],
    ['Total Car Cost', formatPDFCurrency(totalCost)],
    ['Monthly SIP', formatPDFCurrency(inputs.sipMonthly)],
    ['SIP Step-up', `${inputs.sipStepup}%`],
    ['Expected Returns', `${inputs.investReturn}%`]
  ];

  const csv = csvFromRows(['Parameter', 'Value'], summaryData.slice(1));
  const timestamp = new Date().toISOString().slice(0, 10);
  download(`smart-money-planner-summary-${timestamp}.csv`, csv, 'text/csv');
}

function fadeInElement(el) {
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetWidth; // reflow
  el.style.animation = 'fadeIn 220ms ease both';
}

function renderLoanTable(yearly) {
  const tbody = $('table-loan').querySelector('tbody');
  tbody.innerHTML = '';
  for (const y of yearly) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${y.year}</td>
      <td>${formatCurrencyINR(y.emiPaid)}</td>
      <td>${formatCurrencyINR(y.interestPaid)}</td>
      <td>${formatCurrencyINR(y.principalRepaid)}</td>
      <td>${formatCurrencyINR(y.outstanding)}</td>
    `;
    tbody.appendChild(tr);
  }
  fadeInElement(tbody);
}

function renderSipTable(yearly) {
  const tbody = $('table-sip').querySelector('tbody');
  tbody.innerHTML = '';
  for (const y of yearly) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${y.year}</td>
      <td>${formatCurrencyINR(y.contributed)}</td>
      <td>${formatCurrencyINR(y.endValue)}</td>
    `;
    tbody.appendChild(tr);
  }
  fadeInElement(tbody);
}

function renderBreakdownTable(rows) {
  const tbody = $('table-breakdown').querySelector('tbody');
  tbody.innerHTML = '';
  for (const r of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.year}</td>
      <td>${formatCurrencyINR(r.salary)}</td>
      <td>${formatCurrencyINR(r.emi)}</td>
      <td>${formatCurrencyINR(r.sip)}</td>
      <td>${formatCurrencyINR(r.expenses)}</td>
      <td>${formatCurrencyINR(r.savingsLeft)}</td>
    `;
    tbody.appendChild(tr);
  }
  fadeInElement(tbody);
}

function makeChart(ctxId, config) {
  const canvas = $(ctxId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (charts[ctxId]) { charts[ctxId].destroy(); }
  
  // Enhanced responsive config with modern styling
  config.options = {
    ...config.options,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 24,
          usePointStyle: true,
          font: {
            size: 14,
            weight: '600',
            family: 'SF Pro Display, Inter, -apple-system, system-ui'
          },
          color: '#000000'
        }
      }
    },
    scales: {
      ...config.options?.scales,
      x: {
        ...config.options?.scales?.x,
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 13,
            weight: '500'
          },
          color: '#666666'
        }
      },
      y: {
        ...config.options?.scales?.y,
        grid: {
          color: '#f0f0f0',
          lineWidth: 1
        },
        ticks: {
          font: {
            size: 13,
            weight: '500'
          },
          color: '#666666',
          callback: (v) => 'Rs ' + Math.round(v).toLocaleString('en-IN')
        }
      }
    }
  };
  
  charts[ctxId] = new window.Chart(ctx, config);
}

function renderCharts({ years, amort, sip }) {
  const labels = amort.yearly.map(y => `Y${y.year}`);
  makeChart('chart-outstanding', {
    type: 'line',
    data: {
      labels,
      datasets: [
        { 
          label: 'Outstanding Loan', 
          data: amort.yearly.map(y => Math.round(y.outstanding)), 
          borderColor: '#000000', 
          backgroundColor: 'rgba(0,0,0,0.05)', 
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#000000',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }
      ]
    }
  });

  makeChart('chart-sip', {
    type: 'line',
    data: {
      labels,
      datasets: [
        { 
          label: 'SIP Portfolio Value', 
          data: sip.yearly.map(y => Math.round(y.endValue)), 
          borderColor: '#00ff88', 
          backgroundColor: 'rgba(0,255,136,0.1)', 
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00ff88',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        }
      ]
    }
  });
}

function renderCombinedCharts({ amort, sip, breakdown }) {
  const labels = amort.yearly.map(y => `Y${y.year}`);
  
  // EMI vs Salary Chart (Monthly)
  makeChart('chart-emi-salary', {
    type: 'line',
    data: { 
      labels, 
      datasets: [
        { 
          label: 'Monthly Salary', 
          data: breakdown.map(r => Math.round(r.salary / 12)), 
          borderColor: '#00ff88', 
          backgroundColor: 'rgba(0,255,136,0.1)', 
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#00ff88',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          yAxisID: 'y'
        },
        { 
          label: 'Monthly EMI', 
          data: breakdown.map(r => Math.round(r.emi / 12)), 
          borderColor: '#000000', 
          backgroundColor: 'rgba(0,0,0,0.1)', 
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#000000',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          yAxisID: 'y'
        },
        {
          label: 'EMI as % of Salary',
          data: breakdown.map(r => {
            const monthlySalary = r.salary / 12;
            const monthlyEmi = r.emi / 12;
            return monthlySalary > 0 ? Math.round((monthlyEmi / monthlySalary) * 100) : 0;
          }),
          borderColor: '#ffff00',
          backgroundColor: 'rgba(255,255,0,0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#ffff00',
          pointBorderColor: '#000000',
          pointBorderWidth: 2,
          pointRadius: 5,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Monthly Amount (₹)'
          },
          ticks: {
            callback: (v) => 'Rs ' + Math.round(v).toLocaleString('en-IN')
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'EMI as % of Salary'
          },
          ticks: {
            callback: (v) => v + '%'
          },
          grid: {
            drawOnChartArea: false,
          },
        }
      }
    }
  });
  
  makeChart('chart-cashflows', {
    type: 'line',
    data: { 
      labels, 
      datasets: [
        { 
          label: 'Annual Salary', 
          data: breakdown.map(r => Math.round(r.salary)), 
          borderColor: '#00ff88', 
          backgroundColor: 'rgba(0,255,136,0.1)', 
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: '#00ff88',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5
        },
        { 
          label: 'EMI Payments', 
          data: breakdown.map(r => Math.round(r.emi)), 
          borderColor: '#000000', 
          backgroundColor: 'rgba(0,0,0,0.1)', 
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: '#000000',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5
        },
        { 
          label: 'SIP Investment', 
          data: breakdown.map(r => Math.round(r.sip)), 
          borderColor: '#666666', 
          backgroundColor: 'rgba(102,102,102,0.1)', 
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: '#666666',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5
        },
      ]
    }
  });

  makeChart('chart-networth', {
    type: 'line',
    data: { 
      labels, 
      datasets: [
        { 
          label: 'Investment Portfolio', 
          data: sip.yearly.map(y => Math.round(y.endValue)), 
          borderColor: '#00ff88', 
          backgroundColor: 'rgba(0,255,136,0.1)', 
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00ff88',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5
        },
        { 
          label: 'Loan Liability', 
          data: amort.yearly.map(y => Math.round(y.outstanding)), 
          borderColor: '#000000', 
          backgroundColor: 'rgba(0,0,0,0.1)', 
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#000000',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5
        }
      ]
    }
  });

  makeChart('chart-savings', {
    type: 'bar',
    data: { 
      labels, 
      datasets: [
        { 
          label: 'Monthly Savings Left', 
          data: breakdown.map(r => Math.round(r.savingsLeft)), 
          backgroundColor: 'rgba(0,255,136,0.8)', 
          borderColor: '#00ff88',
          borderWidth: 2,
          borderRadius: 8
        },
      ]
    }
  });
}

function updateCards({ loanAmount, emi, requiredDownPayment, totalCarCost, sip }) {
  console.log('Updating cards with SIP data:', sip);
  
  // Loan related values
  setText('card-loan-amount', formatCurrencyINR(loanAmount));
  setText('card-emi', formatCurrencyINR(emi));
  setText('card-dp', formatCurrencyINR(requiredDownPayment));
  setText('card-total-cost', formatCurrencyINR(totalCarCost));

  // Use pre-calculated total SIP investment and returns
  const totalSipInvestment = sip?.totalContributed || 0;
  const totalSipValue = sip?.endValue || 0;
  const totalReturns = totalSipValue - totalSipInvestment;

  console.log('SIP Calculations:', {
    totalSipInvestment,
    totalSipValue,
    totalReturns
  });

  // Update SIP related values
  setText('card-total-sip', formatCurrencyINR(totalSipInvestment));
  setText('card-sip-returns', formatCurrencyINR(totalReturns));
  setText('card-portfolio-value', formatCurrencyINR(totalSipValue));
  
  // Generate investment insight
  generateInvestmentInsight(totalReturns, totalCarCost, loanAmount);
}

function generateInvestmentInsight(totalReturns, totalCarCost, loanAmount) {
  const insightSection = $('investment-insight');
  const insightText = $('insight-text');
  
  if (!insightSection || !insightText) return;
  
  let insightMessage = '';
  let isPositive = true;
  
  // Calculate loan interest (total cost - loan amount - down payment)
  const downPayment = parseFloat($('card-dp').textContent.replace(/[₹,]/g, '')) || 0;
  const totalInterest = totalCarCost - loanAmount - downPayment;
  
  if (totalReturns > totalInterest) {
    // Investment returns are higher than loan interest
    const netBenefit = totalReturns - totalInterest;
    const benefitPercentage = ((netBenefit / totalInterest) * 100).toFixed(1);
    
    insightMessage = `🎉 Excellent! Your investment returns of <span class="insight-highlight">${formatCurrencyINR(totalReturns)}</span> exceed your loan interest of <span class="insight-highlight">${formatCurrencyINR(totalInterest)}</span> by <span class="insight-positive">${formatCurrencyINR(netBenefit)}</span>. That's <span class="insight-positive">${benefitPercentage}% more</span> than what you're paying in interest! Your money is working harder than your debt.`;
    isPositive = true;
  } else if (totalReturns > 0) {
    // Investment returns are positive but less than loan interest
    const shortfall = totalInterest - totalReturns;
    const shortfallPercentage = ((shortfall / totalInterest) * 100).toFixed(1);
    
    insightMessage = `💭 Your investment returns of <span class="insight-highlight">${formatCurrencyINR(totalReturns)}</span> are positive, but fall short of your loan interest by <span class="insight-negative">${formatCurrencyINR(shortfall)}</span>. Consider increasing your SIP amount or exploring higher-return investments to bridge this <span class="insight-negative">${shortfallPercentage}%</span> gap.`;
    isPositive = false;
  } else {
    // No investment returns
    insightMessage = `⚠️ You're not investing alongside your car loan. Your loan interest will cost you <span class="insight-highlight">${formatCurrencyINR(totalInterest)}</span>. Consider starting a SIP to build wealth while you pay off your car!`;
    isPositive = false;
  }
  
  // Additional comparison with car cost
  if (totalReturns > 0) {
    const carCostComparison = ((totalReturns / totalCarCost) * 100).toFixed(1);
    insightMessage += ` <br><br>📈 Your investment returns represent <span class="insight-highlight">${carCostComparison}%</span> of your total car cost - that's like getting a significant discount on your car through smart investing!`;
  }
  
  insightText.innerHTML = insightMessage;
  insightSection.style.display = 'block';
  
  // Add animation
  setTimeout(() => {
    insightSection.style.animation = 'fadeInUp 600ms ease both';
  }, 100);
}

function handleCalculate(evt) {
  evt.preventDefault();
  const input = readInputs();

  const years = Math.max(1, Math.round(input.tenure || 1));
  let loanAmount = 0;
  let emi = 0;
  let requiredDownPayment = 0;
  let eligiblePrincipal = 0;

  if (input.dpMode) {
    loanAmount = Math.max(0, input.carPrice - input.downPayment);
    emi = calculateMonthlyEmi(loanAmount, input.interest, input.tenure);
    eligiblePrincipal = loanAmount;
    requiredDownPayment = Math.max(0, input.downPayment);
  } else {
    const res = calculateDownPaymentFromEmi(input.carPrice, input.emiBudget, input.interest, input.tenure);
    loanAmount = Math.max(0, input.carPrice - res.requiredDownPayment);
    emi = calculateMonthlyEmi(loanAmount, input.interest, input.tenure);
    eligiblePrincipal = res.eligiblePrincipal;
    requiredDownPayment = res.requiredDownPayment;
  }

  const amort = amortizationScheduleYearly(loanAmount, input.interest, input.tenure);
  const totalCarCost = loanAmount + amort.totalInterest + requiredDownPayment;
  const sip = sipFutureValueMonthly(input.sipMonthly, input.investReturn, years, input.sipStepup);

  const breakdown = buildYearlyBreakdown({
    years,
    monthlySalary: input.salaryMonthly,
    salaryGrowthPercent: input.salaryGrowth,
    monthlyExpenses: input.monthlyExpenses,
    loanYearly: amort.yearly,
    sipYearly: sip.yearly,
  });

  updateCards({ loanAmount, emi, requiredDownPayment, totalCarCost, sip });

  renderLoanTable(amort.yearly);
  renderSipTable(sip.yearly);
  renderBreakdownTable(breakdown);
  renderCharts({ years, amort, sip });
  renderCombinedCharts({ amort, sip, breakdown });

  // Show results and export sections
  document.querySelector('.results-section').style.display = 'block';
  document.querySelector('.export-section').style.display = 'block';
}

function setupExportHandlers() {
  // Main export buttons
  const completeBtn = $('btn-export-complete');
  const summaryBtn = $('btn-export-summary');
  
  if (completeBtn) {
    completeBtn.onclick = async () => {
      completeBtn.disabled = true;
      completeBtn.textContent = 'Generating PDF...';
      
      try {
        // Small delay to ensure charts are fully rendered
        await new Promise(resolve => setTimeout(resolve, 500));
        await exportComprehensivePDF();
      } finally {
        completeBtn.disabled = false;
        completeBtn.textContent = 'Export Complete Report (PDF)';
      }
    };
  }
  
  if (summaryBtn) summaryBtn.onclick = () => exportSummaryCSV();

  // CSV exports
  const csvButtons = [
    { id: 'export-loan-csv', table: 'table-loan', filename: 'loan-amortization.csv' },
    { id: 'export-sip-csv', table: 'table-sip', filename: 'sip-growth.csv' },
    { id: 'export-breakdown-csv', table: 'table-breakdown', filename: 'yearly-breakdown.csv' }
  ];
  
  csvButtons.forEach(({ id, table, filename }) => {
    const btn = $(id);
    if (btn) btn.onclick = () => exportTableToCSV(table, filename);
  });

  // PDF exports for individual tables
  const pdfButtons = [
    { id: 'export-loan-pdf', table: 'table-loan', title: 'Loan Amortization Schedule', filename: 'loan-amortization.pdf' },
    { id: 'export-sip-pdf', table: 'table-sip', title: 'SIP Investment Growth', filename: 'sip-growth.pdf' },
    { id: 'export-breakdown-pdf', table: 'table-breakdown', title: 'Yearly Financial Breakdown', filename: 'yearly-breakdown.pdf' }
  ];
  
  pdfButtons.forEach(({ id, table, title, filename }) => {
    const btn = $(id);
    if (btn) btn.onclick = () => exportTableToPDF(table, title, filename);
  });
}

// Share functionality
function createShareUrl() {
  const inputs = readInputs();
  const params = new URLSearchParams({
    salary: inputs.salaryMonthly,
    salaryPeriod: $('salary-period').value,
    salaryGrowth: inputs.salaryGrowth,
    monthlyExpenses: inputs.monthlyExpenses,
    carPrice: inputs.carPrice,
    interest: inputs.interest,
    tenure: inputs.tenure,
    dpMode: inputs.dpMode,
    downPayment: inputs.downPayment,
    emiBudget: inputs.emiBudget,
    sipMonthly: inputs.sipMonthly,
    sipStepup: inputs.sipStepup,
    investReturn: inputs.investReturn
  });
  
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function handleShare() {
  const shareUrl = createShareUrl();
  
  if (navigator.share) {
    navigator.share({
      title: 'Smart Money Planner - Car Loan & Investment Plan',
      text: 'Check out my financial planning calculations!',
      url: shareUrl
    }).catch(console.error);
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      const btn = $('btn-share');
      const originalText = btn.textContent;
      btn.textContent = 'Link Copied!';
      btn.style.background = '#00cc6a';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 2000);
    }).catch(() => {
      // Ultimate fallback: show URL in prompt
      prompt('Copy this link to share:', shareUrl);
    });
  }
}

function loadFromUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.size === 0) return;
  
  // Load values from URL parameters
  const salary = params.get('salary');
  const salaryPeriod = params.get('salaryPeriod');
  const salaryGrowth = params.get('salaryGrowth');
  const monthlyExpenses = params.get('monthlyExpenses');
  const carPrice = params.get('carPrice');
  const interest = params.get('interest');
  const tenure = params.get('tenure');
  const dpMode = params.get('dpMode') === 'true';
  const downPayment = params.get('downPayment');
  const emiBudget = params.get('emiBudget');
  const sipMonthly = params.get('sipMonthly');
  const sipStepup = params.get('sipStepup');
  const investReturn = params.get('investReturn');
  
  // Populate form fields
  if (salary) $('salary').value = salary;
  if (salaryPeriod) $('salary-period').value = salaryPeriod;
  if (salaryGrowth) $('salary-growth').value = salaryGrowth;
  if (monthlyExpenses) $('monthly-expenses').value = monthlyExpenses;
  if (carPrice) $('car-price').value = carPrice;
  if (interest) $('interest-rate').value = interest;
  if (tenure) $('loan-tenure').value = tenure;
  if (downPayment) $('down-payment').value = downPayment;
  if (emiBudget) $('emi-budget').value = emiBudget;
  if (sipMonthly) $('sip-monthly').value = sipMonthly;
  if (sipStepup) $('sip-stepup').value = sipStepup;
  if (investReturn) $('investment-return').value = investReturn;
  
  // Set toggle states
  if (dpMode) {
    toggleMode('dp');
  } else {
    toggleMode('emi');
  }
  
  // Auto-calculate if we have sufficient data
  if (salary && carPrice && interest && tenure) {
    setTimeout(() => {
      $('btn-calc').click();
    }, 100);
  }
}

function initForm() {
  $('planner-form').addEventListener('submit', handleCalculate);
  $('btn-reset').addEventListener('click', () => {
    // Clear URL parameters on reset
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.reload();
  });
  $('btn-share').addEventListener('click', handleShare);
  setupExportHandlers();
}

function init() {
  initToggles();
  initTabs();
  initForm();
  toggleMode('dp');
  loadFromUrlParams(); // Load shared parameters if any
}

document.addEventListener('DOMContentLoaded', init);
