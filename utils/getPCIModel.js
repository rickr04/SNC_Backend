module.exports = (input) => {
  if (typeof input === 'string') {
    PCI_3_2_1 = require("../models/pci_3_2_1");
    return PCI_3_2_1;
  }
}
