import React, { useState } from 'react';
import { transactionService, TransferData } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2, CheckCircle2, AlertCircle, ArrowRight, User, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const transferSchema = z.object({
  recipient_account: z.string().trim().min(1, 'Recipient account is required').max(50, 'Account number too long'),
  amount: z.number().positive('Amount must be greater than 0').max(1000000, 'Amount exceeds maximum limit'),
  description: z.string().max(200, 'Description too long').optional(),
});

const Transfer: React.FC = () => {
  const { refreshUser } = useAuth();
  
  const [recipientAccount, setRecipientAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ recipient_account?: string; amount?: string; description?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setSuccess(false);

    const transferData: TransferData = {
      recipient_account: recipientAccount,
      amount: parseFloat(amount) || 0,
      description: description || undefined,
    };

    const result = transferSchema.safeParse(transferData);
    if (!result.success) {
      const errors: { recipient_account?: string; amount?: string; description?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field as keyof typeof errors] = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await transactionService.initiateTransfer(transferData);
      setSuccess(true);
      toast({
        title: 'Transfer Successful',
        description: `$${transferData.amount.toFixed(2)} has been sent to ${recipientAccount}`,
        className: 'bg-success text-success-foreground',
      });
      
      // Reset form
      setRecipientAccount('');
      setAmount('');
      setDescription('');
      await refreshUser();
    } catch (error) {
      console.error('Transfer failed:', error);
      toast({
        title: 'Transfer Failed',
        description: 'Unable to complete the transfer. Please check details and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Send Money</h1>
        <p className="mt-1 text-muted-foreground">
          Transfer funds securely to any account
        </p>
      </div>

      <Card className="border-border/50 shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-accent" />
            New Transfer
          </CardTitle>
          <CardDescription>
            Fill in the details below to initiate a transfer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-success/10 text-success animate-fade-in">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Transfer completed successfully!</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Account Number</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recipient"
                  placeholder="Enter account number"
                  value={recipientAccount}
                  onChange={(e) => setRecipientAccount(e.target.value)}
                  disabled={isLoading}
                  className={`pl-10 ${validationErrors.recipient_account ? 'border-destructive' : ''}`}
                />
              </div>
              {validationErrors.recipient_account && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.recipient_account}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  className={`pl-10 text-lg font-semibold ${validationErrors.amount ? 'border-destructive' : ''}`}
                />
              </div>
              {validationErrors.amount && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.amount}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a note for this transfer..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
                className={validationErrors.description ? 'border-destructive' : ''}
              />
              {validationErrors.description && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Max 200 characters
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Transfer...
                </>
              ) : (
                <>
                  Send Money
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Transfers are processed instantly and securely</p>
      </div>
    </div>
  );
};

export default Transfer;
