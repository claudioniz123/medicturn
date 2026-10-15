'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  AlertTriangle,
  ArrowDownUp,
  Check,
  ChevronDown,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  LogOut,
  Package,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  Trash2,
  UserRound,
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

const users: User[] = [
  { email: 'admin@farmacia.com', password: 'admin123', name: 'Claudio Niz', role: 'Administrador' },
  { email: 'empleado@farmacia.com', password: 'empleado123', name: 'Christian Maigua', role: 'Usuario' },
]

const seedProducts: Product[] = [
  { id: 1, name: 'Paracetamol 500 mg', category: 'Medicamento', code: 'MED-001', stock: 24, minimum: 20, active: true },
  { id: 2, name: 'Ibuprofeno 400 mg', category: 'Medicamento', code: 'MED-002', stock: 8, minimum: 15, active: true },
  { id: 3, name: 'Alcohol en gel 250 ml', category: 'Higiene', code: 'HIG-014', stock: 42, minimum: 18, active: true },
  { id: 4, name: 'Vitamina C 1 g', category: 'Suplementos', code: 'SUP-008', stock: 12, minimum: 12, active: true },
  { id: 5, name: 'Jabón líquido neutro', category: 'Higiene', code: 'HIG-021', stock: 31, minimum: 10, active: true },
  { id: 6, name: 'Crema hidratante 200 ml', category: 'Perfumería', code: 'PER-006', stock: 0, minimum: 8, active: false },
  { id: 7, name: 'Termómetro digital', category: 'Accesorios', code: 'ACC-003', stock: 16, minimum: 6, active: true },
]

const emptyProduct: Omit<Product, 'id'> = { name: '', category: 'Medicamento', code: '', stock: 0, minimum: 0, active: true }

export default function Page() {
  const [session, setSession] = useState<User | null>(null)
  const [email, setEmail] = useState('admin@farmacia.com')
  const [password, setPassword] = useState('admin123')
  const [loginError, setLoginError] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [dataStatus, setDataStatus] = useState<'loading' | 'saved' | 'error'>('loading')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [status, setStatus] = useState('Todos')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyProduct)
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadProducts() {
      const { data, error } = await supabase.from('products').select('id,name,category,code,stock,minimum,active').order('id')
      if (cancelled) return
      if (error) {
        setDataStatus('error')
        return
      }
      if (!data.length) {
        const { data: seeded, error: seedError } = await supabase.from('products').insert(seedProducts.map(({ id: _id, ...product }) => product)).select('id,name,category,code,stock,minimum,active')
        if (seedError) {
          setDataStatus('error')
          return
        }
        setProducts(seeded as Product[])
      } else {
        setProducts(data as Product[])
      }
      setDataStatus('saved')
    }
    loadProducts()
    return () => { cancelled = true }
  }, [])

  const categories = ['Todas', ...Array.from(new Set(products.map((product) => product.category)))]
  const lowStock = products.filter((product) => product.active && product.stock <= product.minimum).length
  const inactive = products.filter((product) => !product.active).length
  const filteredProducts = useMemo(() => products.filter((product) => {
    const query = search.toLowerCase()
    const matchesSearch = [product.name, product.code, product.category].some((value) => value.toLowerCase().includes(query))
    const matchesCategory = category === 'Todas' || product.category === category
    const matchesStatus = status === 'Todos' || (status === 'Activos' ? product.active : !product.active)
    return matchesSearch && matchesCategory && matchesStatus
  }), [products, search, category, status])

  function login(event: React.FormEvent) {
    event.preventDefault()
    const found = users.find((user) => user.email === email && user.password === password)
    if (!found) return setLoginError('Usuario o contraseña incorrectos.')
    setSession(found)
    setLoginError('')
  }

  function openCreate() {
    setForm(emptyProduct)
    setFormError('')
    setModal('create')
  }

  function openEdit(product: Product) {
    setEditing(product)
    setForm({ name: product.name, category: product.category, code: product.code, stock: product.stock, minimum: product.minimum, active: product.active })
    setFormError('')
    setModal('edit')
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault()
    if (!form.name.trim() || !form.code.trim()) return setFormError('Completá el nombre y el código del producto.')
    if (form.stock < 0 || form.minimum < 0) return setFormError('El stock no puede tener valores negativos.')
    const duplicate = products.some((product) => product.code.toLowerCase() === form.code.trim().toLowerCase() && product.id !== editing?.id)
    if (duplicate) return setFormError('El código de producto ya existe.')
    const payload = { ...form, name: form.name.trim(), code: form.code.trim() }
    const result = editing
      ? await supabase.from('products').update(payload).eq('id', editing.id).select('id,name,category,code,stock,minimum,active').single()
      : await supabase.from('products').insert(payload).select('id,name,category,code,stock,minimum,active').single()
    if (result.error || !result.data) {
      setFormError('No se pudo guardar el producto. Intentá nuevamente.')
      setDataStatus('error')
      return
    }
    setProducts((current) => editing ? current.map((product) => product.id === editing.id ? result.data as Product : product) : [...current, result.data as Product])
    setDataStatus('saved')
    setModal(null)
  }

  async function toggleProduct(id: number) {
    const product = products.find((item) => item.id === id)
    if (!product) return
    const { data, error } = await supabase.from('products').update({ active: !product.active }).eq('id', id).select('id,name,category,code,stock,minimum,active').single()
    if (error || !data) {
      setDataStatus('error')
      return
    }
    setProducts((current) => current.map((item) => item.id === id ? data as Product : item))
    setDataStatus('saved')
  }

  if (!session) return <LoginScreen email={email} password={password} loginError={loginError} showPassword={showPassword} onEmail={setEmail} onPassword={setPassword} onTogglePassword={() => setShowPassword(!showPassword)} onSubmit={login} />

  return (
    <main className="min-h-screen bg-[#f4f7fa] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4 lg:px-10">
          <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-[#0d5c63] text-white shadow-sm"><Stethoscope /></div><div><p className="text-lg font-bold tracking-tight text-[#123b4a]">Medic<span className="text-[#0d8b83]">Turn</span></p><p className="text-xs text-slate-500">Sistema de gestión de medicamentos</p></div></div>
          <div className="hidden items-center gap-3 sm:flex"><div className="border-r border-slate-200 pr-5 text-right"><p className="text-sm font-semibold text-slate-700">Master System</p><p className="text-[11px] text-slate-400">Soluciones para tu farmacia</p></div><div className="flex items-center gap-2"><span className={`mr-2 inline-flex items-center gap-1.5 text-[11px] font-medium ${dataStatus === 'error' ? 'text-rose-600' : dataStatus === 'loading' ? 'text-slate-400' : 'text-[#0d8b83]'}`}><span className={`size-1.5 rounded-full ${dataStatus === 'error' ? 'bg-rose-500' : dataStatus === 'loading' ? 'bg-slate-300' : 'bg-[#0d8b83]'}`} />{dataStatus === 'error' ? 'Error al guardar' : dataStatus === 'loading' ? 'Cargando datos' : 'Guardado'}</span><div className="flex size-9 items-center justify-center rounded-full bg-[#dff3ef] text-[#087b78]"><UserRound size={17} /></div><div><p className="text-sm font-semibold">{session.name}</p><p className="text-xs text-slate-500">{session.email}</p></div><span className={`ml-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${session.role === 'Administrador' ? 'bg-[#e4f2f3] text-[#08616a]' : 'bg-slate-100 text-slate-600'}`}>{session.role}</span></div><button onClick={() => setSession(null)} className="ml-2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar sesión"><LogOut size={18} /></button></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-5 py-7 lg:px-10">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-1 text-sm font-medium text-[#0d8b83]">Panel principal</p><h1 className="text-3xl font-bold tracking-tight text-[#123b4a]">Inventario de productos</h1><p className="mt-1 text-sm text-slate-500">Gestioná el stock y la disponibilidad de tu farmacia.</p></div>{session.role === 'Administrador' && <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0d5c63] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#094b52]"><Plus size={18} /> Nuevo producto</button>}</div>
        <section className="mb-7 grid gap-4 sm:grid-cols-3"><Kpi title="Total de productos" value={products.length} caption="registrados en el sistema" icon={<Package />} tone="teal" /><Kpi title="Bajo stock" value={lowStock} caption="requieren reposición" icon={<AlertTriangle />} tone="amber" alert /><Kpi title="Productos inactivos" value={inactive} caption="dados de baja lógica" icon={<EyeOff />} tone="slate" /></section>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,47,65,0.04)]"><div className="border-b border-slate-100 p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="relative min-w-0 flex-1 xl:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, código o categoría..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0d8b83] focus:bg-white focus:ring-2 focus:ring-[#0d8b83]/10" /></div><div className="flex flex-wrap items-center gap-2"><div className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><Filter size={14} /> Filtros:</div><FilterSelect value={category} onChange={setCategory} options={categories} /><FilterSelect value={status} onChange={setStatus} options={['Todos', 'Activos', 'Inactivos']} /><button onClick={() => { setSearch(''); setCategory('Todas'); setStatus('Todos') }} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">Limpiar</button></div></div></div><div className="flex items-center justify-between px-4 py-3"><p className="text-sm text-slate-500"><strong className="text-slate-700">{filteredProducts.length}</strong> productos encontrados</p>{session.role === 'Usuario' && <div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15} className="text-[#0d8b83]" /> Vista de solo consulta</div>}</div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-[#f7fafb] text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3 font-semibold">Producto</th><th className="px-4 py-3 font-semibold">Categoría</th><th className="px-4 py-3 font-semibold">Código</th><th className="px-4 py-3 font-semibold">Stock actual</th><th className="px-4 py-3 font-semibold">Stock mínimo</th><th className="px-4 py-3 font-semibold">Estado</th>{session.role === 'Administrador' && <th className="px-4 py-3 text-right font-semibold">Acciones</th>}</tr></thead><tbody className="divide-y divide-slate-100">{filteredProducts.map((product) => <tr key={product.id} className={`transition hover:bg-[#fbfdfd] ${!product.active ? 'opacity-65' : ''}`}><td className="px-4 py-4"><p className="font-semibold text-slate-700">{product.name}</p><p className="mt-0.5 text-xs text-slate-400">ID #{String(product.id).padStart(3, '0')}</p></td><td className="px-4 py-4"><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{product.category}</span></td><td className="px-4 py-4 font-mono text-xs font-medium text-slate-500">{product.code}</td><td className="px-4 py-4"><div className="flex items-center gap-2"><span className={`font-semibold ${product.stock <= product.minimum && product.active ? 'text-rose-600' : 'text-slate-700'}`}>{product.stock}</span>{product.stock <= product.minimum && product.active && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">Reponer</span>}</div></td><td className="px-4 py-4 text-sm text-slate-500">{product.minimum}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${product.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{product.active ? 'Activo' : 'Inactivo'}</span></td>{session.role === 'Administrador' && <td className="px-4 py-4"><div className="flex justify-end gap-1"><button onClick={() => openEdit(product)} className="rounded-lg p-2 text-slate-400 hover:bg-[#e8f5f3] hover:text-[#087b78]" aria-label={`Editar ${product.name}`}><Edit3 size={16} /></button><button onClick={() => toggleProduct(product.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={product.active ? `Desactivar ${product.name}` : `Activar ${product.name}`}>{product.active ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></td>}</tr>)}</tbody></table>{filteredProducts.length === 0 && <div className="px-6 py-14 text-center text-sm text-slate-500">No hay productos que coincidan con los filtros.</div>}</div><div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-400"><span>Mostrando {filteredProducts.length} de {products.length} productos</span><span className="hidden sm:inline">Última actualización: hoy, 09:42</span></div></section>
      </div>
      {modal && <ProductModal mode={modal} form={form} error={formError} onChange={setForm} onClose={() => setModal(null)} onSubmit={saveProduct} />}
    </main>
  )
}

function LoginScreen({ email, password, loginError, showPassword, onEmail, onPassword, onTogglePassword, onSubmit }: { email: string; password: string; loginError: string; showPassword: boolean; onEmail: (value: string) => void; onPassword: (value: string) => void; onTogglePassword: () => void; onSubmit: (event: React.FormEvent) => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#eef5f5] p-5"><div className="grid w-full max-w-[940px] overflow-hidden rounded-2xl bg-white shadow-[0_18px_60px_rgba(12,70,78,0.12)] md:grid-cols-[0.9fr_1.1fr]"><div className="relative hidden overflow-hidden bg-[#0d5c63] p-10 text-white md:block"><div className="relative z-10 flex h-full flex-col justify-between"><div><div className="mb-12 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-white/15"><Stethoscope /></div><span className="text-xl font-bold">Medic<span className="text-[#78d6c8]">Turn</span></span></div><p className="mb-3 text-sm font-medium text-[#9de1d8]">Bienvenido de nuevo</p><h1 className="max-w-xs text-4xl font-bold leading-tight">Tu farmacia, siempre bajo control.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-white/70">Gestioná medicamentos, controlá el stock y tomá mejores decisiones para tu equipo.</p></div><p className="text-xs text-white/50">Una solución de Master System</p></div><div className="absolute -bottom-20 -right-20 size-64 rounded-full border-[30px] border-white/5" /><div className="absolute -right-10 top-20 size-36 rounded-full bg-[#0f7477]/40" /></div><div className="p-7 sm:p-12"><div className="mx-auto max-w-sm"><div className="mb-8 md:hidden"><div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-[#0d5c63] text-white"><Stethoscope /></div><p className="text-xl font-bold text-[#123b4a]">Medic<span className="text-[#0d8b83]">Turn</span></p></div><div className="mb-8"><p className="text-sm font-medium text-[#0d8b83]">Acceso seguro</p><h2 className="mt-1 text-2xl font-bold text-[#123b4a]">Iniciá sesión</h2><p className="mt-2 text-sm text-slate-500">Ingresá tus credenciales para continuar.</p></div><form onSubmit={onSubmit} className="flex flex-col gap-5"><label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Correo electrónico<input type="email" value={email} onChange={(event) => onEmail(event.target.value)} className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 outline-none focus:border-[#0d8b83] focus:bg-white focus:ring-2 focus:ring-[#0d8b83]/10" /></label><label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Contraseña<div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => onPassword(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-11 outline-none focus:border-[#0d8b83] focus:bg-white focus:ring-2 focus:ring-[#0d8b83]/10" /><button type="button" onClick={onTogglePassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{loginError && <p className="-mt-2 text-sm text-rose-600">{loginError}</p>}<button className="h-11 rounded-lg bg-[#0d5c63] font-semibold text-white transition hover:bg-[#094b52]">Ingresar al sistema</button></form></div></div></div></main>
}

function Kpi({ title, value, caption, icon, tone, alert = false }: { title: string; value: number; caption: string; icon: React.ReactNode; tone: 'teal' | 'amber' | 'slate'; alert?: boolean }) {
  const colors = { teal: 'bg-[#e5f5f2] text-[#087b78]', amber: 'bg-amber-50 text-amber-600', slate: 'bg-slate-100 text-slate-500' }
  return <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,47,65,0.03)]"><div><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-2 text-3xl font-bold tracking-tight text-[#123b4a]">{value}</p><p className="mt-1 text-xs text-slate-400">{caption}</p></div><div className={`flex size-10 items-center justify-center rounded-lg ${colors[tone]}`}>{alert ? <AlertTriangle size={20} /> : icon}</div></div>
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <div className="relative"><select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 appearance-none rounded-lg border border-slate-200 bg-white py-0 pl-3 pr-8 text-xs font-medium text-slate-600 outline-none focus:border-[#0d8b83]"><option disabled={false}>{options[0]}</option>{options.slice(1).map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" /></div>
}

function ProductModal({ mode, form, error, onChange, onClose, onSubmit }: { mode: 'create' | 'edit'; form: Omit<Product, 'id'>; error: string; onChange: (form: Omit<Product, 'id'>) => void; onClose: () => void; onSubmit: (event: React.FormEvent) => void }) {
  const update = (key: keyof Omit<Product, 'id'>, value: string | number | boolean) => onChange({ ...form, [key]: value })
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123b4a]/35 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-6"><div><p className="text-sm font-medium text-[#0d8b83]">{mode === 'create' ? 'Alta de producto' : 'Modificar producto'}</p><h2 className="mt-1 text-xl font-bold text-[#123b4a]">{mode === 'create' ? 'Nuevo producto' : 'Editar información'}</h2></div><button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X size={19} /></button></div><form onSubmit={onSubmit} className="flex flex-col gap-4 p-6"><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Nombre del producto<input required value={form.name} onChange={(event) => update('name', event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-[#0d8b83]" placeholder="Ej: Paracetamol 500 mg" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Categoría<select value={form.category} onChange={(event) => update('category', event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 outline-none focus:border-[#0d8b83]"><option>Medicamento</option><option>Higiene</option><option>Perfumería</option><option>Suplementos</option><option>Accesorios</option></select></label><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Código único<input required value={form.code} onChange={(event) => update('code', event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 font-mono uppercase outline-none focus:border-[#0d8b83]" placeholder="MED-001" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Stock actual<input type="number" min="0" value={form.stock} onChange={(event) => update('stock', Math.max(0, Number(event.target.value)))} className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-[#0d8b83]" /></label><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Stock mínimo<input type="number" min="0" value={form.minimum} onChange={(event) => update('minimum', Math.max(0, Number(event.target.value)))} className="h-10 rounded-lg border border-slate-200 px-3 outline-none focus:border-[#0d8b83]" /></label></div><label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => update('active', event.target.checked)} className="size-4 accent-[#0d8b83]" /> Producto activo y visible en el catálogo</label>{error && <p className="text-sm text-rose-600">{error}</p>}<div className="mt-2 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancelar</button><button className="rounded-lg bg-[#0d5c63] px-4 py-2 text-sm font-semibold text-white hover:bg-[#094b52]">{mode === 'create' ? 'Crear producto' : 'Guardar cambios'}</button></div></form></div></div>
}
