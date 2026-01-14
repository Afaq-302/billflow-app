'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function SettingsPage() {
  const { settings, updateSettings } = useAuth();
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings(formData);
    toast.success("Settings saved");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your business and invoice settings</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>This information will appear on your invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input
                    value={formData.businessName}
                    onChange={(event) => setFormData({ ...formData, businessName: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.businessEmail}
                    onChange={(event) => setFormData({ ...formData, businessEmail: event.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.businessPhone}
                    onChange={(event) => setFormData({ ...formData, businessPhone: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select
                    value={formData.currencyDefault}
                    onValueChange={(value) => setFormData({ ...formData, currencyDefault: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={formData.businessAddress}
                  onChange={(event) => setFormData({ ...formData, businessAddress: event.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
              <CardDescription>Configure numbering and default values</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input
                    value={formData.invoicePrefix}
                    onChange={(event) => setFormData({ ...formData, invoicePrefix: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Next Invoice Number</Label>
                  <Input
                    type="number"
                    value={formData.nextInvoiceNumber}
                    onChange={(event) =>
                      setFormData({ ...formData, nextInvoiceNumber: parseInt(event.target.value, 10) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={formData.taxRateDefault}
                    onChange={(event) =>
                      setFormData({ ...formData, taxRateDefault: parseFloat(event.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Estimate Prefix</Label>
                  <Input
                    value={formData.estimatePrefix}
                    onChange={(event) => setFormData({ ...formData, estimatePrefix: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Receipt Prefix</Label>
                  <Input
                    value={formData.receiptPrefix}
                    onChange={(event) => setFormData({ ...formData, receiptPrefix: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms (days)</Label>
                  <Input
                    type="number"
                    value={formData.defaultPaymentTermsDays}
                    onChange={(event) =>
                      setFormData({ ...formData, defaultPaymentTermsDays: parseInt(event.target.value, 10) })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Email Template</CardTitle>
                <CardDescription>
                  Use placeholders: {"{{invoiceNumber}}"}, {"{{clientName}}"}, {"{{amount}}"}, {"{{dueDate}}"}, {"{{businessName}}"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={formData.emailTemplates.invoice.subject}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        emailTemplates: {
                          ...formData.emailTemplates,
                          invoice: { ...formData.emailTemplates.invoice, subject: event.target.value },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea
                    value={formData.emailTemplates.invoice.body}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        emailTemplates: {
                          ...formData.emailTemplates,
                          invoice: { ...formData.emailTemplates.invoice, body: event.target.value },
                        },
                      })
                    }
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reminder Email Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={formData.emailTemplates.reminder.subject}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        emailTemplates: {
                          ...formData.emailTemplates,
                          reminder: { ...formData.emailTemplates.reminder, subject: event.target.value },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea
                    value={formData.emailTemplates.reminder.body}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        emailTemplates: {
                          ...formData.emailTemplates,
                          reminder: { ...formData.emailTemplates.reminder, body: event.target.value },
                        },
                      })
                    }
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
