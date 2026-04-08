// shared.js — injects the navbar and music player into every page
// Call injectShared() at the top of each page's script

function injectShared(activePage) {
  // ── Music player bar ──
  var musicBar = document.createElement('div');
  musicBar.className = 'music-bar';
  musicBar.innerHTML =
    '<span class="music-title">🎵 PawketPetsVT OST</span>' +
    '<button class="music-btn" id="music-play-btn" onclick="toggleMusic()" title="Play/Pause">▶</button>' +
    '<button class="music-btn" onclick="stopMusic()" title="Stop">⏹</button>' +
    '<input type="range" class="music-volume" id="music-volume" min="0" max="1" step="0.05" value="0.5" oninput="setVolume(this.value)" title="Volume">' +
    '<span class="music-bar-label">Vol</span>';

  // ── Hidden audio element ──
  var audio = document.createElement('audio');
  audio.id = 'bg-music';
  audio.loop = true;
  audio.volume = 0.5;
  var source = document.createElement('source');
  source.src = 'music.mp3';
  source.type = 'audio/mpeg';
  audio.appendChild(source);
  document.body.insertBefore(audio, document.body.firstChild);

  // ── News ticker ──
  var ticker = document.createElement('div');
  ticker.className = 'news-ticker';
  ticker.innerHTML = '<div class="news-ticker-inner">✦ Welcome to PawketPetsVT! ✦ &nbsp;&nbsp; Adopt your first pet today! ✧ &nbsp;&nbsp; Watch Embertail &amp; Pyxshuul live on Twitch! ✦ &nbsp;&nbsp; New members coming soon... ✧ &nbsp;&nbsp; Earn PawketPoints by playing minigames! ✦ &nbsp;&nbsp; Stay tuned for updates! ✧ &nbsp;&nbsp;</div>';

  // ── Navbar ──
  var navLinks = [
    { href: 'index.html', label: '🏠 Home', id: 'home' },
    { href: 'adopt.html', label: '🐣 Adopt', id: 'adopt' },
    { href: 'mypets.html', label: '💖 My Pets', id: 'mypets' },
    { href: 'shop.html', label: '🛍️ Shop', id: 'shop' },
    { href: 'minigames.html', label: '🎮 Minigames', id: 'minigames' },
    { href: 'news.html', label: '📰 News', id: 'news' }
  ];

  var linksHtml = navLinks.map(function(l) {
    return '<a href="' + l.href + '"' + (l.id === activePage ? ' class="active"' : '') + '>' + l.label + '</a>';
  }).join('');

  var nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.innerHTML =
    '<div class="navbar-inner">' +
    '<a href="index.html" class="navbar-logo"><img src="images/logo.png" alt="PawketPetsVT Logo"><span>Pawket</span>PetsVT</a>' +
    '<div class="navbar-links" id="nav-links-loggedin" style="display:none">' + linksHtml + '</div>' +
    '<div class="navbar-user">' +
    '<span id="nav-user"></span>' +
    '<span id="nav-points" style="display:none"></span>' +
    '<a href="login.html" id="nav-login" class="btn-nav-login">Login</a>' +
    '<button onclick="logoutUser()" id="nav-logout" class="btn-nav-logout" style="display:none">Logout</button>' +
    '</div></div>';

  // Insert everything at the top of body
  document.body.insertBefore(nav, document.body.firstChild);
  document.body.insertBefore(ticker, document.body.firstChild);
  document.body.insertBefore(musicBar, document.body.firstChild);

  // ── Toast ──
  if (!document.getElementById('toast')) {
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'toast';
    document.body.appendChild(toast);
  }

  // Auto-play music after first user interaction
  document.addEventListener('click', function startMusic() {
    var bgMusic = document.getElementById('bg-music');
    if (bgMusic && bgMusic.paused) {
      bgMusic.play().catch(function() {});
      document.getElementById('music-play-btn').textContent = '⏸';
    }
    document.removeEventListener('click', startMusic);
  }, { once: true });
}

function toggleMusic() {
  var audio = document.getElementById('bg-music');
  var btn = document.getElementById('music-play-btn');
  if (!audio) return;
  if (audio.paused) {
    audio.play().catch(function() {});
    btn.textContent = '⏸';
  } else {
    audio.pause();
    btn.textContent = '▶';
  }
}

function stopMusic() {
  var audio = document.getElementById('bg-music');
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  document.getElementById('music-play-btn').textContent = '▶';
}

function setVolume(val) {
  var audio = document.getElementById('bg-music');
  if (audio) audio.volume = parseFloat(val);
}

function showToast(message) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
}
