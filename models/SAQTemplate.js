/**
 * Mongoose schema for SAQ templates.
 * @module
 * @requires {@link https://www.npmjs.com/package/mongoose}
 */
const mongoose = require('mongoose');

/**
 * Mongoose model for SAQ templates.
 * @class SAQTemplate
 * @param {array} questions - Array of ID strings referencing q{@link models/Question~Question}
 * @param {string} _id - Manually set string ID
 */

const SAQTemplateSchema = new mongoose.Schema({
  questions: [{
    type: String,
    ref: 'Question',
    required: true
  }],
  _id: {
    type: String,
  }
}, {
  timestamps: true
});

const SAQTemplate = mongoose.model('SAQTemplate', SAQTemplateSchema);
module.exports = SAQTemplate;
