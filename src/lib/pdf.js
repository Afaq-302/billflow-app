import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "./utils";

export function generateInvoicePDF(invoice, client, settings) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(24);
  doc.setTextColor(30, 58, 95);
  doc.text(settings.businessName, 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(100);
  const addressLines = settings.businessAddress.split("\n");
  addressLines.forEach((line, i) => {
    doc.text(line, 20, 35 + i * 5);
  });
  doc.text(settings.businessEmail, 20, 35 + addressLines.length * 5);
  doc.text(settings.businessPhone, 20, 40 + addressLines.length * 5);

  doc.setFontSize(28);
  doc.setTextColor(30, 58, 95);
  doc.text("INVOICE", pageWidth - 20, 25, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(invoice.invoiceNumber, pageWidth - 20, 35, { align: "right" });

  const statusColor =
    invoice.status === "Paid"
      ? [34, 197, 94]
      : invoice.status === "Overdue"
        ? [239, 68, 68]
        : [100, 116, 139];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - 45, 40, 25, 8, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.text(invoice.status.toUpperCase(), pageWidth - 32.5, 45.5, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("BILL TO", 20, 70);
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text(client.name, 20, 78);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(client.email, 20, 85);
  if (client.address) {
    const clientAddressLines = client.address.split("\n");
    clientAddressLines.forEach((line, i) => {
      doc.text(line, 20, 92 + i * 5);
    });
  }

  doc.setTextColor(100);
  doc.text("Issue Date", pageWidth - 70, 70);
  doc.text("Due Date", pageWidth - 70, 80);
  doc.setTextColor(30);
  doc.text(formatDate(invoice.issueDate), pageWidth - 20, 70, { align: "right" });
  doc.text(formatDate(invoice.dueDate), pageWidth - 20, 80, { align: "right" });

  const tableData = invoice.lineItems.map((item) => [
    item.name,
    item.description || "",
    item.qty.toString(),
    formatCurrency(item.unitPrice, invoice.currency),
    formatCurrency(item.qty * item.unitPrice, invoice.currency),
  ]);

  autoTable(doc, {
    startY: 110,
    head: [["Item", "Description", "Qty", "Rate", "Amount"]],
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: [248, 250, 252],
      textColor: [100, 116, 139],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
    margin: { left: 20, right: 20 },
  });

  const finalY = doc.lastAutoTable.finalY + 15;

  const totalsX = pageWidth - 80;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Subtotal", totalsX, finalY);
  doc.text("Tax (" + invoice.taxRate + "%)", totalsX, finalY + 8);
  if (invoice.discount) {
    doc.text("Discount (" + invoice.discount + "%)", totalsX, finalY + 16);
  }

  doc.setTextColor(30);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - 20, finalY, { align: "right" });
  doc.text(formatCurrency(invoice.taxTotal, invoice.currency), pageWidth - 20, finalY + 8, { align: "right" });
  if (invoice.discount) {
    doc.text(
      "-" + formatCurrency(invoice.discountTotal, invoice.currency),
      pageWidth - 20,
      finalY + 16,
      { align: "right" }
    );
  }

  const totalOffset = invoice.discount ? 28 : 20;
  doc.setDrawColor(200);
  doc.line(totalsX, finalY + totalOffset - 2, pageWidth - 20, finalY + totalOffset - 2);

  doc.setFontSize(12);
  doc.setTextColor(30, 58, 95);
  doc.setFont(undefined, "bold");
  doc.text("Total Due", totalsX, finalY + totalOffset + 6);
  doc.text(formatCurrency(invoice.balanceDue, invoice.currency), pageWidth - 20, finalY + totalOffset + 6, {
    align: "right",
  });

  if (invoice.notes) {
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Notes:", 20, finalY + totalOffset + 25);
    doc.setTextColor(80);
    doc.text(invoice.notes, 20, finalY + totalOffset + 32);
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Thank you for your business!", pageWidth / 2, 280, { align: "center" });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function generateReceiptPDF(receipt, payment, invoice, client, settings) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(24);
  doc.setTextColor(30, 58, 95);
  doc.text(settings.businessName, 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(100);
  const addressLines = settings.businessAddress.split("\n");
  addressLines.forEach((line, i) => {
    doc.text(line, 20, 35 + i * 5);
  });

  doc.setFontSize(28);
  doc.setTextColor(34, 197, 94);
  doc.text("RECEIPT", pageWidth - 20, 25, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(receipt.receiptNumber, pageWidth - 20, 35, { align: "right" });

  doc.setFillColor(34, 197, 94);
  doc.roundedRect(pageWidth - 35, 40, 15, 8, 2, 2, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.text("PAID", pageWidth - 27.5, 45.5, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("RECEIVED FROM", 20, 70);
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text(client.name, 20, 78);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(client.email, 20, 85);

  doc.setTextColor(100);
  doc.text("Payment Date", pageWidth - 70, 70);
  doc.text("Payment Method", pageWidth - 70, 80);
  doc.text("Reference", pageWidth - 70, 90);
  doc.setTextColor(30);
  doc.text(formatDate(payment.date), pageWidth - 20, 70, { align: "right" });
  doc.text(payment.method, pageWidth - 20, 80, { align: "right" });
  doc.text(payment.reference || "-", pageWidth - 20, 90, { align: "right" });

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, 110, pageWidth - 40, 40, 3, 3, "F");

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Amount Received", 30, 125);
  doc.text("For Invoice", 30, 140);

  doc.setFontSize(16);
  doc.setTextColor(30, 58, 95);
  doc.setFont(undefined, "bold");
  doc.text(formatCurrency(receipt.amount, receipt.currency), pageWidth - 30, 125, { align: "right" });
  doc.setFont(undefined, "normal");
  doc.setFontSize(12);
  doc.text(invoice.invoiceNumber, pageWidth - 30, 140, { align: "right" });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Thank you for your payment!", pageWidth / 2, 280, { align: "center" });

  doc.save(`${receipt.receiptNumber}.pdf`);
}

export function exportToCSV(data, filename) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const stringValue = value?.toString() || "";
          return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}
