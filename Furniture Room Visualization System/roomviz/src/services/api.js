const API_BASE = 'http://localhost:5000/api';

// Helper to get stored token
function getToken() {
    return localStorage.getItem('roomviz_token');
}

function setToken(token) {
    localStorage.setItem('roomviz_token', token);
}

function setUser(user) {
    localStorage.setItem('roomviz_user', JSON.stringify(user));
}

function getUser() {
    const u = localStorage.getItem('roomviz_user');
    return u ? JSON.parse(u) : null;
}

function clearAuth() {
    localStorage.removeItem('roomviz_token');
    localStorage.removeItem('roomviz_user');
}

// Generic fetch wrapper
async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    // Handle empty responses (e.g. from DELETE)
    const text = await res.text();
    let data = {};
    if (text) {
        try { data = JSON.parse(text); } catch (e) { data = { message: text }; }
    }
    if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
}

// ─── Auth API ──────────────────────────────────────────────
export const authAPI = {
    register: (name, email, password) =>
        apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

    login: async (email, password) => {
        const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        setToken(data.token);
        setUser(data.user);
        return data;
    },

    logout: () => {
        clearAuth();
    },

    getToken,
    getUser,
    isLoggedIn: () => !!getToken(),
};

// ─── Rooms API ─────────────────────────────────────────────
export const roomsAPI = {
    create: (room) =>
        apiFetch('/rooms', { method: 'POST', body: JSON.stringify(room) }),

    getAll: () => apiFetch('/rooms'),

    getOne: (id) => apiFetch(`/rooms/${id}`),

    update: (id, room) =>
        apiFetch(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(room) }),

    remove: (id) =>
        apiFetch(`/rooms/${id}`, { method: 'DELETE' }),
};

// ─── Designs API ───────────────────────────────────────────
export const designsAPI = {
    save: (design) =>
        apiFetch('/designs', { method: 'POST', body: JSON.stringify(design) }),

    getAll: () => apiFetch('/designs'),

    getOne: (id) => apiFetch(`/designs/${id}`),

    update: (id, design) =>
        apiFetch(`/designs/${id}`, { method: 'PUT', body: JSON.stringify(design) }),

    remove: (id) =>
        apiFetch(`/designs/${id}`, { method: 'DELETE' }),
};

// ─── Furniture API ─────────────────────────────────────────
export const furnitureAPI = {
    getAll: (category) => {
        const q = category && category !== 'All' ? `?category=${category}` : '';
        return apiFetch(`/furniture${q}`);
    },

    getOne: (id) => apiFetch(`/furniture/${id}`),
};
