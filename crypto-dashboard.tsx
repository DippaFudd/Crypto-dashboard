"use client"

import { useEffect, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Activity,
  Wallet,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculatePortfolio, getTopCryptos, type Portfolio, type PortfolioHolding, type Transaction } from "./lib/api"
import AddTransactionDialog from "./components/add-transaction-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { initializeWallet, getWalletBalance, getTrades, type WalletBalance } from "./lib/wallet"
import WalletDialog from "./components/wallet-dialog"
import TradeDialog from "./components/trade-dialog"

export default function CryptoDashboard() {
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [topCryptos, setTopCryptos] = useState<any[]>([])
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([])
  const [portfolio, setPortfolio] = useState<Portfolio>({
    totalValue: 0,
    totalChange: 0,
    totalChangeAmount: 0,
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bestPerformer, setBestPerformer] = useState<PortfolioHolding | null>(null)
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({ usd: 0, lastUpdated: Date.now() })
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [isTradeOpen, setIsTradeOpen] = useState(false)
  const [selectedCoinForTrade, setSelectedCoinForTrade] = useState<any>(null)

  // Load data on first render
  useEffect(() => {
    loadAllData()
  }, [])

  // Function to refresh all data
  const loadAllData = async () => {
    setIsLoading(true)
    try {
      // Initialize wallet
      const wallet = initializeWallet()
      setWalletBalance(wallet)

      // Load portfolio data (update to use trades instead of transactions)
      const portfolioData = await calculatePortfolio()
      setHoldings(portfolioData.holdings)
      setPortfolio(portfolioData.portfolio)

      // Find the best performer
      if (portfolioData.holdings.length > 0) {
        const best = [...portfolioData.holdings].sort((a, b) => b.change24h - a.change24h)[0]
        setBestPerformer(best)
      }

      // Load top cryptocurrencies
      const topCoins = await getTopCryptos(10)
      setTopCryptos(topCoins)

      // Load trades (instead of transactions)
      const trades = getTrades()
      trades.sort((a, b) => b.timestamp - a.timestamp)
      setTransactions(trades)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Format helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`
  }

  // Filter cryptocurrencies based on search term
  const filteredTopCryptos = topCryptos.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Get coin color based on symbol to keep consistent colors
  const getCoinColor = (symbol: string) => {
    const colors = [
      "from-orange-400 to-orange-600",
      "from-blue-400 to-blue-600",
      "from-indigo-400 to-indigo-600",
      "from-purple-400 to-purple-600",
      "from-pink-400 to-pink-600",
      "from-yellow-400 to-yellow-600",
      "from-green-400 to-green-600",
      "from-red-400 to-red-600",
      "from-cyan-400 to-cyan-600",
      "from-emerald-400 to-emerald-600",
    ]

    // Simple hash function to map symbol to a consistent color
    const hash = symbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

    return colors[hash % colors.length]
  }

  const handleOpenTrade = (coin: any) => {
    setSelectedCoinForTrade(coin)
    setIsTradeOpen(true)
  }

  const handleTradeExecuted = () => {
    loadAllData()
  }

  const handleWalletUpdated = () => {
    const wallet = getWalletBalance()
    setWalletBalance(wallet)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Crypto Portfolio
                </h1>
                <p className="text-slate-600 dark:text-slate-400 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Track your cryptocurrency investments</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-slate-600 dark:text-slate-400">Wallet Balance</div>
              <div className="font-bold text-lg">{formatCurrency(walletBalance.usd)}</div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsWalletOpen(true)}
              className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Wallet
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => setIsAddingTransaction(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          <Card className="md:col-span-2 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-xl border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Total Portfolio Value
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all duration-300"
              >
                {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-40 mb-2" />
              ) : (
                <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {balanceVisible ? formatCurrency(portfolio.totalValue) : "••••••"}
                </div>
              )}

              {isLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <div className="flex items-center space-x-2 text-sm mt-2">
                  {portfolio.totalChange >= 0 ? (
                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                      <TrendingUp className="w-4 h-4 animate-bounce" />
                      <span className="font-semibold">
                        {formatPercentage(portfolio.totalChange)} ({formatCurrency(portfolio.totalChangeAmount)})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <TrendingDown className="w-4 h-4 animate-bounce" />
                      <span className="font-semibold">
                        {formatPercentage(portfolio.totalChange)} ({formatCurrency(portfolio.totalChangeAmount)})
                      </span>
                    </div>
                  )}
                  <span className="text-slate-500">24h</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50/80 to-emerald-50/60 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-xl border-green-200/50 dark:border-green-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Best Performer</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading || !bestPerformer ? (
                <>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200">{bestPerformer.symbol}</div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {formatPercentage(bestPerformer.change24h)} today
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/20 shadow-lg">
            <TabsTrigger
              value="portfolio"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300"
            >
              Portfolio
            </TabsTrigger>
            <TabsTrigger
              value="markets"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300"
            >
              Markets
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300"
            >
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Your Holdings
                </CardTitle>
                <CardDescription>Current cryptocurrency positions in your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex w-full items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : holdings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      You don't have any holdings yet. Add a transaction to get started.
                    </p>
                    <Button
                      onClick={() => setIsAddingTransaction(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Your First Transaction
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200/50 dark:border-slate-700/50">
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Asset</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Amount</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Price</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">24h Change</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">
                          Value
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holdings.map((holding, index) => (
                        <TableRow
                          key={holding.id}
                          className="border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all duration-300 group"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              {holding.image ? (
                                <img
                                  src={holding.image || "/placeholder.svg"}
                                  alt={holding.name}
                                  className="w-10 h-10 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div
                                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCoinColor(holding.symbol)} flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                                >
                                  {holding.symbol.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-slate-100">{holding.symbol}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">{holding.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{holding.amount.toLocaleString()}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(holding.price)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={holding.change24h >= 0 ? "default" : "destructive"}
                              className={`${
                                holding.change24h >= 0
                                  ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300 border-green-300"
                                  : "bg-gradient-to-r from-red-100 to-red-200 text-red-800 hover:from-red-200 hover:to-red-300 border-red-300"
                              } transition-all duration-300 hover:scale-105 shadow-sm`}
                            >
                              {holding.change24h >= 0 ? (
                                <ArrowUp className="w-3 h-3 mr-1 animate-pulse" />
                              ) : (
                                <ArrowDown className="w-3 h-3 mr-1 animate-pulse" />
                              )}
                              {formatPercentage(holding.change24h)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(holding.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="markets" className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Market Overview
                </CardTitle>
                <CardDescription>Top cryptocurrencies by market capitalization</CardDescription>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search cryptocurrencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-white/30 focus:border-blue-400 transition-all duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex w-full items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200/50 dark:border-slate-700/50">
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Rank</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Name</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Price</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">24h Change</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">
                          Market Cap
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTopCryptos.map((crypto, index) => (
                        <TableRow
                          key={crypto.id}
                          className="border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all duration-300 group"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <TableCell className="font-bold text-slate-600 dark:text-slate-400">
                            #{crypto.market_cap_rank}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {crypto.image ? (
                                <img
                                  src={crypto.image || "/placeholder.svg"}
                                  alt={crypto.name}
                                  className="w-10 h-10 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div
                                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCoinColor(crypto.symbol)} flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                                >
                                  {crypto.symbol.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {crypto.symbol.toUpperCase()}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">{crypto.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(crypto.current_price)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={crypto.price_change_percentage_24h >= 0 ? "default" : "destructive"}
                              className={`${
                                crypto.price_change_percentage_24h >= 0
                                  ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300 border-green-300"
                                  : "bg-gradient-to-r from-red-100 to-red-200 text-red-800 hover:from-red-200 hover:to-red-300 border-red-300"
                              } transition-all duration-300 hover:scale-105 shadow-sm`}
                            >
                              {crypto.price_change_percentage_24h >= 0 ? (
                                <ArrowUp className="w-3 h-3 mr-1 animate-pulse" />
                              ) : (
                                <ArrowDown className="w-3 h-3 mr-1 animate-pulse" />
                              )}
                              {formatPercentage(crypto.price_change_percentage_24h)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            ${(crypto.market_cap / 1000000000).toFixed(1)}B
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleOpenTrade(crypto)}
                              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                            >
                              Trade
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Recent Transactions
                </CardTitle>
                <CardDescription>Your latest buy and sell orders</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex w-full items-center space-x-4">
                        <Skeleton className="h-6 w-16" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      You haven't made any transactions yet. Add a transaction to get started.
                    </p>
                    <Button
                      onClick={() => setIsAddingTransaction(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Your First Transaction
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200/50 dark:border-slate-700/50">
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Type</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Asset</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Amount</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Price</TableHead>
                        <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Total</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">
                          Date
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction, index) => (
                        <TableRow
                          key={transaction.id}
                          className="border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all duration-300"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <TableCell>
                            <Badge
                              variant={transaction.type === "buy" ? "default" : "outline"}
                              className={`${
                                transaction.type === "buy"
                                  ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300 border-green-300"
                                  : "bg-gradient-to-r from-red-100 to-red-200 text-red-800 hover:from-red-200 hover:to-red-300 border-red-300"
                              } transition-all duration-300 hover:scale-105 shadow-sm font-semibold`}
                            >
                              {transaction.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                            {transaction.symbol.toUpperCase()}
                          </TableCell>
                          <TableCell className="font-medium">{transaction.amount}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(transaction.price)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(transaction.total)}</TableCell>
                          <TableCell className="text-right">
                            <div className="text-sm">
                              <div className="font-medium text-slate-900 dark:text-slate-100">{transaction.date}</div>
                              <div className="text-slate-500 dark:text-slate-400">{transaction.time}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Wallet Dialog */}
      <WalletDialog open={isWalletOpen} onOpenChange={setIsWalletOpen} onBalanceUpdated={handleWalletUpdated} />

      {/* Trade Dialog */}
      <TradeDialog
        open={isTradeOpen}
        onOpenChange={setIsTradeOpen}
        coin={selectedCoinForTrade}
        onTradeExecuted={handleTradeExecuted}
      />

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={isAddingTransaction}
        onOpenChange={setIsAddingTransaction}
        onTransactionAdded={loadAllData}
      />
    </div>
  )
}
