import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as new (
  options?: PDFKit.PDFDocumentOptions,
) => PDFKit.PDFDocument;

export interface SubmissionPdfData {
  submissionNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectAddress: string;
  zipCode?: string;
  /** Tagline/subtitle shown below company name in PDF header (e.g. from site settings). */
  tagline?: string;
  service: {
    name: string;
    code: string;
    scopeDescription?: string;
  };
  basePrice: number;
  markup: number;
  clientPrice: number;
  additionalItemsTotal: number;
  totalAmount: number;
  submittedAt: Date;
  includedBaseItems: Array<{
    itemName: string;
    itemDescription?: string;
  }>;
  items: Array<{
    itemName: string;
    itemDescription?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    selectedOptionName?: string;
    isEnabled: boolean;
  }>;
  projectNotes?: string;
}

@Injectable()
export class PdfGeneratorService {
  private readonly primaryColor = '#1a365d'; // Dark blue
  private readonly secondaryColor = '#2d3748'; // Dark gray
  private readonly accentColor = '#3182ce'; // Blue
  private readonly lightGray = '#e2e8f0';
  /** Reserve 100pt for footer to prevent overflow. */
  private readonly footerReserve = 100;
  private lastItemY = 0;

  async generateSubmissionPdf(data: SubmissionPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const pdfTagline = this.normalizeTaglineForPdf(data.tagline);
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          info: {
            Title: `Estimate ${data.submissionNumber}`,
            Author: 'BBurn Builders',
            Subject: `${pdfTagline ?? 'Estimate'} for ${data.clientName}`,
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => reject(err));

        // Generate the PDF content
        this.addHeader(doc, data);
        this.addClientInfo(doc, data);
        this.addProjectSummary(doc, data);
        this.addLineItems(doc, data);
        this.addTotals(doc, data);
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, data: SubmissionPdfData): void {
    // Company Logo/Name
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .fillColor(this.primaryColor)
      .text('BBurn Builders', 50, 50);

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor(this.secondaryColor)
      .text(
        this.normalizeTaglineForPdf(data.tagline) ??
          'Professional Home Renovation',
        50,
        82,
      );

    // Estimate Number and Date (right aligned)
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(this.secondaryColor)
      .text(`Estimate #: ${data.submissionNumber}`, 400, 50, { align: 'right' })
      .text(`Date: ${this.formatDate(data.submittedAt)}`, 400, 65, {
        align: 'right',
      });

    // Horizontal line
    doc
      .moveTo(50, 110)
      .lineTo(545, 110)
      .strokeColor(this.lightGray)
      .lineWidth(2)
      .stroke();

    doc.moveDown(2);
  }

  private addClientInfo(
    doc: PDFKit.PDFDocument,
    data: SubmissionPdfData,
  ): void {
    const startY = 130;

    // Client Information Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(this.primaryColor)
      .text('CLIENT INFORMATION', 50, startY);

    doc.fontSize(10).font('Helvetica').fillColor(this.secondaryColor);

    const clientInfoY = startY + 25;
    doc.text(`Name: ${data.clientName}`, 50, clientInfoY);
    doc.text(`Email: ${data.clientEmail}`, 50, clientInfoY + 15);
    doc.text(`Phone: ${data.clientPhone}`, 50, clientInfoY + 30);

    // Project Address (right side)
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(this.primaryColor)
      .text('PROJECT ADDRESS', 300, startY);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(this.secondaryColor)
      .text(data.projectAddress, 300, clientInfoY, { width: 250 });

    if (data.zipCode) {
      doc.text(`Zip Code: ${data.zipCode}`, 300, clientInfoY + 30);
    }

    // Horizontal line
    doc
      .moveTo(50, clientInfoY + 60)
      .lineTo(545, clientInfoY + 60)
      .strokeColor(this.lightGray)
      .lineWidth(1)
      .stroke();
  }

  private addProjectSummary(
    doc: PDFKit.PDFDocument,
    data: SubmissionPdfData,
  ): void {
    const startY = 230;

    // Project Summary Box
    doc.rect(50, startY, 512, 50).fillColor('#f7fafc').fill();

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(this.primaryColor)
      .text('PROJECT TYPE', 60, startY + 10);

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor(this.accentColor)
      .text(`${data.service.name} Bathroom Renovation`, 60, startY + 28);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(this.secondaryColor)
      .text(`Code: ${data.service.code}`, 450, startY + 20, {
        align: 'right',
      });
  }

  private addLineItems(doc: PDFKit.PDFDocument, data: SubmissionPdfData): void {
    const startY = 300;
    let currentY = startY;
    const baseRowHeight = 25;

    // Section Title
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(this.primaryColor)
      .text('SCOPE OF WORK', 50, currentY);

    currentY += 25;

    // Table Header (Description and Total only - no Qty, no Unit Price)
    doc.rect(50, currentY, 512, 25).fillColor(this.primaryColor).fill();

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('Description', 55, currentY + 8)
      .text('Total', 480, currentY + 8);

    currentY += 25;

    // Base price row + included items bullets
    if (data.basePrice > 0) {
      const includedItems = data.includedBaseItems || [];
      const scopeDescH = data.service.scopeDescription
        ? doc.heightOfString(data.service.scopeDescription, { width: 420 }) + 4
        : 0;
      const itemLinesHeight = includedItems.reduce((sum, item) => {
        const nameH = doc.heightOfString(`• ${item.itemName}`, { width: 400 });
        const descH = item.itemDescription
          ? doc.heightOfString(item.itemDescription, { width: 390 })
          : 0;
        return sum + nameH + (descH ? descH + 2 : 0) + 4;
      }, 0);
      const basePriceRowHeight =
        25 + scopeDescH + (includedItems.length > 0 ? itemLinesHeight + 10 : 0);

      if (currentY + basePriceRowHeight > this.getMaxContentY(doc)) {
        doc.addPage({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });
        currentY = 50;
      }

      doc
        .rect(50, currentY, 512, basePriceRowHeight)
        .fillColor('#f7fafc')
        .fill();

      // Base price title + price
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(this.secondaryColor)
        .text(
          `Base Price - ${data.service.name} Bathroom Renovation (Scope of Work)`,
          55,
          currentY + 8,
          { width: 420 },
        );

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(this.secondaryColor)
        .text(this.formatCurrency(data.basePrice), 480, currentY + 8);

      // scopeDescription below title
      let afterTitleY = currentY + 24;
      if (data.service.scopeDescription) {
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#718096')
          .text(data.service.scopeDescription, 55, afterTitleY, { width: 420 });
        afterTitleY +=
          doc.heightOfString(data.service.scopeDescription, { width: 420 }) + 4;
      }

      // Included items as bullets below scope description
      if (includedItems.length > 0) {
        let bulletY = afterTitleY;
        for (const item of includedItems) {
          doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor('#4a5568')
            .text(`• ${item.itemName}`, 65, bulletY, { width: 400 });
          bulletY +=
            doc.heightOfString(`• ${item.itemName}`, { width: 400 }) + 2;

          if (item.itemDescription) {
            doc
              .fontSize(7)
              .font('Helvetica')
              .fillColor('#718096')
              .text(item.itemDescription, 75, bulletY, { width: 390 });
            bulletY +=
              doc.heightOfString(item.itemDescription, { width: 390 }) + 2;
          }
          bulletY += 2;
        }
      }

      currentY += basePriceRowHeight;
    }

    // Filter enabled items only
    const enabledItems = data.items.filter(
      (item) => item.isEnabled && item.totalPrice > 0,
    );

    // Table Rows (Description and Total only)
    doc.font('Helvetica').fillColor(this.secondaryColor);

    for (let i = 0; i < enabledItems.length; i++) {
      const item = enabledItems[i];
      const maxContentY = this.getMaxContentY(doc);

      // Item name (with option if selected)
      let itemText = item.itemName || 'Item';
      if (item.selectedOptionName) {
        itemText += ` (${item.selectedOptionName})`;
      }

      // Calculate row height based on description
      const descriptionHeight = item.itemDescription
        ? doc.heightOfString(item.itemDescription, { width: 280 })
        : 0;
      const rowHeight =
        baseRowHeight + descriptionHeight + (item.itemDescription ? 5 : 0);

      // Check if we need a new page
      if (currentY + rowHeight > maxContentY) {
        doc.addPage({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });
        currentY = 50;
      }

      // Alternating row background
      if (i % 2 === 0) {
        doc.rect(50, currentY, 512, rowHeight).fillColor('#f7fafc').fill();
      }

      doc.fillColor(this.secondaryColor);

      // Item name
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(itemText, 55, currentY + 8, { width: 280, lineBreak: false });

      // Item description (if exists)
      if (item.itemDescription) {
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#718096')
          .text(item.itemDescription, 55, currentY + 20, { width: 280 });
      }

      // Total only (Qty and Price columns removed)
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(this.secondaryColor)
        .text(this.formatCurrency(item.totalPrice), 480, currentY + 8);

      currentY += rowHeight;
    }

    // Store the current Y position for totals
    this.lastItemY = currentY;
  }

  private addTotals(doc: PDFKit.PDFDocument, data: SubmissionPdfData): void {
    let currentY = this.lastItemY || 500;
    const totalsHeight = 120;
    const notesMaxHeight = 80;
    const maxContentY = this.getMaxContentY(doc);
    const notesHeight = data.projectNotes
      ? Math.min(
          doc.heightOfString(data.projectNotes, { width: 512 }),
          notesMaxHeight,
        )
      : 0;

    // Only add a new page if totals + notes would not fit
    if (
      currentY + totalsHeight + (notesHeight ? notesHeight + 70 : 0) >
      maxContentY
    ) {
      doc.addPage({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });
      currentY = 50;
    }

    currentY += 20;

    // Totals Section
    const totalsX = 350;

    // Horizontal line above totals
    doc
      .moveTo(totalsX, currentY)
      .lineTo(545, currentY)
      .strokeColor(this.lightGray)
      .lineWidth(1)
      .stroke();

    currentY += 15;

    // Base Price
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(this.secondaryColor)
      .text('Base Price:', totalsX, currentY)
      .text(this.formatCurrency(data.basePrice), 480, currentY);

    currentY += 20;

    // Markup
    if (data.markup > 0) {
      doc
        .text(`Markup (${data.markup}%):`, totalsX, currentY)
        .text(
          this.formatCurrency(data.clientPrice - data.basePrice),
          480,
          currentY,
        );

      currentY += 20;

      // Client Price
      doc
        .text('Client Price:', totalsX, currentY)
        .text(this.formatCurrency(data.clientPrice), 480, currentY);

      currentY += 20;
    }

    // Additional Items
    doc
      .text('Additional Items:', totalsX, currentY)
      .text(this.formatCurrency(data.additionalItemsTotal), 480, currentY);

    currentY += 20;

    // Horizontal line
    doc
      .moveTo(totalsX, currentY)
      .lineTo(545, currentY)
      .strokeColor(this.primaryColor)
      .lineWidth(2)
      .stroke();

    currentY += 15;

    // Total Amount
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(this.primaryColor)
      .text('TOTAL ESTIMATE:', totalsX, currentY)
      .text(this.formatCurrency(data.totalAmount), 460, currentY);

    // Project Notes (if any) - limit height so text does not trigger extra pages
    if (data.projectNotes) {
      currentY += 50;

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(this.primaryColor)
        .text('PROJECT NOTES', 50, currentY);

      currentY += 20;

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(this.secondaryColor)
        .text(data.projectNotes, 50, currentY, {
          width: 512,
          height: notesMaxHeight,
          ellipsis: true,
        });
    }
  }

  private getMaxContentY(doc: PDFKit.PDFDocument): number {
    return doc.page.height - doc.page.margins.bottom - this.footerReserve;
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const footerHeight = 70;
    const footerY = doc.page.height - doc.page.margins.bottom - footerHeight;

    // Footer line
    doc
      .moveTo(50, footerY)
      .lineTo(545, footerY)
      .strokeColor(this.lightGray)
      .lineWidth(1)
      .stroke();

    // Disclaimer - fixed height so wrapping does not create extra pages
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#718096')
      .text(
        'This estimate is valid for 30 days from the date of issue. Prices are subject to change based on final site inspection. ' +
          'Additional costs may apply for unforeseen conditions. This is an estimate only and not a binding contract.',
        50,
        footerY + 10,
        { width: 512, height: 28, align: 'center', ellipsis: true },
      );

    // Company contact
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(this.primaryColor)
      .text(
        'BBurn Builders | info@bburnbuilders.com | (312) 555-1234',
        50,
        footerY + 42,
        {
          width: 512,
          align: 'center',
        },
      );
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  private normalizeTaglineForPdf(tagline?: string): string | undefined {
    if (!tagline) return undefined;

    // Commonize tagline by removing trailing location like "in Chicago"
    // so PDFs don't show a city-specific message.
    const normalized = tagline.replace(/\s+in\s+[A-Za-z\s]+$/i, '').trim();
    return normalized || tagline;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  }
}
