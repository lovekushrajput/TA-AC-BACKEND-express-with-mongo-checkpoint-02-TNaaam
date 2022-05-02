var express = require('express');
var router = express.Router();
var multer = require('multer')
var Event = require('../models/Event')
var Remark = require('../models/Remark')
var fs = require('fs');
const { db } = require('../models/Remark');
const {format} = require('date-fns');

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
    res.render('eventList', { evnts })
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

router.get('/filter',(req,res,next)=>{
  // console.log(req.query);
  const {category, location, start, end} = req.query;
  // console.log(category, location, start, end);


  if(category){
    console.log('cat', category);
  }else if(location){
    console.log('loc', location)
  }else if(start || end){
    console.log('dates', start, end  );
  }

});
//filter by date
// router.post('/date', (req, res, next) => {
//   console.log(req.body.start)
// Event.find({ start_date: { $gte: req.body.start }, end_date: { $lte: req.body.end } }, (err, evnts) => {
//     if (err) return next(err)
//     res.render('eventList',{evnts})
//   })
// })


// event-Details
router.get('/:id', (req, res, next) => {
  let id = req.params.id
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
    res.render('eventEdit', { event, format, startDate: format(event.start_date, 'yyyy-MM-dd'), endDate: format(event.end_date, 'yyyy-MM-dd') })
  })
})


//capture and update
router.post('/:id', upload.single('cover_image'), (req, res,next) => {
  let id = req.params.id
  let new_image = ''
  if(req.file){
    new_image = req.file.filename
    try {
      fs.unlinkSync('.public/images/'+ req.body.cover_image)
    } catch (error) {
      console.log(error)
    }
  }else{
    new_image = req.body.cover_image
  }
  req.body.cover_image=new_image
  Event.findByIdAndUpdate(id,req.body,(err,event)=>{
if(err) return next(err)
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
