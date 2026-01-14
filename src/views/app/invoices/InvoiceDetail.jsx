'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Send, DollarSign, Copy, Link as LinkIcon, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, getDaysUntilDue } from "@/lib/utils";
import { generateInvoicePDF, generateReceiptPDF } from "@/lib/pdf";

export default function InvoiceDetail({ invoiceId }) {
  const router = useRouter();
  const {
    getInvoice,
    getClient,
    getInvoicePayments,
    receipts,
    updateInvoice,
    addPayment,
    addReminderLog,
    settings,
  } = useAuth();

  const invoice = getInvoice(invoiceId);
  const client = invoice ? getClient(invoice.clientId) : null;
  const payments = invoice ? getInvoicePayments(invoice.id) : [];
  const invoiceReceipts = receipts.filter((r) => r.invoiceId === invoiceId);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [emailTo, setEmailTo] = useState(client?.email || "");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  if (!invoice || !client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Invoice not found</h2>
        <Link href="/dashboard/invoices">
          <Button>Back to Invoices</Button>
        </Link>
      </div>
    );
  }

  const daysUntil = getDaysUntilDue(invoice.dueDate);

  const handleDownloadPDF = () => {
    generateInvoicePDF(invoice, client, settings);
    toast.success("PDF downloaded");
  };

  const handleGeneratePaymentLink = async () => {
    let token = invoice.paymentLinkToken;
    if (!invoice.paymentLinkToken) {
      token = "pay_" + uuidv4().slice(0, 8);
      await updateInvoice(invoice.id, { paymentLinkToken: token });
      toast.success("Payment link generated");
    }
    const link = `${window.location.origin}/pay/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Payment link copied to clipboard");
  };

  const openEmailDialog = (type) => {
    const template = type === "invoice" ? settings.emailTemplates.invoice : settings.emailTemplates.reminder;
    setEmailTo(client.email);
    setEmailSubject(
      template.subject
        .replace("{{invoiceNumber}}", invoice.invoiceNumber)
        .replace("{{businessName}}", settings.businessName)
    );
    setEmailBody(
      template.body
        .replace("{{clientName}}", client.name)
        .replace("{{invoiceNumber}}", invoice.invoiceNumber)
        .replace("{{amount}}", formatCurrency(invoice.balanceDue))
        .replace("{{dueDate}}", formatDate(invoice.dueDate))
        .replace("{{businessName}}", settings.businessName)
    );
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    await addReminderLog({
      invoiceId: invoice.id,
      clientId: client.id,
      type: invoice.sentAt ? "Custom" : "First",
      channel: "Email",
      subject: emailSubject,
      message: emailBody,
    });

    if (!invoice.sentAt) {
      await updateInvoice(invoice.id, { status: "Sent", sentAt: new Date().toISOString() });
    }

    toast.success("Email sent (mock)");
    setEmailDialogOpen(false);
    console.log("[MOCK EMAIL]", { to: emailTo, subject: emailSubject, body: emailBody });
  };

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > invoice.balanceDue) {
      toast.error("Amount cannot exceed balance due");
      return;
    }

    await addPayment({
      invoiceId: invoice.id,
      clientId: client.id,
      amount,
      method: paymentMethod,
      date: new Date(paymentDate).toISOString(),
      reference: paymentReference || undefined,
      note: paymentNote || undefined,
    });

    toast.success(`Payment of ${formatCurrency(amount)} recorded`);
    setPaymentDialogOpen(false);
    setPaymentAmount("");
    setPaymentReference("");
    setPaymentNote("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/invoices")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-muted-foreground">
            {client.name} · Due {formatDate(invoice.dueDate)}
            {invoice.status !== "Paid" && invoice.status !== "Void" && (
              <span className={daysUntil < 0 ? "text-destructive" : daysUntil <= 7 ? "text-warning" : ""}>
                {" "}
                {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          {invoice.status !== "Paid" && (
            <>
              <Button variant="outline" onClick={() => openEmailDialog(invoice.sentAt ? "reminder" : "invoice")}>
                <Send className="w-4 h-4 mr-2" />
                {invoice.sentAt ? "Reminder" : "Send"}
              </Button>
              <Button variant="outline" onClick={handleGeneratePaymentLink}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Payment Link
              </Button>
              <Button onClick={() => setPaymentDialogOpen(true)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bill To</p>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                  {client.address && <p className="text-sm text-muted-foreground whitespace-pre-line">{client.address}</p>}
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground">Issue Date</p>
                    <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Item</th>
                      <th className="text-center p-3 font-medium">Qty</th>
                      <th className="text-right p-3 font-medium">Rate</th>
                      <th className="text-right p-3 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="p-3">
                          <p className="font-medium">{item.name}</p>
                          {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        </td>
                        <td className="p-3 text-center">{item.qty}</td>
                        <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(item.qty * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                    <span>{formatCurrency(invoice.taxTotal)}</span>
                  </div>
                  {invoice.discount && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Discount ({invoice.discount}%)</span>
                      <span>-{formatCurrency(invoice.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.grandTotal)}</span>
                  </div>
                  {invoice.paidTotal > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Paid</span>
                      <span>-{formatCurrency(invoice.paidTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>Balance Due</span>
                    <span className={invoice.balanceDue > 0 ? "text-destructive" : "text-success"}>
                      {formatCurrency(invoice.balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <Tabs defaultValue="payments" className="p-6">
              <TabsList>
                <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
                <TabsTrigger value="receipts">Receipts ({invoiceReceipts.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="payments" className="mt-4">
                {payments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No payments recorded</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(payment.date)} · {payment.method}</p>
                        </div>
                        {payment.reference && <p className="text-sm text-muted-foreground">Ref: {payment.reference}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="receipts" className="mt-4">
                {invoiceReceipts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No receipts generated</p>
                ) : (
                  <div className="space-y-2">
                    {invoiceReceipts.map((receipt) => {
                      const payment = payments.find((p) => p.id === receipt.paymentId);
                      return (
                        <div key={receipt.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-success" />
                            </div>
                            <div>
                              <p className="font-medium">{receipt.receiptNumber}</p>
                              <p className="text-sm text-muted-foreground">{formatCurrency(receipt.amount)} · {formatDate(receipt.issuedAt)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (payment) {
                                generateReceiptPDF(receipt, payment, invoice, client, settings);
                                toast.success("Receipt downloaded");
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success transition-all duration-500"
                    style={{ width: `${(invoice.paidTotal / invoice.grandTotal) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {Math.round((invoice.paidTotal / invoice.grandTotal) * 100)}% paid
                  </span>
                  <span className="font-medium">
                    {formatCurrency(invoice.paidTotal)} / {formatCurrency(invoice.grandTotal)}
                  </span>
                </div>

                {invoice.status === "Paid" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Fully Paid</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              {invoice.paymentLinkToken && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const link = `${window.location.origin}/pay/${invoice.paymentLinkToken}`;
                    navigator.clipboard.writeText(link);
                    toast.success("Link copied");
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Payment Link
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Balance due: {formatCurrency(invoice.balanceDue)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={invoice.balanceDue}
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
                placeholder={formatCurrency(invoice.balanceDue)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank">Bank Transfer</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="Transaction ID, check number, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.target.value)}
                placeholder="Optional note..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>This is a mock email - it will be logged to the console</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Input value={emailTo} onChange={(event) => setEmailTo(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={emailBody} onChange={(event) => setEmailBody(event.target.value)} rows={8} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail}>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }) {
  const variants = {
    Draft: "bg-muted text-muted-foreground",
    Sent: "bg-accent/10 text-accent",
    "Partially Paid": "bg-warning/10 text-warning",
    Paid: "bg-success/10 text-success",
    Overdue: "bg-destructive/10 text-destructive",
    Void: "bg-muted text-muted-foreground",
  };

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${variants[status] || variants.Draft}`}>
      {status}
    </span>
  );
}
