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

function pop(n) {
  win = document.createElement('div')
  win.className = 'box'
  win.style.left = (60 * n) + 'px'
  win.style.top = (60 * n) + 'px'
  
  bar = document.createElement('div')
  bar.className = 'head'
  bar.onmousedown = function(e) {
    if (e.target != bar) return
    drag = win
    ox = e.clientX - win.offsetLeft
    oy = e.clientY - win.offsetTop
  }
  
  minbtn = document.createElement('div')
  minbtn.className = 'btn'
  minbtn.innerText = '_'
  minbtn.onclick = function() {
    win.style.display = 'none'
  }

  maxbtn = document.createElement('div')
  maxbtn.className = 'btn'
  maxbtn.innerText = '□'
  maxbtn.onclick = function() {
    if (win.style.width == '100%') {
      win.style.width = '250px'
      win.style.height = '180px'
      win.style.left = (60 * n) + 'px'
      win.style.top = (60 * n) + 'px'
    } else {
      win.style.width = '100%'
      win.style.height = '100%'
      win.style.left = '0px'
      win.style.top = '0px'
    }
  }

  clsbtn = document.createElement('div')
  clsbtn.className = 'btn'
  clsbtn.innerText = '×'
  clsbtn.onclick = function() {
    win.remove()
  }
//still looking into my code?
  bar.appendChild(minbtn)
  bar.appendChild(maxbtn)
  bar.appendChild(clsbtn)

  win.appendChild(bar)
  document.body.appendChild(win)
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
