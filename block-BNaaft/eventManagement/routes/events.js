var express = require('express');
var router = express.Router();
var multer = require('multer')
var Event = require('../models/Event')
var Remark = require('../models/Remark')
var fs = require('fs');
const { format } = require('date-fns');

let storage = multer.diskStorage({
  //destination file
  destination: (req, file, cb) => {
    cb(null, './public/images')
  },
  //filename
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
})

let upload = multer({
  storage: storage
})

/* GET events listing. */
router.get('/', function (req, res, next) {
  Event.find({}, (err, evnts) => {
    if (err) return next(err)
    Event.distinct('event_category', (err, category) => {
      res.render('eventList', { evnts, category: category })
    })

  })
});


//render a eventForm
router.get('/new', (req, res) => {
  res.render('eventForm')
})


//capture the data
router.post('/', upload.single('cover_image'), (req, res, next) => {
  req.body.cover_image = req.file.filename
  Event.create(req.body, (err, events) => {
    if (err) return next(err)
    res.redirect('/events')
  })
})


//filters
router.get('/filter', (req, res, next) => {
  const { category, location, start, end } = req.query;
  //filter by category

  if (category) {
    Event.find({ event_category: category }, (err, evnts) => {
      if (err) return next(err)
      Event.distinct('event_category', (err, category) => {
        if (err) return next(err)
        res.render('eventList', { evnts, category: category })
      })

    })
    //filter by location
  } else if (location) {
    Event.find({ location: location }, (err, evnts) => {
      if (err) return next(err)
      res.render('eventList', { evnts })
    })
    //filter by date
  } else if (start || end) {
    Event.find({ start_date: { $gte: start }, end_date: { $lte: end } }, (err, evnts) => {
      if (err) return next(err)
      res.render('eventList', { evnts })
    })
  }

});


// event-Details
router.get('/:id', (req, res, next) => {
  let id = req.params.id
  // capture the id and populate the remarkId
  Event.findById(id).populate('remarkIds').exec((err, event) => {
    if (err) return next(err)
    res.render('eventDetails', { event })
  })
})

//edit event
router.get('/:id/edit', (req, res, next) => {
  let id = req.params.id
  Event.findById(id, (err, event) => {
    if (err) return next(err)
    res.render('eventEdit', { event, format })
  })
})


//capture and update
router.post('/:id', upload.single('cover_image'), (req, res, next) => {
  let id = req.params.id
  let new_image = ''
  if (req.file) {
    new_image = req.file.filename
    try {
      fs.unlinkSync('.public/images/' + req.body.cover_image)
    } catch (error) {
      console.log(error)
    }
  } else {
    new_image = req.body.cover_image
  }
  req.body.cover_image = new_image
  Event.findByIdAndUpdate(id, req.body, (err, event) => {
    if (err) return next(err)
    res.redirect('/events/' + id)
  })
})


//delete
router.get('/:id/delete', (req, res, next) => {
  let id = req.params.id
  Event.findByIdAndDelete(id, req.body, (err, event) => {
    if (err) return next(err)
    if (event.cover_image !== '') {
      try {
        //deleting photo
        fs.unlinkSync('./public/images/' + event.cover_image)
      } catch (error) {
        console.log(error)
      }
    } else {
      res.redirect('/events')
    }
    Remark.deleteMany({ eventId: event._id }, (err, remark) => {
      if (err) return next(err)
      res.redirect('/events')
    })
  })
})

// like the event
router.get('/:id/likes', (req, res, next) => {
  let id = req.params.id
  Event.findByIdAndUpdate(id, { $inc: { likes: +1 } }, (err, event) => {
    if (err) return next(err)
    res.redirect('/events/' + id)
  })
})

//dislike
router.get('/:id/dislikes', (req, res, next) => {
  let id = req.params.id
  Event.findById(id, (err, event) => {
    if (err) return next(err)
    if (event.likes > 0) {
      Event.findByIdAndUpdate(id, { $inc: { likes: -1 } }, (err, event) => {
        if (err) return next(err)
        res.redirect('/events/' + id)
      })
    }
  })

})

//  creating remark 
router.post('/:id/remark', (req, res, next) => {
  let id = req.params.id
  if (req.body.title === '' || req.body.author === '') {
    res.redirect('/events/' + id)
  } else {
    //appending event ID
    req.body.eventId = id
    Remark.create(req.body, (err, remark) => {
      if (err) return next(err)

      //pushing remark id 
      Event.findByIdAndUpdate(id, { $push: { remarkIds: remark._id } }, (err, event) => {
        if (err) return next(err)
        res.redirect('/events/' + id)
      })
    })
  }

})



module.exports = router;
