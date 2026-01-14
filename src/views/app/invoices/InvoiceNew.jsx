'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, calculateTotals } from "@/lib/utils";

export default function InvoiceNew() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clients, settings, addInvoice } = useAuth();

  const [clientId, setClientId] = useState(searchParams.get("clientId") || "");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + settings.defaultPaymentTermsDays);
    return date.toISOString().split("T")[0];
  });
  const [taxRate, setTaxRate] = useState(settings.taxRateDefault);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [lineItems, setLineItems] = useState([
    { id: uuidv4(), name: "", description: "", qty: 1, unitPrice: 0, taxable: true },
  ]);

  const totals = calculateTotals(lineItems, taxRate, discount || undefined);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: uuidv4(), name: "", description: "", qty: 1, unitPrice: 0, taxable: true },
    ]);
  };

  const updateLineItem = (id, field, value) => {
    setLineItems(
      lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeLineItem = (id) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const handleSubmit = async (asDraft = true) => {
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }

    const validItems = lineItems.filter((item) => item.name && item.qty > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    const invoice = await addInvoice({
      clientId,
      status: asDraft ? "Draft" : "Sent",
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      currency: settings.currencyDefault,
      taxRate,
      discount: discount || undefined,
      lineItems: validItems,
      notes: notes || undefined,
      terms: terms || undefined,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      grandTotal: totals.grandTotal,
      paidTotal: 0,
      balanceDue: totals.grandTotal,
      sentAt: asDraft ? undefined : new Date().toISOString(),
    });

    toast.success(`Invoice ${invoice.invoiceNumber} created`);
    router.push(`/dashboard/invoices/${invoice.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/invoices")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">New Invoice</h1>
          <p className="text-muted-foreground">Create a new invoice for your client</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <Input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((item) => (
                <div key={item.id} className="p-4 border border-border rounded-lg space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <Label>Item Name *</Label>
                      <Input
                        value={item.name}
                        onChange={(event) => updateLineItem(item.id, "name", event.target.value)}
                        placeholder="Service or product name"
                      />
                    </div>
                    {lineItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive mt-6"
                        onClick={() => removeLineItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description || ""}
                      onChange={(event) => updateLineItem(item.id, "description", event.target.value)}
                      placeholder="Optional description"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(event) => updateLineItem(item.id, "qty", Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) => updateLineItem(item.id, "unitPrice", Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center font-medium">
                        {formatCurrency(item.qty * item.unitPrice)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`taxable-${item.id}`}
                      checked={item.taxable}
                      onCheckedChange={(checked) => updateLineItem(item.id, "taxable", checked)}
                    />
                    <Label htmlFor={`taxable-${item.id}`} className="text-sm font-normal">
                      Taxable
                    </Label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Notes visible to client..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                  placeholder="Payment terms..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input type="number" min="0" max="100" value={taxRate} onChange={(event) => setTaxRate(Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Discount (%)</Label>
                  <Input type="number" min="0" max="100" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                  <span>{formatCurrency(totals.taxTotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount ({discount}%)</span>
                    <span>-{formatCurrency(totals.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full" onClick={() => handleSubmit(false)}>
                  Create & Send
                </Button>
                <Button variant="outline" className="w-full" onClick={() => handleSubmit(true)}>
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
