let mongoose = require('mongoose')
let Schema = mongoose.Schema

let remarkSchema = new Schema({
    title: String,
    author: String,
    likes: { type: Number, default: 0 },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' }
})

module.exports = mongoose.model('Remark', remarkSchema)