import { useEffect, useState } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { BudgetCard } from '@/components/BudgetCard';
import { MonthlyOverviewCard } from '@/components/MonthlyOverviewCard';
import { SpendingChart } from '@/components/SpendingChart';
import { RecentExpenses } from '@/components/RecentExpenses';
import { ExpensesSummary } from '@/components/ExpensesSummary';
import { ExpenseFormDialog } from '@/components/ExpenseFormDialog';
import { BudgetAllocationDialog } from '@/components/BudgetAllocationDialog';
import { IncomeFormDialog } from '@/components/IncomeFormDialog';
import { AuthDialog } from '@/components/AuthDialog';
import { Button } from '@/components/ui/button';
import { calculateMonthlyOverview } from '@/lib/calculations';
import { Plus, Settings, Cloud, CloudOff, RefreshCw, LogOut, Wallet } from 'lucide-react';
import { signOut as firebaseSignOut } from '@/lib/auth';
import { format } from 'date-fns';

export function Dashboard() {
  const {
    categories,
    budgets,
    expenses,
    isLoading,
    isOnline,
    isSyncing,
    lastSyncTime,
    user,
    currentMonth,
    getTotalSpent,
    getTotalIncome,
    syncToCloud,
    signOut,
  } = useBudgetStore();

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  useEffect(() => {
    // Show auth dialog if not logged in
    if (!user && !isLoading) {
      setIsAuthDialogOpen(true);
    }
  }, [user, isLoading, isOnline]);

  const handleSignOut = async () => {
    await signOut();
    await firebaseSignOut();
    setIsAuthDialogOpen(true);
  };

  const handleManualSync = () => {
    if (isOnline && user) {
      syncToCloud();
    }
  };

  if (isLoading && !user) {
    console.log('⏳ Dashboard loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="text-4xl mb-4">💰</div>
          <p className="text-lg font-medium text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth dialog if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
      </div>
    );
  }


  const totalIncome = getTotalIncome();
  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const overview = calculateMonthlyOverview(
    totalIncome,
    totalAllocated,
    totalSpent
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">💰 Budget Planner</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {new Date().toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          
          {/* Sync Status & User Info */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Sync Status Bar */}
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-xs sm:text-sm">
              {isOnline ? (
                <>
                  <Cloud className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">Online</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-gray-400" />
                  <span className="text-muted-foreground">Offline</span>
                </>
              )}
              
              {isSyncing && (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin ml-2" />
                  <span>Syncing...</span>
                </>
              )}
              
              {lastSyncTime && !isSyncing && (
                <span className="text-muted-foreground text-xs hidden sm:inline">
                  • Last sync: {format(lastSyncTime, 'HH:mm')}
                </span>
              )}
              
              {isOnline && !isSyncing && (
                <button
                  onClick={handleManualSync}
                  className="ml-2 p-1 hover:bg-background rounded transition-colors"
                  title="Manual sync"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-xs sm:text-sm">
              <span className="text-muted-foreground truncate max-w-[150px]">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="p-1 hover:bg-background rounded transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 w-full mb-6">
          <Button 
            onClick={() => setIsIncomeDialogOpen(true)} 
            variant="outline" 
            size="default"
            className="flex-1 sm:flex-none min-w-[120px]"
          >
            <Wallet className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="text-sm sm:text-base">Add Income</span>
          </Button>
          <Button 
            onClick={() => setIsBudgetDialogOpen(true)} 
            variant="outline" 
            size="default"
            className="flex-1 sm:flex-none min-w-[120px]"
          >
            <Settings className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="text-sm sm:text-base">Set Budget</span>
          </Button>
          <Button 
            onClick={() => setIsExpenseDialogOpen(true)} 
            size="default"
            className="flex-1 sm:flex-none min-w-[120px]"
          >
            <Plus className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="text-sm sm:text-base">Add Expense</span>
          </Button>
        </div>

        {/* Offline Warning */}
        {!isOnline && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <CloudOff className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">You're offline</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Changes will be synced when you're back online
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Overview */}
        <div className="mb-6">
          <MonthlyOverviewCard overview={overview} />
        </div>

        {/* Budget Categories */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Budget Categories</h2>
          {categories.length === 0 ? (
            <p className="text-muted-foreground">No categories yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const budget = budgets.find((b) => b.categoryId === category.id);
                const spent = getTotalSpent(category.id!);
                
                return (
                  <BudgetCard
                    key={category.id}
                    category={category}
                    allocated={budget?.allocated || 0}
                    spent={spent}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Expenses Summary */}
        <div className="mb-4 sm:mb-6">
          <ExpensesSummary 
            expenses={expenses} 
            categories={categories} 
            currentMonth={currentMonth}
          />
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <SpendingChart categories={categories} expenses={expenses} />
          <RecentExpenses expenses={expenses} categories={categories} />
        </div>

        {/* Dialogs */}
        <IncomeFormDialog
          open={isIncomeDialogOpen}
          onOpenChange={setIsIncomeDialogOpen}
        />
        <ExpenseFormDialog
          open={isExpenseDialogOpen}
          onOpenChange={setIsExpenseDialogOpen}
        />
        <BudgetAllocationDialog
          open={isBudgetDialogOpen}
          onOpenChange={setIsBudgetDialogOpen}
        />
        <AuthDialog
          open={isAuthDialogOpen}
          onOpenChange={setIsAuthDialogOpen}
        />
      </div>
    </div>
  );
}
