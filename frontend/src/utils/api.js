const BASE = '/api';

function getToken() {
  return localStorage.getItem('mario_token');
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

export const api = {
  register: (d) => req('POST', '/register', d),
  login: (d) => req('POST', '/login', d),
  logout: () => req('POST', '/logout'),
  me: () => req('GET', '/me'),
  postScore: (d) => req('POST', '/scores', d),
  leaderboard: () => req('GET', '/leaderboard'),
  myScores: () => req('GET', '/scores/me'),
};
