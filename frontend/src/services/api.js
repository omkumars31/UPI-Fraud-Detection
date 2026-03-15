const BASE_URL = 'http://localhost:3001/api';

export async function fetchInitialStats() {
  const res = await fetch(`${BASE_URL}/stats`);
  const data = await res.json();
  return data.data;
}

export async function fetchRecentAlerts(limit = 10) {
  const res = await fetch(`${BASE_URL}/alerts?limit=${limit}`);
  const data = await res.json();
  return data.data;
}

export async function fetchRecentTransactions(limit = 20) {
  const res = await fetch(`${BASE_URL}/transactions?limit=${limit}`);
  const data = await res.json();
  return data.data;
}