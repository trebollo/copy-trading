"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TransactionType = "expense" | "payout";
export type TransactionCategory =
  | "Platform Fee"
  | "Data Subscription"
  | "Funded Account Fee"
  | "Payout"
  | "Other";

export interface TransactionFormData {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
}

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransactionFormData) => void;
  initialData?: TransactionFormData | null;
  mode?: "add" | "edit";
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "add",
}: AddTransactionDialogProps) {
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<TransactionCategory>("Platform Fee");

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setDescription(initialData.description);
      setAmount(String(initialData.amount));
      setType(initialData.type);
      setCategory(initialData.category);
    } else {
      setDate("");
      setDescription("");
      setAmount("");
      setType("expense");
      setCategory("Platform Fee");
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description || !amount) return;

    onSubmit({
      date,
      description,
      amount: parseFloat(amount),
      type,
      category,
    });

    setDate("");
    setDescription("");
    setAmount("");
    setType("expense");
    setCategory("Platform Fee");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the transaction details below."
              : "Fill in the details to add a new transaction."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="txn-date" className="text-sm font-medium">
              Date
            </label>
            <Input
              id="txn-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="txn-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="txn-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Apex Monthly Fee"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="txn-amount" className="text-sm font-medium">
              Amount
            </label>
            <Input
              id="txn-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as TransactionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="payout">Payout</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TransactionCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Platform Fee">Platform Fee</SelectItem>
                <SelectItem value="Data Subscription">
                  Data Subscription
                </SelectItem>
                <SelectItem value="Funded Account Fee">
                  Funded Account Fee
                </SelectItem>
                <SelectItem value="Payout">Payout</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {mode === "edit" ? "Save Changes" : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
