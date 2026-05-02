const mongoose = require("mongoose");

const dropdownSchema = new mongoose.Schema({
    type:{
        type: String,
        required: true
    },
    label:{
        type: String,
        required: true 
    },
    value: {
        type: String,
        required: true 
    },
    status: {
        type: Boolean,
        default: true 
    }
});

module.exports = mongoose.model("dropdown", dropdownSchema);