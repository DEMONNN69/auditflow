import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type TransferResultType = 'transferring' | 'success' | 'failure';

interface TransferResultProps {
  status: TransferResultType;
  amount?: string;
  recipientName?: string;
  recipientId?: string;
  description?: string;
  error?: string;
  onRetry: () => void;
}

export const TransferResult: React.FC<TransferResultProps> = ({
  status,
  amount = '0.00',
  recipientName = 'Recipient',
  recipientId = '',
  description = '',
  error = '',
  onRetry,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (status) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [status]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 overflow-y-auto ${
        status === 'success'
          ? 'bg-gradient-to-br from-green-50/95 to-emerald-50/95 backdrop-blur-sm'
          : status === 'failure'
          ? 'bg-gradient-to-br from-red-50/95 to-rose-50/95 backdrop-blur-sm'
          : 'bg-gradient-to-br from-blue-50/95 to-indigo-50/95 backdrop-blur-sm'
      }`}
    >
      <div className="w-full max-w-md my-auto">
        {/* Icon & Animation */}
        <div className="flex justify-center mb-8">
          {status === 'transferring' && (
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Animated money flow - Rupee symbols */}
              <div className="absolute">
                <div className="text-4xl font-bold text-accent animate-bounce" style={{ animationDelay: '0s' }}>
                  ₹
                </div>
              </div>
              <div className="absolute animate-bounce" style={{ animationDelay: '0.2s', top: '-20px', left: '-20px' }}>
                <div className="text-2xl text-accent/60">₹</div>
              </div>
              <div className="absolute animate-bounce" style={{ animationDelay: '0.4s', top: '-20px', right: '-20px' }}>
                <div className="text-2xl text-accent/60">₹</div>
              </div>
              <div className="absolute animate-bounce" style={{ animationDelay: '0.1s', bottom: '-15px' }}>
                <div className="text-xl text-accent/40">₹</div>
              </div>
              
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent border-r-accent animate-spin"></div>
            </div>
          )}
          {status === 'success' && (
            <div className="relative w-24 h-24 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-24 h-24 text-green-500" strokeWidth={1.5} />
            </div>
          )}
          {status === 'failure' && (
            <div className="relative w-24 h-24 flex items-center justify-center">
              <XCircle className="w-24 h-24 text-red-500" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Content */}
        {status === 'transferring' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Processing Transfer</h2>
            <p className="text-muted-foreground">Sending ₹{amount} to {recipientName}...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-green-700 mb-1">Transfer Successful!</h2>
            <p className="text-green-600 mb-8">Your payment has been sent</p>

            {/* Receipt Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-md border-2 border-green-100">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Recipient:</span>
                  <span className="font-semibold text-foreground">{recipientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Recipient ID:</span>
                  <span className="font-mono text-sm text-foreground bg-accent/10 px-3 py-1.5 rounded-lg font-semibold">
                    {recipientId}
                  </span>
                </div>
                {description && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Note:</span>
                    <span className="text-foreground">{description}</span>
                  </div>
                )}
                <div className="pt-4 border-t-2 border-green-100 flex justify-between items-center">
                  <span className="text-foreground font-semibold">Amount:</span>
                  <span className="text-3xl font-bold text-green-600">₹{amount}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={onRetry}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200"
            >
              <span>Done</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {status === 'failure' && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-700 mb-2">Transfer Failed</h2>
            <p className="text-red-600 mb-8 font-medium">{error || 'Something went wrong'}</p>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-md border-2 border-red-100">
              <p className="text-muted-foreground font-medium mb-2">Amount:</p>
              <p className="text-3xl font-bold text-red-600">₹{amount}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={onRetry}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-semibold rounded-xl transition-all duration-200"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferResult;
