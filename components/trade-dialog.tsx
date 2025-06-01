"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { executeTrade, getWalletBalance, getCryptoHoldings } from "../lib/wallet"
import type { Coin } from "../lib/api"
import { cn } from "@/lib/utils"
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"

interface TradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coin: Coin | null
  onTradeExecuted: () => void
}

export default function TradeDialog({ open, onOpenChange, coin, onTradeExecuted }: TradeDialogProps) {
  const [type, setType] = useState<"buy" | "sell">("buy")
  const [amount, setAmount] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState("")
  const [walletBalance, setWalletBalance] = useState(0)
  const [cryptoHoldings, setCryptoHoldings] = useState(new Map())

  useEffect(() => {
    if (open && coin) {
      loadBalances()
      setAmount("")
      setError("")
      setType("buy")
    }
  }, [open, coin])

  const loadBalances = () => {
    const balance = getWalletBalance()
    const holdings = getCryptoHoldings()
    setWalletBalance(balance.usd)
    setCryptoHoldings(holdings)
  }

  const handleTrade = async () => {
    if (!coin || !amount) return

    setIsExecuting(true)
    setError("")

    try {
      const amountValue = Number.parseFloat(amount)
      if (isNaN(amountValue) || amountValue <= 0) {
        setError("Please enter a valid amount")
        return
      }

      const result = executeTrade(type, coin.id, coin.symbol, coin.name, amountValue, coin.current_price)

      if (result.success) {
        onTradeExecuted()
        onOpenChange(false)
      } else {
        setError(result.error || "Trade failed")
      }
    } catch (err) {
      setError("An error occurred while executing the trade")
    } finally {
      setIsExecuting(false)
    }
  }

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

  if (!coin) return null

  const amountValue = Number.parseFloat(amount) || 0
  const total = amountValue * coin.current_price
  const fee = total * 0.001 // 0.1% fee
  const totalCost = type === "buy" ? total + fee : total - fee

  const currentHolding = cryptoHoldings.get(coin.id)
  const availableToSell = currentHolding?.amount || 0

  const canExecute = amountValue > 0 && (type === "buy" ? walletBalance >= totalCost : availableToSell >= amountValue)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/20 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Trade {coin.name}
          </DialogTitle>
          <DialogDescription>Execute a trade at current market price</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Coin Info */}
          <Card className="bg-slate-50/50 dark:bg-slate-800/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-3">
                <img src={coin.image || "/placeholder.svg"} alt={coin.name} className="w-10 h-10 rounded-full" />
                <div>
                  <div className="font-semibold">{coin.symbol.toUpperCase()}</div>
                  <div className="text-sm text-slate-500">{coin.name}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-bold">{formatCurrency(coin.current_price)}</div>
                  <Badge
                    variant={coin.price_change_percentage_24h >= 0 ? "default" : "destructive"}
                    className={`text-xs ${
                      coin.price_change_percentage_24h >= 0
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-red-100 text-red-800 border-red-300"
                    }`}
                  >
                    {coin.price_change_percentage_24h >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {formatPercentage(coin.price_change_percentage_24h)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trade Type */}
          <div>
            <Label className="mb-2 block">Trade Type</Label>
            <RadioGroup value={type} onValueChange={(value) => setType(value as "buy" | "sell")} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="buy" id="buy" />
                <Label
                  htmlFor="buy"
                  className={cn("font-medium", type === "buy" ? "text-green-600 dark:text-green-400" : "")}
                >
                  Buy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sell" id="sell" />
                <Label
                  htmlFor="sell"
                  className={cn("font-medium", type === "sell" ? "text-red-600 dark:text-red-400" : "")}
                >
                  Sell
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({coin.symbol.toUpperCase()})</Label>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
              className="bg-white/50 dark:bg-slate-700/50"
            />
            {type === "sell" && (
              <div className="text-sm text-slate-500">
                Available: {availableToSell.toLocaleString()} {coin.symbol.toUpperCase()}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {amountValue > 0 && (
            <Card className="bg-slate-50/50 dark:bg-slate-800/50">
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">
                      {amountValue} {coin.symbol.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">{formatCurrency(coin.current_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fee (0.1%):</span>
                    <span className="font-medium">{formatCurrency(fee)}</span>
                  </div>
                  <hr className="border-slate-200 dark:border-slate-700" />
                  <div className="flex justify-between font-bold">
                    <span>Total {type === "buy" ? "Cost" : "Received"}:</span>
                    <span>{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Balance Info */}
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>USD Balance:</span>
              <span className="font-medium">{formatCurrency(walletBalance)}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExecuting}>
            Cancel
          </Button>
          <Button
            onClick={handleTrade}
            disabled={!canExecute || isExecuting}
            className={cn(
              "transition-all duration-300",
              type === "buy"
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                : "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700",
            )}
          >
            {isExecuting ? "Executing..." : `${type === "buy" ? "Buy" : "Sell"} ${coin.symbol.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
