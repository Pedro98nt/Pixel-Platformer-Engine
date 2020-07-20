/*
  This engine is still really scuffed!
  Stuff that I will add eventually (maybe)...
  - Asset loading instead of hard-coding
  - Cleaning up the 'level' object format
  - Cleaning up the 'animations' object format
  - Implementing CLIPPING (this one is super important)
  - Other dynamic objects
  - Actually readable code
  
  Oh well, I think it works as a basic example!
*/
const canvas = document.getElementById('canvas')
const bgCanvas = document.getElementById('bg')
const context = canvas.getContext('2d')
const bgContext = bgCanvas.getContext('2d')

const types = {
  dood: {
    awake: (state) => {
      state.frame = 0
      state.ticks = 0
      state.vx = 0
      state.vy = 0
      state.grounded = false
    },
    update: (state, tick, input) => {
      const gravityIncrement = 0.08
      const maxGravity = 1
      const jumpPower = 2.3
      const minJumpPower = 0.9
      const speedIncrement = 0.05
      const maxSpeed = 0.7
  
      state.vy = state.vy < maxGravity ? state.vy + gravityIncrement : maxGravity
      state.y += state.vy
   
      if (input.up && state.grounded) state.vy = -jumpPower
      if (!input.up && !state.grounded && state.vy < -minJumpPower) state.vy = -minJumpPower
      if (input.right) {
        state.flip = false
        state.vx = state.vx < maxSpeed ? state.vx + speedIncrement : maxSpeed
        state.x += state.vx
        state.animation = state.vx < 0
          ? animations.slide : state.grounded
          ? animations.run : state.vy < 0
          ? animations.jump : animations.fall
      } else if (input.left) {
        state.flip = true
        state.vx = state.vx > -maxSpeed ? state.vx - speedIncrement : -maxSpeed
        state.x += state.vx
        state.animation = state.vx > 0
          ? animations.slide : state.grounded
          ? animations.run : state.vy < 0
          ? animations.jump : animations.fall
      } else {
        state.vx = Math.abs(state.vx) > 0.2 ? state.vx * 0.89 : 0
        state.x += state.vx
        state.animation = state.grounded
          ? Math.abs(state.vx) > 0
          ? animations.slide : animations.idle : state.vy < 0
          ? animations.jump : animations.fall
      }
      
      // really basic death plane
      if (state.y > 150) {
        state.x = 28
        state.y = 68
        state.flip = false
     
        // flash the css animation
        canvas.style.animation = '0'
        bgCanvas.style.animation = '0'
        requestAnimationFrame(() => {
          canvas.style.animation = ''
          bgCanvas.style.animation = ''
        })
      }

      // adjust bounding box based on direction for the collision check
      const collisions = tileCollision(state, state.flip ? 0 : 2, state.flip ? 5 : 7, 3, 16)
      
      state.grounded = collisions.bottom
      
      setCamera(Math.floor(state.x), state.flip)
    }
  }
}

const level = {
  image: document.getElementById('terrain'),
  size: 16,
  width: 22,
  collisions: [1, 2, 3, 4, 5, 6, 7], // data layer tiles that collide
  bg: [
     1, 2, 3, 0, 0, 4, 5, 0,
     6, 5, 7, 8, 6, 4, 9,10,
    11,12,13,14,15, 4,16,17,
    18,19,20, 0,11,21, 0, 0,
    22,22,23,24,18,23,20,25,
    22,22,22,26,22,22,22,22],
  data: [
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0,22,23,24, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0,25,26,27, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0,13,14,15, 0, 0, 0, 0,28,29,30, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0,16,17,18, 0, 0, 0, 8,13, 3, 2, 0, 0, 8, 0,10,13,24, 0, 0,
     0,24,10,19,20,21, 0, 2, 0, 4, 5, 1, 5,11, 0, 2, 0, 2,25,14,18, 0,
     0, 6, 4, 3, 7,11, 0,21, 0, 1, 1, 1,21, 0, 0,28, 0, 8,19,20,30, 0,
     0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1,15, 0, 0, 0,12, 7, 5, 4, 6, 0],
  parallax: [
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0,13,14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0,11,12, 0, 0, 0,15,16, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 9,10, 0, 0, 0,11,12, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 7, 8, 0, 0, 0, 7, 8, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 5, 6, 0, 0, 0, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 3, 4, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0],
}

const dood = document.getElementById('dood')
const animations = {
  idle:  { image: dood, width: 8, height: 16, frames: [[0, 1]] },
  run:   { image: dood, width: 8, height: 16, frames: [[2, 7], [1, 7], [2, 7], [3, 7]] },
  slide: { image: dood, width: 8, height: 16, frames: [[4, 1]] },
  jump:  { image: dood, width: 8, height: 16, frames: [[1, 1]] },
  fall:  { image: dood, width: 8, height: 16, frames: [[5, 1]] }
}

const state = {
  tick: 0,
  camera: { x: 0, px: 0, ox: 0 },
  input: {},
  objects: [
    { type: types.dood, x: 28, y: 68, flip: false }
  ]
}

function tileCollision (state, left, right, top, bottom) {
  const collisions = { left: false, right: false, top: false, bottom: false }

  const topTile = Math.floor((state.y + top) / 16)
  const topOffset = Math.floor((state.y + (top + 2)) / 16)
  const bottomTile = Math.ceil((state.y + bottom) / 16) - 1
  const bottomOffset = Math.ceil((state.y + (bottom - 2)) / 16) - 1

  let leftTile = Math.floor((state.x + left) / 16) // potential wrapping issues
  let rightTile = Math.ceil((state.x + right) / 16) - 1 // on these tiles

  // prevent corner clipping by offsetting the y-axis of the bounding box
  if (level.collisions.includes(level.data[bottomOffset * level.width + rightTile]) ||
      level.collisions.includes(level.data[topOffset * level.width + rightTile])) {
    state.x = rightTile * 16 - 8
    state.vx *= 0.8
    collisions.right = true
  }

  if (level.collisions.includes(level.data[bottomOffset * level.width + leftTile]) ||
      level.collisions.includes(level.data[topOffset * level.width + leftTile])) {
    state.x = leftTile * 16 + 16
    state.vx *= 0.8
    collisions.left = true
  }

  // determine y-axis collisions with the adjusted position
  leftTile = Math.floor((state.x + left) / 16)
  rightTile = Math.ceil((state.x + right) / 16) - 1

  if (level.collisions.includes(level.data[bottomTile * level.width + leftTile]) ||
      level.collisions.includes(level.data[bottomTile * level.width + rightTile])) {
    state.y = bottomTile * 16 - 16
    collisions.bottom = true
  }

  if (level.collisions.includes(level.data[topTile * level.width + leftTile]) ||
      level.collisions.includes(level.data[topTile * level.width + rightTile])) {
    state.y = topTile * 16 + 13
    state.vy *= 0.5
    collisions.top = true
  }
  
  return collisions
}

function setCamera (x, flip) {
  let delta = flip ? Math.abs(12 - state.camera.ox) / 20 : Math.abs(-12 - state.camera.ox) / 20
  
  delta = delta > 0.2 ? delta : 0.2

  state.camera.ox = flip ? Math.min(state.camera.ox + delta, 12) : Math.max(state.camera.ox - delta, -12)
  state.camera.px = state.camera.x
  state.camera.x = x - 60 - state.camera.ox
}

function initialize () {
  state.objects.forEach(thing => thing.type.awake(thing))
  
  resizeCanvas(canvas)
  resizeCanvas(bgCanvas)
  renderBG(level)
  
  window.onkeydown = event => input(event, true)
  window.onkeyup = event => input(event, false)
  window.requestAnimationFrame(tick)
  window.onresize = event => {
    resizeCanvas(canvas)
    resizeCanvas(bgCanvas)
  }
}

function tick (time) {
  state.tick += 1

  state.objects.forEach(thing => thing.type.update(thing, state.tick, state.input, state.camera))
  
  context.clearRect(state.camera.px, 0, canvas.width, canvas.height)
  drawLevel(context, level, state.camera)
  state.objects.forEach(thing => drawSprite(context, thing, state.camera))

  window.requestAnimationFrame(tick)
}

function drawSprite (context, state, camera) {
  const { type, animation, frame, ticks, x, y, flip } = state
  const { image, width, height, frames } = animation
  
  state.ticks -= 1
  if (state.frame >= animation.frames.length) state.frame = 0
  if (state.ticks >= animation.frames[state.frame][1]) state.ticks = animation.frames[state.frame][1]
  
  if (state.ticks <= 0) {
    state.frame += 1
    if (state.frame >= animation.frames.length) state.frame = 0
    
    state.ticks = animation.frames[state.frame][1]
  }

  context.save()
  context.translate(Math.floor(x + width / 2), Math.floor(y + height / 2))
  context.scale(flip ? -1 : 1, 1)
  
  context.drawImage(animation.image, animation.frames[state.frame][0] * width, 0,
                    width, height, Math.floor(-width/2), Math.floor(-height/2), width, height)

  context.restore()
}

function drawLevel (context, level, camera) {
  context.translate(Math.floor(camera.px) - Math.floor(camera.x), 0)
  
  for (let i = 0; i < level.parallax.length; i++)
    context.drawImage(document.getElementById('tower'), (level.parallax[i] - 1) * level.size, 0, level.size, level.size, (i % level.width) * level.size + Math.floor(camera.x / 2), Math.floor(i / level.width) * level.size, level.size, level.size)
  
  for (let i = 0; i < level.data.length; i++)
    context.drawImage(level.image, (level.data[i] - 1) * level.size, 0, level.size, level.size, (i % level.width) * level.size, Math.floor(i / level.width) * level.size, level.size, level.size)
}

function input ({ key }, active) {
  switch (key) {
    case 'd':
    case 'ArrowRight': return state.input.right = active
    case 'a':
    case 'ArrowLeft': return state.input.left = active
    case 'w':
    case 'ArrowUp': return state.input.up = active
  }
}

function resizeCanvas (canvas) {
  const scale = Math.min(
    Math.floor(window.innerWidth / 128),
    Math.floor(window.innerHeight / 120))
  
  canvas.style.width = `${scale * 128}px`
  canvas.style.height = `${scale * 120}px`
 }

function renderBG (level) {
  for (let i = 0; i < level.bg.length; i++) {
    if (level.bg[i] > 0)
      bgContext.drawImage(document.getElementById('background'), (level.bg[i] - 1) * level.size, 0, level.size, level.size, (i % 8) * level.size, Math.floor(i / 8) * level.size, level.size, level.size)
  }
}

initialize()