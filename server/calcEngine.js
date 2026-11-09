// ============================================================
// APP MODEL — Calculation Engine (OTC, MRC)
// ============================================================

function safeDiv(num, den) {
  if (!den || den === 0) return null
  return num / den
}

function fmtNum(n) {
  if (n === null || n === undefined || isNaN(n)) return null
  return Math.round(n * 100) / 100
}

function fmtMoney(n, cur = 'Rp') {
  if (n === null || n === undefined || isNaN(n)) return cur === '$' ? '$0.00' : 'Rp0'
  if (cur === '$') return '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return 'Rp' + Math.round(n).toLocaleString('id-ID')
}

function fmtBEP(n) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return (Math.round(n * 100) / 100).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function calculate(input, bepThreshold = 10) {
  const {
    scheme, totalUnit, programPeriod, cogs,
    otcPrice = 0, dailyFee = 0, dailyIncentive = 0,
    setupFee = 0,
    activeDays = 22, activeRate = 50
  } = input

  const cur = input.currency === 'usd' ? '$' : 'Rp'
  const numSetupFee = Number(setupFee) || 0
  const activeRatePct = activeRate / 100
  const grossMRC = dailyFee * activeDays
  const salesIncentivePerMonth = dailyIncentive * activeDays
  const netMRC = grossMRC - salesIncentivePerMonth
  const expectedNetMRC = netMRC * activeRatePct
  const avgActiveUnits = totalUnit * activeRatePct

  let result = {
    scheme, totalUnit, programPeriod, cogs,
    setupFee: fmtNum(numSetupFee),
    grossMRC: fmtNum(grossMRC),
    salesIncentivePerMonth: fmtNum(salesIncentivePerMonth),
    netMRC: fmtNum(netMRC),
    expectedNetMRC: fmtNum(expectedNetMRC),
    avgActiveUnits: fmtNum(avgActiveUnits),
    totalRevenue: 0, totalCost: 0, totalMargin: 0,
    marginPerDevice: 0, marginPct: null,
    bepMonths: null, bepLabel: '',
    feasibility: '', feasibilityReason: '',
    breakdown: []
  }

  if (scheme === 'otc') {
    const totalOTCRevenue = otcPrice * totalUnit
    const totalCost = cogs * totalUnit
    const marginPerDevice = otcPrice - cogs
    const totalMargin = totalOTCRevenue - totalCost
    const marginPct = safeDiv(totalMargin, totalCost)

    let bepMonths, bepLabel, feasibility, feasibilityReason

    if (otcPrice >= cogs) {
      bepMonths = 0
      bepLabel = 'Immediate / Month 0'
      feasibility = 'layak'
      feasibilityReason = 'OTC price covers COGS from the start.'
    } else {
      bepMonths = null
      bepLabel = 'Not Reached'
      feasibility = 'tidak_layak'
      feasibilityReason = 'OTC price is below COGS with no recurring income to cover the deficit.'
    }

    Object.assign(result, {
      totalRevenue: fmtNum(totalOTCRevenue),
      totalCost: fmtNum(totalCost),
      totalMargin: fmtNum(totalMargin),
      marginPerDevice: fmtNum(marginPerDevice),
      marginPct: fmtNum(marginPct !== null ? marginPct * 100 : null),
      bepMonths, bepLabel, feasibility, feasibilityReason,
      breakdown: [
        `Total OTC Revenue = OTC Price (${fmtMoney(otcPrice, cur)}) × Total Unit (${totalUnit}) = ${fmtMoney(totalOTCRevenue, cur)}`,
        `Total Cost = COGS (${fmtMoney(cogs, cur)}) × Total Unit (${totalUnit}) = ${fmtMoney(totalCost, cur)}`,
        `Margin per Device = OTC Price - COGS = ${fmtMoney(marginPerDevice, cur)}`,
        `Total Margin = ${fmtMoney(totalMargin, cur)}`,
        `BEP: ${bepLabel}`
      ]
    })
  }

  else if (scheme === 'mrc') {
    const remainingCogs = Math.max(0, cogs - numSetupFee)
    const marginPerDevice = numSetupFee + (expectedNetMRC * programPeriod) - cogs
    const totalMargin = marginPerDevice * totalUnit
    // Total Revenue = Setup Fee upfront revenue + recurring Net MRC revenue
    const totalMRCRevenue = (numSetupFee * totalUnit) + (netMRC * activeRatePct * programPeriod * totalUnit)
    const totalCost = cogs * totalUnit
    const marginPct = safeDiv(totalMargin, totalCost)

    let bepMonths = null
    let bepLabel, feasibility, feasibilityReason

    if (numSetupFee >= cogs && cogs > 0) {
      bepMonths = 0
      bepLabel = 'Immediate / Month 0'
      feasibility = 'layak'
      feasibilityReason = 'Setup Fee (DP) di awal sudah menutup seluruh modal COGS sejak hari pertama.'
    } else if (expectedNetMRC <= 0) {
      bepMonths = null
      bepLabel = 'Not Reached'
      feasibility = 'tidak_layak'
      feasibilityReason = 'Expected Net MRC is zero or negative, BEP cannot be reached.'
    } else {
      bepMonths = safeDiv(remainingCogs, expectedNetMRC)
      if (bepMonths === null) {
        bepLabel = 'Not Reached'
        feasibility = 'tidak_layak'
        feasibilityReason = 'Expected Net MRC is zero or negative, BEP cannot be reached.'
      } else if (bepMonths < bepThreshold) {
        bepLabel = `${fmtBEP(bepMonths)} months`
        feasibility = 'layak'
        feasibilityReason = `BEP ${fmtBEP(bepMonths)} months, below the feasibility threshold of ${bepThreshold} months.`
      } else {
        bepLabel = `${fmtBEP(bepMonths)} months`
        feasibility = 'tidak_layak'
        feasibilityReason = `BEP ${fmtBEP(bepMonths)} months. Exceeds the financial feasibility threshold of ${bepThreshold} months.`
      }
    }

    const breakdownSteps = [
      `Gross MRC/active device/month = Daily Fee (${fmtMoney(dailyFee, cur)}) × Active Days (${activeDays}) = ${fmtMoney(grossMRC, cur)}`,
      `Sales Incentive/active device/month = Daily Incentive (${fmtMoney(dailyIncentive, cur)}) × Active Days (${activeDays}) = ${fmtMoney(salesIncentivePerMonth, cur)}`,
      `Net MRC/active device/month = Gross MRC - Incentive = ${fmtMoney(netMRC, cur)}`,
      `Expected Net MRC/deployed device/month = Net MRC × Active Rate (${activeRate}%) = ${fmtMoney(expectedNetMRC, cur)}`
    ]

    if (numSetupFee > 0) {
      breakdownSteps.push(`Setup Fee (DP) per Device = ${fmtMoney(numSetupFee, cur)}`)
      breakdownSteps.push(`Sisa COGS yang perlu ditutup = COGS (${fmtMoney(cogs, cur)}) - Setup Fee (${fmtMoney(numSetupFee, cur)}) = ${fmtMoney(remainingCogs, cur)}`)
      breakdownSteps.push(`BEP = Sisa COGS (${fmtMoney(remainingCogs, cur)}) ÷ Expected Net MRC (${fmtMoney(expectedNetMRC, cur)}) = ${bepMonths !== null ? fmtBEP(bepMonths) + ' months' : 'Not Reached'}`)
      breakdownSteps.push(`Margin per Device = Setup Fee (${fmtMoney(numSetupFee, cur)}) + (Expected Net MRC × ${programPeriod} months) - COGS (${fmtMoney(cogs, cur)}) = ${fmtMoney(marginPerDevice, cur)}`)
    } else {
      breakdownSteps.push(`BEP = COGS (${fmtMoney(cogs, cur)}) ÷ Expected Net MRC (${fmtMoney(expectedNetMRC, cur)}) = ${bepMonths !== null ? fmtBEP(bepMonths) + ' months' : 'Not Reached'}`)
      breakdownSteps.push(`Margin per Device = (Expected Net MRC × ${programPeriod} months) - COGS (${fmtMoney(cogs, cur)}) = ${fmtMoney(marginPerDevice, cur)}`)
    }

    breakdownSteps.push(`Total Margin = Margin per Device (${fmtMoney(marginPerDevice, cur)}) × Total Unit (${totalUnit}) = ${fmtMoney(totalMargin, cur)}`)

    Object.assign(result, {
      totalRevenue: fmtNum(totalMRCRevenue),
      totalCost: fmtNum(totalCost),
      totalMargin: fmtNum(totalMargin),
      marginPerDevice: fmtNum(marginPerDevice),
      marginPct: fmtNum(marginPct !== null ? marginPct * 100 : null),
      bepMonths: bepMonths !== null ? fmtNum(bepMonths) : null,
      bepLabel, feasibility, feasibilityReason,
      breakdown: breakdownSteps
    })
  }

  return result
}

export function validateInput(input) {
  const errors = []
  if (!input.totalUnit || input.totalUnit <= 0) errors.push('Total unit must be greater than 0.')
  if (input.cogs < 0) errors.push('COGS cannot be negative.')
  if (input.otcPrice < 0) errors.push('OTC price cannot be negative.')
  if (input.setupFee < 0) errors.push('Setup fee / DP cannot be negative.')
  if (input.dailyFee < 0) errors.push('Daily fee cannot be negative.')
  if (input.dailyIncentive < 0) errors.push('Daily incentive cannot be negative.')
  if (input.activeDays < 1 || input.activeDays > 31) errors.push('Active days must be between 1 and 31.')
  if (input.activeRate < 0 || input.activeRate > 100) errors.push('Active device rate must be between 0 and 100%.')
  if (input.programPeriod <= 0) errors.push('Program period must be greater than 0.')
  if (input.dailyIncentive > input.dailyFee) errors.push('Daily incentive exceeds daily fee — please verify.')
  return errors
}
