// shared.js — injects navbar, music player, toast into every page

function injectShared(activePage) {

  // ── Music bar ──
  var musicBar = document.createElement('div');
  musicBar.className = 'music-bar';
  musicBar.innerHTML =
    '<span class="music-title">🎵 PawketPetsVT OST</span>' +
    '<button class="music-btn" id="music-play-btn" onclick="toggleMusic()" title="Play/Pause">▶</button>' +
    '<button class="music-btn" onclick="stopMusic()" title="Stop">⏹</button>' +
    '<input type="range" class="music-volume" id="music-volume" min="0" max="1" step="0.05" value="0.5" oninput="setVolume(this.value)" title="Volume">' +
    '<span class="music-bar-label">Vol</span>';

  // ── Audio element ──
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
  var pages = [
    {href:'index.html', label:'🏠 Home', id:'home'},
    {href:'adopt.html', label:'🐣 Adopt', id:'adopt'},
    {href:'mypets.html', label:'💖 My Pets', id:'mypets'},
    {href:'shop.html', label:'🛍️ Shop', id:'shop'},
    {href:'minigames.html', label:'🎮 Minigames', id:'minigames'},
    {href:'news.html', label:'📰 News', id:'news'}
    {href:'twitch.html', label:'🟣 Twitch', id:'twitch'}
  ];
  var linksHtml = pages.map(function(p){
    return '<a href="' + p.href + '"' + (p.id === activePage ? ' class="active"' : '') + '>' + p.label + '</a>';
  }).join('');

  var nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.innerHTML =
    '<div class="navbar-inner">' +
    '<a href="index.html" class="navbar-logo"><img src="images/logo.png" alt="PawketPetsVT"><span>Pawket</span>PetsVT</a>' +
    '<div class="navbar-links" id="nav-links-loggedin" style="display:none">' + linksHtml + '</div>' +
    '<div class="navbar-user">' +
    '<span id="nav-user"></span>' +
    '<span id="nav-points" style="display:none"></span>' +
    '<a href="login.html" id="nav-login" class="btn-nav-login">Login</a>' +
    '<button onclick="logoutUser()" id="nav-logout" class="btn-nav-logout" style="display:none">Logout</button>' +
    '</div></div>';

  // Insert in order: musicBar, ticker, nav
  document.body.insertBefore(nav, document.body.firstChild);
  document.body.insertBefore(ticker, document.body.firstChild);
  document.body.insertBefore(musicBar, document.body.firstChild);

  // ── Toast ──
  if (!document.getElementById('toast')) {
    var toast = document.createElement('div');
    toast.className = 'toast'; toast.id = 'toast';
    document.body.appendChild(toast);
  }

  // ── Persistent music logic ──
  // Save position every second so we can resume on next page
  var bgMusic = document.getElementById('bg-music');
  var musicPlaying = sessionStorage.getItem('musicPlaying') === 'true';
  var savedPos = parseFloat(sessionStorage.getItem('musicPos') || '0');
  var savedVol = parseFloat(sessionStorage.getItem('musicVol') || '0.5');

  // Restore volume
  bgMusic.volume = savedVol;
  var volSlider = document.getElementById('music-volume');
  if (volSlider) volSlider.value = savedVol;

  bgMusic.addEventListener('loadedmetadata', function() {
    if (savedPos > 0) bgMusic.currentTime = savedPos;
    if (musicPlaying) {
      bgMusic.play().then(function() {
        document.getElementById('music-play-btn').textContent = '⏸';
      }).catch(function() {
        // Autoplay blocked — wait for first click
        setupAutoplayOnClick();
      });
    } else {
      setupAutoplayOnClick();
    }
  });

  // Save state before leaving page
  window.addEventListener('beforeunload', function() {
    sessionStorage.setItem('musicPos', bgMusic.currentTime);
    sessionStorage.setItem('musicPlaying', (!bgMusic.paused).toString());
    sessionStorage.setItem('musicVol', bgMusic.volume);
  });

  // Save position every second for resilience
  setInterval(function() {
    if (!bgMusic.paused) {
      sessionStorage.setItem('musicPos', bgMusic.currentTime);
    }
  }, 1000);
}

function setupAutoplayOnClick() {
  document.addEventListener('click', function startMusic() {
    var bgMusic = document.getElementById('bg-music');
    var wasPlaying = sessionStorage.getItem('musicPlaying');
    // Only auto-start on first ever visit (no saved state)
    if (wasPlaying === null) {
      bgMusic.play().catch(function(){});
      document.getElementById('music-play-btn').textContent = '⏸';
      sessionStorage.setItem('musicPlaying', 'true');
    }
    document.removeEventListener('click', startMusic);
  }, { once: true });
}

function toggleMusic() {
  var audio = document.getElementById('bg-music');
  var btn = document.getElementById('music-play-btn');
  if (!audio) return;
  if (audio.paused) {
    audio.play().catch(function(){});
    btn.textContent = '⏸';
    sessionStorage.setItem('musicPlaying', 'true');
  } else {
    audio.pause();
    btn.textContent = '▶';
    sessionStorage.setItem('musicPlaying', 'false');
  }
}

function stopMusic() {
  var audio = document.getElementById('bg-music');
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  document.getElementById('music-play-btn').textContent = '▶';
  sessionStorage.setItem('musicPlaying', 'false');
  sessionStorage.setItem('musicPos', '0');
}

function setVolume(val) {
  var audio = document.getElementById('bg-music');
  if (audio) { audio.volume = parseFloat(val); sessionStorage.setItem('musicVol', val); }
}

function showToast(message) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
}
