const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 700
canvas.height = 700


const offset = {
  x: -0,
  y: -0 // Move background up so player appears lower on the map
}

// --- Modo colisiones --------------------------------------------------------
const collisionMode = {
  active: false,         // ¿el toggle está ON?
  start: null,           // punto de inicio (mousedown)
  currentRect: null,     // rectángulo fantasma mientras arrastras
  rectangles: []         // rects definitivos creados esta sesión
};

// Cargar datos previos (si existen)
const stored = localStorage.getItem('lm-collisions');
if (stored) {
  try {
    collisionMode.rectangles = JSON.parse(stored);
  } catch (e) {
    console.warn('Error parsing stored collisions:', e);
    collisionMode.rectangles = [];
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
  collisionMode.rectangles.forEach(r => {
    boundaries.push(new Boundary({ position: { x: r.x, y: r.y }, width: r.w, height: r.h }));
  });
  movables.push(...boundaries);      // para que se muevan con el mapa
  renderables.unshift(...boundaries); // para que se dibujen debajo del player
  
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

  // --- Pinta rectángulos de colisión -------------------------------------------------
  if (collisionMode.active || collisionMode.rectangles.length) {
    c.strokeStyle = 'yellow';
    c.lineWidth = 2;

    // Rects guardados (persistentes)
    collisionMode.rectangles.forEach(r => {
      c.strokeRect(r.x - background.position.x,
                   r.y - background.position.y,
                   r.w, r.h);
    });

    // Rect fantasma mientras arrastro
    if (collisionMode.currentRect) {
      const r = collisionMode.currentRect;
      c.strokeRect(r.x, r.y, r.w, r.h);
    }
  }

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

document.getElementById('collisionToggle').addEventListener('change', e => {
  collisionMode.active = e.target.checked;
  document.getElementById('collisionMsg').textContent =
    collisionMode.active ? 'Modo colisiones ACTIVADO' : '';
});

document.getElementById('saveBounds').addEventListener('click', () => {
  localStorage.setItem('lm-collisions', JSON.stringify(collisionMode.rectangles));
  document.getElementById('collisionMsg').textContent = 'Colisiones guardadas ✔';
});

canvas.addEventListener('mousedown', e => {
  if (!collisionMode.active) return;
  const r = canvas.getBoundingClientRect();
  collisionMode.start = { x: e.clientX - r.left, y: e.clientY - r.top };
});

canvas.addEventListener('mousemove', e => {
  if (!collisionMode.active || !collisionMode.start) return;
  const r = canvas.getBoundingClientRect();
  const now = { x: e.clientX - r.left, y: e.clientY - r.top };
  collisionMode.currentRect = {
    x: Math.min(collisionMode.start.x, now.x),
    y: Math.min(collisionMode.start.y, now.y),
    w: Math.abs(now.x - collisionMode.start.x),
    h: Math.abs(now.y - collisionMode.start.y)
  };
});

canvas.addEventListener('mouseup', e => {
  if (!collisionMode.active || !collisionMode.start) return;
  if (!collisionMode.currentRect) return;
  const { x, y, w, h } = collisionMode.currentRect;
  // Guarda en coords de mundo (suma offset del fondo)
  const worldX = x + background.position.x;
  const worldY = y + background.position.y;
  
  collisionMode.rectangles.push({
    x: worldX,
    y: worldY,
    w, h
  });
  
  // Añadir boundary en tiempo real para activar colisión inmediatamente
  const newBoundary = new Boundary({ position: { x: worldX, y: worldY }, width: w, height: h });
  boundaries.push(newBoundary);
  movables.push(newBoundary);
  renderables.unshift(newBoundary);
  
  collisionMode.start = null;
  collisionMode.currentRect = null;
  document.getElementById('collisionMsg').textContent = 'Límites definidos correctamente';
});
