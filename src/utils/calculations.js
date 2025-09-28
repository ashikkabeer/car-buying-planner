function toMonthlyRate(annualRatePercent) {
  const r = Number(annualRatePercent) / 100 / 12;
  return isFinite(r) ? r : 0;
}

export function calculateMonthlyEmi(principal, annualRatePercent, tenureYears) {
  const P = Math.max(0, Number(principal));
  const r = toMonthlyRate(annualRatePercent);
  const n = Math.max(0, Math.round(Number(tenureYears) * 12));
  if (n === 0) return 0;
  if (r === 0) return P / n;
  const pow = Math.pow(1 + r, n);
  return (P * r * pow) / (pow - 1);
}

export function calculatePrincipalFromEmi(emi, annualRatePercent, tenureYears) {
  const E = Math.max(0, Number(emi));
  const r = toMonthlyRate(annualRatePercent);
  const n = Math.max(0, Math.round(Number(tenureYears) * 12));
  if (n === 0) return 0;
  if (r === 0) return E * n;
  const pow = Math.pow(1 + r, n);
  return (E * (pow - 1)) / (r * pow);
}

export function calculateEmiFromDownPayment(carPrice, downPayment, annualRatePercent, tenureYears) {
  const principal = Math.max(0, Number(carPrice) - Math.max(0, Number(downPayment)));
  return calculateMonthlyEmi(principal, annualRatePercent, tenureYears);
}

export function calculateDownPaymentFromEmi(carPrice, emi, annualRatePercent, tenureYears) {
  const eligiblePrincipal = calculatePrincipalFromEmi(emi, annualRatePercent, tenureYears);
  const requiredDownPayment = Math.max(0, Number(carPrice) - eligiblePrincipal);
  return { eligiblePrincipal, requiredDownPayment };
}

export function amortizationScheduleYearly(principal, annualRatePercent, tenureYears) {
  const P0 = Math.max(0, Number(principal));
  const r = toMonthlyRate(annualRatePercent);
  const n = Math.max(0, Math.round(Number(tenureYears) * 12));
  const emi = n > 0 ? calculateMonthlyEmi(P0, annualRatePercent, tenureYears) : 0;

  let outstanding = P0;
  const yearly = [];
  let yearInterest = 0;
  let yearPrincipal = 0;
  let yearEmi = 0;

  for (let m = 1; m <= n; m += 1) {
    const interestComponent = outstanding * r;
    const principalComponent = Math.min(outstanding, emi - interestComponent);
    outstanding = Math.max(0, outstanding - principalComponent);

    yearInterest += interestComponent;
    yearPrincipal += principalComponent;
    yearEmi += emi;

    if (m % 12 === 0 || m === n) {
      const year = Math.ceil(m / 12);
      yearly.push({
        year,
        emiPaid: yearEmi,
        interestPaid: yearInterest,
        principalRepaid: yearPrincipal,
        outstanding,
      });
      yearInterest = 0;
      yearPrincipal = 0;
      yearEmi = 0;
    }
  }

  const totalInterest = yearly.reduce((s, y) => s + y.interestPaid, 0);
  return { emi, yearly, totalInterest };
}

export function sipFutureValueMonthly(monthlyInvestmentStart, annualReturnPercent, years, annualStepUpPercent) {
  const rMonthly = toMonthlyRate(annualReturnPercent) * 12 / 12; // toMonthlyRate already annual/12
  const n = Math.max(0, Math.round(Number(years) * 12));
  const stepUp = Math.max(0, Number(annualStepUpPercent)) / 100;
  let monthlyInvestment = Math.max(0, Number(monthlyInvestmentStart));
  let value = 0;
  const yearly = [];
  let contributedYear = 0;

  for (let m = 1; m <= n; m += 1) {
    // contribution at month start
    value = value * (1 + rMonthly) + monthlyInvestment;
    contributedYear += monthlyInvestment;

    if (m % 12 === 0 || m === n) {
      const year = Math.ceil(m / 12);
      yearly.push({ year, contributed: contributedYear, endValue: value });
      contributedYear = 0;
      // step up monthly investment for next year
      monthlyInvestment = monthlyInvestment * (1 + stepUp);
    }
  }
  return { yearly };
}

export function salaryProjectionAnnual(startMonthlySalary, annualGrowthPercent, years) {
  const g = Math.max(0, Number(annualGrowthPercent)) / 100;
  const baseMonthly = Math.max(0, Number(startMonthlySalary));
  const yearly = [];
  for (let y = 1; y <= Number(years); y += 1) {
    const factor = Math.pow(1 + g, y - 1);
    const annualSalary = baseMonthly * 12 * factor;
    yearly.push({ year: y, annualSalary });
  }
  return { yearly };
}

export function buildYearlyBreakdown({ years, monthlySalary, salaryGrowthPercent, monthlyExpenses, loanYearly, sipYearly }) {
  const salary = salaryProjectionAnnual(monthlySalary, salaryGrowthPercent, years).yearly;
  const expensesAnnual = Math.max(0, Number(monthlyExpenses)) * 12;

  const rows = [];
  for (let y = 1; y <= years; y += 1) {
    const s = salary.find(r => r.year === y)?.annualSalary ?? 0;
    const emi = loanYearly.find(r => r.year === y)?.emiPaid ?? 0;
    const sipContrib = sipYearly.find(r => r.year === y)?.contributed ?? 0;
    const savingsLeft = s - emi - sipContrib - expensesAnnual;
    rows.push({ year: y, salary: s, emi, sip: sipContrib, expenses: expensesAnnual, savingsLeft });
  }
  return rows;
}
