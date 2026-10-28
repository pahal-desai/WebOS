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
