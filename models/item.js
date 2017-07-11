const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
    description: String,
    cost: Number,
    quantity: Number
})

module.exports = mongoose.model("Item", ItemSchema);