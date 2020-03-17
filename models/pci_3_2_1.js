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
}, { collection: "pci_3.2.1_questions" });

/* INDEXES (used to speed up queries)
 * db.users.createIndex({ isActive: 1, _id: 1 })
 */

//Create a model using the schema
const pci = mongoose.model('pci_3.2.1_questions', pciSchema);

module.exports = pci;
