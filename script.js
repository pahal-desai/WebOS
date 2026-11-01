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
topz = 20

wins = {}
minned = {}
busy = {}

notes = [
  { title: 'Diary entry', body: 'Dear diary,<br>Today is a peaceful day in <b>BookOS</b>.<br>The parchment smells of <i>antique leather</i> and old stories.' },
  { title: 'Reading list', body: '<u>Ancient manuscripts to find</u>:<br>1. Secrets of typography<br><s>Lost volume II</s><br>2. Bookbinding arts' }
]
notecur = 0

todos = [
  { txt: 'Read antique book', done: false },
  { txt: 'Write diary thoughts', done: true },
  { txt: 'Collect vintage fountain pens', done: false }
]

slices = 120
dur = 550
lag = 0.5

function easecurve(x) {
  return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2
}

function grabwin(el, n) {
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

  btns = ['×', '□', '_']
  for (bi = 0; bi < 3; bi++) {
    g.fillStyle = '#fdfaf2'
    g.fillRect(r.width - 19 - bi*19, 6, 14, 14)
    g.fillStyle = '#2b1810'
    g.font = '10px serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(btns[bi], r.width - 12 - bi*19, 13)
  }

  if (n == 1) {
    digi = el.querySelector('.clockdigi')
    dat = el.querySelector('.clockdate')
    g.fillStyle = '#2b1810'
    g.font = 'bold 30px serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(digi ? digi.innerText : '', r.width / 2, 25 + (r.height - 25) / 2 - 10)
    g.font = '14px serif'
    g.fillText(dat ? dat.innerText : '', r.width / 2, 25 + (r.height - 25) / 2 + 20)
  }

  if (n == 2 || n == 3) {
    g.fillStyle = '#2b1810'
    g.font = 'italic 14px serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('To be shipped with webos 2', r.width / 2, 25 + (r.height - 25) / 2)
  }

  if (n == 4) {
    g.fillStyle = '#ebdcc7'
    g.fillRect(0, 25, 120, r.height - 25)
    g.strokeStyle = '#8b5a2b'
    g.lineWidth = 1
    g.beginPath(); g.moveTo(120, 25); g.lineTo(120, r.height); g.stroke()
    g.fillStyle = '#ebdcc7'
    g.fillRect(120, 25, r.width - 120, 28)
    g.strokeStyle = '#dfd0bb'
    for (ly = 75; ly < r.height; ly += 28) {
      g.beginPath(); g.moveTo(122, ly); g.lineTo(r.width - 2, ly); g.stroke()
    }
  }

  if (n == 5) {
    g.fillStyle = '#fdfaf2'
    g.fillRect(0, 25, r.width, r.height - 25)
    g.strokeStyle = '#d8c8af'
    for (ly = 80; ly < r.height; ly += 28) {
      g.beginPath(); g.moveTo(10, ly); g.lineTo(r.width - 10, ly); g.stroke()
    }
  }

  return c
}

function rungenie(n, shrink, cb) {
  if (busy[n]) return
  busy[n] = 1

  el = wins[n]
  wr = el.getBoundingClientRect()
  thetile = items[n-1].querySelector('.tile')
  ir = thetile.getBoundingClientRect()

  pic = grabwin(el, n)
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
    cg.globalAlpha = shrink ? (raw < 0.65 ? 1 : 1 - (raw-0.65)/0.35 * 0.6) : (raw > 0.35 ? 1 : 0.4 + raw/0.35 * 0.6)

    for (j = 0; j < slices; j++) {
      v = j / slices
      vn = (j+1) / slices

      p = easecurve(Math.min(Math.max(t*(1+lag) - (1-v)*lag, 0), 1))
      pn = easecurve(Math.min(Math.max(t*(1+lag) - (1-vn)*lag, 0), 1))

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
      topz = topz + 1
      wins[n].style.zIndex = topz
      wins[n].style.visibility = 'visible'
      delete minned[n]
    })
    return
  }

  if (wins[n]) {
    topz = topz + 1
    wins[n].style.zIndex = topz
    return
  }

  ww = document.createElement('div')
  wins[n] = ww
  ww.className = 'box'
  topz = topz + 1
  ww.style.zIndex = topz
  ww.onmousedown = function() {
    topz = topz + 1
    this.style.zIndex = topz
  }
  ww.style.left = (60*n) + 'px'
  ww.style.top = (60*n) + 'px'
  if (n == 4) { ww.style.width = '480px'; ww.style.height = '330px' }
  if (n == 5) { ww.style.width = '290px'; ww.style.height = '360px' }

  hd = document.createElement('div')
  hd.className = 'head'
  hd.innerHTML = '<div class=btn>_</div><div class=btn>□</div><div class=btn>×</div>'
  hd.onmousedown = function(e) {
    if (e.target != this) return
    topz = topz + 1
    drag = this.parentNode
    drag.style.zIndex = topz
    ox = e.clientX - drag.offsetLeft
    oy = e.clientY - drag.offsetTop
  }

  hd.children[0].onclick = function() {
    if (busy[n] || minned[n]) return
    minned[n] = 1
    rungenie(n, true, function() {})
  }

  hd.children[1].onclick = function() {
    winel = wins[n]
    if (winel.style.width == '100%') {
      winel.style.width = n == 4 ? '480px' : n == 5 ? '290px' : '250px'
      winel.style.height = n == 4 ? '330px' : n == 5 ? '360px' : '180px'
      winel.style.left = (60*n) + 'px'
      winel.style.top = (60*n) + 'px'
    } else {
      winel.style.width = '100%'
      winel.style.height = '100%'
      winel.style.left = '0px'
      winel.style.top = '0px'
    }
  }

  hd.children[2].onclick = function() {
    if (n == 1 && clktimer) clearInterval(clktimer)
    wins[n].remove()
    delete wins[n]
    delete minned[n]
  }

//still looking into my code?
  ww.appendChild(hd)

  if (n == 1) {
    bdy = document.createElement('div')
    bdy.className = 'clockbody'
    bdy.innerHTML = '<div class=clockdigi></div><div class=clockdate></div>'
    ww.appendChild(bdy)

// this is the (100*pi)th line of the code
    function updateclockapp() {
      now = new Date()
      bdy.children[0].innerText = now.toLocaleTimeString()
      bdy.children[1].innerText = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
    }
    updateclockapp()
    clktimer = setInterval(updateclockapp, 1000)
  }

  if (n == 2 || n == 3) {
    msg = document.createElement('div')
    msg.className = 'soon'
    msg.innerText = 'To be shipped with webos 2'
    ww.appendChild(msg)
  }

  if (n == 4) {
    nwin = document.createElement('div')
    nwin.className = 'notewin'
    nwin.innerHTML = '<div class=noteside><div class=notenew>+ New Note</div><ul class=notelist></ul></div><div class=notemain><div class=notetool><div class=toolbtn style="font-weight:bold" onclick="document.execCommand(\'bold\')">B</div><div class=toolbtn style="font-style:italic" onclick="document.execCommand(\'italic\')">I</div><div class=toolbtn style="text-decoration:underline" onclick="document.execCommand(\'underline\')">U</div><div class=toolbtn style="text-decoration:line-through" onclick="document.execCommand(\'strikeThrough\')">S</div></div><div class=notepaper contenteditable=true></div></div>'
    ww.appendChild(nwin)

    nlist = nwin.querySelector('.notelist')
    npaper = nwin.querySelector('.notepaper')
    ntool = nwin.querySelector('.notetool')
    for (tbi = 0; tbi < ntool.children.length; tbi++) ntool.children[tbi].onmousedown = function(e) { e.preventDefault() }

    function rendernotes() {
      nlist.innerHTML = ''
      for (k = 0; k < notes.length; k++) {
        (function(idx) {
          li = document.createElement('li')
          li.className = 'noteitem' + (idx == notecur ? ' noteactive' : '')
          li.innerHTML = '<span style="overflow:hidden;text-overflow:ellipsis">' + (notes[idx].title || 'Untitled') + '</span><span class=notedel>×</span>'
          li.onclick = function() { notecur = idx; rendernotes() }
          li.children[1].onclick = function(e) {
            e.stopPropagation()
            if (notes.length <= 1) notes[0] = { title: 'New note', body: '' }
            else {
              notes.splice(idx, 1)
              if (notecur >= notes.length) notecur = notes.length - 1
            }
            rendernotes()
          }
          nlist.appendChild(li)
        })(k)
      }
      npaper.innerHTML = notes[notecur] ? notes[notecur].body : ''
    }

    nwin.querySelector('.notenew').onclick = function() {
      notes.push({ title: 'Note ' + (notes.length + 1), body: '' })
      notecur = notes.length - 1
      rendernotes()
      npaper.focus()
    }

    npaper.oninput = function() {
      if (!notes[notecur]) return
      notes[notecur].body = npaper.innerHTML
      txt = npaper.innerText.trim().split('\n')[0]
      notes[notecur].title = txt ? txt.slice(0, 15) : 'Note ' + (notecur + 1)
      if (nlist.children[notecur] && nlist.children[notecur].firstChild) {
        nlist.children[notecur].firstChild.innerText = notes[notecur].title
      }
    }

    rendernotes()
  }

  if (n == 5) {
    twin = document.createElement('div')
    twin.className = 'todowin'
    twin.innerHTML = '<div class=todobar><input class=todoin placeholder="Add new task..."><button class=todobtn>+</button></div><ul class=todolist></ul>'
    ww.appendChild(twin)

    tin = twin.querySelector('.todoin')
    tlist = twin.querySelector('.todolist')

    function rendertodo() {
      tlist.innerHTML = ''
      for (k = 0; k < todos.length; k++) {
        (function(idx) {
          titem = document.createElement('li')
          titem.className = 'todoitem'
          titem.innerHTML = '<div class=todocheck>' + (todos[idx].done ? '✓' : '') + '</div><span class="todotext' + (todos[idx].done ? ' tododone' : '') + '">' + todos[idx].txt + '</span><span class=tododel>×</span>'
          titem.children[0].onclick = function() { todos[idx].done = !todos[idx].done; rendertodo() }
          titem.children[2].onclick = function() { todos.splice(idx, 1); rendertodo() }
          tlist.appendChild(titem)
        })(k)
      }
    }

    function addtodo() {
      val = tin.value.trim()
      if (!val) return
      todos.push({ txt: val, done: false })
      tin.value = ''
      rendertodo()
      tin.focus()
    }

    twin.querySelector('.todobtn').onclick = addtodo
    tin.onkeydown = function(e) {
      if (e.key == 'Enter') addtodo()
    }

    rendertodo()
  }

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

hrhand = document.getElementById('hrhand')
minhand = document.getElementById('minhand')
sechand = document.getElementById('sechand')

function tickclock() {
  d = new Date()
  s = d.getSeconds()
  m = d.getMinutes() + s / 60
  h = (d.getHours() % 12) + m / 60

  if (sechand) sechand.style.transform = 'rotate(' + (s * 6) + 'deg)'
  if (minhand) minhand.style.transform = 'rotate(' + (m * 6) + 'deg)'
  if (hrhand) hrhand.style.transform = 'rotate(' + (h * 30) + 'deg)'
}

tickclock()
setInterval(tickclock, 1000)
