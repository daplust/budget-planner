import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBudgetStore } from '@/store/budgetStore';
import { formatIDRInput, parseIDR } from '@/lib/currency';
import { Check, X } from 'lucide-react';

// Comprehensive expense tags covering all common expense types
const EXPENSE_TAGS = [
  // Food & Dining
  { value: 'Food', emoji: '🍔', category: 'Food & Dining' },
  { value: 'Groceries', emoji: '🛒', category: 'Food & Dining' },
  { value: 'Restaurant', emoji: '🍽️', category: 'Food & Dining' },
  { value: 'Fast Food', emoji: '🍕', category: 'Food & Dining' },
  { value: 'Coffee', emoji: '☕', category: 'Food & Dining' },
  { value: 'Snacks', emoji: '🍿', category: 'Food & Dining' },
  
  // Transportation
  { value: 'Transport', emoji: '🚗', category: 'Transportation' },
  { value: 'Taxi', emoji: '🚕', category: 'Transportation' },
  { value: 'Public Transit', emoji: '🚌', category: 'Transportation' },
  { value: 'Fuel', emoji: '⛽', category: 'Transportation' },
  { value: 'Parking', emoji: '🅿️', category: 'Transportation' },
  { value: 'Vehicle Maintenance', emoji: '🔧', category: 'Transportation' },
  
  // Entertainment & Leisure
  { value: 'Entertainment', emoji: '🎬', category: 'Entertainment' },
  { value: 'Movie', emoji: '🎥', category: 'Entertainment' },
  { value: 'Gaming', emoji: '🎮', category: 'Entertainment' },
  { value: 'Sports', emoji: '⚽', category: 'Entertainment' },
  { value: 'Hobbies', emoji: '🎨', category: 'Entertainment' },
  { value: 'Vacation', emoji: '✈️', category: 'Entertainment' },
  
  // Shopping
  { value: 'Shopping', emoji: '🛍️', category: 'Shopping' },
  { value: 'Clothing', emoji: '👕', category: 'Shopping' },
  { value: 'Electronics', emoji: '📱', category: 'Shopping' },
  { value: 'Home & Garden', emoji: '🏡', category: 'Shopping' },
  { value: 'Beauty', emoji: '💄', category: 'Shopping' },
  { value: 'Gifts', emoji: '🎁', category: 'Shopping' },
  
  // Healthcare
  { value: 'Healthcare', emoji: '💊', category: 'Healthcare' },
  { value: 'Doctor', emoji: '👨‍⚕️', category: 'Healthcare' },
  { value: 'Pharmacy', emoji: '💉', category: 'Healthcare' },
  { value: 'Dental', emoji: '🦷', category: 'Healthcare' },
  { value: 'Gym', emoji: '💪', category: 'Healthcare' },
  
  // Bills & Utilities
  { value: 'Bills', emoji: '📄', category: 'Bills & Utilities' },
  { value: 'Electricity', emoji: '💡', category: 'Bills & Utilities' },
  { value: 'Water', emoji: '💧', category: 'Bills & Utilities' },
  { value: 'Internet', emoji: '🌐', category: 'Bills & Utilities' },
  { value: 'Phone', emoji: '📞', category: 'Bills & Utilities' },
  { value: 'Rent', emoji: '🏠', category: 'Bills & Utilities' },
  
  // Education
  { value: 'Education', emoji: '📚', category: 'Education' },
  { value: 'Books', emoji: '📖', category: 'Education' },
  { value: 'Course', emoji: '🎓', category: 'Education' },
  { value: 'Tuition', emoji: '🏫', category: 'Education' },
  
  // Personal Care
  { value: 'Personal Care', emoji: '🧴', category: 'Personal Care' },
  { value: 'Haircut', emoji: '💇', category: 'Personal Care' },
  { value: 'Spa', emoji: '🧖', category: 'Personal Care' },
  
  // Other
  { value: 'Insurance', emoji: '🛡️', category: 'Other' },
  { value: 'Subscription', emoji: '📺', category: 'Other' },
  { value: 'Donation', emoji: '💝', category: 'Other' },
  { value: 'Pet Care', emoji: '🐾', category: 'Other' },
  { value: 'Other', emoji: '📝', category: 'Other' },
];


interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseFormDialog({ open, onOpenChange }: ExpenseFormDialogProps) {
  const { categories, addExpense } = useBudgetStore();
  
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };

    if (isTagDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isTagDropdownOpen]);

  // Close dropdown when dialog closes
  useEffect(() => {
    if (!open) {
      setIsTagDropdownOpen(false);
    }
  }, [open]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value; 
        if (!inputValue) return;

        const [year, month, day] = inputValue.split("-").map(Number);
        setDate(new Date(year, month - 1, day)); 
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatIDRInput(e.target.value);
    setAmount(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !description) return;

    setIsSubmitting(true);
    try {
      await addExpense({
        amount: parseIDR(amount),
        categoryId,
        description,
        date: date.toISOString(),
        tags: selectedTags,
        recurring: false,
      });

      // Reset form
      setAmount('');
      setCategoryId('');
      setDescription('');
      setDate(new Date());
      setSelectedTags([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Add New Expense</DialogTitle>
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
                  placeholder="150.000"
                  className="pl-8 text-base"
                  required
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger id="category" className="text-base">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 && (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No categories available
                    </div>
                  )}
                  {categories.filter(cat => cat.id).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id!}>
                      <span className="flex items-center gap-2 text-base">
                        <span>{cat.icon}</span>
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">Description *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Lunch at restaurant"
                className="text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Tags/Labels</Label>
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                  className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className={selectedTags.length === 0 ? 'text-muted-foreground' : ''}>
                    {selectedTags.length === 0 
                      ? 'Select tags...' 
                      : `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                    }
                  </span>
                  <span className="ml-2">▼</span>
                </button>
                
                {/* Selected tags display */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTags.map(tag => {
                      const tagInfo = EXPENSE_TAGS.find(t => t.value === tag);
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                        >
                          <span>{tagInfo?.emoji}</span>
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                
                {/* Dropdown menu */}
                {isTagDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-[300px] overflow-y-auto rounded-md border bg-popover shadow-md">
                    <div className="p-2 space-y-1">
                      {/* Group tags by category */}
                      {Array.from(new Set(EXPENSE_TAGS.map(t => t.category))).map(category => (
                        <div key={category}>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                            {category}
                          </div>
                          {EXPENSE_TAGS.filter(t => t.category === category).map(tag => (
                            <button
                              key={tag.value}
                              type="button"
                              onClick={() => {
                                setSelectedTags(prev => 
                                  prev.includes(tag.value)
                                    ? prev.filter(t => t !== tag.value)
                                    : [...prev, tag.value]
                                );
                              }}
                              className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                            >
                              <div className="flex h-4 w-4 items-center justify-center border rounded-sm">
                                {selectedTags.includes(tag.value) && (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                              <span>{tag.emoji}</span>
                              <span>{tag.value}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Select one or more tags for this expense</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm">Date</Label>
              <Input
                id="date"
                type="date"
                value={date.toISOString().split('T')[0]}
                onChange={handleDateChange}
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
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
