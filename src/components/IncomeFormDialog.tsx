import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBudgetStore } from '@/store/budgetStore';
import { formatIDRInput, parseIDR } from '@/lib/currency';
import type { IncomeType } from '@/types';

interface IncomeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncomeFormDialog({ open, onOpenChange }: IncomeFormDialogProps) {
  const { addIncome } = useBudgetStore();
  
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<IncomeType>('salary');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatIDRInput(e.target.value);
    setAmount(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    setIsSubmitting(true);
    try {
      await addIncome({
        amount: parseIDR(amount),
        type,
        description,
        date: new Date(date),
        recurring: false,
      });

      // Reset form
      setAmount('');
      setType('salary');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add income:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Add Income</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 sm:space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm">Amount (IDR) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-muted-foreground">Rp</span>
                <Input
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="5.000.000"
                  className="pl-8 text-base"
                  required
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm">Type *</Label>
              <Select value={type} onValueChange={(value) => setType(value as IncomeType)} required>
                <SelectTrigger id="type" className="text-base">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">💼 Salary</SelectItem>
                  <SelectItem value="bonus">🎁 Bonus</SelectItem>
                  <SelectItem value="side-income">💡 Side Income</SelectItem>
                  <SelectItem value="other">📝 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">Description *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Monthly salary"
                className="text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-base"
                required
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Adding...' : 'Add Income'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
