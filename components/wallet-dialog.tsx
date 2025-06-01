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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addFunds, getWalletBalance, getTradingStats, type WalletBalance } from "../lib/wallet"
import { Wallet, TrendingUp, DollarSign, Activity } from "lucide-react"

interface WalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBalanceUpdated: () => void
}

export default function WalletDialog({ open, onOpenChange, onBalanceUpdated }: WalletDialogProps) {
  const [balance, setBalance] = useState<WalletBalance>({ usd: 0, lastUpdated: Date.now() })
  const [depositAmount, setDepositAmount] = useState("")
  const [isDepositing, setIsDepositing] = useState(false)
  const [stats, setStats] = useState({ totalTrades: 0, totalFees: 0, totalVolume: 0 })

  useEffect(() => {
    if (open) {
      loadWalletData()
    }
  }, [open])

  const loadWalletData = () => {
    const currentBalance = getWalletBalance()
    const tradingStats = getTradingStats()
    setBalance(currentBalance)
    setStats(tradingStats)
  }

  const handleDeposit = async () => {
    const amount = Number.parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) {
      return
    }

    setIsDepositing(true)
    try {
      const newBalance = addFunds(amount)
      setBalance(newBalance)
      setDepositAmount("")
      onBalanceUpdated()
    } catch (error) {
      console.error("Failed to deposit funds:", error)
    } finally {
      setIsDepositing(false)
    }
  }

  const handleQuickDeposit = (amount: number) => {
    setDepositAmount(amount.toString())
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/20 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Management
          </DialogTitle>
          <DialogDescription>Manage your trading funds and view statistics</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Balance */}
          <Card className="bg-gradient-to-br from-green-50/80 to-emerald-50/60 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(balance.usd)}</div>
              <p className="text-xs text-green-600 dark:text-green-400">
                Last updated: {new Date(balance.lastUpdated).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Trading Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/50 dark:bg-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Total Trades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{stats.totalTrades}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Total Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{formatCurrency(stats.totalVolume)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Add Funds */}
          <div className="space-y-4">
            <Label htmlFor="deposit-amount" className="text-sm font-medium">
              Add Funds
            </Label>

            {/* Quick deposit buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[100, 500, 1000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDeposit(amount)}
                  className="bg-white/50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-600"
                >
                  ${amount}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                id="deposit-amount"
                placeholder="Enter amount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="0"
                step="0.01"
                className="bg-white/50 dark:bg-slate-700/50"
              />
              <Button
                onClick={handleDeposit}
                disabled={!depositAmount || isDepositing}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 min-w-[80px]"
              >
                {isDepositing ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>

          {/* Fees Information */}
          <Card className="bg-slate-50/50 dark:bg-slate-800/50">
            <CardContent className="pt-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between items-center mb-2">
                  <span>Trading Fee:</span>
                  <span className="font-medium">0.1%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Fees Paid:</span>
                  <span className="font-medium">{formatCurrency(stats.totalFees)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
