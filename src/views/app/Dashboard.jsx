'use client';

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  FileText,
  Users,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, getDaysUntilDue } from "@/lib/utils";

export default function Dashboard() {
  const { invoices, clients, payments } = useAuth();

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const overdueInvoices = invoices.filter(
    (inv) => inv.status === "Overdue" || (getDaysUntilDue(inv.dueDate) < 0 && inv.balanceDue > 0)
  );
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      trend: "+12% from last month",
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Outstanding",
      value: formatCurrency(totalOutstanding),
      icon: TrendingUp,
      trend: `${invoices.filter((i) => i.balanceDue > 0).length} pending invoices`,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Total Clients",
      value: clients.length.toString(),
      icon: Users,
      trend: "Active accounts",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Overdue",
      value: overdueInvoices.length.toString(),
      icon: AlertTriangle,
      trend: overdueInvoices.length > 0 ? "Action required" : "All caught up!",
      color: overdueInvoices.length > 0 ? "text-destructive" : "text-success",
      bg: overdueInvoices.length > 0 ? "bg-destructive/10" : "bg-success/10",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your billing overview.</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={stat.title} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Invoices</CardTitle>
            <Link href="/dashboard/invoices">
              <Button variant="ghost" size="sm" className="gap-1">
                View all
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No invoices yet</p>
                <Link href="/dashboard/invoices/new">
                  <Button variant="outline" size="sm" className="mt-4">
                    Create your first invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => {
                  const client = clients.find((c) => c.id === invoice.clientId);
                  return (
                    <Link
                      key={invoice.id}
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">{client?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.grandTotal)}</p>
                        <StatusBadge status={invoice.status} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Overdue Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueInvoices.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <p className="text-muted-foreground">No overdue invoices</p>
                <p className="text-sm text-muted-foreground">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueInvoices.map((invoice) => {
                  const client = clients.find((c) => c.id === invoice.clientId);
                  const daysOverdue = Math.abs(getDaysUntilDue(invoice.dueDate));
                  return (
                    <Link
                      key={invoice.id}
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{client?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-destructive">
                          {formatCurrency(invoice.balanceDue)}
                        </p>
                        <p className="text-xs text-destructive">{daysOverdue} days overdue</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
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
