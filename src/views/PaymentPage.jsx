'use client';

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, CheckCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PaymentPage({ paymentToken }) {
  const { invoices, clients, settings, addPayment } = useAuth();
  const invoice = invoices.find((inv) => inv.paymentLinkToken === paymentToken);
  const client = invoice ? clients.find((c) => c.id === invoice.clientId) : null;

  const [amount, setAmount] = useState(invoice?.balanceDue.toString() || "");
  const [method, setMethod] = useState("Card");
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!invoice || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invoice Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This payment link may be invalid or expired.
            </p>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invoice.status === "Paid" || paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-4">
              Thank you for your payment. A receipt has been generated.
            </p>
            <p className="text-lg font-semibold text-success mb-6">
              {formatCurrency(parseFloat(amount) || invoice.grandTotal)}
            </p>
            <Link href="/">
              <Button variant="outline">Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePayment = async () => {
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (payAmount > invoice.balanceDue) {
      toast.error("Amount cannot exceed balance due");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    await addPayment({
      invoiceId: invoice.id,
      clientId: client.id,
      amount: payAmount,
      method,
      date: new Date().toISOString(),
      reference: "ONLINE-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    });

    setLoading(false);
    setPaid(true);
    toast.success("Payment processed successfully!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">{settings.businessName}</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
            <CardDescription>Due {formatDate(invoice.dueDate)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Invoice Total</span>
                  <span className="font-semibold">{formatCurrency(invoice.grandTotal)}</span>
                </div>
                {invoice.paidTotal > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Already Paid</span>
                    <span className="text-success">-{formatCurrency(invoice.paidTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-medium">Balance Due</span>
                  <span className="text-xl font-bold">{formatCurrency(invoice.balanceDue)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Items:</p>
                {invoice.lineItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} · {item.qty}
                    </span>
                    <span>{formatCurrency(item.qty * item.unitPrice)}</span>
                  </div>
                ))}
                {invoice.lineItems.length > 3 && (
                  <p className="text-sm text-muted-foreground">
                    +{invoice.lineItems.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Make Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={invoice.balanceDue}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={(value) => setMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Card">Credit/Debit Card</SelectItem>
                  <SelectItem value="Bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {method === "Card" && (
              <div className="space-y-4 p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  This is a demo - no real payment will be processed
                </p>
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input placeholder="4242 4242 4242 4242" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry</Label>
                    <Input placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label>CVC</Label>
                    <Input placeholder="123" />
                  </div>
                </div>
              </div>
            )}

            <Button className="w-full" size="lg" onClick={handlePayment} disabled={loading}>
              {loading ? "Processing..." : `Pay ${formatCurrency(parseFloat(amount) || 0)}`}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Powered by BillFlow · Secure payment processing
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
