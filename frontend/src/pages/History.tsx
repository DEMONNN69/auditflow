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
  Download,
  Search,
  Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type SortField = 'id' | 'type' | 'amount' | 'counterparty' | 'timestamp';
type SortOrder = 'asc' | 'desc';

const History: React.FC = () => {
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const filters: AuditFilters = {
        ordering: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
      };
      
      if (typeFilter !== 'all') {
        filters.type = typeFilter as 'sent' | 'received';
      }

      const response = await auditService.getHistory(filters);
      setAuditHistory(response.results);
      setTotalCount(response.count);
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
  }, [sortField, sortOrder, typeFilter]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const blob = await auditService.exportHistory(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-history-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Export Complete',
        description: `Your transaction history has been exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Unable to export transaction history',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

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

  // Filter by search query (client-side)
  const filteredHistory = auditHistory.filter((entry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.id.toLowerCase().includes(query) ||
      entry.counterparty.toLowerCase().includes(query) ||
      entry.reference?.toLowerCase().includes(query)
    );
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
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
                  filteredHistory.map((entry) => (
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
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          entry.status === 'completed' && "bg-success/10 text-success",
                          entry.status === 'pending' && "bg-warning/10 text-warning",
                          entry.status === 'failed' && "bg-destructive/10 text-destructive"
                        )}>
                          {entry.status}
                        </span>
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

export default History;
