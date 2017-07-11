const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PurchaseSchema = new Schema({
    itemId: String,
    total: Number,
    timestamp: Date
})

module.exports = mongoose.model("Purchase", PurchaseSchema);