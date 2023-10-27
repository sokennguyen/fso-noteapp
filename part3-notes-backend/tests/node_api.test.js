const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')

const bcrypt = require('bcrypt')
const User = require('../models/user')
const Note = require('../models/note')
const e = require('express')

beforeEach(async()=>{
    await Note.deleteMany({})

    const noteObjects = helper.initialNotes
        .map(note=> new Note(note))
    
    const promiseArray = noteObjects.map(note=> note.save())
    await Promise.all(promiseArray)
})


test('notes are returned as json', async()=>{
    await api
        .get('/api/notes')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    
}, 100000)

test('all notes are returned', async()=>{
    const response = await api.get('/api/notes')
    expect(response.body).toHaveLength(helper.initialNotes.length)
}, 100000)

test('a specific note is within the returned notes', async()=>{
    const response = await api.get('/api/notes')

    const content = response.body.map(r=>r.content)
    expect(content).toContain('HTML is easy')
}, 100000)

test('a valid note can be added', async ()=>{
    const newNote = {
        content: 'async/await simplifies making async calls',
        important: true,
    }

    await api
        .post('/api/notes')
        .send(newNote)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const notesAtEnd = await helper.notesInDb()
    expect(notesAtEnd).toHaveLength(helper.initialNotes.length + 1)

    const contents = notesAtEnd.map(n => n.content)
    expect(contents).toContain(
        'async/await simplifies making async calls'
    )
})

test('note without content is not added', async ()=>{
    const newNote = {
        important:true
    }
    
    await api   
        .post('/api/notes')
        .send(newNote)
        .expect(400)

    const notesAtEnd = await helper.notesInDb()

    expect(notesAtEnd).toHaveLength(helper.initialNotes.length)

})

test('a specific note can be viewed', async ()=>{
    const notesAtStart = await helper.notesInDb()

    const noteToView = notesAtStart[0]

    const resultNote = await api    
        .get(`/api/notes/${noteToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

    expect(resultNote.body).toEqual(noteToView)
})

test('a note can be deleted', async()=>{
    const notesAtStart = await helper.notesInDb()
    const noteToDelete = notesAtStart[0]

    await api
        .delete(`/api/notes/${noteToDelete.id}`)
        .expect(204)

    const notesAtEnd = await helper.notesInDb()

    expect(notesAtEnd).toHaveLength(
        helper.initialNotes.length - 1
    )

    const contents = notesAtEnd.map(r=>r.content)

    expect(contents).not.toContain(noteToDelete.content)
})

describe('when there is initially one user in db', ()=>{
    beforeEach(async()=>{
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('this is a pre-hashed password', 10 )
        const user = new User({username:'root', passwordHash})
        
        await user.save()
    })

    test('creation suceeds with a fresh username', async()=>{
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username:'nskien',
            name:'Kien Nguyen',
            password: 'nguyen song kien'
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length+1)

        const usernames = usersAtEnd.map(user => user.name)
        expect(usernames).toContain(newUser.name)
    })

    test('creation of an existing username is failed and outputed informative response',async ()=>{
        const usersAtStart = await helper.usersInDb()
        
        const existingNameUser = {
            username:'nskien',
            name:'this can be a new name',
            password:'a random password'
        }

        const result = await api
            .post('/api/users')
            .expect(400)
            .expect('Content-Type', /application\/json/)
    
        expect(result.body.error).toContain('expected `username` to be unique')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })
})

afterAll(async()=>{
    await mongoose.connection.close()
})