import styles from './DashboardPage.module.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Plus, LayoutDashboard, Compass, Sofa, Settings, MoreHorizontal, Edit3, Trash2, Copy, LogOut } from 'lucide-react'
import { useStore } from '../store/useStore'
import { roomsAPI, designsAPI, furnitureAPI, authAPI } from '../services/api'

const FURNITURE_LIB = [
    { icon: '🛋', name: '3-Seater Sofa', cat: 'Seating', dim: '210×90cm' },
    { icon: '💺', name: 'Nordic Armchair', cat: 'Seating', dim: '85×80cm' },
    { icon: '🪑', name: 'Dining Chair', cat: 'Seating', dim: '45×45cm' },
    { icon: '🪵', name: 'Coffee Table', cat: 'Tables', dim: '120×60cm' },
    { icon: '🍽', name: 'Dining Table', cat: 'Tables', dim: '180×90cm' },
    { icon: '🛏', name: 'Queen Bed', cat: 'Bedroom', dim: '160×200cm' },
    { icon: '🪞', name: 'Wardrobe', cat: 'Storage', dim: '180×60cm' },
    { icon: '🖥', name: 'Work Desk', cat: 'Office', dim: '140×70cm' },
    { icon: '🌿', name: 'Indoor Plant', cat: 'Decor', dim: '50×50cm' },
    { icon: '💡', name: 'Floor Lamp', cat: 'Lighting', dim: '40×40cm' },
    { icon: '📚', name: 'Bookshelf', cat: 'Storage', dim: '100×35cm' },
    { icon: '📺', name: 'TV Unit', cat: 'Living', dim: '180×50cm' },
    { icon: '🖼', name: 'Wall Art', cat: 'Decor', dim: '80×120cm' },
]

const NAV_ITEMS = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { id: 'designs', icon: <Compass size={18} />, label: 'My Designs' },
    { id: 'library', icon: <Sofa size={18} />, label: 'Furniture Library' },
]

const CATS = ['All', 'Seating', 'Tables', 'Bedroom', 'Storage', 'Office', 'Lighting', 'Decor', 'Living']

// Map material/shape to specific reliable images
const MATERIAL_IMAGES = {
    wood: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=400',
    concrete: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=400',
    carpet: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400',
    marble: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=400',
    tiles: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400',
    parquet: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=400',
}

const FALLBACK_COLORS = ['#1a3a2a', '#2a1a3a', '#3a2a1a', '#1a2a3a', '#2a3a1a', '#3a1a2a']

function getRoomImage(room) {
    return MATERIAL_IMAGES[room.material] || MATERIAL_IMAGES.wood
}

function handleImgError(e, room) {
    // Replace broken image with a styled gradient placeholder
    const color = FALLBACK_COLORS[(room?.id || 0) % FALLBACK_COLORS.length]
    e.target.style.display = 'none'
    const parent = e.target.parentElement
    if (parent && !parent.querySelector('.placeholder-bg')) {
        const div = document.createElement('div')
        div.className = 'placeholder-bg'
        div.style.cssText = `width:100%;height:100%;background:linear-gradient(135deg,${color},#0a0f0c);display:flex;align-items:center;justify-content:center;font-size:42px;`
        div.textContent = room?.shape === 'l-shaped' ? '⌐' : room?.shape === 't-shaped' ? '⊤' : '▬'
        parent.insertBefore(div, e.target)
    }
}

export default function DashboardPage() {
    const navigate = useNavigate()
    const {
        clearFurniture,
        setRoomConfig,
        setFurnitureItems,
        setCurrentRoomId,
        setCurrentDesignId,
        currentRoomId,
        currentDesignId,
        user,
        clearAuth
    } = useStore()
    const [activeNav, setActiveNav] = useState('dashboard')
    const [menuOpen, setMenuOpen] = useState(null)
    const [libCat, setLibCat] = useState('All')
    const [rooms, setRooms] = useState([])
    const [designs, setDesigns] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null) // { type: 'room'|'design', id: any }

    // Redirect if not logged in
    useEffect(() => {
        if (!authAPI.isLoggedIn()) {
            navigate('/')
            return
        }
        loadData()
    }, [])

    // Auto-reset delete confirmation after 3 seconds
    useEffect(() => {
        if (confirmDelete) {
            const timer = setTimeout(() => setConfirmDelete(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [confirmDelete])

    const loadData = async () => {
        setLoading(true)
        try {
            const [roomsList, designsList] = await Promise.all([
                roomsAPI.getAll(),
                designsAPI.getAll()
            ])
            setRooms(roomsList)
            setDesigns(designsList)
        } catch (err) {
            console.error('Failed to load data:', err)
        }
        setLoading(false)
    }

    const handleCreateNew = () => {
        clearFurniture()
        setCurrentRoomId(null)
        setCurrentDesignId(null)
        navigate('/room-creation')
    }

    const handleLogout = () => {
        clearAuth()
        navigate('/')
    }

    // Open a room — load its design if one exists
    const handleOpenRoom = async (room) => {
        setRoomConfig({
            width: room.width,
            length: room.length,
            shape: room.shape,
            material: room.material,
        })
        setCurrentRoomId(room.id)

        // Check if there's a design for this room
        const design = designs.find(d => d.room_id === room.id)
        if (design) {
            setFurnitureItems(design.layout_json)
            setCurrentDesignId(design.id)
        } else {
            clearFurniture()
            setCurrentDesignId(null)
        }
        navigate('/2d-layout')
    }

    const handleOpenDesign = async (design) => {
        setRoomConfig({
            width: design.width,
            length: design.length,
            shape: design.shape,
            material: design.material,
        })
        setCurrentRoomId(design.room_id)
        setCurrentDesignId(design.id)
        setFurnitureItems(design.layout_json)
        navigate('/2d-layout')
    }

    const handleDeleteRoom = async (id, e) => {
        console.log('[DASHBOARD] handleDeleteRoom called for ID:', id)
        if (e && e.stopPropagation) {
            e.stopPropagation()
            e.preventDefault()
        }

        if (confirmDelete?.id !== id) {
            setConfirmDelete({ type: 'room', id })
            return
        }

        try {
            console.log('[DASHBOARD] Proceeding with room deletion after second click...')
            setConfirmDelete(null)

            // Optimistically update
            setRooms(prev => prev.filter(r => String(r.id) !== String(id)))
            setDesigns(prev => prev.filter(d => String(d.room_id) !== String(id)))
            setMenuOpen(null)

            // Clear store if this is the active room
            if (String(currentRoomId) === String(id)) {
                setCurrentRoomId(null)
                setCurrentDesignId(null)
                clearFurniture()
            }

            // Perform the deletion
            await roomsAPI.remove(id)

            console.log('[DASHBOARD] Successfully deleted room:', id)
            // Full sync to ensure all counts are correct
            await loadData()
        } catch (err) {
            console.error('[DASHBOARD] Delete room error:', err)
            alert('Failed to delete room: ' + err.message)
            await loadData() // Rollback/Resync
        }
    }

    const handleDeleteDesign = async (design, e) => {
        console.log('[DASHBOARD] handleDeleteDesign called for ID:', design?.id)
        if (e && e.stopPropagation) {
            e.stopPropagation()
            e.preventDefault()
        }

        if (confirmDelete?.id !== design.id) {
            setConfirmDelete({ type: 'design', id: design.id })
            return
        }

        try {
            console.log('[DASHBOARD] Proceeding with design deletion after second click...')
            setConfirmDelete(null)

            // Optimistically update
            setDesigns(prev => prev.filter(d => String(d.id) !== String(design.id)))

            // Perform backend deletion
            await designsAPI.remove(design.id)

            // Clear store if this was the active design
            if (String(currentDesignId) === String(design.id)) {
                setCurrentDesignId(null)
                clearFurniture()
            }

            console.log('[DASHBOARD] Successfully deleted design:', design.id)
            await loadData()
        } catch (err) {
            console.error('[DASHBOARD] Delete design error:', err)
            alert('Failed to delete design: ' + err.message)
            await loadData()
        }
    }

    const filteredLib = libCat === 'All' ? FURNITURE_LIB : FURNITURE_LIB.filter(f => f.cat === libCat)

    // Filtering search results for rooms and designs
    const q = searchQuery.trim().toLowerCase()
    const filteredRooms = rooms.filter(r => {
        if (!q) return true
        return r.name?.toLowerCase().includes(q) ||
            r.shape?.toLowerCase().includes(q) ||
            r.material?.toLowerCase().includes(q)
    })

    const filteredDesigns = designs.filter(d => {
        if (!q) return true
        return d.title?.toLowerCase().includes(q) ||
            d.room_name?.toLowerCase().includes(q)
    })

    const userName = user?.name || 'User'

    return (
        <div className={styles.layout}>
            {/* ── Sidebar ── */}
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>◈</span>
                    <div>
                        <div className={styles.logoTitle}>RoomViz 3D</div>
                        <div className={styles.logoSub}>FURNITURE SYSTEM</div>
                    </div>
                </div>
                <nav className={styles.nav}>
                    {NAV_ITEMS.map(n => (
                        <div key={n.id}
                            className={`${styles.navItem} ${activeNav === n.id ? styles.active : ''}`}
                            onClick={() => setActiveNav(n.id)}>
                            {n.icon} <span>{n.label}</span>
                        </div>
                    ))}
                    <div className={styles.navDivider}>Settings</div>
                    <div className={styles.navItem} onClick={() => navigate('/room-creation')}>
                        <Settings size={18} /> <span>Room Config</span>
                    </div>
                    <div className={styles.navItem} onClick={handleLogout}>
                        <LogOut size={18} /> <span>Logout</span>
                    </div>
                </nav>
                <div className={styles.userRow}>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=fcebdc&color=000&rounded=true`} alt="user" className={styles.avatar} />
                    <div>
                        <div className={styles.userName}>{userName}</div>
                        <div className={styles.userRole}>Pro Designer</div>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className={styles.main}>
                {/* Topbar */}
                <div className={styles.topbar}>
                    <div className={styles.searchBar}>
                        <span>🔍</span>
                        <input
                            placeholder="Search designs, furniture, rooms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className={styles.topbarRight}>
                        <button className={styles.iconBtn}><Bell size={18} /></button>
                        <button className={styles.createBtn} onClick={handleCreateNew}>
                            <Plus size={18} /> Create New Design
                        </button>
                    </div>
                </div>

                <div className={styles.content}>
                    <h1 className={styles.pageTitle}>
                        {activeNav === 'dashboard' ? 'My Rooms' : activeNav === 'designs' ? 'My Designs' : 'Furniture Library'}
                    </h1>
                    <p className={styles.pageSub}>
                        {activeNav === 'dashboard' ? 'Manage and edit your 3D room layouts' :
                            activeNav === 'designs' ? 'All your saved furniture layouts' :
                                'Browse all available furniture items'}
                    </p>

                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>TOTAL ROOMS</div>
                            <div className={styles.statVal}>{rooms.length}</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>SAVED DESIGNS</div>
                            <div className={styles.statVal}>{designs.length}</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statLabel}>FURNITURE ITEMS</div>
                            <div className={styles.statVal}>
                                {designs.reduce((sum, d) => sum + (d.layout_json?.length || 0), 0)}
                                <span className={styles.statMuted}>pieces placed</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Dashboard View ── */}
                    {activeNav === 'dashboard' && (
                        <>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                    Loading rooms...
                                </div>
                            ) : (
                                <div className={styles.grid}>
                                    {filteredRooms.map((room, idx) => (
                                        <div key={room.id} className={styles.card}>
                                            <div className={styles.cardThumb} onClick={() => handleOpenRoom(room)}>
                                                <img src={getRoomImage(room)} alt={room.name} onError={(e) => handleImgError(e, room)} />
                                                <div className={styles.cardTags}>
                                                    <span className={styles.tag}>{room.shape}</span>
                                                    <span className={styles.tag}>{room.material}</span>
                                                </div>
                                            </div>
                                            <div className={styles.cardInfo}>
                                                <div onClick={() => handleOpenRoom(room)} style={{ cursor: 'pointer', flex: 1 }}>
                                                    <div className={styles.cardTitle}>{room.name}</div>
                                                    <div className={styles.cardTime}>{room.width}ft × {room.length}ft · Created {new Date(room.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <div className={styles.cardMenuWrap} style={{ display: 'flex', gap: '8px' }}>
                                                    <button className={styles.moreBtn}
                                                        onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === room.id ? null : room.id) }}
                                                        title="More options">
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={styles.moreBtn}
                                                        onClick={(e) => handleDeleteRoom(room.id, e)}
                                                        title={confirmDelete?.id === room.id ? "Click again to CONFIRM DELETE" : "Delete Room"}
                                                        style={{
                                                            border: `1px solid ${confirmDelete?.id === room.id ? '#ff0000' : 'rgba(239, 68, 68, 0.4)'}`,
                                                            color: confirmDelete?.id === room.id ? '#fff' : '#ef4444',
                                                            background: confirmDelete?.id === room.id ? '#ff0000' : 'transparent',
                                                            zIndex: 100,
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        {confirmDelete?.id === room.id ? (
                                                            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>SURE?</span>
                                                        ) : (
                                                            <Trash2 size={14} style={{ pointerEvents: 'none' }} />
                                                        )}
                                                    </button>
                                                    {menuOpen === room.id && (
                                                        <div className={styles.cardMenu} onClick={e => e.stopPropagation()}>
                                                            <div className={styles.menuItem} onClick={() => handleOpenRoom(room)}>
                                                                <Edit3 size={14} /> Edit
                                                            </div>
                                                            <div className={styles.menuItem} onClick={() => { handleOpenRoom(room); setTimeout(() => navigate('/3d-view'), 100) }}>
                                                                <LayoutDashboard size={14} /> View 3D
                                                            </div>
                                                            <div
                                                                className={`${styles.menuItem} ${styles.menuDanger}`}
                                                                onClick={(e) => handleDeleteRoom(room.id, e)}
                                                                style={confirmDelete?.id === room.id ? { background: '#ff0000', color: '#fff' } : {}}
                                                            >
                                                                <Trash2 size={14} style={{ pointerEvents: 'none' }} />
                                                                {confirmDelete?.id === room.id ? 'CLICK AGAIN TO DELETE' : 'Delete Room'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {filteredRooms.length === 0 && searchQuery && (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                            No rooms matching "{searchQuery}"
                                        </div>
                                    )}

                                    <div className={styles.createCard} onClick={handleCreateNew}>
                                        <div className={styles.createCircle}><Plus size={24} /></div>
                                        <span>Create New Room</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── My Designs View ── */}
                    {activeNav === 'designs' && (
                        <div className={styles.grid}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
                            ) : filteredDesigns.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                                    <p style={{ fontSize: 18 }}>{searchQuery ? 'No designs match your search' : 'No saved designs yet'}</p>
                                    <p style={{ marginTop: 8 }}>{searchQuery ? 'Try a different keyword' : 'Create a room and arrange furniture to save your first design.'}</p>
                                </div>
                            ) : (
                                <>
                                    {filteredDesigns.map((d, idx) => (
                                        <div key={d.id} className={styles.card}>
                                            <div className={styles.cardThumb} onClick={() => handleOpenDesign(d)}>
                                                <img src={getRoomImage(d)} alt={d.title} onError={(e) => handleImgError(e, d)} />
                                                <div className={styles.cardTags}>
                                                    <span className={styles.tag}>{d.layout_json?.length || 0} items</span>
                                                </div>
                                            </div>
                                            <div className={styles.cardInfo}>
                                                <div onClick={() => handleOpenDesign(d)} style={{ cursor: 'pointer', flex: 1 }}>
                                                    <div className={styles.cardTitle}>{d.title}</div>
                                                    <div className={styles.cardTime}>{d.room_name} · {d.width}×{d.length}ft</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={styles.moreBtn}
                                                    onClick={(e) => handleDeleteDesign(d, e)}
                                                    title={confirmDelete?.id === d.id ? "Click again to CONFIRM DELETE" : "Delete Design"}
                                                    style={{
                                                        border: '1px solid #ef4444',
                                                        color: confirmDelete?.id === d.id ? '#fff' : '#ef4444',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        background: confirmDelete?.id === d.id ? '#ff0000' : 'transparent',
                                                        zIndex: 1000,
                                                        position: 'relative',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <Trash2 size={13} style={{ pointerEvents: 'none' }} />
                                                    <span style={{ fontSize: '12px', fontWeight: '700', pointerEvents: 'none' }}>
                                                        {confirmDelete?.id === d.id ? 'ARE YOU SURE?' : 'Delete'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Furniture Library View ── */}
                    {activeNav === 'library' && (
                        <>
                            <h1 className={styles.pageTitle}>Furniture Library</h1>
                            <p className={styles.pageSub}>Browse all available furniture items</p>
                            <div className={styles.catTabs}>
                                {CATS.map(c => (
                                    <button key={c}
                                        className={`${styles.catTab} ${libCat === c ? styles.catTabActive : ''}`}
                                        onClick={() => setLibCat(c)}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.libGrid}>
                                {filteredLib.map((item, i) => (
                                    <div key={i} className={styles.libCard}>
                                        <div className={styles.libIcon}>{item.icon}</div>
                                        <div className={styles.libName}>{item.name}</div>
                                        <div className={styles.libDim}>{item.dim}</div>
                                        <div className={styles.libCat}>{item.cat}</div>
                                        <button className={styles.useBtn} onClick={() => navigate('/2d-layout')}>
                                            Use in Layout
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
