import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userService, auditService, transactionService, User, AuditEntry, TransferData } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2, 
  Send, 
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const transferSchema = z.object({
  recipient_account: z.string().trim().min(1, 'Recipient account is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional(),
});

type SortField = 'id' | 'type' | 'amount' | 'counterparty' | 'timestamp';
type SortOrder = 'asc' | 'desc';

const Dashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  
  // Balance state
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  
  // Transfer form state
  const [recipientAccount, setRecipientAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ recipient_account?: string; amount?: string }>({});
  
  // Audit history state
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Fetch user balance
  const fetchBalance = async () => {
    setBalanceLoading(true);
    try {
      const userData: User = await userService.getCurrentUser();
      setBalance(userData.balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch account balance',
        variant: 'destructive',
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  // Fetch audit history
  const fetchAuditHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await auditService.getHistory({
        ordering: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
      });
      setAuditHistory(response.results);
    } catch (error) {
      console.error('Failed to fetch audit history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transaction history',
        variant: 'destructive',
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchAuditHistory();
  }, []);

  useEffect(() => {
    fetchAuditHistory();
  }, [sortField, sortOrder]);

  // Handle transfer submission
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const transferData: TransferData = {
      recipient_account: recipientAccount,
      amount: parseFloat(amount),
      description: description || undefined,
    };

    // Validate
    const result = transferSchema.safeParse(transferData);
    if (!result.success) {
      const errors: { recipient_account?: string; amount?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'recipient_account') errors.recipient_account = err.message;
        if (err.path[0] === 'amount') errors.amount = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    setTransferLoading(true);
    try {
      await transactionService.initiateTransfer(transferData);
      toast({
        title: 'Transfer Successful',
        description: `$${transferData.amount.toFixed(2)} sent successfully`,
        className: 'bg-success text-success-foreground',
      });
      
      // Reset form
      setRecipientAccount('');
      setAmount('');
      setDescription('');
      
      // Refresh data
      await Promise.all([fetchBalance(), fetchAuditHistory(), refreshUser()]);
    } catch (error) {
      console.error('Transfer failed:', error);
      toast({
        title: 'Transfer Failed',
        description: 'Unable to complete the transfer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTransferLoading(false);
    }
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.first_name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your transfers and view transaction history
        </p>
      </div>

      {/* Balance & Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 lg:col-span-1 border-border/50 shadow-card hover:shadow-card-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
            <Wallet className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">
                  {balance !== null ? formatCurrency(balance) : '$—'}
                </span>
                <span className="text-sm text-success flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Available
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Account: {user?.account_number || '—'}
            </p>
          </CardContent>
        </Card>

        {/* Transfer Card */}
        <Card className="lg:col-span-2 border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-accent" />
              Quick Transfer
            </CardTitle>
            <CardDescription>
              Send money to another account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Account</Label>
                <Input
                  id="recipient"
                  placeholder="Account number"
                  value={recipientAccount}
                  onChange={(e) => setRecipientAccount(e.target.value)}
                  disabled={transferLoading}
                  className={validationErrors.recipient_account ? 'border-destructive' : ''}
                />
                {validationErrors.recipient_account && (
                  <p className="text-xs text-destructive">{validationErrors.recipient_account}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={transferLoading}
                  className={validationErrors.amount ? 'border-destructive' : ''}
                />
                {validationErrors.amount && (
                  <p className="text-xs text-destructive">{validationErrors.amount}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Payment for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={transferLoading}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={transferLoading}
                >
                  {transferLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Audit History Table */}
      <Card className="border-border/50 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Complete audit trail of your transactions
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAuditHistory()}
            disabled={historyLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", historyLoading && "animate-spin")} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                  <TableHead 
                    className="cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      <SortIcon field="id" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      <SortIcon field="type" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-1">
                      Amount
                      <SortIcon field="amount" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => handleSort('counterparty')}
                  >
                    <div className="flex items-center gap-1">
                      Counterparty
                      <SortIcon field="counterparty" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => handleSort('timestamp')}
                  >
                    <div className="flex items-center gap-1">
                      Timestamp
                      <SortIcon field="timestamp" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-accent" />
                        <span className="text-muted-foreground">Loading transactions...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : auditHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="text-muted-foreground">
                        <p>No transactions found</p>
                        <p className="text-sm">Your transaction history will appear here</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  auditHistory.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-mono text-sm">
                        #{entry.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          entry.type === 'sent' 
                            ? "bg-destructive/10 text-destructive" 
                            : "bg-success/10 text-success"
                        )}>
                          {entry.type === 'sent' ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownLeft className="h-3 w-3" />
                          )}
                          {entry.type === 'sent' ? 'Sent' : 'Received'}
                        </div>
                      </TableCell>
                      <TableCell className={cn(
                        "font-semibold",
                        entry.type === 'sent' ? "text-destructive" : "text-success"
                      )}>
                        {entry.type === 'sent' ? '-' : '+'}{formatCurrency(entry.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.counterparty}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(entry.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
