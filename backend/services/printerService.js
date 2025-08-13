const { printer: ThermalPrinter, types: PrinterTypes } = require('node-thermal-printer');

async function printTestReceipt() {
  // Initialize printer
  const printer = new ThermalPrinter({
    type: PrinterTypes.CUSTOM, // Try CUSTOM first, or change to PrinterTypes.EPSON
    interface: 'usb',
    options: {
      timeout: 5000,
    },
    removeSpecialCharacters: false,
    lineCharacter: '-',
  });

  try {
    const isConnected = await printer.isPrinterConnected();
    console.log('Printer connected:', isConnected);
    if (!isConnected) {
      console.log('Printer not detected. Check connection.');
      return;
    }

    // Begin printing receipt
    printer.alignCenter();
    printer.println('*** RECEIPT ***');
    printer.drawLine();

    printer.alignLeft();
    printer.println('Store: POZER Test Store');
    printer.println('Date: ' + new Date().toLocaleString());
    printer.drawLine();

    printer.println('Item         Qty    Price');
    printer.println('--------------------------');
    printer.println('Coffee       2      $3.00');
    printer.println('Sandwich     1      $5.50');
    printer.drawLine();

    printer.alignRight();
    printer.println('Total: $11.50');
    printer.newLine();

    printer.alignCenter();
    printer.println('Thank you for your purchase!');
    printer.newLine(3);

    await printer.cut();
    await printer.execute();

    console.log('Print success!');
  } catch (error) {
    console.error('Print failed:', error);
  }
}

module.exports = { printTestReceipt };
