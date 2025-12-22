import React, { useState } from 'react';
import { transactionService, userService, type TransferData, type RecipientInfo } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Send, Loader2, CheckCircle2, AlertCircle, User as UserIcon, IndianRupee } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { transferSchema } from '@/schemas/transaction.schema';
import { TransferResult } from '@/components/TransferResult';
import type { TransferResultType } from '@/components/TransferResult';

const Transfer: React.FC = () => {
  const { user, refreshUser } = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Select recipient, Step 2: Enter amount/description
  const [recipientId, setRecipientId] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);
  const [isFetchingRecipient, setIsFetchingRecipient] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingTransferData, setPendingTransferData] = useState<TransferData | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ 
    to_recipient_id?: string; 
    amount?: string; 
    description?: string 
  }>({});
  
  // Transfer result state
  const [resultStatus, setResultStatus] = useState<TransferResultType | null>(null);
  const [resultError, setResultError] = useState('');

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

  const handleProceed = () => {
    if (recipientInfo && !validationErrors.to_recipient_id) {
      setStep(2);
      // Smooth scroll to amount section
      setTimeout(() => {
        document.getElementById('amount')?.focus();
      }, 100);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

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

    // Show confirmation dialog instead of directly submitting
    setPendingTransferData(transferData);
    setShowConfirmDialog(true);
  };

  const confirmTransfer = async () => {
    if (!pendingTransferData || !recipientInfo) return;

    setIsLoading(true);
    setShowConfirmDialog(false);
    setResultStatus('transferring');
    
    try {
      await transactionService.initiateTransfer(pendingTransferData);
      
      // Show success state for 1.5 seconds before showing receipt
      setTimeout(() => {
        setResultStatus('success');
      }, 1500);
      
    } catch (error: any) {
      console.error('Transfer failed:', error);
      const errorMessage = error?.response?.data?.error || 'Unable to complete the transfer. Please try again.';
      setResultError(errorMessage);
      
      // Show transferring for 1.5 seconds, then display failure
      setTimeout(() => {
        setResultStatus('failure');
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResultRetry = () => {
    if (resultStatus === 'success') {
      // Reset everything on success
      setResultStatus(null);
      setStep(1);
      setRecipientId('');
      setRecipientInfo(null);
      setAmount('');
      setDescription('');
      setPendingTransferData(null);
      refreshUser();
    } else if (resultStatus === 'failure') {
      // Go back to form on failure
      setResultStatus(null);
      setResultError('');
    }
  };

  return (
    <>
      {/* Show transfer result overlay when processing/success/failure */}
      {resultStatus && (
        <TransferResult
          status={resultStatus}
          amount={pendingTransferData?.amount.toFixed(2) || '0.00'}
          recipientName={recipientInfo?.full_name || 'Recipient'}
          recipientId={recipientInfo?.recipient_id || recipientId}
          description={pendingTransferData?.description}
          error={resultError}
          onRetry={handleResultRetry}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
        {/* Left Column - Header & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Send Money</h1>
            <p className="mt-2 text-muted-foreground">
              Transfer funds securely using Recipient ID
            </p>
          </div>

          {/* User Balance Card */}
          <Card className="border-border/50 shadow-sm bg-accent/5 sticky top-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Your Balance</p>
                  <p className="text-3xl font-bold text-foreground">₹{user?.balance || '0.00'}</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Your Recipient ID</p>
                  <p className="text-sm font-mono font-semibold text-accent bg-accent/10 p-2 rounded-lg text-center break-all">
                    {user?.recipient_id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Transfer Form */}
        <Card className="lg:col-span-2 border-border/50 shadow-elevated">
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
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* STEP 1: Recipient Selection */}
              {step === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Who are you sending to?</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="recipient"
                        placeholder="Enter their 10-digit ID"
                        value={recipientId}
                        onChange={(e) => handleRecipientIdChange(e.target.value)}
                        disabled={isLoading}
                        maxLength={10}
                        className={`pl-10 font-mono text-base ${validationErrors.to_recipient_id ? 'border-destructive' : ''}`}
                        autoFocus
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
                  </div>

                  {/* Recipient Info Card */}
                  {recipientInfo && !validationErrors.to_recipient_id && (
                    <div className="mt-6 p-4 rounded-xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 via-background to-accent/5 shadow-sm animate-in fade-in duration-300">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 flex-shrink-0">
                          <CheckCircle2 className="h-6 w-6 text-accent" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recipient Found</p>
                          <p className="text-xl font-bold text-foreground">{recipientInfo.full_name}</p>
                          <p className="text-sm text-muted-foreground">{recipientInfo.email}</p>
                          <div className="mt-3 flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 w-fit">
                            <span className="text-xs font-medium text-muted-foreground">ID:</span>
                            <span className="font-mono text-sm font-semibold text-accent">{recipientId}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handleProceed}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 text-base"
                    disabled={!recipientInfo || isFetchingRecipient || validationErrors.to_recipient_id !== undefined}
                  >
                    Proceed to Payment
                  </Button>
                </div>
              )}

              {/* STEP 2: Amount & Description */}
              {step === 2 && (
                <div className="space-y-5 animate-fade-in">
                  {/* Recipient Summary */}
                  <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sending to</p>
                    <p className="text-lg font-bold text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                      {recipientInfo?.full_name}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">How much to send?</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isLoading}
                        className={`pl-10 text-2xl font-bold text-foreground placeholder:text-muted-foreground/30 ${validationErrors.amount ? 'border-destructive' : ''}`}
                        autoFocus
                      />
                    </div>
                    {validationErrors.amount && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.amount}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Add a note (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="E.g., Lunch money, Birthday gift..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isLoading}
                      className={`min-h-[80px] resize-none text-base ${validationErrors.description ? 'border-destructive' : ''}`}
                    />
                    {validationErrors.description && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 py-6 text-base"
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 text-base"
                      disabled={isLoading || !amount}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Money
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send <span className="font-bold text-foreground">₹{pendingTransferData?.amount.toFixed(2)}</span> to <span className="font-bold text-foreground">{recipientInfo?.full_name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4 border-y border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recipient ID:</span>
              <span className="font-mono font-semibold">{pendingTransferData?.to_recipient_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold">₹{pendingTransferData?.amount.toFixed(2)}</span>
            </div>
            {pendingTransferData?.description && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Note:</span>
                <span className="text-right">{pendingTransferData.description}</span>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmTransfer}
              disabled={isLoading}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Yes, Send Money'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </>
  );
};

export default Transfer;
    