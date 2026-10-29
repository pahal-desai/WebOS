boot = document.getElementById('boot')
load = document.getElementById('load')
page = document.getElementById('page')

num = 0

function run() {
  num = num + 1
  load.style.width = num + '%'
  page.innerText = 'page ' + num

  if (num == 100) {
    boot.style.display = 'none'
    clearInterval(timer)
  }
}

timer = setInterval(run, 30)
//you looking into the code makes me feel uncomfortable.
drag = null
ox = 0
oy = 0

wins = {}
minned = {}
busy = {}

slices = 120
dur = 550
lag = 0.5

function easecurve(x) {
  return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2
}

function grabwin(el) {
  r = el.getBoundingClientRect()
  c = document.createElement('canvas')
  dpr = window.devicePixelRatio || 1
  c.width = Math.round(r.width * dpr)
  c.height = Math.round(r.height * dpr)
  g = c.getContext('2d')
  g.scale(dpr, dpr)
  g.fillStyle = '#fdfaf2'
  g.fillRect(0, 0, r.width, r.height)
  g.strokeStyle = '#8b5a2b'
  g.lineWidth = 2
  g.strokeRect(1, 1, r.width-2, r.height-2)
  g.fillStyle = '#8b5a2b'
  g.fillRect(0, 0, r.width, 25)
  g.fillStyle = '#fdfaf2'
  g.fillRect(r.width-19, 6, 14, 14)
  g.fillRect(r.width-38, 6, 14, 14)
  g.fillRect(r.width-57, 6, 14, 14)
  g.fillStyle = '#2b1810'
  g.font = '10px serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('×', r.width-12, 13)
  g.fillText('□', r.width-31, 13)
  g.fillText('_', r.width-50, 13)
  return c
}

function rungenie(n, shrink, cb) {
  if (busy[n]) return
  busy[n] = 1

  el = wins[n]
  wr = el.getBoundingClientRect()
  thetile = items[n-1].querySelector('.tile')
  ir = thetile.getBoundingClientRect()

  pic = grabwin(el)
  el.style.visibility = 'hidden'

  cvs = document.createElement('canvas')
  dpr = window.devicePixelRatio || 1
  cvs.width = innerWidth * dpr
  cvs.height = innerHeight * dpr
  cvs.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:998;pointer-events:none'
  document.body.appendChild(cvs)
  cg = cvs.getContext('2d')
  cg.scale(dpr, dpr)
  cg.imageSmoothingEnabled = true
  cg.imageSmoothingQuality = 'high'

  scx = wr.left + wr.width/2
  sy = wr.top
  sw2 = wr.width/2
  sh = wr.height

  tcx = ir.left + ir.width/2
  tcy = ir.top + ir.height/2
  tw2 = ir.width/2

  began = null

  function tick(ts) {
    if (!began) began = ts
    raw = Math.min((ts - began) / dur, 1)
    t = shrink ? raw : 1 - raw

    cg.clearRect(0, 0, cvs.width, cvs.height)

    if (shrink) {
      cg.globalAlpha = raw < 0.65 ? 1 : 1 - (raw-0.65)/0.35 * 0.6
    } else {
      cg.globalAlpha = raw > 0.35 ? 1 : 0.4 + raw/0.35 * 0.6
    }

    for (j = 0; j < slices; j++) {
      v = j / slices
      vn = (j+1) / slices

      p = Math.min(Math.max(t*(1+lag) - (1-v)*lag, 0), 1)
      p = easecurve(p)
      pn = Math.min(Math.max(t*(1+lag) - (1-vn)*lag, 0), 1)
      pn = easecurve(pn)

      hw = sw2 + (tw2 - sw2) * Math.pow(p, 2.2)
      hwn = sw2 + (tw2 - sw2) * Math.pow(pn, 2.2)

      cx = scx + (tcx - scx) * p
      cxn = scx + (tcx - scx) * pn

      y = sy + v*sh + (tcy - sy - v*sh) * p
      yn = sy + vn*sh + (tcy - sy - vn*sh) * pn

      ahw = (hw + hwn) / 2
      acx = (cx + cxn) / 2
      dh = yn - y
      if (dh < 0.5) dh = 0.5

      ssy = v * pic.height
      ssh = (vn - v) * pic.height
      if (ssh < 1) ssh = 1

      cg.drawImage(pic, 0, ssy, pic.width, ssh, acx - ahw, y, ahw*2, dh + 0.5)
    }

    cg.globalAlpha = 1

    if (raw < 1) {
      requestAnimationFrame(tick)
    } else {
      cvs.remove()
      delete busy[n]
      cb()
    }
  }

  requestAnimationFrame(tick)
}

function pop(n) {
  if (wins[n] && minned[n]) {
    if (busy[n]) return
    rungenie(n, false, function() {
      wins[n].style.visibility = 'visible'
      delete minned[n]
    })
    return
  }

  if (wins[n]) return

  ww = document.createElement('div')
  wins[n] = ww
  ww.className = 'box'
  ww.style.left = (60*n) + 'px'
  ww.style.top = (60*n) + 'px'

  hd = document.createElement('div')
  hd.className = 'head'
  hd.onmousedown = function(e) {
    if (e.target != hd) return
    drag = wins[n]
    ox = e.clientX - wins[n].offsetLeft
    oy = e.clientY - wins[n].offsetTop
  }

  mb = document.createElement('div')
  mb.className = 'btn'
  mb.innerText = '_'
  mb.onclick = function() {
    if (busy[n] || minned[n]) return
    minned[n] = 1
    rungenie(n, true, function() {})
  }

  xb = document.createElement('div')
  xb.className = 'btn'
  xb.innerText = '□'
  xb.onclick = function() {
    winel = wins[n]
    if (winel.style.width == '100%') {
      winel.style.width = '250px'
      winel.style.height = '180px'
      winel.style.left = (60*n) + 'px'
      winel.style.top = (60*n) + 'px'
    } else {
      winel.style.width = '100%'
      winel.style.height = '100%'
      winel.style.left = '0px'
      winel.style.top = '0px'
    }
  }

  closebtn = document.createElement('div')
  closebtn.className = 'btn'
  closebtn.innerText = '×'
  closebtn.onclick = function() {
    wins[n].remove()
    delete wins[n]
    delete minned[n]
  }
//still looking into my code?
  hd.appendChild(mb)
  hd.appendChild(xb)
  hd.appendChild(closebtn)

  ww.appendChild(hd)
  document.body.appendChild(ww)
}

document.onmousemove = function(e) {
  if (drag) {
    drag.style.left = (e.clientX - ox) + 'px'
    drag.style.top = (e.clientY - oy) + 'px'
  }
}

document.onmouseup = function() {
  drag = null
}

dock = document.getElementById('dock')
items = document.querySelectorAll('.dockitem')

for (i = 0; i < items.length; i++) {
  items[i].onmousemove = function(e) {
    rect = this.getBoundingClientRect()
    pos = (e.clientX - rect.left) / rect.width
    off = (pos - 0.5) * 8
    dock.style.setProperty('--dock-offset-left', (-off) + 'px')
    dock.style.setProperty('--dock-offset-right', off + 'px')
  }
}
