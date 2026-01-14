'use client';

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { settingsDefaults } from "@/lib/settingsDefaults";

const AuthContext = createContext(null);

async function fetchJson(url, options) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [reminderLogs, setReminderLogs] = useState([]);
  const [settings, setSettings] = useState(settingsDefaults);
  const user = session?.user ?? null;
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (status !== "authenticated") {
      setClients([]);
      setInvoices([]);
      setPayments([]);
      setReceipts([]);
      setReminderLogs([]);
      setSettings(settingsDefaults);
      return;
    }

    const loadAll = async () => {
      try {
        const [clientsData, invoicesData, paymentsData, receiptsData, settingsData] =
          await Promise.all([
            fetchJson("/api/clients"),
            fetchJson("/api/invoices"),
            fetchJson("/api/payments"),
            fetchJson("/api/receipts"),
            fetchJson("/api/settings"),
          ]);

        setClients(clientsData.clients || []);
        setInvoices(invoicesData.invoices || []);
        setPayments(paymentsData.payments || []);
        setReceipts(receiptsData.receipts || []);
        setSettings(settingsData.settings || settingsDefaults);
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };

    loadAll();
  }, [status]);

  const logout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const addClient = async (clientData) => {
    const data = await fetchJson("/api/clients", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
    setClients((prev) => [data.client, ...prev]);
    return data.client;
  };

  const updateClient = async (id, data) => {
    const response = await fetchJson(`/api/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    setClients((prev) => prev.map((c) => (c.id === id ? response.client : c)));
    return response.client;
  };

  const deleteClient = async (id) => {
    await fetchJson(`/api/clients/${id}`, { method: "DELETE" });
    setClients((prev) => prev.filter((c) => c.id !== id));
    setInvoices((prev) => prev.filter((inv) => inv.clientId !== id));
    setPayments((prev) => prev.filter((p) => p.clientId !== id));
    setReceipts((prev) => prev.filter((r) => r.clientId !== id));
  };

  const addInvoice = async (invoiceData) => {
    const data = await fetchJson("/api/invoices", {
      method: "POST",
      body: JSON.stringify(invoiceData),
    });
    setInvoices((prev) => [data.invoice, ...prev]);
    if (data.settings) {
      setSettings(data.settings);
    }
    return data.invoice;
  };

  const updateInvoice = async (id, data) => {
    const response = await fetchJson(`/api/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? response.invoice : inv)));
    return response.invoice;
  };

  const deleteInvoice = async (id) => {
    await fetchJson(`/api/invoices/${id}`, { method: "DELETE" });
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    setPayments((prev) => prev.filter((p) => p.invoiceId !== id));
    setReceipts((prev) => prev.filter((r) => r.invoiceId !== id));
  };

  const addPayment = async (paymentData) => {
    const data = await fetchJson("/api/payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
    setPayments((prev) => [data.payment, ...prev]);
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === data.invoice.id ? data.invoice : inv))
    );
    if (data.receipt) {
      setReceipts((prev) => [data.receipt, ...prev]);
    }
    if (data.settings) {
      setSettings(data.settings);
    }
    return data;
  };

  const addReminderLog = async (logData) => {
    const data = await fetchJson("/api/reminders", {
      method: "POST",
      body: JSON.stringify(logData),
    });
    setReminderLogs((prev) => [data.reminderLog, ...prev]);
  };

  const updateSettings = async (data) => {
    const response = await fetchJson("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    setSettings(response.settings);
    return response.settings;
  };

  const getters = useMemo(
    () => ({
      getClient: (id) => clients.find((c) => c.id === id),
      getInvoice: (id) => invoices.find((inv) => inv.id === id),
      getInvoicePayments: (invoiceId) => payments.filter((p) => p.invoiceId === invoiceId),
      getClientInvoices: (clientId) => invoices.filter((inv) => inv.clientId === clientId),
      getClientPayments: (clientId) => payments.filter((p) => p.clientId === clientId),
    }),
    [clients, invoices, payments]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        sessionStatus: status,
        logout,
        clients,
        invoices,
        payments,
        receipts,
        reminderLogs,
        settings,
        addClient,
        updateClient,
        deleteClient,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addPayment,
        addReminderLog,
        updateSettings,
        ...getters,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const noop = () => {};

const fallbackContext = {
  user: null,
  isAuthenticated: false,
  sessionStatus: "unauthenticated",
  logout: noop,
  clients: [],
  invoices: [],
  payments: [],
  receipts: [],
  reminderLogs: [],
  settings: settingsDefaults,
  addClient: async () => null,
  updateClient: async () => null,
  deleteClient: async () => {},
  addInvoice: async () => null,
  updateInvoice: async () => null,
  deleteInvoice: async () => {},
  addPayment: async () => ({ payment: null, receipt: null }),
  addReminderLog: async () => {},
  updateSettings: async () => null,
  getClient: () => undefined,
  getInvoice: () => undefined,
  getInvoicePayments: () => [],
  getClientInvoices: () => [],
  getClientPayments: () => [],
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context ?? fallbackContext;
}
