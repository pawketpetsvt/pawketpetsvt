// auth.js - handles login, registration, session, daily bonus, stat calculations

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
    email: email, password: password,
    options: { data: { username: username } }
  });
  if (result.error) throw new Error(result.error.message);
  if (result.data.user) {
    var pr = await supabaseClient.from('players').insert([{
      id: result.data.user.id, username: username, pawketpoints: 0
    }]);
    if (pr.error) console.warn('Player row error:', pr.error.message);
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
  var key = 'daily_bonus_' + userId;
  if (localStorage.getItem(key) === today) return { awarded: false };
  var BONUS = 50;
  var pr = await supabaseClient.from('players').select('pawketpoints').eq('id', userId).single();
  if (!pr.data) return { awarded: false };
  var newPoints = pr.data.pawketpoints + BONUS;
  var res = await supabaseClient.from('players').update({ pawketpoints: newPoints }).eq('id', userId);
  if (!res.error) { localStorage.setItem(key, today); return { awarded: true, amount: BONUS, newTotal: newPoints }; }
  return { awarded: false };
}

// Energy regens 5 per hour, capped at max
function calculateEnergyRegen(currentEnergy, maxEnergy, lastPlayedTimestamp) {
  if (!lastPlayedTimestamp) return currentEnergy;
  var hours = (new Date() - new Date(lastPlayedTimestamp)) / (1000 * 60 * 60);
  return Math.min(currentEnergy + Math.floor(hours * 5), maxEnergy);
}

// Hunger decays 15 per day = 0.625 per hour, min 0
function calculateHungerDecay(currentHunger, lastFedTimestamp) {
  if (!lastFedTimestamp) return currentHunger;
  var hours = (new Date() - new Date(lastFedTimestamp)) / (1000 * 60 * 60);
  return Math.max(currentHunger - Math.floor(hours * 0.625), 0);
}

// Happiness decays 15 per day = 0.625 per hour
// Uses most recent of last_fed or last_played as the reference point
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
  var hours = (new Date() - lastInteraction) / (1000 * 60 * 60);
  return Math.max(currentHappiness - Math.floor(hours * 0.625), 0);
}

// Level up — returns updated stats with max stats increased by 5 each level
function calculateLevelUp(currentXp, currentLevel, currentMaxHunger, currentMaxEnergy, currentMaxHappiness) {
  var xpForNext = currentLevel * 100;
  if (currentXp < xpForNext) {
    return { leveled: false, level: currentLevel, xp: currentXp, maxHunger: currentMaxHunger, maxEnergy: currentMaxEnergy, maxHappiness: currentMaxHappiness };
  }
  var newLevel = currentLevel + 1;
  var leftoverXp = currentXp - xpForNext;
  var newMaxHunger = currentMaxHunger + 5;
  var newMaxEnergy = currentMaxEnergy + 5;
  var newMaxHappiness = currentMaxHappiness + 5;
  return {
    leveled: true,
    level: newLevel,
    xp: leftoverXp,
    maxHunger: newMaxHunger,
    maxEnergy: newMaxEnergy,
    maxHappiness: newMaxHappiness
  };
}

// Updates navbar — reads username from players table, never shows email
async function updateNav() {
  var user = await getCurrentUser();
  var navUser = document.getElementById('nav-user');
  var navPoints = document.getElementById('nav-points');
  var navLogout = document.getElementById('nav-logout');
  var navLogin = document.getElementById('nav-login');
  var navLinks = document.getElementById('nav-links-loggedin');

  if (user) {
    var pr = await supabaseClient.from('players').select('username, pawketpoints').eq('id', user.id).single();
    if (pr.data) {
      if (navUser) navUser.textContent = '⭐ ' + pr.data.username;
      if (navPoints) { navPoints.textContent = '🪙 ' + pr.data.pawketpoints + ' PP'; navPoints.style.display = 'inline-block'; }
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
