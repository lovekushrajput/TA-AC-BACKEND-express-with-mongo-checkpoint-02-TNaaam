var express = require('express');
var router = express.Router();
let Remark = require('../models/Remark')
let Event = require('../models/Event')


//Editing remark
router.get('/:id/edit', (req, res, next) => {
    let id = req.params.id
    Remark.findById(id, (err, remark) => {
        if (err) return next(err)
        res.render('remarkEdit', { remark: remark })
    })
})


//updating remark
router.post('/:id', (req, res) => {
    let id = req.params.id
    Remark.findByIdAndUpdate(id, req.body, (err, remark) => {
        if (err) return next(err)
        res.redirect('/events/' + remark.eventId)
    })
})


//Delete remark
router.get('/:id/delete', (req, res, next) => {
    let id = req.params.id
    Remark.findByIdAndDelete(id, req.body, (err, remark) => {
        if (err) return next(err)
        Event.findByIdAndUpdate(remark.eventId, { $pull: { remarkIds: remark._id } }, (err, event) => {
            if (err) return next(err)
            res.redirect('/events/' + remark.eventId)
        })
    })
})


//likes remark
router.get('/:id/likes', (req, res, next) => {
    let id = req.params.id
    Remark.findByIdAndUpdate(id, { $inc: { likes: +1 } }, (err, remark) => {
        if (err) return next(err)
        res.redirect('/events/' + remark.eventId)
    })
})


//dislike remark
router.get('/:id/dislikes', (req, res, next) => {
    let id = req.params.id
    Remark.findById(id, (err, remark) => {
        if (err) return next(err)
        if (remark.likes > 0) {
            Remark.findByIdAndUpdate(id, { $inc: { likes: -1 } }, (err, remark) => {
                if (err) return next(err)
                res.redirect('/events/' + remark.eventId)
            })
        }

    })
})




module.exports = router;