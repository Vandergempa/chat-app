const socket = io()

const messages = document.querySelector('#rooms')
const inputField = document.querySelectorAll('input')[1]
const button = document.querySelector('button')
const selectTemplate = document.querySelector('#select-template').innerHTML

socket.emit('pageLoad')


socket.on('roomCount', (roomCount) => {
  // To delete the added select dropdown on every page refresh
  if (messages.childElementCount > 0) {
    messages.removeChild(messages.lastElementChild)
  }

  const html = Mustache.render(selectTemplate, roomCount)
  messages.insertAdjacentHTML('afterbegin', html)

  const selector = document.querySelector('select')

  selector.addEventListener('change', (e) => {
    inputField.value = e.target.value
    button.textContent = 'Join'
  })
})

