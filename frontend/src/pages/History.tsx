import React, { useState, useEffect } from 'react';
import { auditService, AuditEntry, AuditFilters } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2, 
  RefreshCw,
  ChevronUp,
  ChevronDown,
  History as HistoryIcon,
  Search,
  Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type SortOrder = 'asc' | 'desc';

const History: React.FC = () => {
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const filters: AuditFilters = {
        ordering: `${sortOrder === 'desc' ? '-' : ''}created_at`,
      };
      
      const response = await auditService.getHistory(filters);
      // Filter by type on client-side based on direction field
      const allData = response.results || [];
      const filteredByType = typeFilter === 'all' 
        ? allData
        : allData.filter(entry => entry.data?.direction === typeFilter);
      
      setAuditHistory(filteredByType);
      setTotalCount(filteredByType.length);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transaction history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [sortOrder, typeFilter]);

  const handleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const SortIcon = () => {
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

  // Filter by search query (client-side)
  const filteredHistory = auditHistory
    .filter(entry => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        entry.sender_id?.toLowerCase().includes(query) ||
        entry.receiver_id?.toLowerCase().includes(query) ||
        entry.from_user_name?.toLowerCase().includes(query) ||
        entry.to_user_name?.toLowerCase().includes(query) ||
        entry.transaction_reference?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const dir = sortOrder === 'desc' ? -1 : 1;
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="mt-1 text-muted-foreground">
            Complete audit trail of all your transactions
          </p>
        </div>
        <div />
      </div>

      <Card className="border-border/50 shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-accent" />
              <CardTitle>All Transactions</CardTitle>
              <span className="text-sm text-muted-foreground">
                ({totalCount} total)
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
          <CardDescription>
            View and filter your complete transaction history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, counterparty, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-secondary transition-colors"
                    onClick={handleSort}
                  >
                    <div className="flex items-center gap-1">
                      Date/Time
                      <SortIcon />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-accent" />
                        <span className="text-muted-foreground">Loading transactions...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="text-muted-foreground">
                        <p>No transactions found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((entry) => {
                    const direction = entry.data?.direction;
                    const isReceived = direction === 'received';
                    const counterparty = isReceived ? entry.from_user_name : entry.to_user_name;
                    const amount = parseFloat(entry.amount || '0');
                    
                    return (
                      <TableRow key={entry.id} className="hover:bg-secondary/30 transition-colors">
                        <TableCell className="font-mono text-sm">
                          #{entry.id}
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            isReceived
                              ? "bg-success/10 text-success" 
                              : "bg-destructive/10 text-destructive"
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
                        <TableCell className={cn(
                          "font-semibold",
                          isReceived ? "text-success" : "text-destructive"
                        )}>
                          {isReceived ? '+' : '-'}{formatCurrency(amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {counterparty || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(entry.created_at)}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            entry.status === 'success' || entry.status === 'completed' 
                              ? "bg-success/10 text-success"
                              : entry.status === 'pending'
                              ? "bg-warning/10 text-warning"
                              : "bg-destructive/10 text-destructive"
                          )}>
                            {entry.status ? entry.status.charAt(0).toUpperCase() + entry.status.slice(1) : '—'}
                          </span>
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

export default History;
