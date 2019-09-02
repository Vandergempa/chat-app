const path = require('path');
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
// We create a server outside of the express library (express would do it otherwise)
// because Socketio needs to be called with the raw http server:
const server = http.createServer(app)
const io = socketio(server)

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;

// Serving up static directory:
app.use(express.static(publicPath))

// Set up the websocket on the server:
// Print a message to the terminal, when a given client connects:
io.on('connection', (socket) => {
  console.log('New WebSocket connection')

  // The built-in feature of socket.io is used here. It lets us connect to
  // rooms.
  socket.on('join', ({ username, room }, callback) => {
    // id is the unique identificator for a specific connection
    const { error, user } = addUser({ id: socket.id, username, room })

    // The code only runs if the user has been succesfully added.
    if (error) {
      return callback(error)
    }

    socket.join(user.room)

    // New methods to emit:
    // - io.to().emit (allows us to send a message to everyone
    // in the room without sending it to other rooms)
    // - socket.broadcast.to().emit (...)

    // socket.emit only sends it to a particular connection.
    socket.emit('message', generateMessage('Admin', 'Welcome to the chat!'))
    // socket.broadcast.emit sends the message to all connections except 
    // to the sender socket.
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the chat!`))
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })

  // Receiving an event from the client this time:
  // ACKNOWLEDGEMENT!!! Second we setup the server to send back the acknowledgment
  // by calling a callback function!
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id)

    const filter = new Filter()

    if (filter.isProfane(message)) {
      return callback('No profanity! Please do not use swear words!')
    }
    // Here the event type should be identical to the function argument.
    // io.emit emits the event to all the connections.
    io.to(user.room).emit('message', generateMessage(user.username, message))

    callback()
  })

  // Disconnect is a built-in event.
  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    // If someone didn't even join the room, there is no need to send message
    if (user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left.`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })

  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id)

    io.to(user.room).emit(
      'locationMessage',
      generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`)
    )
    callback()
  })
})

server.listen(port, () => {
  console.log(`Server is up and running on port ${port}`)
})

  // // We want to send an EVENT from the server and receive it on the client side
  // // First argument is a custom EVENT, the second one is what we want to send.
  // socket.emit('countUpdated', count)
