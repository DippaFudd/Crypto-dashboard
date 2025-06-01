// CoinGecko API functions
const API_BASE_URL = "https://api.coingecko.com/api/v3"

export interface Coin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  price_change_percentage_24h: number
  price_change_24h: number
  total_volume: number
}

export interface Portfolio {
  totalValue: number
  totalChange: number
  totalChangeAmount: number
}

export interface PortfolioHolding {
  id: string
  symbol: string
  name: string
  amount: number
  price: number
  change24h: number
  value: number
  image: string
}

export interface Transaction {
  id: string
  type: "buy" | "sell"
  coinId: string
  symbol: string
  name: string
  amount: number
  price: number
  total: number
  date: string
  time: string
  timestamp: number
}

// Get top cryptocurrencies
export const getTopCryptos = async (limit = 10): Promise<Coin[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`,
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to fetch top cryptocurrencies:", error)
    return []
  }
}

// Get specific coin data by ID
export const getCoinData = async (coinId: string): Promise<Coin | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to fetch data for ${coinId}:`, error)
    return null
  }
}

// Local storage functions for portfolio

// Save transactions to local storage
export const saveTransaction = (transaction: Transaction): void => {
  try {
    const storedTransactions = localStorage.getItem("crypto_transactions")
    const transactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : []

    transactions.push(transaction)
    localStorage.setItem("crypto_transactions", JSON.stringify(transactions))
  } catch (error) {
    console.error("Failed to save transaction:", error)
  }
}

// Get all stored transactions
export const getTransactions = (): Transaction[] => {
  try {
    const storedTransactions = localStorage.getItem("crypto_transactions")
    return storedTransactions ? JSON.parse(storedTransactions) : []
  } catch (error) {
    console.error("Failed to get transactions:", error)
    return []
  }
}

// Calculate portfolio holdings based on trades
export const calculatePortfolio = async (): Promise<{
  holdings: PortfolioHolding[]
  portfolio: Portfolio
}> => {
  // Import getTrades from wallet module
  const { getTrades } = await import("./wallet")
  const trades = getTrades()
  const coinHoldings = new Map<string, { amount: number; symbol: string; name: string; coinId: string }>()

  // Calculate net holdings for each coin
  trades.forEach((trade) => {
    const current = coinHoldings.get(trade.coinId) || {
      amount: 0,
      symbol: trade.symbol,
      name: trade.name,
      coinId: trade.coinId,
    }

    if (trade.type === "buy") {
      current.amount += trade.amount
    } else {
      current.amount -= trade.amount
    }

    coinHoldings.set(trade.coinId, current)
  })

  // Filter out coins with zero or negative balance
  const holdingsArray = Array.from(coinHoldings.values()).filter((holding) => holding.amount > 0)

  // No holdings
  if (holdingsArray.length === 0) {
    return {
      holdings: [],
      portfolio: { totalValue: 0, totalChange: 0, totalChangeAmount: 0 },
    }
  }

  // Fetch current prices for all coins in portfolio
  try {
    const coinIds = holdingsArray.map((holding) => holding.coinId).join(",")
    const response = await fetch(
      `${API_BASE_URL}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const coinsData: Coin[] = await response.json()

    // Map coin data to holdings
    const holdings = holdingsArray.map((holding) => {
      const coinData = coinsData.find((coin) => coin.id === holding.coinId)

      if (!coinData) {
        return {
          id: holding.coinId,
          symbol: holding.symbol.toUpperCase(),
          name: holding.name,
          amount: holding.amount,
          price: 0,
          change24h: 0,
          value: 0,
          image: "",
        }
      }

      const value = holding.amount * coinData.current_price

      return {
        id: holding.coinId,
        symbol: holding.symbol.toUpperCase(),
        name: holding.name,
        amount: holding.amount,
        price: coinData.current_price,
        change24h: coinData.price_change_percentage_24h || 0,
        value: value,
        image: coinData.image,
      }
    })

    // Calculate portfolio totals
    const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0)

    // Calculate weighted average 24h change
    const totalValueYesterday = holdings.reduce((sum, holding) => {
      const valueYesterday = holding.value / (1 + holding.change24h / 100)
      return sum + valueYesterday
    }, 0)

    const totalChange = totalValueYesterday > 0 ? ((totalValue - totalValueYesterday) / totalValueYesterday) * 100 : 0
    const totalChangeAmount = totalValue - totalValueYesterday

    // Sort holdings by value
    holdings.sort((a, b) => b.value - a.value)

    return {
      holdings,
      portfolio: {
        totalValue,
        totalChange,
        totalChangeAmount,
      },
    }
  } catch (error) {
    console.error("Failed to calculate portfolio:", error)
    return {
      holdings: [],
      portfolio: { totalValue: 0, totalChange: 0, totalChangeAmount: 0 },
    }
  }
}

// Search coins by query
export const searchCoins = async (query: string): Promise<Coin[]> => {
  if (!query || query.length < 2) return []

  try {
    const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const coins = data.coins.slice(0, 10)

    // Get more detailed data for these coins
    if (coins.length > 0) {
      const ids = coins.map((coin: any) => coin.id).join(",")
      const detailedResponse = await fetch(
        `${API_BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
      )

      if (!detailedResponse.ok) {
        throw new Error(`API error: ${detailedResponse.status}`)
      }

      return await detailedResponse.json()
    }

    return []
  } catch (error) {
    console.error("Failed to search coins:", error)
    return []
  }
}
