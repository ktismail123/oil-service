import { environment } from './../../../../../environments/environment.prod';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import {
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Accessory, OilFilter, OilType } from '../../../../models';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-step7-customer-summary',
  imports: [
    ReactiveFormsModule,
    FormFieldComponent,
    NgIf,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './step7-customer-summary.component.html',
  styleUrl: './step7-customer-summary.component.scss',
})
export class Step7CustomerSummaryComponent {
  private route = inject(ActivatedRoute);

  editMode = this.route.snapshot.queryParams['mode'];

  environment = environment;

  @Input() customerForm!: FormGroup;
  @Input() oilForm!: FormGroup;
  @Input() selectedBrandName: string = '';
  @Input() selectedModelName: string = '';
  @Input() serviceInterval: number = 0;
  @Input() selectedOilType: OilType | undefined;
  @Input() selectedFilter: OilFilter | undefined;
  @Input() selectedAccessories: Accessory[] = [];
  @Input() subtotal: number = 0;
  @Input() laborCost: number = 0;
  @Input() vatAmount: number = 0;
  @Input() totalAmount: number = 0;
  @Input() billNumber = '';
  @Input() oilQuantity: number = 0;

  @Output() submitBooking = new EventEmitter();
  @Output() updateBooking = new EventEmitter();

  buttonText = this.editMode === 'edit' ? 'Update' : 'Confirm Booking';
  formattedDate: string;

  get totalWithLabor(): number {
    return (+this.totalAmount || 0) + (+this.laborCost || 0);
  }

  get oilTotalPrice(): number {
    return this.oilForm?.get('totalPrice')?.value || 0;
  }

  constructor() {
    const today = new Date();
    this.formattedDate = today.toISOString().split('T')[0];
  }

printReceipt(): void {
  const receiptContent = document.getElementById('receipt-content');

  if (receiptContent) {
    const clonedContent = receiptContent.cloneNode(true) as HTMLElement;

    // Remove customer details form section (if present)
    const customerDetailsSection = clonedContent.querySelector(
      '.border-b.border-dashed.border-gray-300.pb-4.mb-4.print\\:hidden'
    );
    if (customerDetailsSection) {
      customerDetailsSection.remove();
    }

    const printWindow = window.open('', '_blank', 'width=350,height=1000'); // 80mm ≈ 350px

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tech Lube Receipt</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0mm;
            }
            html, body {
              width: 80mm;
              margin: 0 auto;
              padding: 0;
              font-family: 'Courier New', monospace;
              font-size: 13px;   /* slightly larger for thermal printer */
              line-height: 1.5;
              background: white;
            }

            /* FORCE ALL TEXT AND BORDERS TO BLACK */
            body, body * {
              color: #000 !important;
              border-color: #000 !important;
              background: #fff !important;
              font-weight: normal !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            h1, h2, h3, h4, h5, h6, strong, 
            .font-medium, .font-semibold, .font-bold {
              font-weight: bold !important;
            }

            .print-wrapper {
              width: 100%;
              display: flex;
              justify-content: center;
            }

            .receipt-container {
              width: 80mm;
              max-width: 80mm;
              padding: 5mm;
              box-sizing: border-box;
            }

            h1 {
              font-size: 18px !important;
              font-weight: bold !important;
              text-align: center;
              margin-bottom: 4px;
            }

            h3 {
              font-size: 14px !important;
              font-weight: bold !important;
              text-align: center;
              margin: 12px 0 8px 0;
            }

            .text-center { text-align: center !important; }
            .text-xs { font-size: 11px !important; }
            .text-sm { font-size: 12px !important; }
            .text-lg { font-size: 15px !important; font-weight: bold !important; }

            .border-b-2 { border-bottom: 2px dashed #000 !important; }
            .border-b { border-bottom: 1px dashed #000 !important; }
            .border-t-2 { border-top: 2px dashed #000 !important; }

            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-4 { margin-bottom: 16px; }
            .mt-1 { margin-top: 4px; }
            .pb-4 { padding-bottom: 16px; }
            .pt-2 { padding-top: 8px; }
            .pt-4 { padding-top: 16px; }

            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .flex-1 { flex: 1; }
            .text-right { text-align: right !important; }

            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-2 > * + * { margin-top: 8px; }

            .print\\:hidden, .hidden {
              display: none !important;
            }
            .print\\:block {
              display: block !important;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            <div class="receipt-container">
              ${clonedContent.innerHTML}
            </div>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();

      printWindow.onload = function () {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
    }
  }
}


  // Alternative function for ESC/POS thermal printers
  printThermalReceipt(): void {
    // This generates ESC/POS commands for direct thermal printing
    const escPos = this.generateESCPOSCommands();

    // You can send these commands to a thermal printer via:
    // 1. Serial/USB connection
    // 2. Network printer
    // 3. Bluetooth

    // Example: Send to network thermal printer
    this.sendToThermalPrinter(escPos);
  }

  private generateESCPOSCommands(): string {
    const ESC = '\x1B';
    const GS = '\x1D';

    let commands = '';

    // Initialize printer
    commands += ESC + '@';

    // Center align and bold
    commands += ESC + 'a' + '1'; // Center
    commands += ESC + 'E' + '1'; // Bold on
    commands += 'TECH LUBE\n';
    commands += ESC + 'E' + '0'; // Bold off
    commands += 'Premium Auto Service Center\n';
    commands += 'Tel: +971-XXX-XXXX\n';
    commands += 'info@techlube.ae\n\n';

    // Receipt info
    commands += 'RECEIPT #TL-THG6765\n';
    commands += '01-02-2025\n';
    commands += '--------------------------------\n';

    // Customer details
    commands += ESC + 'a' + '0'; // Left align
    commands += 'CUSTOMER DETAILS\n';
    commands += '--------------------------------\n';

    const customerName = this.customerForm.get('name')?.value || 'N/A';
    const mobile = this.customerForm.get('mobile')?.value || 'N/A';
    const plateNumber = this.customerForm.get('plateNumber')?.value || 'N/A';

    commands += `Name: ${customerName}\n`;
    commands += `Mobile: ${mobile}\n`;
    commands += `Plate: ${plateNumber}\n`;
    commands += '--------------------------------\n';

    // Service details
    commands += 'SERVICE DETAILS\n';
    commands += '--------------------------------\n';
    commands += `Vehicle: ${this.selectedBrandName} ${this.selectedModelName}\n`;
    commands += `Service: ${this.serviceInterval} KM\n`;
    commands += '--------------------------------\n';

    // Items
    commands += 'ITEMS & SERVICES\n';
    commands += '--------------------------------\n';

    if (this.selectedOilType) {
      commands += `${this.selectedOilType.grade} ${this.selectedOilType.brand}\n`;
      commands += `Engine Oil (${this.oilQuantity}L)\n`;
      commands += `                    AED 156.00\n\n`;
    }

    if (this.selectedFilter) {
      commands += `${this.selectedFilter.brand} Oil Filter\n`;
      commands += `Code: ${this.selectedFilter.code}\n`;
      commands += `                AED ${this.selectedFilter.price}\n\n`;
    }

    const laborCost = this.customerForm.get('laborCost')?.value;
    if (laborCost && laborCost > 0) {
      commands += 'Labor & Service Charges\n';
      commands += `                AED ${laborCost}\n\n`;
    }

    // Totals
    commands += '================================\n';
    commands += ESC + 'E' + '1'; // Bold on
    commands += `TOTAL: AED ${(this.totalAmount || 0).toFixed(2)}\n`;
    commands += ESC + 'E' + '0'; // Bold off
    commands += '================================\n\n';

    // Footer
    commands += ESC + 'a' + '1'; // Center
    commands += 'Thank you for choosing Tech Lube!\n';
    commands += `Next Service: ${this.serviceInterval + 5000} KM\n\n`;
    commands += 'Follow us: @TechLubeUAE\n';
    commands += 'Visit: www.techlube.ae\n\n\n';

    // Cut paper
    commands += GS + 'V' + '1';

    return commands;
  }

  // Method to send commands to thermal printer (implement based on your setup)
  private sendToThermalPrinter(commands: string): void {
    // Option 1: Send via WebUSB (requires HTTPS)
    // this.sendViaWebUSB(commands);
    // Option 2: Send via WebSocket to local service
    // this.sendViaWebSocket(commands);
    // Option 3: Send via HTTP to printer's IP
    // this.sendViaHTTP(commands);
  }

  onSubmitBooking() {
    if (this.editMode == 'edit') {
      this.updateBooking.emit();
    } else {
      this.submitBooking.emit();
    }
  }
}
