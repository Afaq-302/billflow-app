'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, MapPin, FileText, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ClientDetail({ clientId }) {
  const router = useRouter();
  const { getClient, getClientInvoices, getClientPayments, invoices } = useAuth();

  const client = getClient(clientId);

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Client not found</h2>
        <Link href="/dashboard/clients">
          <Button>Back to Clients</Button>
        </Link>
      </div>
    );
  }

  const clientInvoices = getClientInvoices(client.id);
  const clientPayments = getClientPayments(client.id);

  const totalBilled = clientInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPaid = clientInvoices.reduce((sum, inv) => sum + inv.paidTotal, 0);
  const outstanding = totalBilled - totalPaid;

  const ledgerItems = [
    ...clientInvoices.map((inv) => ({
      date: inv.createdAt,
      type: "Invoice",
      ref: inv.invoiceNumber,
      debit: inv.grandTotal,
      credit: 0,
    })),
    ...clientPayments.map((payment) => {
      const inv = invoices.find((i) => i.id === payment.invoiceId);
      return {
        date: payment.date,
        type: "Payment",
        ref: inv?.invoiceNumber || "N/A",
        debit: 0,
        credit: payment.amount,
      };
    }),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const ledgerWithBalance = ledgerItems.map((item) => {
    runningBalance += item.debit - item.credit;
    return { ...item, balance: runningBalance };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/clients")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">Client since {formatDate(client.createdAt)}</p>
        </div>
        <Link href={`/dashboard/invoices/new?clientId=${client.id}`}>
          <Button>Create Invoice</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBilled)}</div>
            <p className="text-xs text-muted-foreground">{clientInvoices.length} invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            <DollarSign className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">{clientPayments.length} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            <TrendingUp className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(outstanding)}</div>
            <p className="text-xs text-muted-foreground">Balance due</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{client.email}</p>
              </div>
            </div>
            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium whitespace-pre-line">{client.address}</p>
                </div>
              </div>
            )}
            {client.notes && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <Tabs defaultValue="invoices" className="p-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="ledger">Ledger</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices" className="mt-4">
              {clientInvoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No invoices yet</p>
              ) : (
                <div className="space-y-2">
                  {clientInvoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/dashboard/invoices/${inv.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{inv.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(inv.issueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(inv.grandTotal)}</p>
                        <StatusBadge status={inv.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              {clientPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payments yet</p>
              ) : (
                <div className="space-y-2">
                  {clientPayments.map((payment) => {
                    const inv = invoices.find((i) => i.id === payment.invoiceId);
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(payment.date)} · {inv?.invoiceNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{payment.method}</p>
                          {payment.reference && (
                            <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ledger" className="mt-4">
              {ledgerWithBalance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium">Date</th>
                        <th className="text-left py-2 font-medium">Type</th>
                        <th className="text-left py-2 font-medium">Ref</th>
                        <th className="text-right py-2 font-medium">Debit</th>
                        <th className="text-right py-2 font-medium">Credit</th>
                        <th className="text-right py-2 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerWithBalance.map((item, idx) => (
                        <tr key={idx} className="border-b border-border/50">
                          <td className="py-2">{formatDate(item.date)}</td>
                          <td className="py-2">{item.type}</td>
                          <td className="py-2">{item.ref}</td>
                          <td className="py-2 text-right">{item.debit > 0 ? formatCurrency(item.debit) : "-"}</td>
                          <td className="py-2 text-right text-success">
                            {item.credit > 0 ? formatCurrency(item.credit) : "-"}
                          </td>
                          <td className="py-2 text-right font-medium">{formatCurrency(item.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
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
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${variants[status] || variants.Draft}`}>
      {status}
    </span>
  );
}
