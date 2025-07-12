const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 700
canvas.height = 700

// Collision map and game state
let collisionMap = null
let gameStarted = false

// Tile size constant for coordinate conversion
const TILE = 1 // Each pixel in collision map = 1 pixel in canvas

const offset = {
  x: -0,
  y: -100 // Move background up so player appears lower on the map
}

// Function to check if a position is walkable
function isWalkable(px, py) {
  if (!collisionMap) return true

  // Convert pixel coordinates to map indices (respecting sign, no Math.abs!)
  const mapX = Math.floor(px / TILE)
  const mapY = Math.floor(py / TILE)

  // Check bounds - out of bounds = obstacle
  if (
    mapY < 0 ||
    mapY >= collisionMap.length ||
    mapX < 0 ||
    mapX >= collisionMap[0].length
  ) {
    console.log(
      'Out of bounds:',
      mapX,
      mapY,
      'from coords:',
      px,
      py,
      'Map size:',
      collisionMap[0].length,
      collisionMap.length
    )
    return false
  }

  console.log(
    'Checking map at:',
    mapX,
    mapY,
    '=',
    collisionMap[mapY][mapX],
    'from coords:',
    px,
    py
  )
  // Return true if walkable (1), false if obstacle (0)
  return collisionMap[mapY][mapX] === 1
}

// Load collision map
fetch('./colisiones/collision_map.json')
  .then((response) => response.json())
  .then((data) => {
    collisionMap = data
    gameStarted = true
    console.log(
      'Collision map loaded:',
      collisionMap.length + 'x' + collisionMap[0].length
    )
    console.log('Canvas size:', canvas.width + 'x' + canvas.height)
    console.log('Background starting position:', background.position)
    console.log('Player starting position:', player.position)
    animate() // Start the game loop
  })
  .catch((error) => {
    console.error('Error loading collision map:', error)
    gameStarted = true
    animate() // Start anyway without collisions
  })

const image = new Image()
image.src = './img/DptoMap.png'

const playerDownImage = new Image()
playerDownImage.src = './img/Yo/playerDown.png'

const playerUpImage = new Image()
playerUpImage.src = './img/Yo/playerUp.png'

const playerLeftImage = new Image()
playerLeftImage.src = './img/Yo/playerLeft.png'

const playerRightImage = new Image()
playerRightImage.src = './img/Yo/playerRight.png'

const player = new Sprite({
  position: {
    x: canvas.width / 2 - 192 / 4 / 2,
    y: canvas.height / 2 - 68 / 2
  },
  image: playerDownImage,
  frames: {
    max: 4,
    hold: 10
  },
  sprites: {
    up: playerUpImage,
    left: playerLeftImage,
    right: playerRightImage,
    down: playerDownImage
  }
})

const background = new Sprite({
  position: {
    x: offset.x,
    y: offset.y
  },
  image: image
})

const keys = {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  }
}

const movables = [background]
const renderables = [background, player]

function animate() {
  if (!gameStarted) return

  const animationId = window.requestAnimationFrame(animate)
  renderables.forEach((renderable) => {
    renderable.draw()
  })

  let moving = true
  player.animate = false

  if (keys.w.pressed && lastKey === 'w') {
    console.log('Moving up')
    player.animate = true
    player.image.src = player.sprites.up.src

    // Check collision at new position (look ahead by 6 pixels)
    const lookAhead = 6
    const playerCenterX = canvas.width / 2
    const playerCenterY = canvas.height / 2

    // Convert to world coordinates
    const worldX = playerCenterX - background.position.x
    const worldY = playerCenterY - background.position.y - lookAhead

    console.log('Checking collision at world coords:', worldX, worldY)

    if (!isWalkable(worldX, worldY)) {
      console.log('Collision detected, cannot move up')
      moving = false
    }

    if (moving) {
      console.log('Moving world down (player moves up)')
      movables.forEach((movable) => {
        movable.position.y += 6
      })
    }
  } else if (keys.a.pressed && lastKey === 'a') {
    player.animate = true
    player.image.src = player.sprites.left.src

    // Check collision at new position (look ahead by 6 pixels)
    const lookAhead = 6
    const playerCenterX = canvas.width / 2
    const playerCenterY = canvas.height / 2

    // Convert to world coordinates
    const worldX = playerCenterX - background.position.x - lookAhead
    const worldY = playerCenterY - background.position.y

    console.log('Checking collision at world coords:', worldX, worldY)

    if (!isWalkable(worldX, worldY)) {
      console.log('Collision detected, cannot move left')
      moving = false
    }

    if (moving) {
      console.log('Moving world right (player moves left)')
      movables.forEach((movable) => {
        movable.position.x += 6
      })
    }
  } else if (keys.s.pressed && lastKey === 's') {
    player.animate = true
    player.image.src = player.sprites.down.src

    // Check collision at new position (look ahead by 6 pixels)
    const lookAhead = 6
    const playerCenterX = canvas.width / 2
    const playerCenterY = canvas.height / 2

    // Convert to world coordinates
    const worldX = playerCenterX - background.position.x
    const worldY = playerCenterY - background.position.y + lookAhead

    console.log('Checking collision at world coords:', worldX, worldY)

    if (!isWalkable(worldX, worldY)) {
      console.log('Collision detected, cannot move down')
      moving = false
    }

    if (moving) {
      console.log('Moving world up (player moves down)')
      movables.forEach((movable) => {
        movable.position.y -= 6
      })
    }
  } else if (keys.d.pressed && lastKey === 'd') {
    player.animate = true
    player.image.src = player.sprites.right.src

    // Check collision at new position (look ahead by 6 pixels)
    const lookAhead = 6
    const playerCenterX = canvas.width / 2
    const playerCenterY = canvas.height / 2

    // Convert to world coordinates
    const worldX = playerCenterX - background.position.x + lookAhead
    const worldY = playerCenterY - background.position.y

    console.log('Checking collision at world coords:', worldX, worldY)

    if (!isWalkable(worldX, worldY)) {
      console.log('Collision detected, cannot move right')
      moving = false
    }

    if (moving) {
      console.log('Moving world left (player moves right)')
      movables.forEach((movable) => {
        movable.position.x -= 6
      })
    }
  }
}

let lastKey = ''
window.addEventListener('keydown', (e) => {
  console.log('Key pressed:', e.key)
  switch (e.key) {
    case 'w':
      keys.w.pressed = true
      lastKey = 'w'
      console.log('W key pressed')
      break
    case 'a':
      keys.a.pressed = true
      lastKey = 'a'
      console.log('A key pressed')
      break
    case 's':
      keys.s.pressed = true
      lastKey = 's'
      console.log('S key pressed')
      break
    case 'd':
      keys.d.pressed = true
      lastKey = 'd'
      console.log('D key pressed')
      break
  }
})

window.addEventListener('keyup', (e) => {
  switch (e.key) {
    case 'w':
      keys.w.pressed = false
      break
    case 'a':
      keys.a.pressed = false
      break
    case 's':
      keys.s.pressed = false
      break
    case 'd':
      keys.d.pressed = false
      break
  }
})
