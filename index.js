const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 350
canvas.height = 350

// ------------- DEBUG -----------------------------------------------
const DEBUG = true // ← pon false en producción
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

// --- Modo objetos ------------------------------------------------------------
const objectMode = {
  active: false,
  palette: [
    // añade aquí los PNG que pongas en img/objetos
    'img/objetos/Piano.png'
  ],
  selectedIdx: null, // índice en palette
  selectedId: null, // índice del objeto seleccionado para flechas
  draggingId: null, // índice en placed[]
  offsetDrag: { x: 0, y: 0 },
  placed: [] // {src, x, y, sprite}  (x,y en coordenadas mundo)
}

// Cargar objetos guardados
const storedObjs = localStorage.getItem('lm-objects')
if (storedObjs) {
  try {
    objectMode.placed = JSON.parse(storedObjs)
    dbg(`🗂️ Objetos cargados ${objectMode.placed.length}`)
  } catch (e) {
    objectMode.placed = []
  }
}

const boundaries = []

const image = new Image()
image.src = './img/DptoMap.jpg'

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

  // Sprites de objetos persistentes
  objectMode.placed.forEach((o) => {
    const s = new Sprite({
      position: { x: o.x, y: o.y },
      image: { src: o.src }
    })
    o.sprite = s
    movables.push(s)
    renderables.push(s) // dibuja encima de boundaries
  })

  dbg(`Boundaries iniciales creados: ${boundaries.length}`)
  dbg(`Objetos iniciales creados: ${objectMode.placed.length}`)
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

let frameCount = 0
function animate() {
  const animationId = window.requestAnimationFrame(animate)
  frameCount++

  // Log cada 30 frames (aprox 2 veces por segundo)
  if (DEBUG && frameCount % 30 === 0) {
    dbg('🌀 Frame', frameCount, '-', renderables.length, 'sprites en escena')
  }

  renderables.forEach((renderable, index) => {
    renderable.draw()

    // Log objetos solo ocasionalmente para no saturar
    if (
      DEBUG &&
      frameCount % 60 === 0 &&
      index < 3 &&
      renderable.image &&
      renderable.image.src &&
      renderable.image.src.includes('objetos')
    ) {
      dbg('   ↳ dibujando objeto', renderable.image.src, renderable.position)
    }
  })

  // --- Debug: visualizar foot collision box -----------------------------------------
  if (DEBUG) {
    c.strokeStyle = 'red'
    c.lineWidth = 1
    const f = playerFootRect()
    c.strokeRect(f.position.x, f.position.y, f.width, f.height)
  }

  // --- Pinta rectángulos de colisión -------------------------------------------------
  if (
    DEBUG
      ? collisionMode.active || collisionMode.rectangles.length
      : collisionMode.active
  ) {
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

    const predicted = 3 // velocidad

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

    const predicted = 3 // velocidad

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

    const predicted = 3 // velocidad

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

    const predicted = 3 // velocidad

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

  // Mover objeto seleccionado con flechas
  if (
    objectMode.active &&
    objectMode.draggingId == null &&
    objectMode.selectedId !== null
  ) {
    const sel = objectMode.placed[objectMode.selectedId]
    if (!sel) return
    switch (e.key) {
      case 'ArrowUp':
        sel.y -= 4
        e.preventDefault()
        break
      case 'ArrowDown':
        sel.y += 4
        e.preventDefault()
        break
      case 'ArrowLeft':
        sel.x -= 4
        e.preventDefault()
        break
      case 'ArrowRight':
        sel.x += 4
        e.preventDefault()
        break
      default:
        return
    }
    sel.sprite.position.x = sel.x
    sel.sprite.position.y = sel.y
    dbg('Arrow move', { key: e.key, x: sel.x, y: sel.y })
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
  return {
    x: e.clientX - r.left,
    y: e.clientY - r.top
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
  const pos = getCanvasPos(e)

  // Modo objetos
  if (objectMode.active) {
    // ¿click sobre algún objeto?
    for (let i = objectMode.placed.length - 1; i >= 0; i--) {
      // arriba primero
      const o = objectMode.placed[i]
      const r = {
        x: o.x + background.position.x,
        y: o.y + background.position.y,
        w: o.sprite.width,
        h: o.sprite.height
      }
      if (
        pos.x >= r.x &&
        pos.x <= r.x + r.w &&
        pos.y >= r.y &&
        pos.y <= r.y + r.h
      ) {
        objectMode.draggingId = i
        objectMode.selectedId = i // para mover con flechas
        objectMode.offsetDrag = { x: pos.x - r.x, y: pos.y - r.y }
        dbg('Drag object', i)
        break
      }
    }
    return
  }

  // Modo colisiones
  if (!collisionMode.active) return
  collisionMode.start = pos
  dbg('Start rect', collisionMode.start)
})

canvas.addEventListener('mousemove', (e) => {
  const pos = getCanvasPos(e)

  // Modo objetos
  if (objectMode.active && objectMode.draggingId !== null) {
    const o = objectMode.placed[objectMode.draggingId]
    // nuevas coords mundo
    o.x = pos.x - objectMode.offsetDrag.x - background.position.x
    o.y = pos.y - objectMode.offsetDrag.y - background.position.y
    o.sprite.position.x = o.x
    o.sprite.position.y = o.y
    return
  }

  // Modo colisiones
  if (!collisionMode.active || !collisionMode.start) return
  collisionMode.currentRect = {
    x: Math.min(collisionMode.start.x, pos.x),
    y: Math.min(collisionMode.start.y, pos.y),
    w: Math.abs(pos.x - collisionMode.start.x),
    h: Math.abs(pos.y - collisionMode.start.y)
  }
})

canvas.addEventListener('mouseup', (e) => {
  // Modo objetos
  if (objectMode.active) {
    objectMode.draggingId = null
    return
  }

  // Modo colisiones
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

// Poblar la lista de miniaturas
const listEl = document.getElementById('objectList')
objectMode.palette.forEach((src, i) => {
  const img = new Image()
  img.src = src
  img.style.width = '100%'
  img.style.cursor = 'pointer'
  img.addEventListener('click', () => {
    objectMode.selectedIdx = i
    dbg('🎯 Objeto seleccionado en paleta:', src, 'idx:', i)
    // resalta el seleccionado
    ;[...listEl.children].forEach((ch) => (ch.style.outline = ''))
    img.style.outline = '2px solid white'
    document.getElementById('addObject').disabled = false
    dbg('🔓 Botón "Añadir" habilitado')
  })
  listEl.appendChild(img)
})

// Toggle y botones
document.getElementById('objectToggle').addEventListener('change', (e) => {
  objectMode.active = e.target.checked
  document.getElementById('objectPanel').style.display = objectMode.active
    ? 'block'
    : 'none'
  document.getElementById('objectMsg').textContent = objectMode.active
    ? 'Modo objetos ACTIVADO'
    : ''

  // Reiniciar UI al salir del modo
  if (!objectMode.active) {
    document.getElementById('addObject').disabled = true
    objectMode.selectedIdx = null
    objectMode.selectedId = null
    const listEl = document.getElementById('objectList')
    ;[...listEl.children].forEach((ch) => (ch.style.outline = ''))
  }

  dbg('Toggle objectMode →', objectMode.active)
})

document.getElementById('addObject').addEventListener('click', () => {
  if (objectMode.selectedIdx == null) {
    dbg('❌ Click en "Añadir" sin objeto seleccionado')
    return
  }
  dbg('✅ Click en "Añadir" con idx', objectMode.selectedIdx)
  const src = objectMode.palette[objectMode.selectedIdx]

  // 1 · Cargamos dimensiones reales del PNG antes de decidir coord.
  const imgTmp = new Image()
  imgTmp.src = src
  dbg('⏳ Cargando PNG', src)

  imgTmp.onload = () => {
    dbg('🖼️ PNG cargado', { w: imgTmp.width, h: imgTmp.height })

    // Centro de la viewport → coordenadas mundo
    let worldX = canvas.width / 2 - background.position.x - imgTmp.width / 2
    let worldY = canvas.height / 2 - background.position.y - imgTmp.height / 2

    // 2 · Clamp para que quede dentro de los límites del mapa/fondo
    const maxX = background.image.width - imgTmp.width
    const maxY = background.image.height - imgTmp.height
    worldX = Math.max(0, Math.min(worldX, maxX))
    worldY = Math.max(0, Math.min(worldY, maxY))

    dbg('📐 Coordenadas finales', { worldX, worldY })

    // 3 · Crear sprite ya con sus coords definitivas
    const s = new Sprite({
      position: { x: worldX, y: worldY },
      image: { src }
    })
    objectMode.placed.push({ src, x: worldX, y: worldY, sprite: s })
    movables.push(s)
    renderables.push(s)
    dbg(
      '🎨 Sprite creado; movables:',
      movables.length,
      'renderables:',
      renderables.length
    )
    dbg('Objeto añadido centrado', { src, x: worldX, y: worldY })
  }

  imgTmp.onerror = () => dbg('❌ ERROR cargando', src)
})

document.getElementById('saveObjects').addEventListener('click', () => {
  // guardamos la posición en coordenadas de mundo
  const toSave = objectMode.placed.map((o) => ({
    src: o.src,
    x: o.sprite.position.x - background.position.x,
    y: o.sprite.position.y - background.position.y
  }))
  localStorage.setItem('lm-objects', JSON.stringify(toSave))
  document.getElementById('objectMsg').textContent = 'Objetos guardados ✔'
  dbg('Objetos guardados', toSave.length)
})
