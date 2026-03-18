import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { ArrowRight, Save } from 'lucide-react'
import { roomsAPI, authAPI } from '../services/api'
import styles from './RoomCreationPage.module.css'

const SHAPES = [
    { id: 'rectangular', label: 'Rectangular', icon: '▬' },
    { id: 'l-shaped', label: 'L-Shaped', icon: '⌐' },
    { id: 't-shaped', label: 'T-Shaped', icon: '⊤' },
]

const MATERIALS = [
    { id: 'wood', label: 'Natural Wood', style: { background: 'linear-gradient(135deg,#c68642,#7b4f2e)' } },
    { id: 'concrete', label: 'Concrete', style: { background: 'linear-gradient(135deg,#888,#555)' } },
    { id: 'carpet', label: 'Plush Carpet', style: { background: 'linear-gradient(135deg,#4a6a3f,#2d4a25)' } },
    { id: 'marble', label: 'Marble', style: { background: 'linear-gradient(135deg,#d9d9d9,#a8a8a8)' } },
    { id: 'tiles', label: 'Modern Tiles', style: { background: 'linear-gradient(135deg,#e0e0e0,#b0b0b0)' } },
    { id: 'parquet', label: 'Parquet', style: { background: 'linear-gradient(135deg,#d4a462,#8a5c2e)' } },
]

export default function RoomCreationPage() {
    const navigate = useNavigate()
    const { roomConfig, setRoomConfig, setCurrentRoomId, clearFurniture } = useStore()
    const [local, setLocal] = useState({ name: '', ...roomConfig })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const set = (key, val) => setLocal(l => ({ ...l, [key]: val }))

    const handleSubmit = async (e, preventNavigate = false) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        const config = {
            width: local.width,
            length: local.length,
            shape: local.shape,
            material: local.material,
        }
        setRoomConfig(config)
        clearFurniture()

        // Save to backend if logged in
        if (authAPI.isLoggedIn()) {
            try {
                const result = await roomsAPI.create({
                    name: local.name || `Room ${Date.now()}`,
                    width: parseFloat(local.width),
                    length: parseFloat(local.length),
                    shape: local.shape,
                    material: local.material,
                })
                setCurrentRoomId(result.id)
            } catch (err) {
                setError(err.message)
                setSaving(false)
                return
            }
        }

        if (!preventNavigate) {
            navigate('/2d-layout')
        }
    }

    const handleSaveOnly = (e) => {
        handleSubmit(e, true)
    }

    const user = authAPI.getUser()

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>◈</span> RoomVision 3D
                </div>
                <nav className={styles.nav}>
                    <span onClick={() => navigate('/dashboard')}>Projects</span>
                    <span>Library</span>
                    <span>Help</span>
                    <button className={styles.saveBtn} onClick={handleSaveOnly} type="button">
                        <Save size={15} /> {saving ? 'Saving...' : 'Save Progress'}
                    </button>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=fcebdc&color=000&rounded=true`} alt="user" className={styles.avatar} />
                </nav>
            </header>

            <main className={styles.main}>
                <div className={styles.breadcrumb}>
                    <span onClick={() => navigate('/dashboard')} className={styles.link}>Projects</span>
                    <span>›</span>
                    <span>New Room Configuration</span>
                </div>

                <h1 className={styles.title}>New Room Configuration</h1>
                <p className={styles.subtitle}>Set up your 3D environment by defining the space and base materials.</p>

                {/* Progress */}
                <div className={styles.progressCard}>
                    <div className={styles.progressHeader}>
                        <span>Overall Progress</span>
                        <span className={styles.step}>Step 1 of 3</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: '33%' }} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Room Name */}
                    <div className={styles.sectionHead}>
                        <div className={styles.badge}>★</div>
                        <h2>Room Name</h2>
                    </div>
                    <div className={styles.dimGrid}>
                        <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                            <label>Give your room a name</label>
                            <input type="text" placeholder="e.g. Modern Living Room"
                                value={local.name} onChange={e => set('name', e.target.value)} required />
                        </div>
                    </div>

                    {/* Section 1: Dimensions */}
                    <div className={styles.sectionHead}>
                        <div className={styles.badge}>1</div>
                        <h2>Room Dimensions</h2>
                    </div>
                    <div className={styles.dimGrid}>
                        <div className={styles.field}>
                            <label>Length (ft)</label>
                            <input type="number" min="5" max="200" placeholder="e.g. 15"
                                value={local.length} onChange={e => set('length', e.target.value)} required />
                        </div>
                        <div className={styles.field}>
                            <label>Width (ft)</label>
                            <input type="number" min="5" max="200" placeholder="e.g. 20"
                                value={local.width} onChange={e => set('width', e.target.value)} required />
                        </div>
                    </div>

                    {/* Section 2: Shape */}
                    <div className={`${styles.sectionHead} ${styles.mt}`}>
                        <div className={styles.badge}>2</div>
                        <h2>Room Shape</h2>
                    </div>
                    <div className={styles.shapeGrid}>
                        {SHAPES.map(s => (
                            <div key={s.id}
                                className={`${styles.shapeCard} ${local.shape === s.id ? styles.selected : ''}`}
                                onClick={() => set('shape', s.id)}>
                                <div className={styles.shapeIcon}>{s.icon}</div>
                                <span>{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Section 3: Material */}
                    <div className={`${styles.sectionHead} ${styles.mt}`}>
                        <div className={styles.badge}>3</div>
                        <h2>Base Materials</h2>
                    </div>
                    <div className={styles.matGrid}>
                        {MATERIALS.map(m => (
                            <div key={m.id}
                                className={`${styles.matCard} ${local.material === m.id ? styles.selected : ''}`}
                                onClick={() => set('material', m.id)}>
                                <div className={styles.matPreview} style={m.style} />
                                <div className={styles.matLabel}>
                                    <span>{m.label}</span>
                                    <div className={styles.radio} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, textAlign: 'center', marginTop: 16 }}>
                            {error}
                        </div>
                    )}

                    <div className={styles.footer}>
                        <button type="submit" className={styles.continueBtn} disabled={saving}>
                            {saving ? 'Creating...' : 'Continue to Layout'} <ArrowRight size={18} />
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}
