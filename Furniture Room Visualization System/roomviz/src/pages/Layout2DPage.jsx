import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { RotateCcw, RotateCw, Save, Box, Trash2, Plus } from 'lucide-react'
import { designsAPI, authAPI } from '../services/api'
import styles from './Layout2DPage.module.css'

const SCALE = 42
const FT_TO_M = 0.3048
const PADDING = 60

const CATALOG = [
    { type: 'sofa', label: '3-Seater Sofa', w: 2.1, d: 0.9, color: '#2a4030', icon: '🛋' },
    { type: 'armchair', label: 'Nordic Armchair', w: 0.85, d: 0.8, color: '#2a4030', icon: '💺' },
    { type: 'dining-chair', label: 'Dining Chair', w: 0.45, d: 0.45, color: '#3a2a15', icon: '🪑' },
    { type: 'coffee-table', label: 'Coffee Table', w: 1.2, d: 0.6, color: '#3a2a10', icon: '🪵' },
    { type: 'dining-table', label: 'Dining Table', w: 1.8, d: 0.9, color: '#3a2a10', icon: '🍽' },
    { type: 'bed', label: 'Queen Bed', w: 1.6, d: 2.0, color: '#1a2540', icon: '🛏' },
    { type: 'wardrobe', label: 'Wardrobe', w: 1.8, d: 0.6, color: '#1a200a', icon: '🪞' },
    { type: 'desk', label: 'Work Desk', w: 1.4, d: 0.7, color: '#3a2a10', icon: '🖥' },
    { type: 'plant', label: 'Indoor Plant', w: 0.5, d: 0.5, color: '#183a18', icon: '🌿' },
    { type: 'lamp', label: 'Floor Lamp', w: 0.4, d: 0.4, color: '#2a2000', icon: '💡' },
    { type: 'bookshelf', label: 'Bookshelf', w: 1.0, d: 0.35, color: '#1a1410', icon: '📚' },
    { type: 'tv-unit', label: 'TV Unit', w: 1.8, d: 0.5, color: '#111111', icon: '📺' },
]

const COLORS = [
    { hex: '#2a4030', label: 'Forest' },
    { hex: '#3a2a10', label: 'Oak' },
    { hex: '#0a1a2a', label: 'Navy' },
    { hex: '#3a1010', label: 'Ruby' },
    { hex: '#2a2a2a', label: 'Slate' },
    { hex: '#e8e0cc', label: 'Cream' },
    { hex: '#4a2060', label: 'Plum' },
    { hex: '#204050', label: 'Teal' },
]

const FLOOR_FILL = {
    wood: { fill: 'rgba(160,102,42,0.3)', stroke: '#c8882a' },
    concrete: { fill: 'rgba(100,100,100,0.25)', stroke: '#888' },
    carpet: { fill: 'rgba(58,107,58,0.3)', stroke: '#4a7a4a' },
    marble: { fill: 'rgba(200,200,200,0.2)', stroke: '#ccc' },
    tiles: { fill: 'rgba(180,180,180,0.2)', stroke: '#aaa' },
    parquet: { fill: 'rgba(176,120,48,0.3)', stroke: '#b07830' },
}

// ─── Draw a shaped room on canvas ──────────────────────────────────────────
function getRoomPath(ctx, shape, ox, oy, rw, rl) {
    const W = rw * SCALE
    const H = rl * SCALE
    ctx.beginPath()
    if (shape === 'l-shaped') {
        const hw = W / 2, hh = H / 2
        ctx.moveTo(ox, oy)
        ctx.lineTo(ox + W, oy)
        ctx.lineTo(ox + W, oy + hh)
        ctx.lineTo(ox + hw, oy + hh)
        ctx.lineTo(ox + hw, oy + H)
        ctx.lineTo(ox, oy + H)
        ctx.closePath()
    } else if (shape === 't-shaped') {
        const tw = W / 3, th = H / 2
        ctx.moveTo(ox, oy)
        ctx.lineTo(ox + W, oy)
        ctx.lineTo(ox + W, oy + th)
        ctx.lineTo(ox + W - tw, oy + th)
        ctx.lineTo(ox + W - tw, oy + H)
        ctx.lineTo(ox + tw, oy + H)
        ctx.lineTo(ox + tw, oy + th)
        ctx.lineTo(ox, oy + th)
        ctx.closePath()
    } else {
        ctx.rect(ox, oy, W, H)
    }
}

// ─── Draw furniture icon on canvas ─────────────────────────────────────────
function drawFurnitureDetail(ctx, type, pw, ph, color) {
    ctx.fillStyle = lighten(color, 40)
    switch (type) {
        case 'sofa': {
            // cushions
            const cw = pw * 0.3, ch = ph * 0.6
            for (let i = 0; i < 3; i++) {
                const cx = -pw / 2 + pw * 0.05 + i * (cw + pw * 0.025)
                roundRect(ctx, cx, -ph * 0.15, cw, ch, 4); ctx.fill()
            }
            // backrest
            ctx.fillStyle = lighten(color, 20)
            roundRect(ctx, -pw / 2, -ph / 2, pw, ph * 0.25, 4); ctx.fill()
            break
        }
        case 'armchair': {
            roundRect(ctx, -pw * 0.35, -ph * 0.1, pw * 0.7, ph * 0.55, 4); ctx.fill()
            ctx.fillStyle = lighten(color, 20)
            roundRect(ctx, -pw / 2, -ph / 2, pw, ph * 0.3, 4); ctx.fill()
            break
        }
        case 'dining-chair': {
            roundRect(ctx, -pw * 0.35, -ph * 0.05, pw * 0.7, ph * 0.5, 3); ctx.fill()
            ctx.fillStyle = lighten(color, 20)
            roundRect(ctx, -pw * 0.35, -ph / 2, pw * 0.7, ph * 0.35, 3); ctx.fill()
            break
        }
        case 'bed': {
            // pillow
            ctx.fillStyle = lighten(color, 60)
            roundRect(ctx, -pw * 0.35, -ph / 2 + ph * 0.05, pw * 0.3, ph * 0.2, 4); ctx.fill()
            roundRect(ctx, pw * 0.05, -ph / 2 + ph * 0.05, pw * 0.3, ph * 0.2, 4); ctx.fill()
            // blanket
            ctx.fillStyle = lighten(color, 25)
            roundRect(ctx, -pw * 0.4, -ph / 2 + ph * 0.28, pw * 0.8, ph * 0.65, 4); ctx.fill()
            // headboard
            ctx.fillStyle = lighten(color, 15)
            roundRect(ctx, -pw / 2, -ph / 2, pw, ph * 0.15, 3); ctx.fill()
            break
        }
        case 'dining-table':
        case 'coffee-table': {
            // Table top
            roundRect(ctx, -pw * 0.4, -ph * 0.4, pw * 0.8, ph * 0.8, 3); ctx.fill()
            break
        }
        case 'desk': {
            ctx.fillStyle = lighten(color, 30)
            roundRect(ctx, -pw * 0.4, -ph * 0.35, pw * 0.8, ph * 0.7, 3); ctx.fill()
            // monitor hint
            ctx.fillStyle = '#111'
            roundRect(ctx, -pw * 0.15, -ph * 0.3, pw * 0.3, ph * 0.4, 2); ctx.fill()
            break
        }
        case 'wardrobe': {
            const dw = pw / 2 - 4
            roundRect(ctx, -pw / 2 + 2, -ph / 2 + 2, dw, ph - 4, 2); ctx.fill()
            roundRect(ctx, 2, -ph / 2 + 2, dw, ph - 4, 2); ctx.fill()
            // handles
            ctx.fillStyle = '#c0a060'
            ctx.beginPath(); ctx.arc(-4, 0, 3, 0, Math.PI * 2); ctx.fill()
            ctx.beginPath(); ctx.arc(4, 0, 3, 0, Math.PI * 2); ctx.fill()
            break
        }
        case 'bookshelf': {
            const sh = ph / 3
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = i % 2 === 0 ? lighten(color, 25) : lighten(color, 10)
                roundRect(ctx, -pw * 0.45, -ph / 2 + i * sh + 2, pw * 0.9, sh - 4, 1); ctx.fill()
            }
            break
        }
        case 'tv-unit': {
            // TV screen
            ctx.fillStyle = '#0a0a14'
            roundRect(ctx, -pw * 0.35, -ph * 0.4, pw * 0.7, ph * 0.6, 3); ctx.fill()
            ctx.fillStyle = '#1a2a3a'
            roundRect(ctx, -pw * 0.3, -ph * 0.35, pw * 0.6, ph * 0.5, 2); ctx.fill()
            break
        }
        case 'plant': {
            ctx.fillStyle = '#1a5a1a'
            ctx.beginPath(); ctx.ellipse(0, 0, pw * 0.35, ph * 0.4, 0, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = '#2a7a2a'
            ctx.beginPath(); ctx.ellipse(-pw * 0.15, -ph * 0.1, pw * 0.22, ph * 0.28, -0.5, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = '#2a7a2a'
            ctx.beginPath(); ctx.ellipse(pw * 0.15, -ph * 0.1, pw * 0.22, ph * 0.28, 0.5, 0, Math.PI * 2); ctx.fill()
            ctx.fillStyle = '#8b5e3c'
            roundRect(ctx, -pw * 0.2, ph * 0.25, pw * 0.4, ph * 0.2, 2); ctx.fill()
            break
        }
        case 'lamp': {
            ctx.fillStyle = lighten(color, 30)
            ctx.beginPath(); ctx.moveTo(0, -ph * 0.45); ctx.lineTo(-pw * 0.3, -ph * 0.05); ctx.lineTo(pw * 0.3, -ph * 0.05); ctx.closePath(); ctx.fill()
            ctx.fillStyle = '#aaa'
            ctx.fillRect(-pw * 0.05, -ph * 0.05, pw * 0.1, ph * 0.5)
            ctx.fillStyle = '#666'
            roundRect(ctx, -pw * 0.3, ph * 0.4, pw * 0.6, ph * 0.1, 2); ctx.fill()
            break
        }
        default:
            break
    }
}

function lighten(hex, amt) {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, (num >> 16) + amt)
    const g = Math.min(255, ((num >> 8) & 0xff) + amt)
    const b = Math.min(255, (num & 0xff) + amt)
    return `rgb(${r},${g},${b})`
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function Layout2DPage() {
    const navigate = useNavigate()
    const { roomConfig, furnitureItems, addFurniture, updateFurniture, removeFurniture,
        selectedItemId, setSelectedItemId, currentRoomId, currentDesignId, setCurrentDesignId } = useStore()

    const canvasRef = useRef(null)
    const wrapperRef = useRef(null)
    const dragInfoRef = useRef(null)
    const isDraggingCanvas = useRef(false)
    const [saved, setSaved] = useState(false)
    const [search, setSearch] = useState('')

    const roomW = parseFloat(roomConfig.width || 20) * FT_TO_M
    const roomL = parseFloat(roomConfig.length || 15) * FT_TO_M
    const shape = roomConfig.shape || 'rectangular'

    const canvasW = roomW * SCALE + PADDING * 2
    const canvasH = roomL * SCALE + PADDING * 2

    const selectedItem = furnitureItems.find(f => f.id === selectedItemId)

    const floorStyle = FLOOR_FILL[roomConfig.material] || FLOOR_FILL.wood

    // ─── Render ──────────────────────────────────────────────────────
    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'
        ctx.lineWidth = 1
        for (let x = 0; x <= canvas.width; x += SCALE) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
        }
        for (let y = 0; y <= canvas.height; y += SCALE) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
        }

        // Floor fill
        getRoomPath(ctx, shape, PADDING, PADDING, roomW, roomL)
        ctx.fillStyle = floorStyle.fill
        ctx.fill()

        // Draw tile pattern if tiles
        if (roomConfig.material === 'tiles') {
            const tileSize = SCALE * 0.5
            ctx.save()
            ctx.clip()
            ctx.strokeStyle = 'rgba(200,200,200,0.15)'
            ctx.lineWidth = 0.5
            for (let x = PADDING; x < PADDING + roomW * SCALE; x += tileSize) {
                ctx.beginPath(); ctx.moveTo(x, PADDING); ctx.lineTo(x, PADDING + roomL * SCALE); ctx.stroke()
            }
            for (let y = PADDING; y < PADDING + roomL * SCALE; y += tileSize) {
                ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(PADDING + roomW * SCALE, y); ctx.stroke()
            }
            ctx.restore()
        }

        // Wood grain
        if (roomConfig.material === 'wood' || roomConfig.material === 'parquet') {
            ctx.save()
            getRoomPath(ctx, shape, PADDING, PADDING, roomW, roomL)
            ctx.clip()
            ctx.strokeStyle = 'rgba(100,60,20,0.08)'
            ctx.lineWidth = 1.5
            for (let y = PADDING; y < PADDING + roomL * SCALE; y += 8) {
                ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(PADDING + roomW * SCALE, y); ctx.stroke()
            }
            ctx.restore()
        }

        // Wall
        ctx.shadowBlur = 16
        ctx.shadowColor = 'rgba(0,229,87,0.5)'
        ctx.strokeStyle = '#00e557'
        ctx.lineWidth = 3.5
        getRoomPath(ctx, shape, PADDING, PADDING, roomW, roomL)
        ctx.stroke()
        ctx.shadowBlur = 0

        // Dimension labels
        ctx.fillStyle = '#7d9484'
        ctx.font = '12px Inter,sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${roomConfig.width} ft`, PADDING + (roomW * SCALE) / 2, PADDING - 12)
        ctx.save()
        ctx.translate(PADDING - 14, PADDING + (roomL * SCALE) / 2)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(`${roomConfig.length} ft`, 0, 0)
        ctx.restore()

        // Furniture
        furnitureItems.forEach(item => drawItem(ctx, item))
    }, [furnitureItems, roomW, roomL, shape, roomConfig, selectedItemId, floorStyle])

    function drawItem(ctx, item) {
        const pw = item.w * SCALE
        const ph = item.d * SCALE
        const cx = PADDING + (item.x + item.w / 2) * SCALE
        const cy = PADDING + (item.y + item.d / 2) * SCALE

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate((item.rotation * Math.PI) / 180)

        // Drop shadow
        ctx.shadowBlur = 8
        ctx.shadowColor = 'rgba(0,0,0,0.4)'
        ctx.fillStyle = item.color || '#2a4030'
        ctx.beginPath()
        ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 5)
        ctx.fill()
        ctx.shadowBlur = 0

        // Border
        ctx.strokeStyle = item.id === selectedItemId ? '#00e557' : 'rgba(255,255,255,0.15)'
        ctx.lineWidth = item.id === selectedItemId ? 2.5 : 1
        ctx.beginPath()
        ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 5)
        ctx.stroke()

        // Furniture detail drawing
        if (pw > 20 && ph > 20) {
            drawFurnitureDetail(ctx, item.type, pw, ph, item.color || '#2a4030')
        }

        // Emoji icon
        const fontSize = Math.min(pw, ph) * 0.35
        if (fontSize >= 8) {
            ctx.font = `${fontSize}px serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(item.icon || '□', 0, 0)
        }

        // Selection dashes
        if (item.id === selectedItemId) {
            ctx.strokeStyle = '#00e557'
            ctx.lineWidth = 1
            ctx.setLineDash([5, 4])
            ctx.strokeRect(-pw / 2 - 6, -ph / 2 - 6, pw + 12, ph + 12)
            ctx.setLineDash([])
        }

        ctx.restore()
    }

    useEffect(() => { render() }, [render])

    // ─── Drop from sidebar ────────────────────────────────────────────
    const handleCanvasDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const raw = e.dataTransfer.getData('catalog-item')
        if (!raw) return
        const cat = JSON.parse(raw)
        const rect = canvasRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left - PADDING) / SCALE - cat.w / 2
        const y = (e.clientY - rect.top - PADDING) / SCALE - cat.d / 2
        const newItem = {
            id: Date.now(),
            type: cat.type, label: cat.label,
            icon: cat.icon, color: cat.color,
            x: Math.max(0, Math.min(x, roomW - cat.w)),
            y: Math.max(0, Math.min(y, roomL - cat.d)),
            w: cat.w, d: cat.d, rotation: 0
        }
        addFurniture(newItem)
        setSelectedItemId(newItem.id)
    }

    const handleWrapperDrop = (e) => {
        // Also handle drop on the wrapper (when dropped slightly outside canvas)
        handleCanvasDrop(e)
    }

    // ─── Click to add furniture directly ─────────────────────────────
    const addItemToCenter = (cat) => {
        const newItem = {
            id: Date.now(),
            type: cat.type, label: cat.label,
            icon: cat.icon, color: cat.color,
            x: Math.max(0, (roomW - cat.w) / 2),
            y: Math.max(0, (roomL - cat.d) / 2),
            w: cat.w, d: cat.d, rotation: 0
        }
        addFurniture(newItem)
        setSelectedItemId(newItem.id)
    }

    // ─── Canvas mouse events ──────────────────────────────────────────
    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        const mx = (e.clientX - rect.left - PADDING) / SCALE
        const my = (e.clientY - rect.top - PADDING) / SCALE

        for (let i = furnitureItems.length - 1; i >= 0; i--) {
            const item = furnitureItems[i]
            if (mx >= item.x && mx <= item.x + item.w &&
                my >= item.y && my <= item.y + item.d) {
                setSelectedItemId(item.id)
                isDraggingCanvas.current = true
                dragInfoRef.current = { id: item.id, offX: mx - item.x, offY: my - item.y }
                return
            }
        }
        setSelectedItemId(null)
    }

    const handleMouseMove = (e) => {
        if (!isDraggingCanvas.current || !dragInfoRef.current) return
        const rect = canvasRef.current.getBoundingClientRect()
        const mx = (e.clientX - rect.left - PADDING) / SCALE
        const my = (e.clientY - rect.top - PADDING) / SCALE
        const { id, offX, offY } = dragInfoRef.current
        const item = furnitureItems.find(f => f.id === id)
        if (!item) return
        updateFurniture(id, {
            x: Math.max(0, Math.min(mx - offX, roomW - item.w)),
            y: Math.max(0, Math.min(my - offY, roomL - item.d)),
        })
    }

    const handleMouseUp = () => {
        isDraggingCanvas.current = false
        dragInfoRef.current = null
    }

    // ─── Actions ─────────────────────────────────────────────────────
    const rotateSelected = (deg) => {
        if (!selectedItem) return
        updateFurniture(selectedItemId, { rotation: ((selectedItem.rotation || 0) + deg + 360) % 360 })
    }

    const deleteSelected = () => {
        if (!selectedItem) return
        removeFurniture(selectedItemId)
        setSelectedItemId(null)
    }

    const handleSave = async () => {
        setSaved(false)

        // Save to backend if logged in and room exists
        if (authAPI.isLoggedIn() && currentRoomId) {
            try {
                if (currentDesignId) {
                    // Update existing design
                    await designsAPI.update(currentDesignId, {
                        title: `Design for ${roomConfig.shape} room`,
                        layout_json: furnitureItems,
                    })
                } else {
                    // Create new design
                    const result = await designsAPI.save({
                        room_id: currentRoomId,
                        title: `Design for ${roomConfig.shape} room`,
                        layout_json: furnitureItems,
                    })
                    setCurrentDesignId(result.id)
                }
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
                return
            } catch (err) {
                console.error('Backend save failed, falling back to file download:', err)
            }
        }

        // Fallback: file download
        const data = { roomConfig, furnitureItems };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'room-plan.json'; a.click();
        URL.revokeObjectURL(url);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    const filteredCatalog = CATALOG.filter(c =>
        c.label.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className={styles.page}>
            {/* ── Left Sidebar ── */}
            <aside className={styles.catalog}>
                <div className={styles.catalogHeader}>
                    <span className={styles.logoIcon}>◈</span>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Furniture Catalog</span>
                </div>

                <div className={styles.searchWrap}>
                    <input
                        placeholder="Search furniture..."
                        className={styles.search}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className={styles.catalogHint}>
                    Drag onto canvas or click <Plus size={11} /> to add
                </div>

                <div className={styles.items}>
                    {filteredCatalog.map(item => (
                        <div
                            key={item.type}
                            className={styles.catalogItem}
                            draggable
                            onDragStart={e => {
                                e.dataTransfer.setData('catalog-item', JSON.stringify(item))
                                e.dataTransfer.effectAllowed = 'copy'
                            }}
                        >
                            <div className={styles.catIcon}>{item.icon}</div>
                            <div className={styles.catInfo}>
                                <div className={styles.catLabel}>{item.label}</div>
                                <div className={styles.catSize}>{item.w * 100}×{item.d * 100} cm</div>
                            </div>
                            <button
                                className={styles.addBtn}
                                onClick={() => addItemToCenter(item)}
                                title="Add to center of room"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* ── Canvas Area ── */}
            <main className={styles.canvasArea}>
                <div className={styles.toolbar}>
                    <div className={styles.toolGroup}>
                        <button className={styles.toolBtn} title="Rotate -15°" onClick={() => rotateSelected(-15)}><RotateCcw size={16} /></button>
                        <button className={styles.toolBtn} title="Rotate +15°" onClick={() => rotateSelected(15)}><RotateCw size={16} /></button>
                        <button className={styles.toolBtn} title="Delete selected" onClick={deleteSelected}><Trash2 size={16} /></button>
                    </div>
                    <div className={styles.toolGroupRight}>
                        <span className={styles.roomInfo}>
                            {roomConfig.width}ft × {roomConfig.length}ft · {roomConfig.shape} · {roomConfig.material}
                        </span>
                        <button className={`${styles.saveBtn} ${saved ? styles.savedBtn : ''}`} onClick={handleSave}>
                            <Save size={14} /> {saved ? 'Saved!' : 'Save'}
                        </button>
                        <button className={styles.viewBtn} onClick={() => navigate('/3d-view')}>
                            <Box size={14} /> View in 3D
                        </button>
                    </div>
                </div>

                <div
                    ref={wrapperRef}
                    className={styles.canvasWrap}
                    onDrop={handleWrapperDrop}
                    onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
                >
                    <canvas
                        ref={canvasRef}
                        width={Math.max(canvasW, 400)}
                        height={Math.max(canvasH, 300)}
                        className={styles.canvas}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onDrop={handleCanvasDrop}
                        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
                    />
                </div>
            </main>

            {/* ── Right Properties ── */}
            <aside className={styles.props}>
                <div className={styles.propsHeader}>
                    Selected Object
                    <button className={styles.delBtn} onClick={deleteSelected}><Trash2 size={16} /></button>
                </div>

                {!selectedItem ? (
                    <div className={styles.noSel}>
                        <div style={{ fontSize: 36, opacity: 0.2 }}>👆</div>
                        <p>Click an object on the canvas or use <strong>+ buttons</strong> in the catalog sidebar to add furniture</p>
                    </div>
                ) : (
                    <div className={styles.propsBody}>
                        <div className={styles.selLabel}>
                            <span style={{ fontSize: 28 }}>{selectedItem.icon}</span>
                            <div>
                                <div style={{ fontWeight: 600 }}>{selectedItem.label}</div>
                                <div className={styles.selSub}>{selectedItem.w.toFixed(2)}m × {selectedItem.d.toFixed(2)}m</div>
                            </div>
                        </div>

                        <div className={styles.propSection}>
                            <div className={styles.propLabel}>ROTATION</div>
                            <div className={styles.sliderRow}>
                                <input type="range" min="0" max="360" value={selectedItem.rotation || 0}
                                    className={styles.slider}
                                    onChange={e => updateFurniture(selectedItemId, { rotation: +e.target.value })} />
                                <span className={styles.badge}>{selectedItem.rotation || 0}°</span>
                            </div>
                            <div className={styles.rotBtns}>
                                {[-90, -45, 45, 90].map(d => (
                                    <button key={d} className={styles.rotBtn} onClick={() => rotateSelected(d)}>
                                        {d > 0 ? '+' : ''}{d}°
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.propSection}>
                            <div className={styles.propLabel}>DIMENSIONS (M)</div>
                            <div className={styles.dimRow}>
                                <div className={styles.floatField}>
                                    <span>Width</span>
                                    <input type="number" step="0.1" min="0.3" value={selectedItem.w}
                                        onChange={e => updateFurniture(selectedItemId, { w: parseFloat(e.target.value) || 0.3 })} />
                                </div>
                                <div className={styles.floatField}>
                                    <span>Depth</span>
                                    <input type="number" step="0.1" min="0.3" value={selectedItem.d}
                                        onChange={e => updateFurniture(selectedItemId, { d: parseFloat(e.target.value) || 0.3 })} />
                                </div>
                            </div>
                        </div>

                        <div className={styles.propSection}>
                            <div className={styles.propLabel}>COLOR</div>
                            <div className={styles.colorGrid}>
                                {COLORS.map(c => (
                                    <div key={c.hex}
                                        className={`${styles.swatch} ${selectedItem.color === c.hex ? styles.swatchActive : ''}`}
                                        style={{ background: c.hex }}
                                        title={c.label}
                                        onClick={() => updateFurniture(selectedItemId, { color: c.hex })} />
                                ))}
                            </div>
                        </div>

                        <button className={styles.resetBtn} onClick={() => setSelectedItemId(null)}>Deselect</button>
                    </div>
                )}
            </aside>
        </div>
    )
}
