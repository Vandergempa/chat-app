// This lets the client connect to the websocket:
const socket = io()

const messageForm = document.querySelector('#message-form')
const messageFormInput = messageForm.querySelector('input')
const messageFormButton = messageForm.querySelector('button')
const sendLocationButton = document.querySelector('#send-location')
const messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const messageLocationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
// location.search is used to get the query string part of the url in the browser
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
  // New message element
  const newMessage = messages.lastElementChild

  // Height of the newest message 
  const newMessageStyles = getComputedStyle(newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = messages.offsetHeight
  
  // Height of messages container
  const containerHeight = messages.scrollHeight

  // How far have i scrolled?
  // Here we add together the scrollbar's height (the visible height) and the 
  // distance between the top of the content and the top of the scrollbar
  const scrollOffset = messages.scrollTop + visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight
  }
}

// Receiving the event from the server side.
socket.on('message', (message) => {
  // After setting the dynamic value in the html file, we provide data for our template
  // as a second argument to render (an object)
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:m a')
  })
  messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('locationMessage', (message) => {
  // After setting the dynamic value in the html file, we provide data for our template
  // as a second argument to render (an object).
  const html = Mustache.render(messageLocationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:m a')
  })
  messages.insertAdjacentHTML('beforeend', html)
  autoScroll()
})

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  // Disabling the form
  messageFormButton.setAttribute('disabled', 'disabled')

  // e.target is to get the event we are listening on, then we can access any
  // of the elements by their name (name=message in index.html)
  const message = e.target.elements.message.value

  // This is only emitting the event to a particular connection, in case
  // we would like to emit it to every connection possible io.emit needs to be used.
  // ACKNOWLEDGEMENT!!! First we setup the client acknowledgment function in socket.emit!
  socket.emit('sendMessage', message, (error) => {
    // Enabling the form and removing the message in input after submit
    messageFormButton.removeAttribute('disabled')
    messageFormInput.value = ''
    messageFormInput.focus()

    if (error) {
      return console.log(error)
    }
  })
})

sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser.')
  }

  // Disabling the button
  sendLocationButton.setAttribute('disabled', 'disabled')

  // Fetching the user location with the mozilla Geolocation API: 
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, () => {
      // Enabling the button
      sendLocationButton.removeAttribute('disabled')

      console.log('Location shared!')
    })
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = '/'
  }
})

// To receive the event from the server (event name must match!)
// socket.on('countUpdated', (count) => {
//   console.log('The count has been updated!', count)
// })