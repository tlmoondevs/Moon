// app.js – Moon Executor (working version)
(function(){
  const API_BASE = 'https://moon-api.reallyfrostpvp-b61.workers.dev';

  // token helpers
  function getToken() { return localStorage.getItem('token'); }
  function setToken(t) { localStorage.setItem('token', t); }
  function removeToken() { localStorage.removeItem('token'); }

  // page navigation
  document.querySelectorAll('nav a[data-page], .btn[data-page]').forEach(function(link){
    link.addEventListener('click', function(e){
      e.preventDefault();
      var page = this.dataset.page;
      if (!page) return;
      document.querySelectorAll('.section').forEach(function(s){ s.classList.remove('active'); });
      document.getElementById(page).classList.add('active');
    });
  });

  // auth UI
  function updateAuthUI(){
    var token = getToken();
    var nav = document.getElementById('navAuth');
    if (token) {
      nav.innerHTML = '<a href="#" data-page="profile">Profile</a> <a href="#" id="logoutLink">Logout</a>';
      document.getElementById('logoutLink').addEventListener('click', function(){
        removeToken();
        location.reload();
      });
      if (document.getElementById('profile').classList.contains('active')) loadProfile();
    } else {
      nav.innerHTML = '<a href="#" data-page="login">Login</a> <a href="#" data-page="register">Register</a>';
    }
  }

  // register
  document.getElementById('registerBtn').addEventListener('click', async function(){
    var u = document.getElementById('regUsername').value.trim();
    var e = document.getElementById('regEmail').value.trim();
    var p = document.getElementById('regPassword').value;
    var err = document.getElementById('regError');
    if (!u || !e || !p) { err.textContent = 'All fields required'; return; }
    err.textContent = 'Registering...';
    try {
      var res = await fetch(API_BASE + '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, email: e, password: p })
      });
      var text = await res.text();
      if (!res.ok) { err.textContent = text || 'Registration failed'; return; }
      alert('Registered! Please login.');
      document.querySelectorAll('.section').forEach(function(s){ s.classList.remove('active'); });
      document.getElementById('login').classList.add('active');
      err.textContent = '';
    } catch (ex) {
      err.textContent = 'Network error – check console (F12)';
      console.error(ex);
    }
  });

  // login
  document.getElementById('loginBtn').addEventListener('click', async function(){
    var e = document.getElementById('loginEmail').value.trim();
    var p = document.getElementById('loginPassword').value;
    var err = document.getElementById('loginError');
    if (!e || !p) { err.textContent = 'All fields required'; return; }
    err.textContent = 'Logging in...';
    try {
      var res = await fetch(API_BASE + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, password: p })
      });
      var text = await res.text();
      if (!res.ok) { err.textContent = text || 'Invalid credentials'; return; }
      var data = JSON.parse(text);
      setToken(data.token);
      location.reload();
    } catch (ex) {
      err.textContent = 'Network error – check console';
      console.error(ex);
    }
  });

  // load profile
  async function loadProfile(){
    var t = getToken();
    if (!t) return;
    try {
      var res = await fetch(API_BASE + '/api/me', {
        headers: { 'Authorization': 'Bearer ' + t }
      });
      if (!res.ok) throw new Error('Unauthorized');
      var u = await res.json();
      document.getElementById('profileUsername').textContent = u.username;
      document.getElementById('profileKey').textContent = 'Key: ' + u.key;
      document.getElementById('nicknameInput').value = u.nickname || '';
      document.getElementById('avatarUrlInput').value = u.avatar_url || '';
      var status = document.getElementById('profileStatus');
      if (status) {
        status.textContent = u.active ? 'Active' : 'Banned';
        status.style.color = u.active ? '#4ade80' : '#f87171';
      }
    } catch (ex) {
      removeToken();
      location.reload();
    }
  }

  // save profile
  document.getElementById('saveProfileBtn').addEventListener('click', async function(){
    var t = getToken();
    if (!t) return;
    var nick = document.getElementById('nicknameInput').value.trim();
    var ava = document.getElementById('avatarUrlInput').value.trim();
    await fetch(API_BASE + '/api/me', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nick, avatar_url: ava })
    });
    alert('Profile updated!');
    loadProfile();
  });

  // change email
  document.getElementById('changeEmailBtn').addEventListener('click', async function(){
    var t = getToken();
    var ne = document.getElementById('newEmail').value.trim();
    if (!ne) return;
    var res = await fetch(API_BASE + '/api/me/email', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ne })
    });
    if (res.ok) alert('Email updated!');
    else alert('Error: ' + (await res.text()));
  });

  // change password
  document.getElementById('changePasswordBtn').addEventListener('click', async function(){
    var t = getToken();
    var cp = document.getElementById('currentPassword').value;
    var np = document.getElementById('newPassword').value;
    if (!cp || !np) return;
    var res = await fetch(API_BASE + '/api/me/password', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: cp, newPassword: np })
    });
    if (res.ok) alert('Password changed!');
    else alert('Error: ' + (await res.text()));
  });

  // status
  fetch('status.json')
    .then(function(r){ return r.json(); })
    .then(function(d){
      var dot = document.getElementById('statusDot');
      var txt = document.getElementById('statusText');
      dot.style.background = d.color;
      dot.style.boxShadow = '0 0 20px ' + d.color;
      txt.textContent = d.text;
      document.getElementById('statusDetails').textContent = 'Last updated: ' + new Date().toLocaleString();
    })
    .catch(function(){
      document.getElementById('statusDot').style.background = 'gray';
      document.getElementById('statusText').textContent = 'Status unavailable';
    });

  // init
  updateAuthUI();
})();
