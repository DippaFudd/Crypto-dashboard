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
import { type Coin, searchCoins } from "../lib/api"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { executeTrade } from "../lib/wallet"

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransactionAdded: () => void
}

export default function AddTransactionDialog({ open, onOpenChange, onTransactionAdded }: AddTransactionDialogProps) {
  const [type, setType] = useState<"buy" | "sell">("buy")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Coin[]>([])
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null)
  const [amount, setAmount] = useState("")
  const [price, setPrice] = useState("")
  const [openCoinSearch, setOpenCoinSearch] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Handle search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true)
        const results = await searchCoins(searchQuery)
        setSearchResults(results)
        setIsSearching(false)
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  // Update price when coin is selected
  useEffect(() => {
    if (selectedCoin) {
      setPrice(selectedCoin.current_price.toString())
    }
  }, [selectedCoin])

  const handleSubmit = async () => {
    if (!selectedCoin || !amount || !price) {
      setError("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const amountValue = Number.parseFloat(amount)
      const priceValue = Number.parseFloat(price)

      if (isNaN(amountValue) || isNaN(priceValue) || amountValue <= 0 || priceValue <= 0) {
        setError("Invalid amount or price")
        return
      }

      // Use the trading system instead of just recording transactions
      const result = executeTrade(
        type,
        selectedCoin.id,
        selectedCoin.symbol,
        selectedCoin.name,
        amountValue,
        priceValue,
      )

      if (result.success) {
        resetForm()
        onTransactionAdded()
        onOpenChange(false)
      } else {
        setError(result.error || "Transaction failed")
      }
    } catch (error) {
      console.error("Error adding transaction:", error)
      setError("An error occurred while processing your transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setType("buy")
    setSearchQuery("")
    setSelectedCoin(null)
    setAmount("")
    setPrice("")
    setError("")
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/20 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Add Transaction
          </DialogTitle>
          <DialogDescription>Add a new transaction to your portfolio</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div>
            <Label htmlFor="transaction-type" className="mb-2 block">
              Transaction Type
            </Label>
            <RadioGroup
              id="transaction-type"
              value={type}
              onValueChange={(value) => setType(value as "buy" | "sell")}
              className="flex gap-4"
            >
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

          <div className="space-y-2">
            <Label htmlFor="coin">Asset</Label>
            <Popover open={openCoinSearch} onOpenChange={setOpenCoinSearch}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCoinSearch}
                  className="w-full justify-between bg-white/50 dark:bg-slate-700/50"
                >
                  {selectedCoin ? (
                    <div className="flex items-center gap-2">
                      {selectedCoin.image && (
                        <img
                          src={selectedCoin.image || "/placeholder.svg"}
                          alt={selectedCoin.name}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span>
                        {selectedCoin.name} ({selectedCoin.symbol.toUpperCase()})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Select a cryptocurrency</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search cryptocurrency..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>
                      {isSearching ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Searching...</span>
                        </div>
                      ) : (
                        "No results found."
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {searchResults.map((coin) => (
                        <CommandItem
                          key={coin.id}
                          value={coin.id}
                          onSelect={() => {
                            setSelectedCoin(coin)
                            setOpenCoinSearch(false)
                          }}
                          className="flex items-center gap-2 py-2"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {coin.image && (
                              <img
                                src={coin.image || "/placeholder.svg"}
                                alt={coin.name}
                                className="w-6 h-6 rounded-full"
                              />
                            )}
                            <span>
                              {coin.name} ({coin.symbol.toUpperCase()})
                            </span>
                          </div>
                          {selectedCoin?.id === coin.id && <Check className="h-4 w-4" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-slate-500 mt-1">
              Type at least 2 characters to search (e.g. "bitcoin", "eth", "cardano")
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                placeholder="0.00"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="any"
                className="bg-white/50 dark:bg-slate-700/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Total</Label>
            <div className="p-2 bg-slate-100/80 dark:bg-slate-700/80 rounded-md font-medium text-right">
              {amount && price
                ? `$${(Number.parseFloat(amount) * Number.parseFloat(price)).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "$0.00"}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedCoin || !amount || !price || isSubmitting}
            className={cn(
              "transition-all duration-300",
              type === "buy"
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                : "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700",
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              `${type === "buy" ? "Buy" : "Sell"} ${selectedCoin?.symbol.toUpperCase() || ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
