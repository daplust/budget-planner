import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBudgetStore } from '@/store/budgetStore';
import { formatIDRInput, parseIDR, formatIDR } from '@/lib/currency';
import { format } from 'date-fns';

type AllocationMode = 'amount' | 'percentage';

interface BudgetAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BudgetAllocationDialog({ open, onOpenChange }: BudgetAllocationDialogProps) {
  const { categories, budgets, currentMonth, setBudget, getTotalIncome } = useBudgetStore();
  const [mode, setMode] = useState<AllocationMode>('amount');
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalIncome = getTotalIncome(currentMonth);

  useEffect(() => {
    console.log('💰 BudgetAllocationDialog - Categories:', categories.length, categories);
    console.log('💵 Total Income for', currentMonth, ':', totalIncome);
    
    // Initialize allocations from existing budgets
    const initialAmounts: Record<string, string> = {};
    const initialPercentages: Record<string, string> = {};
    
    categories.forEach((cat) => {
      if (!cat.id) return;
      const budget = budgets.find((b) => b.categoryId === cat.id);
      if (budget) {
        initialAmounts[cat.id] = budget.allocated.toString();
        // Calculate percentage from amount
        if (totalIncome > 0) {
          const pct = (budget.allocated / totalIncome) * 100;
          initialPercentages[cat.id] = pct.toFixed(1);
        }
      }
    });
    
    setAllocations(initialAmounts);
    setPercentages(initialPercentages);
  }, [categories, budgets, open, currentMonth, totalIncome]);

  const handleAmountChange = (categoryId: string, value: string) => {
    const formatted = formatIDRInput(value);
    setAllocations((prev) => ({ ...prev, [categoryId]: formatted }));
    
    // Update percentage based on amount
    if (totalIncome > 0) {
      const amount = parseIDR(formatted) || 0;
      const pct = (amount / totalIncome) * 100;
      setPercentages((prev) => ({ ...prev, [categoryId]: pct.toFixed(1) }));
    }
  };

  const handlePercentageChange = (categoryId: string, value: string) => {
    // Allow numbers with one decimal point
    const sanitized = value.replace(/[^\d.]/g, '');
    const parts = sanitized.split('.');
    const formatted = parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 1)}` : parts[0];
    
    setPercentages((prev) => ({ ...prev, [categoryId]: formatted }));
    
    // Update amount based on percentage
    const pct = parseFloat(formatted) || 0;
    const amount = Math.round((pct / 100) * totalIncome);
    setAllocations((prev) => ({ ...prev, [categoryId]: amount.toString() }));
  };

  const getTotalAllocated = () => {
    return Object.values(allocations).reduce((sum, value) => {
      return sum + (parseIDR(value) || 0);
    }, 0);
  };

  const getTotalPercentage = () => {
    return Object.values(percentages).reduce((sum, value) => {
      return sum + (parseFloat(value) || 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      for (const category of categories) {
        if (!category.id) continue;
        const amount = parseIDR(allocations[category.id] || '0');
        if (amount > 0) {
          await setBudget({
            month: currentMonth,
            categoryId: category.id,
            allocated: amount,
            rolloverEnabled: false,
          });
        }
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to set budgets:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Set Monthly Budget</DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(new Date(), 'MMMM yyyy')}
          </p>
        </DialogHeader>

        {/* Income Summary & Mode Toggle */}
        <div className="space-y-3 border-b pb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Income:</span>
            <span className="font-semibold text-base">{formatIDR(totalIncome)}</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'amount' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('amount')}
              className="flex-1"
            >
              Fixed Amount
            </Button>
            <Button
              type="button"
              variant={mode === 'percentage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('percentage')}
              className="flex-1"
              disabled={totalIncome === 0}
            >
              Percentage (%)
            </Button>
          </div>
          
          {totalIncome === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              💡 Add income first to use percentage mode
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 sm:space-y-4 py-4 max-h-[45vh] overflow-y-auto">
            {categories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No categories available.</p>
                <p className="text-sm mt-2">Please refresh the page.</p>
              </div>
            )}
            {categories.filter(cat => cat.id).map((category) => (
              <div key={category.id} className="space-y-2">
                <Label htmlFor={`budget-${category.id}`} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">{category.icon}</span>
                    {category.name}
                  </span>
                  {mode === 'amount' && percentages[category.id!] && (
                    <span className="text-xs text-muted-foreground">
                      ({parseFloat(percentages[category.id!]).toFixed(1)}%)
                    </span>
                  )}
                  {mode === 'percentage' && allocations[category.id!] && (
                    <span className="text-xs text-muted-foreground">
                      {formatIDR(parseIDR(allocations[category.id!]))}
                    </span>
                  )}
                </Label>
                
                {mode === 'amount' ? (
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-muted-foreground">Rp</span>
                    <Input
                      id={`budget-${category.id}`}
                      value={allocations[category.id!] || ''}
                      onChange={(e) => handleAmountChange(category.id!, e.target.value)}
                      placeholder="0"
                      className="pl-8 text-base"
                      inputMode="numeric"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      id={`budget-${category.id}`}
                      value={percentages[category.id!] || ''}
                      onChange={(e) => handlePercentageChange(category.id!, e.target.value)}
                      placeholder="0"
                      className="pr-8 text-base"
                      inputMode="decimal"
                    />
                    <span className="absolute right-3 top-2 text-sm text-muted-foreground">%</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t pt-3 sm:pt-4 mb-3 sm:mb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-base sm:text-lg font-semibold">
                <span>Total Allocated:</span>
                <span className="break-words text-right">{formatIDR(getTotalAllocated())}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Percentage of Income:</span>
                <span className={getTotalPercentage() > 100 ? 'text-destructive font-semibold' : ''}>
                  {getTotalPercentage().toFixed(1)}%
                </span>
              </div>
              {getTotalPercentage() > 100 && (
                <p className="text-xs text-destructive">
                  ⚠️ Total exceeds 100% of income
                </p>
              )}
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
              {isSubmitting ? 'Saving...' : 'Save Budget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
