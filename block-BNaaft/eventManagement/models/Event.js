let mongoose = require('mongoose')
let Schema = mongoose.Schema

let eventSchema = new Schema({
    title: { type: String, required: true },
    summary: { type: String, required: true },
    host: { type: String, required: true },
    start_date: { type: Date },
    end_date: { type: Date },
    event_category: [{ type: String, required: true }],
    cover_image: { type: String, required: true },
    location: { type: String, required: true },
    likes: { type: Number, default: 0 },
    remarkIds: [{ type: Schema.Types.ObjectId, ref: 'Remark' }]
}, { timestamps: true })

module.exports = mongoose.model('Event', eventSchema)