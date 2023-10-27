const notesRouter = require('express').Router()
const Note = require('../models/note')
const User = require('../models/user')
const jwt = require('jsonwebtoken')


notesRouter.get('/',async (req, res) => {
    const notes = await Note
      .find({}).populate('user',{username:1, name:1})

    res.json(notes)
    
  })
    
notesRouter.get('/:id', async (request, response, next) => {
  const note = await Note.findById(request.params.id)
    if (note) {
      response.json(note)
    } else {
      response.status(400).end()
    }
})

notesRouter.delete('/:id', async (request, response,next) => {
  await Note.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

notesRouter.put('/:id', (request,response,next)=>{
  const body=request.body

  const note={
    content:body.content,
    important:body.important,
  }
  
  Note.findByIdAndUpdate(request.params.id, note, {new:true})
    .then(updatedNote=>{
      response.json(updatedNote)
    })
    .catch(error=>next(error))
})



const getTokenFrom = request => {
  const authorication = request.get('authorization')
  if (authorication && authorication.startsWith('Bearer ')) {
    return authorication.replace('Bearer ', '')
  }
  return null
}

notesRouter.post('/', async(request, response, next) => {
  const body = request.body

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({error: 'token invalid'})
  }
  const user = await User.findById(decodedToken.id)

  const note = new Note({
    content: body.content,
    important: body.important || false,
    user: user.id
  })


  const savedNote = await note.save()
  user.notes = user.notes.concat(savedNote._id)
  await user.save()

  response.status(201).json(savedNote)
})



module.exports = notesRouter