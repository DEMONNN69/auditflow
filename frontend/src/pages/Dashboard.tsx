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
  TrendingUp,
  Copy,
  Check
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const transferSchema = z.object({
  to_recipient_id: z
    .string()
    .trim()
    .length(10, 'Recipient ID must be 10 digits')
    .regex(/^\d+$/, 'Recipient ID must be numeric'),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional(),
});

type SortField = 'created_at' | 'event_type';
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
  const [validationErrors, setValidationErrors] = useState<{ to_recipient_id?: string; amount?: string }>({});
  
  // Audit history state
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [copiedRecipientId, setCopiedRecipientId] = useState(false);

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
      const response = await auditService.getMyLogs();
      // Client-side sort since my_logs returns flat array
      const sorted = [...response].sort((a, b) => {
        const dir = sortOrder === 'desc' ? -1 : 1;
        if (sortField === 'created_at') {
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
        }
        // event_type fallback
        return a.event_type.localeCompare(b.event_type) * dir;
      });
      setAuditHistory(sorted);
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
      to_recipient_id: recipientAccount,
      amount: parseFloat(amount),
      description: description || undefined,
    };

    // Validate
    const result = transferSchema.safeParse(transferData);
    if (!result.success) {
      const errors: { recipient_account?: string; amount?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'to_recipient_id') (errors as any).to_recipient_id = err.message;
        if (err.path[0] === 'amount') (errors as any).amount = err.message;
      });
      setValidationErrors(errors as { to_recipient_id?: string; amount?: string });
      return;
    }

    setTransferLoading(true);
    try {
      await transactionService.initiateTransfer(transferData);
      toast({
        title: 'Transfer Successful',
        description: `₹${transferData.amount.toFixed(2)} sent successfully`,
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
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
                  {balance !== null ? formatCurrency(balance) : '₹—'}
                </span>
                <span className="text-sm text-success flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Available
                </span>
              </div>
            )}
            <button
              onClick={() => {
                if (user?.recipient_id) {
                  navigator.clipboard.writeText(user.recipient_id);
                  setCopiedRecipientId(true);
                  setTimeout(() => setCopiedRecipientId(false), 2000);
                  toast({
                    title: 'Copied',
                    description: 'Recipient ID copied to clipboard',
                  });
                }
              }}
              className="mt-4 w-full flex items-center justify-between gap-3 p-3 rounded-lg border-2 border-accent/30 bg-accent/5 hover:bg-accent/10 hover:border-accent/50 transition-all cursor-pointer group"
              title="Click to copy your Recipient ID"
            >
              <div className="text-left flex-1">
                <p className="text-xs text-muted-foreground font-medium">Your Recipient ID</p>
                <p className="text-lg font-mono font-bold text-accent">{user?.recipient_id || '—'}</p>
              </div>
              <div className="flex-shrink-0">
                {copiedRecipientId ? (
                  <Check className="h-5 w-5 text-green-500 transition-all" />
                ) : (
                  <Copy className="h-5 w-5 text-accent group-hover:text-accent/80 transition-all" />
                )}
              </div>
            </button>
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
                <Label htmlFor="recipient">Recipient ID</Label>
                <Input
                  id="recipient"
                  placeholder="Enter 10-digit Recipient ID"
                  value={recipientAccount}
                  onChange={(e) => setRecipientAccount(e.target.value)}
                  disabled={transferLoading}
                  className={validationErrors.to_recipient_id ? 'border-destructive' : ''}
                />
                {validationErrors.to_recipient_id && (
                  <p className="text-xs text-destructive">{validationErrors.to_recipient_id}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (INR)</Label>
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
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                  <TableHead className="min-w-[120px]">From (ID)</TableHead>
                  <TableHead className="min-w-[120px]">To (ID)</TableHead>
                  <TableHead className="min-w-[100px]">Amount</TableHead>
                  <TableHead className="min-w-[90px]">Type</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-secondary transition-colors min-w-[160px]"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Date/Time
                      <SortIcon field="created_at" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-accent" />
                        <span className="text-muted-foreground">Loading audit history...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : auditHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="text-muted-foreground">
                        <p>No transactions found</p>
                        <p className="text-sm">Your transaction history will appear here</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  auditHistory.map((entry) => {
                    const direction = entry.data?.direction;
                    const isReceived = direction === 'received';
                    return (
                      <TableRow key={entry.id} className="hover:bg-secondary/30 transition-colors">
                        <TableCell className="font-mono text-sm">
                          {entry.sender_id || entry.from_user_name || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {entry.receiver_id || '—'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {entry.amount ? `₹${parseFloat(entry.amount).toFixed(2)}` : '—'}
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
                            isReceived
                              ? "bg-green-500/10 text-green-600 flex items-center"
                              : "bg-blue-500/10 text-blue-600 flex items-center"
                          )}>
                            {isReceived ? (
                              <>
                                <ArrowDownLeft className="h-3 w-3" />
                                Received
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="h-3 w-3" />
                                Sent
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                            entry.status === 'success' || entry.status === 'completed'
                              ? "bg-emerald-500/10 text-emerald-700"
                              : entry.status === 'failed'
                              ? "bg-red-500/10 text-red-700"
                              : "bg-yellow-500/10 text-yellow-700"
                          )}>
                            {entry.status ? entry.status.charAt(0).toUpperCase() + entry.status.slice(1) : '—'}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(entry.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })
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
