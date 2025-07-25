const canvas = document.getElementById('gameCanvas')
const c = canvas.getContext('2d')
const delBtn = document.getElementById('deleteObjectBtn')
const cfgBtn = document.getElementById('configObjectBtn')
const delColBtn = document.getElementById('deleteCollisionBtn')

canvas.width = 350
canvas.height = 350

// ------------- DEBUG -----------------------------------------------
const DEBUG = false // ← pon false en producción
function dbg(...args) {
  if (DEBUG) console.log('[DBG]', ...args)
}

let __frame = 0

function isPlayerRef(s) {
  return s === player || s?.isPlayer === true || s?.id === 'player' || s?.type === 'player'
}
function toNumber(n) {
  const v = Number(n)
  return Number.isFinite(v) ? v : 0
}
function getFootRect(s) {
  try {
    if (isPlayerRef(s) && typeof playerFootRect === 'function') return playerFootRect()
    if (typeof s?.footRect === 'function') return s.footRect()
    if (s?.footbox) return s.footbox
    if (s?.hitbox) return s.hitbox
    // Fallback a bounds básicos del sprite
    const pos = { x: toNumber(s?.position?.x), y: toNumber(s?.position?.y) }
    const width = toNumber(s?.width ?? s?.size?.width)
    const height = toNumber(s?.height ?? s?.size?.height)
    return { position: pos, width, height }
  } catch (e) {
    console.warn('[DBG] getFootRect error en', s, e)
    return { position: { x: 0, y: 0 }, width: 0, height: 0 }
  }
}
function nivelOf(s) {
  const raw = s?.nivel
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

// Orden entre OBJETOS (nunca interviene el jugador aquí)
function cmpObjects(a, b) {
  if (background && a === background) return -1
  if (background && b === background) return 1
  const aLvl = nivelOf(a), bLvl = nivelOf(b)
  if (aLvl !== bLvl) return aLvl - bLvl
  const aY = bottomY(a), bY = bottomY(b)
  if (aY !== bY) return aY - bY
  return (a.__zStable ?? 0) - (b.__zStable ?? 0) // estable
}

// Construye el array final "alrededor" del player
function orderAroundPlayer(list) {
  const hasBg = !!background && list.includes(background)
  const hasPlayer = list.some(isPlayerRef)
  const out = []
  if (!hasPlayer) {
    // Fallback: no hay player en escena
    const only = hasBg ? list.filter(s => s !== background) : list.slice()
    only.sort(cmpObjects)
    if (hasBg) out.push(background)
    out.push(...only)
    return out
  }
  const p = list.find(isPlayerRef)
  const pY = bottomY(p)
  const others = list.filter(s => s !== p && (!hasBg || s !== background))
  const behind = []
  const front  = []
  for (const s of others) {
    (bottomY(s) <= pY ? behind : front).push(s) // empate por Y → detrás del player
  }
  behind.sort(cmpObjects)
  front.sort(cmpObjects)
  if (hasBg) out.push(background)
  out.push(...behind, p, ...front)
  return out
}


// ------------- CSS HELPERS -----------------------------------------------
function showElement(element) {
  element.classList.remove('is-hidden')
}

function hideElement(element) {
  element.classList.add('is-hidden')
}

function isElementHidden(element) {
  return element.classList.contains('is-hidden')
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
    'img/objetos/Piano.png',
    'img/objetos/Silla.png',
    'img/objetos/Escritorio.png',
    'img/objetos/Monitor.png',
    'img/objetos/Teclado y mouse.png'
  ],
  selectedIdx: null, // índice en palette
  selectedId: null, // índice del objeto seleccionado para flechas
  draggingId: null, // índice en placed[]
  offsetDrag: { x: 0, y: 0 },
  placed: [] // {src, x, y, nivel, sprite}  (x,y en coordenadas mundo)
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

// Identificación del jugador (por si cambia la referencia)
player.id = 'player'
player.isPlayer = true

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
    o.nivel = o.nivel ?? 0
    const s = new Sprite({
      position: { x: o.x, y: o.y },
      image: { src: o.src }
    })
    s.nivel = o.nivel
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

function updateFloatingButtons() {
  // ----- objeto ------------------------------------------------------------
  if (!isElementHidden(delBtn)) {
    const idx = Number(delBtn.dataset.idx)
    const o = objectMode.placed[idx]
    if (o) {
      const x = o.sprite.position.x + o.sprite.width - 8
      const y = o.sprite.position.y - 8
      delBtn.style.left = `${x}px`
      delBtn.style.top = `${y}px`
    } else {
      hideElement(delBtn)
    }
  }

  if (!isElementHidden(cfgBtn)) {
    const idx = Number(cfgBtn.dataset.idx)
    const o = objectMode.placed[idx]
    if (o) {
      const x = o.sprite.position.x + o.sprite.width - 8
      const yCfg = o.sprite.position.y + 10
      cfgBtn.style.left = `${x}px`
      cfgBtn.style.top = `${yCfg}px`
    } else {
      hideElement(cfgBtn)
    }
  }

  // ----- colisión ----------------------------------------------------------
  if (!isElementHidden(delColBtn)) {
    const idx = Number(delColBtn.dataset.idx)
    const b = boundaries[idx]
    if (b) {
      const x = b.position.x + b.width - 8
      const y = b.position.y - 8
      delColBtn.style.left = `${x}px`
      delColBtn.style.top = `${y}px`
    } else {
      hideElement(delColBtn)
    }
  }
}

function bottomY(s) {
  const r = getFootRect(s)
  const y = toNumber(r?.position?.y) + toNumber(r?.height)
  return y
}

let frameCount = 0
function animate() {
  const animationId = window.requestAnimationFrame(animate)
  frameCount++

  // Log cada 30 frames (aprox 2 veces por segundo)
  if (DEBUG && frameCount % 30 === 0) {
    dbg('🌀 Frame', frameCount, '-', renderables.length, 'sprites en escena')
  }

  // ── ORDEN DE PROFUNDIDAD ───────────────────────────────────────────
  __frame++
  // Etiquetas estables para orden determinístico
  renderables.forEach((s, i) => { s.__zStable = i })

  // Particionar por player y reconstruir
  const ordered = orderAroundPlayer(renderables)
  renderables.splice(0, renderables.length, ...ordered)

  // 2 · pintar ya en orden correcto
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

  // 2 · reposicionar botones flotantes
  updateFloatingButtons()

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
  if (!collisionMode.active) hideElement(delColBtn)
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
  hideElement(delColBtn)
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
    hideElement(delBtn) // ocultar mientras se arrastra
    return
  }

  // Hover para botón "X"
  if (objectMode.active) {
    let hoveredId = null
    for (let i = objectMode.placed.length - 1; i >= 0; i--) {
      const o = objectMode.placed[i]
      const r = {
        x: o.sprite.position.x,
        y: o.sprite.position.y,
        w: o.sprite.width,
        h: o.sprite.height
      }
      if (
        pos.x >= r.x &&
        pos.x <= r.x + r.w &&
        pos.y >= r.y &&
        pos.y <= r.y + r.h
      ) {
        hoveredId = i
        // posiciona la "X" en la esquina superior-derecha del sprite
        delBtn.style.left = `${r.x + r.w - 8}px`
        delBtn.style.top = `${r.y - 8}px`
        showElement(delBtn)
        delBtn.dataset.idx = i

        // posiciona el engranaje más cerca de la X
        const yCfg = r.y + 10
        cfgBtn.style.left = `${r.x + r.w - 8}px`
        cfgBtn.style.top = `${yCfg}px`
        showElement(cfgBtn)
        cfgBtn.dataset.idx = i
        break
      }
    }
    if (hoveredId === null) {
      hideElement(delBtn)
      hideElement(cfgBtn)
    }
  }

  // ── Hover para botón "X" de colisiones ──────────────────────────────
  if (collisionMode.active && !collisionMode.start) {
    // no dibujando
    let hovered = null
    for (let i = boundaries.length - 1; i >= 0; i--) {
      // de arriba a abajo
      const b = boundaries[i] // Boundary instance
      const r = {
        x: b.position.x,
        y: b.position.y,
        w: b.width,
        h: b.height
      }
      if (
        pos.x >= r.x &&
        pos.x <= r.x + r.w &&
        pos.y >= r.y &&
        pos.y <= r.y + r.h
      ) {
        hovered = i
        delColBtn.style.left = `${r.x + r.w - 8}px`
        delColBtn.style.top = `${r.y - 8}px`
        showElement(delColBtn)
        delColBtn.dataset.idx = i
        break
      }
    }
    if (hovered === null) hideElement(delColBtn)
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

// ── Click en la "X" para eliminar objeto ────────────────────────────────────
delBtn.addEventListener('click', () => {
  const idx = Number(delBtn.dataset.idx)
  const o = objectMode.placed[idx]
  if (!o) return

  // quitar de arrays
  objectMode.placed.splice(idx, 1)
  movables.splice(movables.indexOf(o.sprite), 1)
  renderables.splice(renderables.indexOf(o.sprite), 1)

  hideElement(delBtn)
  hideElement(cfgBtn)
  dbg('🗑️ Objeto eliminado', idx)
})

// ── Click en la "X" para eliminar colisión ──────────────────────────────────
delColBtn.addEventListener('click', () => {
  const idx = Number(delColBtn.dataset.idx)
  const boundarySprite = boundaries[idx]
  if (!boundarySprite) return

  // 1 · quitar del array boundaries y de movables/renderables
  boundaries.splice(idx, 1)
  movables.splice(movables.indexOf(boundarySprite), 1)
  renderables.splice(renderables.indexOf(boundarySprite), 1)

  // 2 · quitar del array de datos persistentes
  collisionMode.rectangles.splice(idx, 1)

  // 3 · ocultar botón y refrescar
  hideElement(delColBtn)
  dbg('🗑️ Colisión eliminada', idx)
})

// 1· Lazy-loading de miniaturas + fade-in
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src // carga real
        observer.unobserve(img)
      }
    })
  },
  { root: document.getElementById('objectPanel'), threshold: 0.1 }
)

// Poblar lista de miniaturas con lazy-load
const listEl = document.getElementById('objectList')
objectMode.palette.forEach((src, i) => {
  const img = document.createElement('img')
  img.dataset.src = src // diferimos la carga
  img.alt = `Objeto ${i + 1}: ${src.split('/').pop().replace('.png', '')}`
  img.tabIndex = 0 // accesible por teclado

  // al cargar, aplicar fade-in
  img.addEventListener('load', () => img.classList.add('loaded'))

  // click o Enter → seleccionar
  function select() {
    objectMode.selectedIdx = i
    ;[...listEl.children].forEach((ch) => ch.classList.remove('is-selected'))
    img.classList.add('is-selected')
    document.getElementById('addObject').disabled = false
  }
  img.addEventListener('click', select)
  img.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') select()
  })

  listEl.appendChild(img)
  observer.observe(img) // activar lazy-load
})

// Navegación ← → dentro del panel
const objectPanel = document.getElementById('objectPanel')
objectPanel.addEventListener('keydown', (e) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return
  const imgs = [...listEl.children]
  let idx = objectMode.selectedIdx ?? -1
  if (e.key === 'ArrowLeft') idx = (idx - 1 + imgs.length) % imgs.length
  if (e.key === 'ArrowRight') idx = (idx + 1) % imgs.length
  imgs[idx].focus()
  imgs[idx].click() // reutiliza la lógica de selección
})

// Toggle y botones
document.getElementById('objectToggle').addEventListener('change', (e) => {
  objectMode.active = e.target.checked
  const objectPanel = document.getElementById('objectPanel')
  if (objectMode.active) {
    objectPanel.classList.add('is-open')
  } else {
    objectPanel.classList.remove('is-open')
  }
  document.getElementById('objectMsg').textContent = objectMode.active
    ? 'Modo objetos ACTIVADO'
    : ''

  // Reiniciar UI al salir del modo
  if (!objectMode.active) {
    document.getElementById('addObject').disabled = true
    objectMode.selectedIdx = null
    objectMode.selectedId = null
    const listEl = document.getElementById('objectList')
    ;[...listEl.children].forEach((ch) => ch.classList.remove('is-selected'))
    hideElement(delBtn)
    hideElement(cfgBtn)
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
    const nivel = 0 // valor por defecto
    const s = new Sprite({
      position: { x: worldX, y: worldY },
      image: { src }
    })
    s.nivel = nivel
    objectMode.placed.push({ src, x: worldX, y: worldY, nivel, sprite: s })
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
    y: o.sprite.position.y - background.position.y,
    nivel: o.nivel ?? 0
  }))
  localStorage.setItem('lm-objects', JSON.stringify(toSave))
  document.getElementById('objectMsg').textContent = 'Objetos guardados ✔'
  dbg('Objetos guardados', toSave.length)
})

// ─── Toggle Tools dropdown ─────────────────────────
const toolsButton = document.getElementById('toolsButton')
const toolsDropdown = document.getElementById('toolsDropdown')
const objectToggle = document.getElementById('objectToggle')
const collisionToggle = document.getElementById('collisionToggle')
const saveBtn = document.getElementById('saveBounds')
const messagesContainer = document.getElementById('messagesContainer')

// 1) Abrir / cerrar dropdown
toolsButton.addEventListener('click', () => {
  const open = toolsDropdown.classList.toggle('show')
  toolsButton.setAttribute('aria-expanded', open)
  toolsDropdown.setAttribute('aria-hidden', !open)
  toolsButton.classList.toggle('open', open)
})

// 2) Cerrar al click fuera o teclear Esc
document.addEventListener('click', (e) => {
  if (!toolsButton.contains(e.target) && !toolsDropdown.contains(e.target)) {
    toolsDropdown.classList.remove('show')
    toolsButton.setAttribute('aria-expanded', 'false')
    toolsDropdown.setAttribute('aria-hidden', 'true')
  }
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    toolsDropdown.classList.remove('show')
    toolsButton.setAttribute('aria-expanded', 'false')
    toolsDropdown.setAttribute('aria-hidden', 'true')
  }
})

// 3) Mostrar / ocultar Guardar según estado de switches
function updateSaveVisibility() {
  const anyOn = objectToggle.checked || collisionToggle.checked
  saveBtn.hidden = !anyOn

  // Show/hide messages container
  if (anyOn) {
    messagesContainer.classList.remove('is-hidden')
  } else {
    messagesContainer.classList.add('is-hidden')
  }
}

objectToggle.addEventListener('change', (e) => {
  updateSaveVisibility()
})

collisionToggle.addEventListener('change', (e) => {
  updateSaveVisibility()
})

// ────────────────────────────────────────────────────────────────────────────
// MODAL DE CONFIGURACIÓN DE NIVEL
// ────────────────────────────────────────────────────────────────────────────

const modal = document.getElementById('levelModal')
const nivelInput = document.getElementById('nivelInput')
const nivelSave = document.getElementById('nivelSave')
const nivelCancel = document.getElementById('nivelCancel')

function openModal(idx, valorActual) {
  modal.dataset.idx = idx
  nivelInput.value = valorActual ?? 0
  modal.classList.remove('hidden')
  nivelInput.focus()
}

function closeModal() {
  modal.classList.add('hidden')
}

// Botón ⚙ (cfgBtn)
cfgBtn.addEventListener('click', () => {
  const idx = Number(cfgBtn.dataset.idx)
  const o = objectMode.placed[idx]
  if (o) openModal(idx, o.nivel)
})

// Botones del modal
nivelSave.addEventListener('click', () => {
  const idx = Number(modal.dataset.idx)
  const nuevo = Number(nivelInput.value)

  if (!Number.isNaN(nuevo)) {
    const o = objectMode.placed[idx]
    if (o) {
      o.nivel = nuevo
      o.sprite.nivel = nuevo
    }
  }
  closeModal()
})

nivelCancel.addEventListener('click', closeModal)

// Cerrar con ESC o clic fuera
modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target.classList.contains('modal__backdrop'))
    closeModal()
})

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal()
})
