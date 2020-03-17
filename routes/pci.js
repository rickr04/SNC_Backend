const express = require('express');

const pController = require('../controllers/pci');

const pciVersionValid = require('../middleware/pciVersionValid');
const pciFormValid = require('../middleware/pciFormValid');

//localhost:3000/pci
const router = express.Router();

//PCI

//Get PCI Form
router.get('/:pciVersion/:pciForm', pciVersionValid, pciFormValid, pController.getForm);

module.exports = router;
