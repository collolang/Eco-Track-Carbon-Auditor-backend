// // src/services/api.js  (UPDATED — replace your existing api.js with this)
// // Handles all API calls with JWT authentication + auto token refresh

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// // ─── Token helpers ─────────────────────────────────────────────────────────

// export const tokenStorage = {
//   getAccess:      ()      => localStorage.getItem('accessToken'),
//   getRefresh:     ()      => localStorage.getItem('refreshToken'),
//   setTokens:      (a, r)  => { localStorage.setItem('accessToken', a); localStorage.setItem('refreshToken', r); },
//   clearTokens:    ()      => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); },
// };

// // ─── Core fetch with auto-refresh ─────────────────────────────────────────

// let isRefreshing = false;

// const apiRequest = async (endpoint, options = {}, retry = true) => {
//   const url = `${API_BASE_URL}${endpoint}`;

//   const headers = { 'Content-Type': 'application/json', ...options.headers };
//   const token = tokenStorage.getAccess();
//   if (token) headers['Authorization'] = `Bearer ${token}`;

//   const config = {
//     ...options,
//     headers,
//     body: options.body && typeof options.body === 'object'
//       ? JSON.stringify(options.body)
//       : options.body,
//   };

//   const response = await fetch(url, config);

//   // Auto-refresh on 401 TOKEN_EXPIRED
//   if (response.status === 401 && retry && !isRefreshing) {
//     const body = await response.json().catch(() => ({}));
//     if (body.code === 'TOKEN_EXPIRED') {
//       isRefreshing = true;
//       try {
//         const refreshed = await authApi.refresh();
//         tokenStorage.setTokens(refreshed.accessToken, refreshed.refreshToken);
//         isRefreshing = false;
//         return apiRequest(endpoint, options, false); // retry once
//       } catch {
//         isRefreshing = false;
//         tokenStorage.clearTokens();
//         window.dispatchEvent(new Event('auth:logout'));
//         throw new Error('Session expired. Please log in again.');
//       }
//     }
//   }

//   if (!response.ok) {
//     const error = await response.json().catch(() => ({ message: 'Request failed' }));
//     throw new Error(error.message || `HTTP error ${response.status}`);
//   }

//   const data = await response.json();
//   return data.data ?? data; // unwrap { success, data } envelope
// };

// // ─── Auth API ──────────────────────────────────────────────────────────────

// export const authApi = {
//   // async register(userData) {
//     const data = await apiRequest('/auth/register', { method: 'POST', body: userData });
//     tokenStorage.setTokens(data.accessToken, data.refreshToken);
//     return data;
//   },

//   async login(email, password) {
//     const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
//     tokenStorage.setTokens(data.accessToken, data.refreshToken);
//     return data;
//   },

//   async refresh() {
//     const refreshToken = tokenStorage.getRefresh();
//     if (!refreshToken) throw new Error('No refresh token');
//     return apiRequest('/auth/refresh', { method: 'POST', body: { refreshToken } }, false);
//   },

//   async logout() {
//     const refreshToken = tokenStorage.getRefresh();
//     try {
//       await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken } }, false);
//     } finally {
//       tokenStorage.clearTokens();
//     }
//   },

//   async getMe() {
//     return apiRequest('/auth/me');
//   },
// };

// // ─── Company API ───────────────────────────────────────────────────────────

// export const companyApi = {
//   async getProfile() {
//     return apiRequest('/company/profile');
//   },

//   async updateProfile(profileData) {
//     return apiRequest('/company/profile', { method: 'PUT', body: profileData });
//   },
// };

// // ─── Emissions API ─────────────────────────────────────────────────────────

// export const emissionsApi = {
//   async getAllEntries(params = {}) {
//     const query = new URLSearchParams(params).toString();
//     return apiRequest(`/emissions${query ? `?${query}` : ''}`);
//   },

//   async getEntryById(id) {
//     return apiRequest(`/emissions/${id}`);
//   },

//   async createEntry(entryData) {
//     return apiRequest('/emissions', { method: 'POST', body: entryData });
//   },

//   async updateEntry(id, entryData) {
//     return apiRequest(`/emissions/${id}`, { method: 'PUT', body: entryData });
//   },

//   async deleteEntry(id) {
//     return apiRequest(`/emissions/${id}`, { method: 'DELETE' });
//   },

//   async getMonthlyData(year) {
//     const query = year ? `?year=${year}` : '';
//     return apiRequest(`/emissions/monthly${query}`);
//   },

//   async getBreakdownData(month, year) {
//     const params = new URLSearchParams();
//     if (month) params.append('month', month);
//     if (year)  params.append('year', year);
//     const query = params.toString();
//     return apiRequest(`/emissions/breakdown${query ? `?${query}` : ''}`);
//   },

//   async getTotalEmissions() {
//     return apiRequest('/emissions/total');
//   },

//   async getYearlyComparison() {
//     return apiRequest('/emissions/yearly');
//   },
// };

// // ─── Reports API ───────────────────────────────────────────────────────────

// export const reportsApi = {
//   async generateReport(month, year) {
//     return apiRequest(`/reports?month=${month}&year=${year}`);
//   },

//   async getHistory() {
//     return apiRequest('/reports/history');
//   },
// };

// export default { authApi, companyApi, emissionsApi, reportsApi };
