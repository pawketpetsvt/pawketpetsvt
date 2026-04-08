// auth.js - handles login, registration, session checking, and daily bonus

async function redirectIfLoggedIn() {
  var data = (await supabaseClient.auth.getSession()).data;
  if (data.session) window.location.href = 'index.html';
}

async function requireLogin() {
  var data = (await supabaseClient.auth.getSession()).data;
  if (!data.session) window.location.href = 'login.html';
  return data.session;
}

async function getCurrentUser() {
  var data = (await supabaseClient.auth.getSession()).data;
  return data.session ? data.session.user : null;
}

async function registerUser(email, password, username) {
  var result = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: { data: { username: username } }
  });
  if (result.error) throw new Error(result.error.message);

  if (result.data.user) {
    var playerResult = await supabaseClient.from('players').insert([{
      id: result.data.user.id,
      username: username,
      pawketpoints: 0
    }]);
    if (playerResult.error) console.warn('Player row error:', playerResult.error.message);
  }
  return result.data;
}

async function loginUser(email, password) {
  var result = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function logoutUser() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

async function checkDailyBonus(userId) {
  var today = new Date().toISOString().split('T')[0];
  var bonusKey = 'daily_bonus_' + userId;
  if (localStorage.getItem(bonusKey) === today) return { awarded: false };

  var DAILY_BONUS = 50;
  var playerResult = await supabaseClient.from('players').select('pawketpoints').eq('id', userId).single();
  if (!playerResult.data) return { awarded: false };

  var newPoints = playerResult.data.pawketpoints + DAILY_BONUS;
  var updateResult = await supabaseClient.from('players').update({ pawketpoints: newPoints }).eq('id', userId);
  if (!updateResult.error) {
    localStorage.setItem(bonusKey, today);
    return { awarded: true, amount: DAILY_BONUS, newTotal: newPoints };
  }
  return { awarded: false };
}

function calculateEnergyRegen(currentEnergy, maxEnergy, lastPlayedTimestamp) {
  if (!lastPlayedTimestamp) return currentEnergy;
  var hoursElapsed = (new Date() - new Date(lastPlayedTimestamp)) / (1000 * 60 * 60);
  return Math.min(currentEnergy + Math.floor(hoursElapsed * 5), maxEnergy);
}

function calculateHappinessDecay(currentHappiness, lastFedTimestamp, lastPlayedTimestamp) {
  var lastInteraction = null;
  if (lastFedTimestamp && lastPlayedTimestamp) {
    lastInteraction = new Date(lastFedTimestamp) > new Date(lastPlayedTimestamp)
      ? new Date(lastFedTimestamp) : new Date(lastPlayedTimestamp);
  } else if (lastFedTimestamp) {
    lastInteraction = new Date(lastFedTimestamp);
  } else if (lastPlayedTimestamp) {
    lastInteraction = new Date(lastPlayedTimestamp);
  } else {
    return currentHappiness;
  }
  var hoursElapsed = (new Date() - lastInteraction) / (1000 * 60 * 60);
  return Math.max(currentHappiness - Math.floor(hoursElapsed), 0);
}

// Updates navbar — shows username from players table, never email
async function updateNav() {
  var user = await getCurrentUser();
  var navUser = document.getElementById('nav-user');
  var navPoints = document.getElementById('nav-points');
  var navLogout = document.getElementById('nav-logout');
  var navLogin = document.getElementById('nav-login');
  var navLinks = document.getElementById('nav-links-loggedin');

  if (user) {
    var playerResult = await supabaseClient
      .from('players')
      .select('username, pawketpoints')
      .eq('id', user.id)
      .single();

    if (playerResult.data) {
      if (navUser) navUser.textContent = '⭐ ' + playerResult.data.username;
      if (navPoints) { navPoints.textContent = '🪙 ' + playerResult.data.pawketpoints + ' PP'; navPoints.style.display = 'inline-block'; }
    }
    if (navLogout) navLogout.style.display = 'inline-block';
    if (navLogin) navLogin.style.display = 'none';
    if (navLinks) navLinks.style.display = 'flex';
  } else {
    if (navLogout) navLogout.style.display = 'none';
    if (navLogin) navLogin.style.display = 'inline-block';
    if (navLinks) navLinks.style.display = 'none';
  }
}
