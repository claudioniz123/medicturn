'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArchiveX,
  Check,
  ChevronDown,
  CircleAlert,
  Edit3,
  LogOut,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'

type Role = 'Administrador' | 'Usuario'
type User = { email: string; password: string; name: string; role: Role }
type Product = {
  id: number
  name: string
  category: string
  code: string
  stock: number
  minimum: number
  active: boolean
}

const USERS: User[] = [
  { email: 'admin@farmacia.com', password: 'admin123', name: 'Admin', role: 'Administrador' },
  { email: 'empleado@farmacia.com', password: 'empleado123', name: 'Empleado', role: 'Usuario' },
]

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Paracetamol 500 mg', category: 'Medicamento', code: 'MED-001', stock: 120, minimum: 40, active: true },
  { id: 2, name: 'Ibuprofeno 400 mg', category: 'Medicamento', code: 'MED-002', stock: 18, minimum: 30, active: true },
  { id: 3, name: 'Alcohol en gel 250 ml', category: 'Higiene', code: 'HIG-001', stock: 54, minimum: 20, active: true },
  { id: 4, name: 'Vitamina C 1 g', category: 'Suplementos', code: 'SUP-001', stock: 8, minimum: 15, active: true },
  { id: 5, name: 'Shampoo neutro 400 ml', category: 'Perfumería', code: 'PER-001', stock: 33, minimum: 12, active: true },
  { id: 6, name: 'Gasas estériles x10', category: 'Higiene', code: 'HIG-002', stock: 0, minimum: 10, active: false },
]

const emptyProduct: Omit<Product, 'id' | 'active'> = { name: '', category: 'Medicamento', code: '', stock: 0, minimum: 0 }

export default function MedicturnDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('admin@farmacia.com')
  const [password, setPassword] = useState('admin123')
  const [loginError, setLoginError] = useState('')
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [status, setStatus] = useState('Todos')
  const [modal, setModal] = useState<'new' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [draft, setDraft] = useState(emptyProduct)
  const [formError, setFormError] = useState('')
  const [showInactive, setShowInactive] = useState(true)

  useEffect(() => {
    const saved = window.localStorage.getItem('medicturn-user')
    if (saved) setUser(JSON.parse(saved))
    const savedProducts = window.localStorage.getItem('medicturn-products')
    if (savedProducts) setProducts(JSON.parse(savedProducts))
  }, [])

  useEffect(() => {
    window.localStorage.setItem('medicturn-products', JSON.stringify(products))
  }, [products])

  const categories = useMemo(() => ['Todas', ...Array.from(new Set(products.map((product) => product.category)))], [products])
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.code} ${product.category}`.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'Todas' || product.category === category
    const matchesStatus = status === 'Todos' || (status === 'Activos' ? product.active : !product.active)
    return matchesQuery && matchesCategory && matchesStatus && (showInactive || product.active)
  }), [products, query, category, status, showInactive])
  const lowStock = products.filter((product) => product.active && product.stock <= product.minimum).length
  const inactive = products.filter((product) => !product.active).length

  function login(event: React.FormEvent) {
    event.preventDefault()
    const found = USERS.find((candidate) => candidate.email === email && candidate.password === password)
    if (!found) return setLoginError('Usuario o contraseña incorrectos.')
    setUser(found)
    window.localStorage.setItem('medicturn-user', JSON.stringify(found))
    setLoginError('')
  }

  function logout() {
    setUser(null)
    window.localStorage.removeItem('medicturn-user')
  }

  function openNew() {
    setEditing(null); setDraft(emptyProduct); setFormError(''); setModal('new')
  }

  function openEdit(product: Product) {
    setEditing(product); setDraft({ name: product.name, category: product.category, code: product.code, stock: product.stock, minimum: product.minimum }); setFormError(''); setModal('edit')
  }

  function saveProduct(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.name.trim() || !draft.code.trim()) return setFormError('Completá el nombre y el código del producto.')
    if (draft.stock < 0 || draft.minimum < 0) return setFormError('El stock no puede ser negativo.')
    const duplicate = products.some((product) => product.code.toLowerCase() === draft.code.trim().toLowerCase() && product.id !== editing?.id)
    if (duplicate) return setFormError('El código de producto debe ser único.')
    if (editing) setProducts((current) => current.map((product) => product.id === editing.id ? { ...product, ...draft, name: draft.name.trim(), code: draft.code.trim() } : product))
    else setProducts((current) => [...current, { ...draft, id: Date.now(), name: draft.name.trim(), code: draft.code.trim(), active: true }])
    setModal(null)
  }

  function toggleActive(id: number) {
    if (user?.role !== 'Administrador') return
    setProducts((current) => current.map((product) => product.id === id ? { ...product, active: !product.active } : product))
  }

  if (!user) return <LoginScreen email={email} password={password} error={loginError} setEmail={setEmail} setPassword={setPassword} onSubmit={login} />

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#164e63] text-white"><Stethoscope /></div><div><p className="text-lg font-bold tracking-tight text-[#164e63]">MedicTurn</p><p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Gestión de medicamentos</p></div></div>
          <div className="flex items-center gap-4"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user.name}</p><span className="text-xs text-slate-500">{user.email}</span></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.role === 'Administrador' ? 'bg-cyan-50 text-cyan-800' : 'bg-slate-100 text-slate-600'}`}><ShieldCheck className="mr-1 inline size-3" />{user.role}</span><button onClick={logout} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Cerrar sesión"><LogOut /></button></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-semibold text-[#0e7490]">Farmacia Central Salud</p><h1 className="text-3xl font-bold tracking-tight text-slate-900">Panel de inventario</h1><p className="mt-1 text-sm text-slate-500">Controlá existencias y mantené tu catálogo al día.</p></div>{user.role === 'Administrador' && <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#164e63] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f3d4d]"><Plus className="size-4" />Nuevo producto</button>}</div>
        <div className="mb-8 grid gap-4 sm:grid-cols-3"><Kpi icon={<Package />} label="Total productos" value={products.length} detail="en el catálogo" tone="blue" /><Kpi icon={<CircleAlert />} label="Bajo stock" value={lowStock} detail="requieren reposición" tone="amber" /><Kpi icon={<ArchiveX />} label="Inactivos" value={inactive} detail="dados de baja lógica" tone="slate" /></div>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">Catálogo de productos</h2><p className="mt-1 text-xs text-slate-500">{visibleProducts.length} productos encontrados</p></div>{user.role === 'Usuario' && <div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 sm:flex"><UsersRound className="size-4" />Modo consulta</div>}</div><div className="grid gap-3 lg:grid-cols-[1fr_170px_140px_auto]"><label className="relative block"><span className="sr-only">Buscar productos</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, código o categoría..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" /></label><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-cyan-600"><option value="Todas">Todas las categorías</option>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-cyan-600"><option>Todos</option><option>Activos</option><option>Inactivos</option></select><label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs text-slate-600"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} className="accent-[#164e63]" />Ver inactivos</label></div></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3 font-semibold">Producto</th><th className="px-5 py-3 font-semibold">Categoría</th><th className="px-5 py-3 font-semibold">Código</th><th className="px-5 py-3 text-right font-semibold">Stock actual</th><th className="px-5 py-3 text-right font-semibold">Stock mínimo</th><th className="px-5 py-3 font-semibold">Estado</th>{user.role === 'Administrador' && <th className="px-5 py-3 text-right font-semibold">Acciones</th>}</tr></thead><tbody className="divide-y divide-slate-100">{visibleProducts.map((product) => { const isLow = product.active && product.stock <= product.minimum; return <tr key={product.id} className={`transition hover:bg-slate-50/80 ${!product.active ? 'opacity-60' : ''}`}><td className="px-5 py-4 font-semibold text-slate-800">{product.name}</td><td className="px-5 py-4 text-slate-500">{product.category}</td><td className="px-5 py-4 font-mono text-xs text-slate-500">{product.code}</td><td className={`px-5 py-4 text-right font-bold ${isLow ? 'text-amber-700' : 'text-slate-700'}`}>{isLow && <AlertTriangle className="mr-1 inline size-4" />}{product.stock}</td><td className="px-5 py-4 text-right text-slate-500">{product.minimum}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${product.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><span className={`size-1.5 rounded-full ${product.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />{product.active ? 'Activo' : 'Inactivo'}</span></td>{user.role === 'Administrador' && <td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => openEdit(product)} className="rounded-lg p-2 text-slate-400 hover:bg-cyan-50 hover:text-cyan-700" aria-label={`Editar ${product.name}`}><Edit3 className="size-4" /></button><button onClick={() => toggleActive(product.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={product.active ? `Desactivar ${product.name}` : `Activar ${product.name}`}>{product.active ? <ArchiveX className="size-4" /> : <Check className="size-4" />}</button></div></td>}</tr> })}</tbody></table>{visibleProducts.length === 0 && <div className="p-12 text-center text-sm text-slate-500">No se encontraron productos con esos filtros.</div>}</div></section><p className="mt-5 text-center text-xs text-slate-400">Master System · MedicTurn v1.0 · Última actualización: hoy</p>
      </main>
      {modal && <ProductModal mode={modal} draft={draft} error={formError} setDraft={setDraft} onClose={() => setModal(null)} onSubmit={saveProduct} />}
    </div>
  )
}

function Kpi({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: number; detail: string; tone: 'blue' | 'amber' | 'slate' }) { const tones = { blue: 'bg-cyan-50 text-cyan-700', amber: 'bg-amber-50 text-amber-700', slate: 'bg-slate-100 text-slate-600' }; return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div><div className={`rounded-xl p-3 ${tones[tone]}`}>{icon}</div></div></div> }

function LoginScreen({ email, password, error, setEmail, setPassword, onSubmit }: { email: string; password: string; error: string; setEmail: (value: string) => void; setPassword: (value: string) => void; onSubmit: (event: React.FormEvent) => void }) { return <main className="flex min-h-screen items-center justify-center bg-[#eef5f7] p-5"><div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-[1.05fr_0.95fr]"><div className="hidden flex-col justify-between bg-[#164e63] p-10 text-white md:flex"><div><div className="mb-16 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-white/15"><Stethoscope /></div><span className="text-xl font-bold">MedicTurn</span></div><p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">Farmacia Central Salud</p><h1 className="max-w-sm text-4xl font-bold leading-tight">Tu inventario, siempre bajo control.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-cyan-100">Gestioná productos, stock y alertas desde un solo lugar.</p></div><p className="text-xs text-cyan-200">Desarrollado por Master System</p></div><form onSubmit={onSubmit} className="p-7 sm:p-10"><div className="mb-8 flex items-center gap-3 md:hidden"><div className="flex size-10 items-center justify-center rounded-xl bg-[#164e63] text-white"><Stethoscope /></div><span className="text-xl font-bold text-[#164e63]">MedicTurn</span></div><p className="text-sm font-semibold text-[#0e7490]">Bienvenido de nuevo</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Iniciar sesión</h2><p className="mt-2 text-sm text-slate-500">Ingresá tus credenciales para continuar.</p><div className="mt-8 flex flex-col gap-5"><label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">Usuario<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" /></label><label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 font-normal outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" /></label></div>{error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}<button type="submit" className="mt-7 h-11 w-full rounded-xl bg-[#164e63] text-sm font-semibold text-white transition hover:bg-[#0f3d4d]">Ingresar al sistema</button><div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500"><p className="mb-2 font-semibold text-slate-700">Accesos de prueba</p><p><b>Admin:</b> admin@farmacia.com / admin123</p><p><b>Empleado:</b> empleado@farmacia.com / empleado123</p></div></form></div></main> }

function ProductModal({ mode, draft, error, setDraft, onClose, onSubmit }: { mode: 'new' | 'edit'; draft: typeof emptyProduct; error: string; setDraft: React.Dispatch<React.SetStateAction<typeof emptyProduct>>; onClose: () => void; onSubmit: (event: React.FormEvent) => void }) { const update = (field: keyof typeof emptyProduct, value: string) => setDraft((current) => ({ ...current, [field]: field === 'stock' || field === 'minimum' ? Math.max(0, Number(value)) : value })); return <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/35 p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><div className="mb-6 flex items-start justify-between"><div><h2 id="product-modal-title" className="text-xl font-bold">{mode === 'new' ? 'Nuevo producto' : 'Editar producto'}</h2><p className="mt-1 text-sm text-slate-500">Completá la información del inventario.</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X className="size-5" /></button></div><form onSubmit={onSubmit} className="flex flex-col gap-4"><label className="text-sm font-semibold">Nombre del producto<input required value={draft.name} onChange={(event) => update('name', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-cyan-600" placeholder="Ej: Paracetamol 500 mg" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Categoría<select value={draft.category} onChange={(event) => update('category', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-normal outline-none focus:border-cyan-600"><option>Medicamento</option><option>Higiene</option><option>Perfumería</option><option>Suplementos</option><option>Accesorios</option></select></label><label className="text-sm font-semibold">Código único<input required value={draft.code} onChange={(event) => update('code', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal uppercase outline-none focus:border-cyan-600" placeholder="MED-007" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Stock actual<input type="number" min="0" value={draft.stock} onChange={(event) => update('stock', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-cyan-600" /></label><label className="text-sm font-semibold">Stock mínimo<input type="number" min="0" value={draft.minimum} onChange={(event) => update('minimum', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-cyan-600" /></label></div>{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}<div className="mt-2 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" className="rounded-lg bg-[#164e63] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3d4d]">{mode === 'new' ? 'Crear producto' : 'Guardar cambios'}</button></div></form></div></div> }

export { USERS }
