// Wallet management functions for localStorage

export interface WalletBalance {
  usd: number
  lastUpdated: number
}

export interface Trade {
  id: string
  type: "buy" | "sell"
  coinId: string
  symbol: string
  name: string
  amount: number
  price: number
  total: number
  fee: number
  date: string
  time: string
  timestamp: number
}

const WALLET_KEY = "crypto_wallet_balance"
const TRADES_KEY = "crypto_trades"
const TRADING_FEE = 0.001 // 0.1% trading fee

// Initialize wallet with starting balance
export const initializeWallet = (): WalletBalance => {
  const existingWallet = getWalletBalance()
  if (existingWallet.usd === 0) {
    const initialBalance: WalletBalance = {
      usd: 10000, // Starting with $10,000
      lastUpdated: Date.now(),
    }
    saveWalletBalance(initialBalance)
    return initialBalance
  }
  return existingWallet
}

// Get wallet balance from localStorage
export const getWalletBalance = (): WalletBalance => {
  try {
    const stored = localStorage.getItem(WALLET_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    return { usd: 0, lastUpdated: Date.now() }
  } catch (error) {
    console.error("Failed to get wallet balance:", error)
    return { usd: 0, lastUpdated: Date.now() }
  }
}

// Save wallet balance to localStorage
export const saveWalletBalance = (balance: WalletBalance): void => {
  try {
    localStorage.setItem(WALLET_KEY, JSON.stringify(balance))
  } catch (error) {
    console.error("Failed to save wallet balance:", error)
  }
}

// Add funds to wallet
export const addFunds = (amount: number): WalletBalance => {
  const currentBalance = getWalletBalance()
  const newBalance: WalletBalance = {
    usd: currentBalance.usd + amount,
    lastUpdated: Date.now(),
  }
  saveWalletBalance(newBalance)
  return newBalance
}

// Execute a trade (buy or sell)
export const executeTrade = (
  type: "buy" | "sell",
  coinId: string,
  symbol: string,
  name: string,
  amount: number,
  price: number,
): { success: boolean; error?: string; trade?: Trade } => {
  try {
    const currentBalance = getWalletBalance()
    const total = amount * price
    const fee = total * TRADING_FEE

    if (type === "buy") {
      const totalCost = total + fee
      if (currentBalance.usd < totalCost) {
        return {
          success: false,
          error: `Insufficient funds. You need $${totalCost.toFixed(2)} but only have $${currentBalance.usd.toFixed(2)}`,
        }
      }

      // Deduct from USD balance
      const newBalance: WalletBalance = {
        usd: currentBalance.usd - totalCost,
        lastUpdated: Date.now(),
      }
      saveWalletBalance(newBalance)
    } else {
      // For sell orders, check if user has enough of the cryptocurrency
      const holdings = getCryptoHoldings()
      const holding = holdings.get(coinId)

      if (!holding || holding.amount < amount) {
        return {
          success: false,
          error: `Insufficient ${symbol.toUpperCase()}. You need ${amount} but only have ${holding?.amount || 0}`,
        }
      }

      // Add to USD balance (minus fee)
      const totalReceived = total - fee
      const newBalance: WalletBalance = {
        usd: currentBalance.usd + totalReceived,
        lastUpdated: Date.now(),
      }
      saveWalletBalance(newBalance)
    }

    // Create trade record
    const now = new Date()
    const trade: Trade = {
      id: `trade-${Date.now()}`,
      type,
      coinId,
      symbol,
      name,
      amount,
      price,
      total,
      fee,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0].substring(0, 5),
      timestamp: now.getTime(),
    }

    // Save trade
    saveTrade(trade)

    return { success: true, trade }
  } catch (error) {
    console.error("Failed to execute trade:", error)
    return { success: false, error: "Failed to execute trade" }
  }
}

// Save trade to localStorage
export const saveTrade = (trade: Trade): void => {
  try {
    const storedTrades = localStorage.getItem(TRADES_KEY)
    const trades: Trade[] = storedTrades ? JSON.parse(storedTrades) : []
    trades.push(trade)
    localStorage.setItem(TRADES_KEY, JSON.stringify(trades))
  } catch (error) {
    console.error("Failed to save trade:", error)
  }
}

// Get all trades
export const getTrades = (): Trade[] => {
  try {
    const storedTrades = localStorage.getItem(TRADES_KEY)
    return storedTrades ? JSON.parse(storedTrades) : []
  } catch (error) {
    console.error("Failed to get trades:", error)
    return []
  }
}

// Get cryptocurrency holdings from trades
export const getCryptoHoldings = (): Map<string, { amount: number; symbol: string; name: string }> => {
  const trades = getTrades()
  const holdings = new Map<string, { amount: number; symbol: string; name: string }>()

  trades.forEach((trade) => {
    const current = holdings.get(trade.coinId) || {
      amount: 0,
      symbol: trade.symbol,
      name: trade.name,
    }

    if (trade.type === "buy") {
      current.amount += trade.amount
    } else {
      current.amount -= trade.amount
    }

    holdings.set(trade.coinId, current)
  })

  return holdings
}

// Get trading statistics
export const getTradingStats = () => {
  const trades = getTrades()
  const totalTrades = trades.length
  const totalFees = trades.reduce((sum, trade) => sum + trade.fee, 0)
  const totalVolume = trades.reduce((sum, trade) => sum + trade.total, 0)

  return {
    totalTrades,
    totalFees,
    totalVolume,
  }
}
