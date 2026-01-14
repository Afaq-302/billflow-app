'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, CreditCard, Users, BarChart3, ArrowRight, Check, Zap, Shield, Clock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">BillFlow</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-6 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Simple invoicing for modern businesses</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Get paid faster with
            <span className="gradient-text block mt-2">beautiful invoices</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Create professional invoices, track payments, and manage your clients all in one beautifully simple platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            {isAuthenticated ? (
              <>
                <Button asChild size="lg" className="gap-2 min-w-[200px]">
                  <Link href="/dashboard">
                    Go to workspace
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-w-[200px]">
                  <Link href="/dashboard/invoices">See invoices</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="gap-2 min-w-[200px]">
                  <Link href="/signup">
                    Start for free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-w-[200px]">
                  <Link href="/dashboard">View demo</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to get paid</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features wrapped in a simple, intuitive interface
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-card border border-border/50 hover:shadow-lg hover:border-accent/30 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${0.1 * idx}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {benefits.map((benefit, idx) => (
              <div key={benefit.title} className="animate-fade-in" style={{ animationDelay: `${0.1 * idx}s` }}>
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="rounded-2xl p-8 md:p-12 text-center relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to streamline your billing?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8">Join thousands of businesses already using BillFlow</p>
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <Link href="/signup">
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2024 BillFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: FileText,
    title: "Professional Invoices",
    description: "Create beautiful, branded invoices in seconds with our intuitive editor.",
  },
  {
    icon: CreditCard,
    title: "Payment Links",
    description: "Generate secure payment links and get paid online instantly.",
  },
  {
    icon: Users,
    title: "Client Management",
    description: "Keep track of all your clients, their invoices, and payment history.",
  },
  {
    icon: BarChart3,
    title: "Revenue Insights",
    description: "Monitor your cash flow with real-time analytics and reports.",
  },
  {
    icon: Clock,
    title: "Automatic Reminders",
    description: "Never chase payments again with automated reminder emails.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and stored securely on your device.",
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Create and send invoices in under a minute",
  },
  {
    icon: Check,
    title: "Get Paid Faster",
    description: "On average, 2x faster payment collection",
  },
  {
    icon: Shield,
    title: "Always Free",
    description: "No credit card required, use forever",
  },
];
