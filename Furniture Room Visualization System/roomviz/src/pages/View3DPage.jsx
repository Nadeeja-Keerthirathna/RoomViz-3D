import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Text } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Suspense, useRef, useState } from 'react'
import { LayoutDashboard, Layers, Lightbulb, Video, Box } from 'lucide-react'
import * as THREE from 'three'
import styles from './View3DPage.module.css'

const FT_TO_M = 0.3048

// ─── Floor color map ─────────────────────────────────────────────────────────
const FLOOR_COLORS = {
    wood: '#a0662a',
    concrete: '#8a8a8a',
    carpet: '#3a7a3a',
    marble: '#d0d0d0',
    tiles: '#c0c0c0',
    parquet: '#b07830',
}
const WALL_COLOR = '#1d2e22'

// ─── Room Shapes ─────────────────────────────────────────────────────────────
function Room({ config }) {
    const w = parseFloat(config.width || 20) * FT_TO_M
    const l = parseFloat(config.length || 15) * FT_TO_M
    const h = 2.4  // Wall height
    const fc = FLOOR_COLORS[config.material] || '#a0662a'
    const shape = config.shape || 'rectangular'

    // Build floor shape geometry
    const floorShape = new THREE.Shape()
    if (shape === 'l-shaped') {
        const hw = w / 2, hl = l / 2
        // Match walls: Back wall at -hl, Left wall at -hw
        // Cutout at Front-Right (+X, +Z) which is (+X, -ShapeY)
        floorShape.moveTo(-hw, hl)   // Back-Left
        floorShape.lineTo(hw, hl)    // Back-Right
        floorShape.lineTo(hw, 0)     // Middle-Right
        floorShape.lineTo(0, 0)      // Center
        floorShape.lineTo(0, -hl)    // Front-Middle
        floorShape.lineTo(-hw, -hl)  // Front-Left
        floorShape.closePath()
    } else if (shape === 't-shaped') {
        const tw = w / 3
        // Match walls: T-top at Back (-hl), Stem towards Front (+hl)
        floorShape.moveTo(-w / 2, l / 2)  // Back-Left
        floorShape.lineTo(w / 2, l / 2)   // Back-Right
        floorShape.lineTo(w / 2, 0)       // Middle-Right
        floorShape.lineTo(tw, 0)          // Stem-In-Right
        floorShape.lineTo(tw, -l / 2)     // Front-Right
        floorShape.lineTo(-tw, -l / 2)    // Front-Left
        floorShape.lineTo(-tw, 0)         // Stem-In-Left
        floorShape.lineTo(-w / 2, 0)      // Middle-Left
        floorShape.closePath()
    } else {
        floorShape.moveTo(-w / 2, l / 2)
        floorShape.lineTo(w / 2, l / 2)
        floorShape.lineTo(w / 2, -l / 2)
        floorShape.lineTo(-w / 2, -l / 2)
        floorShape.closePath()
    }

    const floorGeo = new THREE.ShapeGeometry(floorShape)

    // Walls: 3 walls only (back + left + right), NO front wall, NO ceiling
    // so camera can look inside the room from above/front
    const wallSegs = shape === 'l-shaped' ? [
        // Back wall
        { pos: [0, h / 2, -l / 2], size: [w, h, 0.08] },
        // Left outer wall
        { pos: [-w / 2, h / 2, 0], size: [0.08, h, l] },
        // Right short wall (top half)
        { pos: [w / 2, h / 2, -l / 4], size: [0.08, h, l / 2] },
        // Inner corner horizontal
        { pos: [w / 4, h / 2, 0], size: [w / 2, h, 0.08] },
        // Inner corner vertical
        { pos: [0, h / 2, l / 4], size: [0.08, h, l / 2] },
    ] : shape === 't-shaped' ? [
        // Back wall (full width top section)
        { pos: [0, h / 2, -l / 2], size: [w, h, 0.08] },
        // Left wall top section
        { pos: [-w / 2, h / 2, -l / 4], size: [0.08, h, l / 2] },
        // Right wall top section
        { pos: [w / 2, h / 2, -l / 4], size: [0.08, h, l / 2] },
        // Inner step left shoulder (centered at -w/3, width w/3)
        { pos: [-w / 3, h / 2, 0], size: [w / 3, h, 0.08] },
        // Inner step right shoulder (centered at w/3, width w/3)
        { pos: [w / 3, h / 2, 0], size: [w / 3, h, 0.08] },
        // Left wall bottom section (stem at -w/6)
        { pos: [-w / 6, h / 2, l / 4], size: [0.08, h, l / 2] },
        // Right wall bottom section (stem at w/6)
        { pos: [w / 6, h / 2, l / 4], size: [0.08, h, l / 2] },
    ] : [
        // Rectangular: back + left + right only (NO front wall)
        { pos: [0, h / 2, -l / 2], size: [w, h, 0.08] },       // Back
        { pos: [-w / 2, h / 2, 0], size: [0.08, h, l] },        // Left
        { pos: [w / 2, h / 2, 0], size: [0.08, h, l] },         // Right
    ]

    return (
        <group>
            {/* Floor */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} geometry={floorGeo}>
                <meshStandardMaterial color={fc} roughness={0.85} metalness={0.0} side={THREE.DoubleSide} />
            </mesh>

            {/* Tile grid pattern on floor */}
            {(config.material === 'tiles' || config.material === 'marble') && (
                <gridHelper args={[Math.max(w, l) + 1, Math.floor(Math.max(w, l) * 2), '#999', '#777']}
                    position={[0, 0.006, 0]} />
            )}

            {/* Walls - DoubleSide so visible from inside */}
            {wallSegs.map((seg, i) => (
                <mesh key={i} receiveShadow castShadow position={seg.pos}>
                    <boxGeometry args={seg.size} />
                    <meshStandardMaterial
                        color={WALL_COLOR}
                        roughness={0.92}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}

            {/* NO ceiling — open top so you can see inside */}

            {/* Floor edge glow strip along back wall */}
            <mesh position={[0, 0.01, -l / 2 + 0.06]}>
                <boxGeometry args={[w, 0.02, 0.04]} />
                <meshStandardMaterial color="#00e557" emissive="#00e557" emissiveIntensity={2} />
            </mesh>

            {/* Floor edge glow strip along left wall */}
            <mesh position={[-w / 2 + 0.06, 0.01, 0]}>
                <boxGeometry args={[0.04, 0.02, l]} />
                <meshStandardMaterial color="#00e557" emissive="#00e557" emissiveIntensity={1.5} />
            </mesh>
        </group>
    )
}

// ─── Furniture Models ─────────────────────────────────────────────────────────
function SofaModel({ color }) {
    return (
        <group>
            <mesh castShadow position={[0, 0.2, 0]}>
                <boxGeometry args={[1.0, 0.4, 0.45]} />
                <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
            {/* Cushions */}
            {[-0.28, 0, 0.28].map((x, i) => (
                <mesh key={i} castShadow position={[x, 0.45, -0.05]}>
                    <boxGeometry args={[0.28, 0.15, 0.4]} />
                    <meshStandardMaterial color={lightenColor(color, 30)} roughness={0.7} />
                </mesh>
            ))}
            {/* Backrest */}
            <mesh castShadow position={[0, 0.5, -0.25]}>
                <boxGeometry args={[1.0, 0.5, 0.1]} />
                <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
            {/* Armrests */}
            {[-0.55, 0.55].map((x, i) => (
                <mesh key={i} castShadow position={[x, 0.38, 0]}>
                    <boxGeometry args={[0.1, 0.35, 0.5]} />
                    <meshStandardMaterial color={color} roughness={0.8} />
                </mesh>
            ))}
            {/* Legs */}
            {[[-0.45, -0.2], [0.45, -0.2], [-0.45, 0.2], [0.45, 0.2]].map(([x, z], i) => (
                <mesh key={i} castShadow position={[x, 0.05, z]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
                    <meshStandardMaterial color="#5a3a1a" metalness={0.3} roughness={0.6} />
                </mesh>
            ))}
        </group>
    )
}

function ChairModel({ color }) {
    return (
        <group>
            <mesh castShadow position={[0, 0.22, 0]}>
                <boxGeometry args={[0.42, 0.06, 0.42]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            <mesh castShadow position={[0, 0.5, -0.19]}>
                <boxGeometry args={[0.42, 0.5, 0.05]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            {[[-0.17, -0.18], [0.17, -0.18], [-0.17, 0.18], [0.17, 0.18]].map(([x, z], i) => (
                <mesh key={i} castShadow position={[x, 0.12, z]}>
                    <cylinderGeometry args={[0.022, 0.022, 0.45, 8]} />
                    <meshStandardMaterial color="#4a3010" roughness={0.6} />
                </mesh>
            ))}
        </group>
    )
}

function BedModel({ color, w, d }) {
    return (
        <group>
            {/* Base */}
            <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
                <boxGeometry args={[w * 0.95, 0.3, d * 0.9]} />
                <meshStandardMaterial color="#3a2a10" roughness={0.8} />
            </mesh>
            {/* Mattress */}
            <mesh castShadow position={[0, 0.35, 0]}>
                <boxGeometry args={[w * 0.92, 0.18, d * 0.85]} />
                <meshStandardMaterial color="#f0ede5" roughness={0.9} />
            </mesh>
            {/* Pillow(s) */}
            {[-w * 0.2, w * 0.2].map((x, i) => (
                <mesh key={i} castShadow position={[x, 0.47, -d * 0.3]}>
                    <boxGeometry args={[w * 0.3, 0.08, d * 0.18]} />
                    <meshStandardMaterial color="#fff8f0" roughness={0.8} />
                </mesh>
            ))}
            {/* Blanket */}
            <mesh castShadow position={[0, 0.42, d * 0.05]}>
                <boxGeometry args={[w * 0.88, 0.05, d * 0.6]} />
                <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
            {/* Headboard */}
            <mesh castShadow position={[0, 0.65, -d / 2 + 0.05]}>
                <boxGeometry args={[w * 0.96, 0.7, 0.1]} />
                <meshStandardMaterial color="#3a2a10" roughness={0.7} />
            </mesh>
        </group>
    )
}

function TableModel({ color, w, d, h = 0.75 }) {
    return (
        <group>
            <mesh castShadow position={[0, h, 0]}>
                <boxGeometry args={[w, 0.06, d]} />
                <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
            </mesh>
            {[[-w * 0.4, -d * 0.4], [w * 0.4, -d * 0.4], [-w * 0.4, d * 0.4], [w * 0.4, d * 0.4]].map(([x, z], i) => (
                <mesh key={i} castShadow position={[x, h / 2, z]}>
                    <cylinderGeometry args={[0.03, 0.03, h, 8]} />
                    <meshStandardMaterial color="#4a3010" roughness={0.6} />
                </mesh>
            ))}
        </group>
    )
}

function DeskModel({ color, w, d }) {
    return (
        <group>
            <mesh castShadow position={[0, 0.74, 0]}>
                <boxGeometry args={[w, 0.05, d]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.15} />
            </mesh>
            {[[-w / 2 + 0.06, 0], [w / 2 - 0.06, 0]].map(([x, z], i) => (
                <mesh key={i} castShadow position={[x, 0.37, z]}>
                    <boxGeometry args={[0.05, 0.74, d]} />
                    <meshStandardMaterial color={color} roughness={0.6} />
                </mesh>
            ))}
            {/* Monitor */}
            <mesh castShadow position={[0, 1.1, -d * 0.3]}>
                <boxGeometry args={[0.4, 0.28, 0.03]} />
                <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.87, -d * 0.3]}>
                <boxGeometry args={[0.05, 0.15, 0.03]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </group>
    )
}

function WardrobeModel({ color, w, d }) {
    return (
        <group>
            <mesh castShadow position={[0, 0.9, 0]}>
                <boxGeometry args={[w, 1.8, d]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            {/* Door line */}
            <mesh position={[0, 0.9, d / 2 + 0.01]}>
                <boxGeometry args={[0.01, 1.7, 0.01]} />
                <meshStandardMaterial color={lightenColor(color, 40)} />
            </mesh>
            {/* Handles */}
            {[-w / 4, w / 4].map((x, i) => (
                <mesh key={i} position={[x, 0.9, d / 2 + 0.01]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.12, 8]} rotation={[Math.PI / 2, 0, 0]} />
                    <meshStandardMaterial color="#c0a060" metalness={0.7} roughness={0.3} />
                </mesh>
            ))}
        </group>
    )
}

function PlantModel() {
    return (
        <group>
            <mesh castShadow position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.12, 0.1, 0.22, 12]} />
                <meshStandardMaterial color="#8b5e3c" roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0, 0.42, 0]}>
                <sphereGeometry args={[0.22, 12, 12]} />
                <meshStandardMaterial color="#2a7a2a" roughness={0.9} />
            </mesh>
            <mesh castShadow position={[-0.12, 0.38, 0.08]}>
                <sphereGeometry args={[0.14, 10, 10]} />
                <meshStandardMaterial color="#1a6a1a" roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0.1, 0.36, -0.08]}>
                <sphereGeometry args={[0.12, 10, 10]} />
                <meshStandardMaterial color="#3a8a3a" roughness={0.9} />
            </mesh>
        </group>
    )
}

function LampModel({ color }) {
    return (
        <group>
            {/* Base */}
            <mesh castShadow position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.06, 16]} />
                <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Pole */}
            <mesh castShadow position={[0, 0.9, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 1.7, 12]} />
                <meshStandardMaterial color="#777" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Shade */}
            <mesh castShadow position={[0, 1.65, 0]}>
                <coneGeometry args={[0.2, 0.3, 16, 1, true]} />
                <meshStandardMaterial color={color || '#c8a060'} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
            {/* Light source */}
            <pointLight position={[0, 1.6, 0]} intensity={0.8} color="#ffe0a0" distance={4} />
        </group>
    )
}

function BookshelfModel({ color, w, d }) {
    return (
        <group>
            <mesh castShadow position={[0, 0.9, 0]}>
                <boxGeometry args={[w, 1.8, d]} />
                <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            {[0.3, 0.7, 1.1, 1.5].map((y, i) => (
                <mesh key={i} position={[0, y, 0]}>
                    <boxGeometry args={[w * 0.95, 0.02, d * 0.9]} />
                    <meshStandardMaterial color={lightenColor(color, 25)} roughness={0.5} />
                </mesh>
            ))}
            {/* Book colors */}
            {[0.1, 0.5, 0.9, 1.3].map((y, i) => (
                ['#d04040', '#4060d0', '#40a060', '#c08020'].map((c2, j) => (
                    <mesh key={`${i}-${j}`} castShadow position={[-w * 0.35 + j * w * 0.22, y + 0.1, 0]}>
                        <boxGeometry args={[w * 0.18, 0.18, d * 0.7]} />
                        <meshStandardMaterial color={c2} roughness={0.6} />
                    </mesh>
                ))
            ))}
        </group>
    )
}

function TVUnitModel({ color, w, d }) {
    return (
        <group>
            {/* Cabinet */}
            <mesh castShadow position={[0, 0.22, 0]}>
                <boxGeometry args={[w, 0.44, d]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            {/* TV screen */}
            <mesh castShadow position={[0, 0.9, -d / 3]}>
                <boxGeometry args={[w * 0.85, 0.5 * (w / 1.8), 0.05]} />
                <meshStandardMaterial color="#050510" roughness={0.2} metalness={0.3} />
            </mesh>
            {/* Screen glow */}
            <mesh position={[0, 0.9, -d / 3 + 0.01]}>
                <boxGeometry args={[w * 0.8, 0.44 * (w / 1.8), 0.01]} />
                <meshStandardMaterial color="#102030" emissive="#102030" emissiveIntensity={0.5} />
            </mesh>
        </group>
    )
}

function lightenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, (num >> 16) + amount)
    const g = Math.min(255, ((num >> 8) & 0xff) + amount)
    const b = Math.min(255, (num & 0xff) + amount)
    return `rgb(${r},${g},${b})`
}

// ─── Furniture Dispatcher ─────────────────────────────────────────────────────
function FurnitureObject({ item, roomConfig }) {
    const rw = parseFloat(roomConfig.width || 20) * FT_TO_M
    const rl = parseFloat(roomConfig.length || 15) * FT_TO_M
    const x3 = item.x + item.w / 2 - rw / 2
    const z3 = item.y + item.d / 2 - rl / 2
    const rot = (item.rotation * Math.PI) / 180
    const color = item.color || '#2a4030'

    const scale = [
        item.w / (['sofa', 'armchair', 'dining-chair'].includes(item.type) ? (item.type === 'sofa' ? 1.1 : item.type === 'armchair' ? 0.42 : 0.42) : item.w),
        1,
        item.d / (['sofa', 'armchair', 'dining-chair'].includes(item.type) ? (item.type === 'sofa' ? 0.5 : 0.42) : item.d)
    ]

    let model = null
    switch (item.type) {
        case 'sofa': model = <SofaModel color={color} />; break
        case 'armchair': model = <ChairModel color={color} />; break
        case 'dining-chair': model = <ChairModel color={color} />; break
        case 'bed': model = <BedModel color={color} w={item.w} d={item.d} />; break
        case 'coffee-table': model = <TableModel color={color} w={item.w} d={item.d} h={0.45} />; break
        case 'dining-table': model = <TableModel color={color} w={item.w} d={item.d} h={0.75} />; break
        case 'desk': model = <DeskModel color={color} w={item.w} d={item.d} />; break
        case 'wardrobe': model = <WardrobeModel color={color} w={item.w} d={item.d} />; break
        case 'plant': model = <PlantModel />; break
        case 'lamp': model = <LampModel color={color} />; break
        case 'bookshelf': model = <BookshelfModel color={color} w={item.w} d={item.d} />; break
        case 'tv-unit': model = <TVUnitModel color={color} w={item.w} d={item.d} />; break
        default:
            model = (
                <mesh castShadow>
                    <boxGeometry args={[item.w, 0.5, item.d]} />
                    <meshStandardMaterial color={color} roughness={0.7} />
                </mesh>
            )
    }

    return (
        <group position={[x3, 0, z3]} rotation={[0, -rot, 0]}>
            {model}
        </group>
    )
}

// ─── Lights ───────────────────────────────────────────────────────────────────
function Lights() {
    return (
        <>
            <ambientLight intensity={0.4} color="#d5f0dc" />
            <directionalLight position={[8, 14, 10]} intensity={1.5} castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-25} shadow-camera-right={25}
                shadow-camera-top={25} shadow-camera-bottom={-25}
                shadow-bias={-0.001}
                color="#ffe8c0" />
            <pointLight position={[-8, 4, -6]} intensity={0.5} color="#8090ff" />
        </>
    )
}



// ─── Main Page ────────────────────────────────────────────────────────────────
export default function View3DPage() {
    const navigate = useNavigate()
    const { roomConfig, furnitureItems, setRoomConfig } = useStore()
    const glRef = useRef(null)
    const [activeMat, setActiveMat] = useState(roomConfig.material || 'wood')

    const handleMaterialChange = (mat) => {
        setActiveMat(mat)
        setRoomConfig({ ...roomConfig, material: mat })
    }



    const areaM2 = (parseFloat(roomConfig.width || 20) * parseFloat(roomConfig.length || 15) * FT_TO_M * FT_TO_M).toFixed(1)

    return (
        <div className={styles.page}>
            <Canvas id="three-canvas" shadows gl={{ preserveDrawingBuffer: true }}
                className={styles.canvas}
                onCreated={({ gl }) => { glRef.current = gl }}>
                <PerspectiveCamera makeDefault fov={50} position={[8, 8, 10]} />
                <Suspense fallback={null}>
                    <Lights />
                    <Environment preset="apartment" />
                    <Room config={roomConfig} />
                    {furnitureItems.map(item => (
                        <FurnitureObject key={item.id} item={item} roomConfig={roomConfig} />
                    ))}
                    <ContactShadows position={[0, 0.002, 0]} opacity={0.4} scale={50} blur={2.5} far={12} />
                </Suspense>
                <OrbitControls enableDamping dampingFactor={0.06}
                    maxPolarAngle={Math.PI / 2.1}
                    minDistance={2} maxDistance={50}
                    target={[0, 0, 0]} />
            </Canvas>

            {/* UI Overlay */}
            <div className={styles.ui}>
                {/* Topbar */}
                <header className={styles.topbar}>
                    <div className={styles.logo}>
                        <span className={styles.logoIcon}>◈</span>
                        <div>
                            <div className={styles.logoTitle}>3D Room Planner</div>
                            <div className={styles.logoSub}>Visualization Mode: High Fidelity</div>
                        </div>
                    </div>
                    <nav className={styles.nav}>
                        <span onClick={() => navigate('/dashboard')}>Projects</span>
                        <span onClick={() => navigate('/2d-layout')}>Layout</span>
                        <span onClick={() => navigate('/room-creation')}>Settings</span>

                    </nav>
                </header>

                {/* Left tools */}
                <div className={styles.leftTools}>
                    <button className={`${styles.toolBtn} ${styles.active}`} title="Scene"><Layers size={18} /></button>
                    <button className={styles.toolBtn} title="Back to 2D" onClick={() => navigate('/2d-layout')}><LayoutDashboard size={18} /></button>
                    <button className={styles.toolBtn} title="Furniture" onClick={() => navigate('/2d-layout')}><Box size={18} /></button>
                    <button className={styles.toolBtn} title="Lighting"><Lightbulb size={18} /></button>
                </div>

                {/* Info card */}
                <div className={styles.infoCard}>
                    <div className={styles.infoTitle}>{roomConfig.shape || 'Rectangular'} Room</div>
                    <div className={styles.infoSub}>
                        <span className={styles.dot} /> <span>REAL-TIME</span>
                    </div>
                    <div className={styles.infoStats}>
                        <div><span>Area</span><span>{areaM2} m²</span></div>
                        <div><span>Objects</span><span>{furnitureItems.length}</span></div>
                        <div><span>Dims</span><span>{roomConfig.width}×{roomConfig.length} ft</span></div>
                    </div>
                </div>

                {/* Floor Material Switcher */}
                <div className={styles.bottomBar}>
                    <div className={styles.matInfo}>
                        <div className={styles.matLabel}>FLOOR</div>
                        <div className={styles.matVal}>{activeMat}</div>
                    </div>
                    <div className={styles.sep} />
                    <div className={styles.matBtns}>
                        {Object.entries(FLOOR_COLORS).map(([k, c]) => (
                            <button
                                key={k}
                                className={`${styles.matBtn} ${activeMat === k ? styles.matBtnActive : ''}`}
                                title={k}
                                onClick={() => handleMaterialChange(k)}
                            >
                                <div className={styles.matSwatch} style={{ background: c }} />
                                <span>{k}</span>
                            </button>
                        ))}
                    </div>
                    <div className={styles.sep} />
                    <button className={styles.back2dBtn} onClick={() => navigate('/2d-layout')}>
                        <LayoutDashboard size={14} /> Back to 2D
                    </button>
                </div>

                <div className={styles.viewHint}>
                    🖱 Drag to orbit · Scroll to zoom · Right-click to pan
                </div>
            </div>
        </div>
    )
}
