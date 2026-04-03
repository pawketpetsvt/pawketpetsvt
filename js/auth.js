// auth.js - handles login, registration, session checking, and daily bonus

// Redirect to home if already logged in
async function redirectIfLoggedIn() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    window.location.href = 'index.html';
  }
}

// Redirect to login if NOT logged in
async function requireLogin() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = 'login.html';
  }
  return data.session;
}

// Get current user
async function getCurrentUser() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    return data.session.user;
  }
  return null;
}

// Register a new user
async function registerUser(email, password, username) {
  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { username: username }
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.user) {
    const { error: playerError } = await supabaseClient
      .from('players')
      .insert([{
        id: data.user.id,
        username: username,
        pawketpoints: 0
      }]);

    if (playerError) {
      console.warn('Player row error:', playerError.message);
    }
  }

  return data;
}

// Login existing user
async function loginUser(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Logout
async function logoutUser() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

// Daily login bonus — awards 50 PP once per calendar day
async function checkDailyBonus(userId) {
  const today = new Date().toISOString().split('T')[0];
  const bonusKey = 'daily_bonus_' + userId;
  const lastClaimed = localStorage.getItem(bonusKey);

  if (lastClaimed === today) {
    return { awarded: false };
  }

  const DAILY_BONUS = 50;

  const { data: playerData } = await supabaseClient
    .from('players')
    .select('pawketpoints')
    .eq('id', userId)
    .single();

  if (!playerData) return { awarded: false };

  const newPoints = playerData.pawketpoints + DAILY_BONUS;

  const { error } = await supabaseClient
    .from('players')
    .update({ pawketpoints: newPoints })
    .eq('id', userId);

  if (!error) {
    localStorage.setItem(bonusKey, today);
    return { awarded: true, amount: DAILY_BONUS, newTotal: newPoints };
  }

  return { awarded: false };
}

// Calculate energy regen since last played
// Pets regen 5 energy per hour, capped at max_energy
function calculateEnergyRegen(currentEnergy, maxEnergy, lastPlayedTimestamp) {
  if (!lastPlayedTimestamp) return currentEnergy;
  const now = new Date();
  const lastPlayed = new Date(lastPlayedTimestamp);
  const hoursElapsed = (now - lastPlayed) / (1000 * 60 * 60);
  const regenAmount = Math.floor(hoursElapsed * 5);
  return Math.min(currentEnergy + regenAmount, maxEnergy);
}

// Calculate happiness decay since last interaction
// Happiness decays 1 point per hour (20 per day), minimum 0
function calculateHappinessDecay(currentHappiness, lastFedTimestamp, lastPlayedTimestamp) {
  // Use whichever interaction was most recent
  let lastInteraction = null;
  if (lastFedTimestamp && lastPlayedTimestamp) {
    lastInteraction = new Date(lastFedTimestamp) > new Date(lastPlayedTimestamp)
      ? new Date(lastFedTimestamp)
      : new Date(lastPlayedTimestamp);
  } else if (lastFedTimestamp) {
    lastInteraction = new Date(lastFedTimestamp);
  } else if (lastPlayedTimestamp) {
    lastInteraction = new Date(lastPlayedTimestamp);
  } else {
    return currentHappiness;
  }

  const now = new Date();
  const hoursElapsed = (now - lastInteraction) / (1000 * 60 * 60);
  const decayAmount = Math.floor(hoursElapsed * 1);
  return Math.max(currentHappiness - decayAmount, 0);
}

// Update nav to show username and pawketpoints if logged in
async function updateNav() {
  const user = await getCurrentUser();
  const navUser = document.getElementById('nav-user');
  const navPoints = document.getElementById('nav-points');
  const navLogout = document.getElementById('nav-logout');
  const navLogin = document.getElementById('nav-login');

  if (user) {
    const { data: playerData } = await supabaseClient
      .from('players')
      .select('username, pawketpoints')
      .eq('id', user.id)
      .single();

    if (playerData) {
      if (navUser) navUser.textContent = '⭐ ' + playerData.username;
      if (navPoints) navPoints.textContent = '🪙 ' + playerData.pawketpoints + ' PP';
    }

    if (navLogout) navLogout.style.display = 'inline-block';
    if (navLogin) navLogin.style.display = 'none';
  } else {
    if (navLogout) navLogout.style.display = 'none';
    if (navLogin) navLogin.style.display = 'inline-block';
  }
}
