module.exports = (input) => {
  switch(input) {
    case "3.2.1":
      return require("../models/pci_3_2_1");
    default:
      return null;
  }
}
