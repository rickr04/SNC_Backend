const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Create a schema
const knowledgeBaseSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  kID: { type: Number },
  versionAdded: { type: String },
  name: { type: String },
  description: { type: String}
}, { collection: "KnowledgeBase" });

/* INDEXES (used to speed up queries)
 * db.users.createIndex({ isActive: 1, _id: 1 })
 */

//Create a model using the schema
const knowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

module.exports = knowledgeBase;
