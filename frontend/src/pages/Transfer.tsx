import React, { useState } from 'react';
import { transactionService, userService, type TransferData, type RecipientInfo } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2, CheckCircle2, AlertCircle, User as UserIcon, IndianRupee } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { transferSchema } from '@/schemas/transaction.schema';

const Transfer: React.FC = () => {
  const { user, refreshUser } = useAuth();
  
  const [recipientId, setRecipientId] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);
  const [isFetchingRecipient, setIsFetchingRecipient] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ 
    to_recipient_id?: string; 
    amount?: string; 
    description?: string 
  }>({});

  const fetchRecipientInfo = async (id: string) => {
    if (id.length !== 10) {
      setRecipientInfo(null);
      return;
    }

    setIsFetchingRecipient(true);
    try {
      const info = await userService.getRecipientInfo(id);
      setRecipientInfo(info);
      setValidationErrors(prev => ({ ...prev, to_recipient_id: undefined }));
    } catch (error) {
      setRecipientInfo(null);
      setValidationErrors(prev => ({ 
        ...prev, 
        to_recipient_id: 'Recipient not found' 
      }));
    } finally {
      setIsFetchingRecipient(false);
    }
  };

  const handleRecipientIdChange = (value: string) => {
    setRecipientId(value);
    if (value.length === 10) {
      fetchRecipientInfo(value);
    } else {
      setRecipientInfo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setSuccess(false);

    const transferData: TransferData = {
      to_recipient_id: recipientId,
      amount: parseFloat(amount) || 0,
      description: description || undefined,
    };

    const result = transferSchema.safeParse(transferData);
    if (!result.success) {
      const errors: { to_recipient_id?: string; amount?: string; description?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field as keyof typeof errors] = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    if (!recipientInfo) {
      setValidationErrors(prev => ({ 
        ...prev, 
        to_recipient_id: 'Please enter a valid recipient ID' 
      }));
      return;
    }

    setIsLoading(true);
    try {
      await transactionService.initiateTransfer(transferData);
      setSuccess(true);
      toast({
        title: 'Transfer Successful',
          description: `₹${transferData.amount.toFixed(2)} sent to ${recipientInfo.full_name}`,
        className: 'bg-success text-success-foreground',
      });
      
      // Reset form
      setRecipientId('');
      setRecipientInfo(null);
      setAmount('');
      setDescription('');
      await refreshUser();
    } catch (error: any) {
      console.error('Transfer failed:', error);
      const errorMessage = error?.response?.data?.error || 'Unable to complete the transfer. Please try again.';
      toast({
        title: 'Transfer Failed',
        description: errorMessage,
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
          Transfer funds securely using Recipient ID
        </p>
      </div>

      {/* User Balance Card */}
      <Card className="border-border/50 shadow-sm bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <p className="text-3xl font-bold text-foreground">₹{user?.balance || '0.00'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Your Recipient ID</p>
              <p className="text-lg font-mono font-semibold text-accent">{user?.recipient_id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-accent" />
            New Transfer
          </CardTitle>
          <CardDescription>
            Enter the recipient's 10-digit ID to send money
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
              <Label htmlFor="recipient">Recipient ID</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recipient"
                  placeholder="Enter 10-digit Recipient ID"
                  value={recipientId}
                  onChange={(e) => handleRecipientIdChange(e.target.value)}
                  disabled={isLoading}
                  maxLength={10}
                  className={`pl-10 font-mono ${validationErrors.to_recipient_id ? 'border-destructive' : ''}`}
                />
                {isFetchingRecipient && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {validationErrors.to_recipient_id && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.to_recipient_id}
                </p>
              )}
              {recipientInfo && !validationErrors.to_recipient_id && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 text-accent animate-fade-in">
                  <CheckCircle2 className="h-4 w-4" />
                  <div>
                    <p className="font-medium">{recipientInfo.full_name}</p>
                    <p className="text-xs opacity-80">{recipientInfo.email}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (INR)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                placeholder="Add a note about this transfer"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                className={`min-h-[80px] resize-none ${validationErrors.description ? 'border-destructive' : ''}`}
              />
              {validationErrors.description && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.description}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
              disabled={isLoading || !recipientInfo || isFetchingRecipient}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Transfer...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Money
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transfer;
    