// auth.js — handles login, registration, and session checking

// Redirect to home if already logged in
async function redirectIfLoggedIn() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) window.location.href = 'index.html';
}

// Redirect to login if NOT logged in
async function requireLogin() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) window.location.href = 'login.html';
  return session;
}

// Get current user
async function getCurrentUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session ? session.user : null;
}

// Register a new user
async function registerUser(email, password, username) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });
  if (error) throw error;

  // Insert into players table
  if
 (data.user) {
  
const
 { 
error
: playerError } = 
await
 supabaseClient
    .from(
'players'
)
    .insert([{ 
user_id
: data.user.id, 
pawketpoints
: 
0
 }]);

  
if
 (playerError) {
    
console
.error(
'Player row error:'
, playerError);
    
throw
 playerError;
  }
}

// Login existing user
async function loginUser(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Logout
async function logoutUser() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

// Update nav to show username + pawketpoints if logged in
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
      if (navUser) navUser.textContent = `⭐ ${playerData.username}`;
      if (navPoints) navPoints.textContent = `🪙 ${playerData.pawketpoints} PP`;
    }
    if (navLogout) navLogout.style.display = 'inline-block';
    if (navLogin) navLogin.style.display = 'none';
  } else {
    if (navLogout) navLogout.style.display = 'none';
    if (navLogin) navLogin.style.display = 'inline-block';
  }
}
