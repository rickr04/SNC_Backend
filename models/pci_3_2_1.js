const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create a schema
const pciSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  SAQ: { type: Array},
  requirement: { type: String },
  priority: { type: Number },
  question: { type: String },
  header: { type: Boolean },
  expectedTesting: { type: Array},
  responses: { type: Array},
  keywords: { type: Array},
  kIDs: { type: Array},
}, { collection: "PCI_3.2.1_Questions" });

/* INDEXES (used to speed up queries)
 * db.users.createIndex({ isActive: 1, _id: 1 })
 */

//Create a model using the schema
const pci = mongoose.model('PCI_3.2.1_Questions', pciSchema);

module.exports = pci;
