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

  if (n == 1) {
    digi = el.querySelector('.clockdigi')
    dstr = digi ? digi.innerText : ''
    dat = el.querySelector('.clockdate')
    datstr = dat ? dat.innerText : ''
    g.fillStyle = '#2b1810'
    g.font = 'bold 30px serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(dstr, r.width / 2, 25 + (r.height - 25) / 2 - 10)
    g.font = '14px serif'
    g.fillText(datstr, r.width / 2, 25 + (r.height - 25) / 2 + 20)
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
    g.beginPath()
    g.moveTo(120, 25)
    g.lineTo(120, r.height)
    g.stroke()
    g.fillStyle = '#ebdcc7'
    g.fillRect(120, 25, r.width - 120, 28)
    g.strokeStyle = '#dfd0bb'
    for (ly = 75; ly < r.height; ly += 28) {
      g.beginPath()
      g.moveTo(122, ly)
      g.lineTo(r.width - 2, ly)
      g.stroke()
    }
  }

  if (n == 5) {
    g.fillStyle = '#fdfaf2'
    g.fillRect(0, 25, r.width, r.height - 25)
    g.strokeStyle = '#d8c8af'
    for (ly = 80; ly < r.height; ly += 28) {
      g.beginPath()
      g.moveTo(10, ly)
      g.lineTo(r.width - 10, ly)
      g.stroke()
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
  if (n == 4) {
    ww.style.width = '480px'
    ww.style.height = '330px'
  }
  if (n == 5) {
    ww.style.width = '290px'
    ww.style.height = '360px'
  }

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

  if (n == 1) {
    bdy = document.createElement('div')
    bdy.className = 'clockbody'
    
    dig = document.createElement('div')
    dig.className = 'clockdigi'
    
    dt = document.createElement('div')
    dt.className = 'clockdate'
    
    bdy.appendChild(dig)
    bdy.appendChild(dt)
    ww.appendChild(bdy)

    function updateclockapp() {
      now = new Date()
      dig.innerText = now.toLocaleTimeString()
      dt.innerText = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
    }

    updateclockapp()
    clktimer = setInterval(updateclockapp, 1000)

    oldclose = closebtn.onclick
    closebtn.onclick = function() {
      clearInterval(clktimer)
      oldclose()
    }
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

    nside = document.createElement('div')
    nside.className = 'noteside'

    nnew = document.createElement('div')
    nnew.className = 'notenew'
    nnew.innerText = '+ New Note'

    nlist = document.createElement('ul')
    nlist.className = 'notelist'

    nside.appendChild(nnew)
    nside.appendChild(nlist)

    nmain = document.createElement('div')
    nmain.className = 'notemain'

    ntool = document.createElement('div')
    ntool.className = 'notetool'

    bbtn = document.createElement('div')
    bbtn.className = 'toolbtn'
    bbtn.innerText = 'B'
    bbtn.style.fontWeight = 'bold'
    bbtn.onmousedown = function(e) { e.preventDefault() }
    bbtn.onclick = function() { document.execCommand('bold', false, null) }

    ibtn = document.createElement('div')
    ibtn.className = 'toolbtn'
    ibtn.innerText = 'I'
    ibtn.style.fontStyle = 'italic'
    ibtn.onmousedown = function(e) { e.preventDefault() }
    ibtn.onclick = function() { document.execCommand('italic', false, null) }

    ubtn = document.createElement('div')
    ubtn.className = 'toolbtn'
    ubtn.innerText = 'U'
    ubtn.style.textDecoration = 'underline'
    ubtn.onmousedown = function(e) { e.preventDefault() }
    ubtn.onclick = function() { document.execCommand('underline', false, null) }

    sbtn = document.createElement('div')
    sbtn.className = 'toolbtn'
    sbtn.innerText = 'S'
    sbtn.style.textDecoration = 'line-through'
    sbtn.onmousedown = function(e) { e.preventDefault() }
    sbtn.onclick = function() { document.execCommand('strikeThrough', false, null) }

    ntool.appendChild(bbtn)
    ntool.appendChild(ibtn)
    ntool.appendChild(ubtn)
    ntool.appendChild(sbtn)

    npaper = document.createElement('div')
    npaper.className = 'notepaper'
    npaper.contentEditable = 'true'

    nmain.appendChild(ntool)
    nmain.appendChild(npaper)

    nwin.appendChild(nside)
    nwin.appendChild(nmain)
    ww.appendChild(nwin)

    function rendernotes() {
      nlist.innerHTML = ''
      for (k = 0; k < notes.length; k++) {
        (function(idx) {
          li = document.createElement('li')
          li.className = 'noteitem' + (idx == notecur ? ' noteactive' : '')

          sp = document.createElement('span')
          sp.innerText = notes[idx].title || 'Untitled'
          sp.style.overflow = 'hidden'
          sp.style.textOverflow = 'ellipsis'

          del = document.createElement('span')
          del.className = 'notedel'
          del.innerText = '×'
          del.onclick = function(e) {
            e.stopPropagation()
            if (notes.length <= 1) {
              notes[0] = { title: 'New note', body: '' }
              notecur = 0
            } else {
              notes.splice(idx, 1)
              if (notecur >= notes.length) notecur = notes.length - 1
            }
            rendernotes()
          }

          li.appendChild(sp)
          li.appendChild(del)
          li.onclick = function() {
            notecur = idx
            rendernotes()
          }
          nlist.appendChild(li)
        })(k)
      }

      npaper.innerHTML = notes[notecur] ? notes[notecur].body : ''
    }

    nnew.onclick = function() {
      notes.push({ title: 'Note ' + (notes.length + 1), body: '' })
      notecur = notes.length - 1
      rendernotes()
      npaper.focus()
    }

    npaper.oninput = function() {
      if (!notes[notecur]) return
      notes[notecur].body = npaper.innerHTML
      txt = npaper.innerText.trim().split('\n')[0]
      if (txt) {
        notes[notecur].title = txt.slice(0, 15)
      } else {
        notes[notecur].title = 'Note ' + (notecur + 1)
      }
      activeitem = nlist.children[notecur]
      if (activeitem && activeitem.firstChild) {
        activeitem.firstChild.innerText = notes[notecur].title
      }
    }

    rendernotes()
  }

  if (n == 5) {
    twin = document.createElement('div')
    twin.className = 'todowin'

    tbar = document.createElement('div')
    tbar.className = 'todobar'

    tin = document.createElement('input')
    tin.className = 'todoin'
    tin.placeholder = 'Add new task...'

    tadd = document.createElement('button')
    tadd.className = 'todobtn'
    tadd.innerText = '+'

    tbar.appendChild(tin)
    tbar.appendChild(tadd)

    tlist = document.createElement('ul')
    tlist.className = 'todolist'

    twin.appendChild(tbar)
    twin.appendChild(tlist)
    ww.appendChild(twin)

    function rendertodo() {
      tlist.innerHTML = ''
      for (k = 0; k < todos.length; k++) {
        (function(idx) {
          titem = document.createElement('li')
          titem.className = 'todoitem'

          tcheck = document.createElement('div')
          tcheck.className = 'todocheck'
          tcheck.innerText = todos[idx].done ? '✓' : ''
          tcheck.onclick = function() {
            todos[idx].done = !todos[idx].done
            rendertodo()
          }

          ttxt = document.createElement('span')
          ttxt.className = 'todotext' + (todos[idx].done ? ' tododone' : '')
          ttxt.innerText = todos[idx].txt

          tdel = document.createElement('span')
          tdel.className = 'tododel'
          tdel.innerText = '×'
          tdel.onclick = function() {
            todos.splice(idx, 1)
            rendertodo()
          }

          titem.appendChild(tcheck)
          titem.appendChild(ttxt)
          titem.appendChild(tdel)
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

    tadd.onclick = addtodo
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
// this marks the 100*pi lines of the code lmao