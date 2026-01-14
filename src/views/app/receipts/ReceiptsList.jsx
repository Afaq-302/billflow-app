'use client';

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Download, Search } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateReceiptPDF } from "@/lib/pdf";
import { toast } from "sonner";

export default function ReceiptsList() {
  const { receipts, payments, invoices, clients, settings } = useAuth();
  const [search, setSearch] = useState("");

  const sortedReceipts = [...receipts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((receipt) => {
      const invoice = invoices.find((i) => i.id === receipt.invoiceId);
      const client = clients.find((c) => c.id === receipt.clientId);
      return (
        receipt.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
        invoice?.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        client?.name.toLowerCase().includes(search.toLowerCase())
      );
    });

  const handleDownload = (receiptId) => {
    const receipt = receipts.find((r) => r.id === receiptId);
    if (!receipt) return;

    const payment = payments.find((p) => p.id === receipt.paymentId);
    const invoice = invoices.find((i) => i.id === receipt.invoiceId);
    const client = clients.find((c) => c.id === receipt.clientId);

    if (payment && invoice && client) {
      generateReceiptPDF(receipt, payment, invoice, client, settings);
      toast.success("Receipt downloaded");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Receipts</h1>
        <p className="text-muted-foreground">Payment receipts for your records</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search receipts..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-10"
        />
      </div>

      {sortedReceipts.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No receipts yet</h3>
            <p className="text-muted-foreground">
              Receipts are generated automatically when payments are recorded
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedReceipts.map((receipt, idx) => {
            const invoice = invoices.find((i) => i.id === receipt.invoiceId);
            const client = clients.find((c) => c.id === receipt.clientId);
            const payment = payments.find((p) => p.id === receipt.paymentId);

            return (
              <Card
                key={receipt.id}
                className="hover:shadow-md transition-shadow animate-fade-in"
                style={{ animationDelay: `${idx * 0.02}s` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold">{receipt.receiptNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {client?.name} · {invoice?.invoiceNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-success">
                          {formatCurrency(receipt.amount, receipt.currency)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(receipt.issuedAt)} · {payment?.method}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(receipt.id)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
