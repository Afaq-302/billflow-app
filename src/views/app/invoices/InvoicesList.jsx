'use client';

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, Download, MoreHorizontal, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatCurrency, formatDate, getDaysUntilDue } from "@/lib/utils";
import { exportToCSV } from "@/lib/pdf";

export default function InvoicesList() {
  const { invoices, clients, deleteInvoice } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInvoices = invoices.filter((inv) => {
    const client = clients.find((c) => c.id === inv.clientId);
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      client?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedInvoices = [...filteredInvoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleDelete = async (id, number) => {
    if (confirm(`Delete invoice ${number}?`)) {
      await deleteInvoice(id);
      toast.success("Invoice deleted");
    }
  };

  const handleExport = () => {
    const data = sortedInvoices.map((inv) => {
      const client = clients.find((c) => c.id === inv.clientId);
      return {
        Number: inv.invoiceNumber,
        Client: client?.name || "Unknown",
        IssueDate: formatDate(inv.issueDate),
        DueDate: formatDate(inv.dueDate),
        Status: inv.status,
        Total: inv.grandTotal,
        Paid: inv.paidTotal,
        Balance: inv.balanceDue,
      };
    });
    exportToCSV(data, "invoices");
    toast.success("Invoices exported");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage and track your invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button asChild className="gap-2">
            <Link href="/dashboard/invoices/new">
              <Plus className="w-4 h-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sortedInvoices.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No invoices found</h3>
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== "all" ? "Try adjusting your filters" : "Create your first invoice to get started"}
            </p>
            <Button asChild className="gap-2">
              <Link href="/dashboard/invoices/new">
                <Plus className="w-4 h-4" />
                Create Invoice
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedInvoices.map((invoice, idx) => {
            const client = clients.find((c) => c.id === invoice.clientId);
            const daysUntil = getDaysUntilDue(invoice.dueDate);
            return (
              <Card
                key={invoice.id}
                className="hover:shadow-md transition-shadow animate-fade-in"
                style={{ animationDelay: `${idx * 0.02}s` }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/invoices/${invoice.id}`} className="font-semibold hover:text-accent transition-colors">
                            {invoice.invoiceNumber}
                          </Link>
                          <StatusBadge status={invoice.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {client?.name} · Due {formatDate(invoice.dueDate)}
                          {invoice.status !== "Paid" && invoice.status !== "Void" && (
                            <span className={daysUntil < 0 ? "text-destructive" : daysUntil <= 7 ? "text-warning" : ""}>
                              {" "}
                              {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d left`}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.grandTotal)}</p>
                        {invoice.balanceDue > 0 && invoice.balanceDue !== invoice.grandTotal && (
                          <p className="text-sm text-muted-foreground">Due: {formatCurrency(invoice.balanceDue)}</p>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/invoices/${invoice.id}`} className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
