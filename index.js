const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 700
canvas.height = 700

// ------------- DEBUG -----------------------------------------------
const DEBUG = false // ← pon false en producción
function dbg(...args) {
  if (DEBUG) console.log('[DBG]', ...args)
}

// ------------- COLLISION DETECTION ------------------------------------
function rectangularCollision({ rect1, rect2 }) {
  const hit =
    rect1.position.x + rect1.width > rect2.position.x &&
    rect1.position.x < rect2.position.x + rect2.width &&
    rect1.position.y + rect1.height > rect2.position.y &&
    rect1.position.y < rect2.position.y + rect2.height

  if (DEBUG && hit) dbg('💥 COLISION', { p: rect1.position, b: rect2.position })
  return hit
}

const offset = {
  x: -0,
  y: -0 // Move background up so player appears lower on the map
}

// --- Modo colisiones --------------------------------------------------------
const collisionMode = {
  active: false, // ¿el toggle está ON?
  start: null, // punto de inicio (mousedown)
  currentRect: null, // rectángulo fantasma mientras arrastras
  rectangles: [] // rects definitivos creados esta sesión
}

// Cargar datos previos (si existen)
// NOTA: Si tienes límites guardados con la fórmula anterior (suma en lugar de resta),
// ejecuta una vez en consola: localStorage.removeItem('lm-collisions')
const stored = localStorage.getItem('lm-collisions')
if (stored) {
  try {
    collisionMode.rectangles = JSON.parse(stored)
    dbg(`Se cargaron ${collisionMode.rectangles.length} límites persistentes`)
  } catch (e) {
    console.warn('Error parsing stored collisions:', e)
    collisionMode.rectangles = []
  }
}

const boundaries = []

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

// Devuelve el rectángulo de colisión solo para la mitad inferior
function playerFootRect() {
  return {
    position: {
      x: player.position.x, // igual que ahora
      y: player.position.y + player.height / 2 // parte baja
    },
    width: player.width,
    height: player.height / 2
  }
}

const background = new Sprite({
  position: {
    x: offset.x,
    y: offset.y
  },
  image: image
})

// Start the game when background image loads
image.addEventListener('load', () => {
  // Create boundaries from saved collision rectangles
  collisionMode.rectangles.forEach((r) => {
    boundaries.push(
      new Boundary({ position: { x: r.x, y: r.y }, width: r.w, height: r.h })
    )
  })
  movables.push(...boundaries) // para que se muevan con el mapa
  renderables.unshift(...boundaries) // para que se dibujen debajo del player

  dbg(`Boundaries iniciales creados: ${boundaries.length}`)
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

  // --- Debug: visualizar foot collision box -----------------------------------------
  if (DEBUG) {
    c.strokeStyle = 'red'
    c.lineWidth = 1
    const f = playerFootRect()
    c.strokeRect(f.position.x, f.position.y, f.width, f.height)
  }

  // --- Pinta rectángulos de colisión -------------------------------------------------
  if (DEBUG ? (collisionMode.active || collisionMode.rectangles.length) : collisionMode.active) {
    c.strokeStyle = 'yellow'
    c.lineWidth = 2

    // Rects guardados (persistentes)
    collisionMode.rectangles.forEach((r) => {
      c.strokeRect(
        r.x + background.position.x,
        r.y + background.position.y,
        r.w,
        r.h
      )
    })

    // Rect fantasma mientras arrastro
    if (collisionMode.currentRect) {
      const r = collisionMode.currentRect
      c.strokeRect(r.x, r.y, r.w, r.h)
    }
  }

  player.animate = false

  if (keys.w.pressed && lastKey === 'w') {
    player.animate = true
    player.image.src = player.sprites.up.src

    const predicted = 6 // velocidad

    // ¿chocaría con alguno?
    let collision = false
    const foot = playerFootRect()
    for (const b of boundaries) {
      if (
        rectangularCollision({
          rect1: foot, // ← solo piernas
          rect2: {
            ...b,
            position: { x: b.position.x, y: b.position.y + predicted } // ← mueve fantasma
          }
        })
      ) {
        collision = true
        if (DEBUG) dbg('STOP ↑ por', b)
        break
      }
    }

    if (!collision) movables.forEach((m) => (m.position.y += predicted))
  } else if (keys.a.pressed && lastKey === 'a') {
    player.animate = true
    player.image.src = player.sprites.left.src

    const predicted = 6 // velocidad

    // ¿chocaría con alguno?
    let collision = false
    const foot = playerFootRect()
    for (const b of boundaries) {
      if (
        rectangularCollision({
          rect1: foot, // ← solo piernas
          rect2: {
            ...b,
            position: { x: b.position.x + predicted, y: b.position.y } // ← mueve fantasma
          }
        })
      ) {
        collision = true
        if (DEBUG) dbg('STOP ← por', b)
        break
      }
    }

    if (!collision) movables.forEach((m) => (m.position.x += predicted))
  } else if (keys.s.pressed && lastKey === 's') {
    player.animate = true
    player.image.src = player.sprites.down.src

    const predicted = 6 // velocidad

    // ¿chocaría con alguno?
    let collision = false
    const foot = playerFootRect()
    for (const b of boundaries) {
      if (
        rectangularCollision({
          rect1: foot, // ← solo piernas
          rect2: {
            ...b,
            position: { x: b.position.x, y: b.position.y - predicted } // ← mueve fantasma
          }
        })
      ) {
        collision = true
        if (DEBUG) dbg('STOP ↓ por', b)
        break
      }
    }

    if (!collision) movables.forEach((m) => (m.position.y -= predicted))
  } else if (keys.d.pressed && lastKey === 'd') {
    player.animate = true
    player.image.src = player.sprites.right.src

    const predicted = 6 // velocidad

    // ¿chocaría con alguno?
    let collision = false
    const foot = playerFootRect()
    for (const b of boundaries) {
      if (
        rectangularCollision({
          rect1: foot, // ← solo piernas
          rect2: {
            ...b,
            position: { x: b.position.x - predicted, y: b.position.y } // ← mueve fantasma
          }
        })
      ) {
        collision = true
        if (DEBUG) dbg('STOP → por', b)
        break
      }
    }

    if (!collision) movables.forEach((m) => (m.position.x -= predicted))
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

function getCanvasPos(e) {
  const r = canvas.getBoundingClientRect()
  const scaleX = canvas.width / r.width // factor de escala horizontal
  const scaleY = canvas.height / r.height // factor vertical
  return {
    x: (e.clientX - r.left) * scaleX,
    y: (e.clientY - r.top) * scaleY
  }
}

document.getElementById('collisionToggle').addEventListener('change', (e) => {
  collisionMode.active = e.target.checked
  dbg('Toggle collisionMode →', collisionMode.active)
  document.getElementById('collisionMsg').textContent = collisionMode.active
    ? 'Modo colisiones ACTIVADO'
    : ''
})

document.getElementById('saveBounds').addEventListener('click', () => {
  localStorage.setItem(
    'lm-collisions',
    JSON.stringify(collisionMode.rectangles)
  )
  document.getElementById('collisionMsg').textContent = 'Colisiones guardadas ✔'
})

canvas.addEventListener('mousedown', (e) => {
  if (!collisionMode.active) return
  collisionMode.start = getCanvasPos(e)
  dbg('Start rect', collisionMode.start)
})

canvas.addEventListener('mousemove', (e) => {
  if (!collisionMode.active || !collisionMode.start) return
  const now = getCanvasPos(e)
  collisionMode.currentRect = {
    x: Math.min(collisionMode.start.x, now.x),
    y: Math.min(collisionMode.start.y, now.y),
    w: Math.abs(now.x - collisionMode.start.x),
    h: Math.abs(now.y - collisionMode.start.y)
  }
})

canvas.addEventListener('mouseup', (e) => {
  if (!collisionMode.active || !collisionMode.start) return
  if (!collisionMode.currentRect) return

  const { x, y, w, h } = collisionMode.currentRect
  const worldX = x - background.position.x
  const worldY = y - background.position.y
  dbg('Rect final (world)', { worldX, worldY, w, h })

  collisionMode.rectangles.push({ x: worldX, y: worldY, w, h })

  const newB = new Boundary({
    position: { x: worldX, y: worldY },
    width: w,
    height: h
  })
  boundaries.push(newB)
  movables.push(newB)
  renderables.unshift(newB)
  dbg('Boundary añadido', newB)

  collisionMode.start = collisionMode.currentRect = null
  document.getElementById('collisionMsg').textContent =
    'Límites definidos correctamente'
})
