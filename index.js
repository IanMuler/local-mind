const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 700
canvas.height = 700


const offset = {
  x: -0,
  y: -0 // Move background up so player appears lower on the map
}


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

// Start the game when background image loads
image.addEventListener('load', () => {
  animate()
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
  const animationId = window.requestAnimationFrame(animate)
  renderables.forEach((renderable) => {
    renderable.draw()
  })

  player.animate = false

  if (keys.w.pressed && lastKey === 'w') {
    player.animate = true
    player.image.src = player.sprites.up.src
    movables.forEach((movable) => {
      movable.position.y += 6
    })
  } else if (keys.a.pressed && lastKey === 'a') {
    player.animate = true
    player.image.src = player.sprites.left.src
    movables.forEach((movable) => {
      movable.position.x += 6
    })
  } else if (keys.s.pressed && lastKey === 's') {
    player.animate = true
    player.image.src = player.sprites.down.src
    movables.forEach((movable) => {
      movable.position.y -= 6
    })
  } else if (keys.d.pressed && lastKey === 'd') {
    player.animate = true
    player.image.src = player.sprites.right.src
    movables.forEach((movable) => {
      movable.position.x -= 6
    })
  }
}

let lastKey = ''
window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'w':
      keys.w.pressed = true
      lastKey = 'w'
      break
    case 'a':
      keys.a.pressed = true
      lastKey = 'a'
      break
    case 's':
      keys.s.pressed = true
      lastKey = 's'
      break
    case 'd':
      keys.d.pressed = true
      lastKey = 'd'
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
