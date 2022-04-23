const mongoose =  require('mongoose');
const { Schema } = mongoose;
const path = require('path');
const fileSchema = new Schema ({
    to: {type: Date },
    from: {type: Date },
    in: {type: Number },
    adultIn: {type: Number },
    out: {type: Number },
    adultOut: {type: Number },
    store: {type: String}
});

fileSchema.virtual('uniqueId')
    .get(function(){
        return this.filename.replace(path.extname(this.filename), '')
    });

module.exports = mongoose.model('counterPeoples',fileSchema)