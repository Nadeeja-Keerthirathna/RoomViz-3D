import { create } from 'zustand'
import { authAPI } from '../services/api'

export const useStore = create((set) => ({
    // ─── Auth ──────────────────────────────────────────────
    user: authAPI.getUser(),
    isLoggedIn: authAPI.isLoggedIn(),
    setAuth: (user) => set({ user, isLoggedIn: true }),
    clearAuth: () => {
        authAPI.logout()
        set({ user: null, isLoggedIn: false })
    },

    // ─── Room configuration ────────────────────────────────
    roomConfig: {
        width: 20,
        length: 15,
        shape: 'rectangular',
        material: 'wood',
    },
    setRoomConfig: (config) => set({ roomConfig: config }),

    // Current room ID (from backend)
    currentRoomId: null,
    setCurrentRoomId: (id) => set({ currentRoomId: id }),

    // Current design ID (from backend)
    currentDesignId: null,
    setCurrentDesignId: (id) => set({ currentDesignId: id }),

    // ─── Furniture objects placed in 2D layout ─────────────
    // Each: { id, type, label, x, y, width, depth, rotation, color }
    furnitureItems: [],
    setFurnitureItems: (items) => set({ furnitureItems: items }),
    addFurniture: (item) =>
        set((s) => ({ furnitureItems: [...s.furnitureItems, item] })),
    updateFurniture: (id, updates) =>
        set((s) => ({
            furnitureItems: s.furnitureItems.map((f) =>
                f.id === id ? { ...f, ...updates } : f
            ),
        })),
    removeFurniture: (id) =>
        set((s) => ({
            furnitureItems: s.furnitureItems.filter((f) => f.id !== id),
        })),
    clearFurniture: () => set({ furnitureItems: [] }),

    selectedItemId: null,
    setSelectedItemId: (id) => set({ selectedItemId: id }),
}))
