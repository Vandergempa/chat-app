const users = []

const addUser = ({ id, username, room }) => {
  // Clean the data
  username = username.trim().toLowerCase()
  room = room.trim().toLowerCase()

  // Validate the data
  if (!username || !room) {
    return {
      error: 'Username and room are required!'
    }
  }

  // Check for existing user
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username
  })

  // Validate username
  if (existingUser) {
    return {
      error: 'Username is already in use!'
    }
  }

  // Actually store the user
  const user = { id, username, room }
  users.push(user)
  return { user }
}

const removeUser = (id) => {
  // -1 if we didnt find a match, 0 or bigger if we found one
  // This method is faster than .filter as it stops once a match is found
  const index = users.findIndex((user) => {
    return user.id === id
  })

  if (index !== -1) {
    return users.splice(index, 1)[0]
  }
}

const getUser = (id) => {
  return users.find((user) => {
    return user.id === id
  })

}

const getUsersInRoom = (room) => {
  return users.filter((user) => {
    return user.room === room
  })
}

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
}