import styles from './LoginPage.module.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react'
import { authAPI } from '../services/api'
import { useStore } from '../store/useStore'

export default function LoginPage() {
    const navigate = useNavigate()
    const setAuth = useStore(s => s.setAuth)
    const [loading, setLoading] = useState(false)
    const [isRegister, setIsRegister] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({ name: '', email: '', password: '' })

    const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (isRegister) {
                // Register first, then auto-login
                await authAPI.register(form.name, form.email, form.password)
                const data = await authAPI.login(form.email, form.password)
                setAuth(data.user)
            } else {
                const data = await authAPI.login(form.email, form.password)
                setAuth(data.user)
            }
            navigate('/dashboard')
        } catch (err) {
            setError(err.message || 'Something went wrong')
            setLoading(false)
        }
    }

    return (
        <div className={styles.page}>
            {/* Animated background blobs */}
            <div className={styles.blob1} />
            <div className={styles.blob2} />

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>◈</span>
                    RoomViz 3D
                </div>
                <nav className={styles.nav}>
                    <a href="#">Explore</a>
                    <a href="#">Features</a>
                    <a href="#">Showcase</a>
                    <button className={styles.signupBtn} onClick={() => setIsRegister(true)}>Sign Up</button>
                </nav>
            </header>

            {/* Card */}
            <main className={styles.cardWrap}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
                        <p>{isRegister ? 'Start designing your rooms in 3D' : 'Access your 3D workspace and room designs'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {isRegister && (
                            <>
                                <label>Full Name</label>
                                <div className={styles.inputGroup}>
                                    <User size={16} className={styles.icon} />
                                    <input type="text" placeholder="Alex Rivera" required
                                        value={form.name} onChange={e => handleChange('name', e.target.value)} />
                                </div>
                            </>
                        )}

                        <label>Email Address</label>
                        <div className={styles.inputGroup}>
                            <Mail size={16} className={styles.icon} />
                            <input type="email" placeholder="name@company.com" required
                                value={form.email} onChange={e => handleChange('email', e.target.value)} />
                        </div>

                        <div className={styles.pwRow}>
                            <label>Password</label>
                            {!isRegister && <a href="#" className={styles.forgot}>Forgot password?</a>}
                        </div>
                        <div className={styles.inputGroup}>
                            <Lock size={16} className={styles.icon} />
                            <input type="password" placeholder="••••••••" required
                                value={form.password} onChange={e => handleChange('password', e.target.value)} />
                        </div>

                        {!isRegister && (
                            <label className={styles.checkRow}>
                                <input type="checkbox" />
                                <span>Keep me logged in for 30 days</span>
                            </label>
                        )}

                        {error && <div className={styles.errorMsg}>{error}</div>}

                        <button type="submit" className={styles.launchBtn} disabled={loading}>
                            {loading ? <Loader2 size={18} className={styles.spin} /> : <>{isRegister ? 'Create Account' : 'Launch Designer'} <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <p className={styles.signup}>
                        {isRegister ? (
                            <>Already have an account? <span onClick={() => { setIsRegister(false); setError('') }}>Sign in</span></>
                        ) : (
                            <>Don't have an account? <span onClick={() => { setIsRegister(true); setError('') }}>Start free trial</span></>
                        )}
                    </p>
                </div>
            </main>

            <footer className={styles.footer}>
                <span>© 2024 Furniture Room Visualization System. All rights reserved.</span>
                <div className={styles.footerLinks}>
                    <a href="#">Terms of Service</a>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Contact Support</a>
                </div>
            </footer>
        </div>
    )
}
