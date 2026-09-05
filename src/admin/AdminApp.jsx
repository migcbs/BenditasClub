import React, { useEffect, useState } from 'react';
import { CircularProgress, ThemeProvider } from '@mui/material';
import { adminTheme } from './adminTheme';
import { adminApi as defaultApi } from './adminApi';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import './admin.css';

const TOKEN_KEY = 'bc_admin_token';
const demoDashboard = {
  summary: { sales: 18460, orders: 64, averageTicket: 288, cashSales: 10460, cardSales: 8000, pendingOrders: 2, cancelledOrders: 1, kitchenDelays: 2 },
  recentOrders: [
    { id: 'bdt001', clienteNombre: 'Mesa 4', tipo: 'mesa', mesa: '4', estadoCocina: 'en_preparacion', estado: 'pendiente', sucursal: 'xico', total: 599, createdAt: new Date().toISOString(), empleado: { nombre: 'Ana' }, metodoPago: null, notas: '', items: [{ id: 'it1', cantidad: 2, nombre: '8 Alitas', sabores: ['BBQ', 'Mango habanero'], subtotal: 400 }, { id: 'it2', cantidad: 1, nombre: 'Papas', sabores: [], subtotal: 199 }] },
    { id: 'bdt002', clienteNombre: 'Mariana', clienteTelefono: '2281234567', tipo: 'para_llevar', estadoCocina: 'lista', estado: 'pagado', sucursal: 'xico', total: 279, createdAt: new Date().toISOString(), empleado: { nombre: 'Ana' }, metodoPago: 'efectivo', notas: 'Sin cebolla', items: [{ id: 'it3', cantidad: 1, nombre: 'Boneless 250g', sabores: ['Buffalo'], subtotal: 279 }] },
  ],
  topProducts: [{ productId: 'p1', name: '8 Alitas', quantity: 21, sales: 2079 }, { productId: 'p2', name: 'Boneless 250g', quantity: 16, sales: 2224 }],
  alerts: [{ type: 'stock' }, { type: 'stock' }, { type: 'stock' }],
  byBranch: [{ branch: 'xico', sales: 11200, orders: 38 }, { branch: 'coatepec', sales: 7260, orders: 26 }],
  hourlySales: Array.from({ length: 24 }, (_, hour) => ({ hour, sales: hour >= 12 && hour <= 21 ? Math.round(600 + Math.sin((hour - 12) / 3) * 500 + Math.random() * 300) : 0, orders: 0 })),
};
let demoInventory = [
    { id: 'i1', nombre: 'Alita de pollo', unit: 'kg', quantity: 8.4, reorderPoint: 12, health: 'low' },
    { id: 'i2', nombre: 'Salsa mango habanero', unit: 'l', quantity: .8, reorderPoint: 4, health: 'critical' },
    { id: 'i3', nombre: 'Papa francesa', unit: 'kg', quantity: 28, reorderPoint: 15, health: 'healthy' },
    { id: 'i4', nombre: 'Aceite vegetal', unit: 'l', quantity: 17, reorderPoint: 10, health: 'healthy' },
];
const stockHealth = (quantity, minimum) => quantity <= minimum * .25 ? 'critical' : quantity <= minimum ? 'low' : 'healthy';
let demoMovements = [];
let demoSuppliers = [{ id: 's1', nombre: 'Distribuidora Avícola Veracruz' }];
let demoPurchases = [];
let demoRecipes = [{ id: 'r1', productId: 'p1', yield: 1, product: { id: 'p1', nombre: '8 Alitas' }, items: [{}, {}, {}, {}] }, { id: 'r2', productId: 'p2', yield: 1, product: { id: 'p2', nombre: 'Boneless 250g' }, items: [{}, {}, {}] }];
let demoRewards = [{ id: 'lr1', label: '20% de descuento', type: 'discount_percent', value: 20, stampsRequired: 6, activo: true }];
let demoRedemptions = [{ id: 'red1', code: 'AB12-CD34', redeemed: false, reward: { type: 'discount_percent', value: 20 }, customer: { nombre: 'Mariana' } }];
let demoPointsRedemptions = [];
let demoBirthdayRewards = [{ id: 'br1', label: '10% de descuento', type: 'discount_percent', value: 10, activo: true }];
let demoBirthdayRedemptions = [];
let demoProducts = [
  { id: 'p1', nombre: '8 Alitas', tipo: 'comida', precio: 99, costoPuntos: null },
  { id: 'p2', nombre: 'Boneless 250g', tipo: 'comida', precio: 139, costoPuntos: 80 },
];
let demoCategories = [{ id: 'cat-merch-1', nombre: 'Playeras', orden: 100 }];
let demoMerchProducts = [{ id: 'merch-1', nombre: 'Playera Monalisa', category: { nombre: 'Playeras' }, variants: [{ id: 'var-1', nombre: 'Única', precio: 249, activo: true, stocks: [{ sucursal: 'xico', quantity: 5 }, { sucursal: 'coatepec', quantity: 3 }] }] }];
let demoMerchOrders = [];
let demoBranchSettings = [{ sucursal: 'xico', clabe: '', banco: '', titular: '', envioMinimo: 35 }, { sucursal: 'coatepec', clabe: '', banco: '', titular: '', envioMinimo: 35 }];
let demoDeliveryZones = [{ id: 'dz1', sucursal: 'xico', distanciaMaxKm: 3, costoEnvio: 35, etiqueta: 'Centro', activo: true }, { id: 'dz2', sucursal: 'xico', distanciaMaxKm: 7, costoEnvio: 55, etiqueta: 'Zona media', activo: true }];
let demoCoupons = [{ id: 'cp1', codigo: 'BENDITASCLUB', tipo: 'discount_percent', valor: 15, descripcion: 'Lanzamiento', activo: true, usosMaximos: null, usosActuales: 4 }];
let demoResetRequests = [{ id: 'pr1', email: 'cliente@ejemplo.com', nombre: 'Cliente Demo', telefono: '2281234567', customerId: 'demo-customer', estado: 'pendiente', createdAt: new Date().toISOString() }];
let demoCashShifts = [{ id: 'c1', sucursal: 'xico', status: 'open', openingAmount: 1500, countedAmount: null, expectedAmount: null, difference: null, openedAt: new Date().toISOString(), closedAt: null, notes: null, movements: [{ id: 'm1', type: 'pay_in', amount: 300, concept: 'Depósito de cambio', createdAt: new Date().toISOString() }, { id: 'm2', type: 'pay_out', amount: 150, concept: 'Compra de hielo', createdAt: new Date().toISOString() }] }];
const demoApi = {
  inventory: async () => demoInventory,
  addStock: async ({ ingredientId, quantity, reason }) => { const ingredient = demoInventory.find((item) => item.id === ingredientId); demoInventory = demoInventory.map((item) => item.id === ingredientId ? { ...item, quantity: item.quantity + quantity, health: stockHealth(item.quantity + quantity, item.reorderPoint) } : item); demoMovements.unshift({ id:`m-${Date.now()}`, quantity, reason, createdAt:new Date().toISOString(), ingredient:{nombre:ingredient.nombre,unit:ingredient.unit} }); },
  createIngredient: async (payload) => { const quantity = Number(Object.values(payload.initialStock || {})[0] || 0); demoInventory = [...demoInventory, { id: `demo-${Date.now()}`, ...payload, quantity, health: stockHealth(quantity, payload.reorderPoint) }]; },
  updateIngredient: async (id,payload) => { demoInventory=demoInventory.map((item)=>item.id===id?{...item,...payload,health:stockHealth(item.quantity,payload.reorderPoint)}:item); },
  inventoryMovements: async () => demoMovements,
  products: async () => demoProducts,
  updateProduct: async (id, payload) => { demoProducts = demoProducts.map((p) => p.id === id ? { ...p, ...payload } : p); return demoProducts.find((p) => p.id === id); },
  saveRecipe: async (productId,payload) => { const product=(await demoApi.products()).find((item)=>item.id===productId); const record={id:`r-${Date.now()}`,productId,yield:payload.yield,product,items:payload.items}; demoRecipes=demoRecipes.some((item)=>item.productId===productId)?demoRecipes.map((item)=>item.productId===productId?{...item,...record,id:item.id}:item):[...demoRecipes,record]; },
  recipes: async () => demoRecipes,
  suppliers: async () => demoSuppliers,
  createSupplier: async (payload) => { demoSuppliers=[...demoSuppliers,{id:`s-${Date.now()}`,...payload}]; },
  purchases: async () => demoPurchases,
  createPurchase: async (payload) => { const supplier=demoSuppliers.find((item)=>item.id===payload.supplierId); demoPurchases=[{id:`po-${Date.now()}`,status:'draft',supplier,items:payload.items,total:payload.items.reduce((sum,item)=>sum+item.quantityOrdered*item.unitCost,0)},...demoPurchases]; },
  receivePurchase: async (id,payload) => { demoPurchases=demoPurchases.map((purchase)=>purchase.id===id?{...purchase,status:'received',receivedAt:new Date().toISOString(),items:purchase.items.map((item)=>({ ...item, quantityReceived:(payload.items.find((entry)=>entry.id===item.id)?.quantityReceived || item.quantityOrdered) }))}:purchase); },
  cashShifts: async (sucursal) => sucursal && sucursal !== 'all' ? demoCashShifts.filter((s) => s.sucursal === sucursal) : demoCashShifts,
  openCashShift: async ({ sucursal, openingAmount }) => {
    const shift = { id: `c-${Date.now()}`, sucursal, status: 'open', openingAmount: Number(openingAmount), countedAmount: null, expectedAmount: null, difference: null, openedAt: new Date().toISOString(), closedAt: null, notes: null, movements: [] };
    demoCashShifts = [shift, ...demoCashShifts];
    return shift;
  },
  closeCashShift: async (id, { countedAmount, notes }) => {
    demoCashShifts = demoCashShifts.map((s) => s.id === id ? { ...s, status: 'closed', expectedAmount: Number(s.openingAmount), countedAmount, difference: countedAmount - Number(s.openingAmount), notes: notes || null, closedAt: new Date().toISOString() } : s);
    return demoCashShifts.find((s) => s.id === id);
  },
  expenses: async () => [{ id: 'e1', concept: 'Gas', category: 'Servicios', paymentMethod: 'efectivo', amount: 620, sucursal: 'xico', occurredAt: new Date().toISOString(), receiptRef: null }],
  users: async () => [{ id: 'u1', nombre: 'Ana', role: 'empleado', sucursal: 'xico', activo: true }, { id: 'u2', nombre: 'Luis', role: 'cocina', sucursal: 'xico', activo: true }],
  createUser: async () => {},
  updateUser: async () => {},
  updateSupplier: async () => {},
  pendingDeletions: async () => [],
  resolveDeletion: async () => {},
  deleteOrder: async () => {},
  loyaltyRewards: async () => demoRewards,
  loyaltyRedemptions: async () => demoRedemptions,
  createLoyaltyReward: async (payload) => { demoRewards = [...demoRewards.map((r) => ({ ...r, activo: false })), { id: `lr-${Date.now()}`, ...payload, activo: true }]; },
  updateLoyaltyReward: async (id, payload) => { demoRewards = demoRewards.map((r) => (payload.activo ? { ...r, activo: r.id === id } : r.id === id ? { ...r, ...payload } : r)); },
  pointsRedemptions: async () => demoPointsRedemptions,
  birthdayRewards: async () => demoBirthdayRewards,
  birthdayRedemptions: async () => demoBirthdayRedemptions,
  createBirthdayReward: async (payload) => {
    demoBirthdayRewards = [...demoBirthdayRewards.map((r) => ({ ...r, activo: false })), { id: `br-${Date.now()}`, ...payload, activo: true }];
  },
  updateBirthdayReward: async (id, payload) => {
    demoBirthdayRewards = demoBirthdayRewards.map((r) => (payload.activo ? { ...r, activo: r.id === id } : r.id === id ? { ...r, ...payload } : r));
  },
  categories: async () => demoCategories,
  createCategory: async (payload) => { const category = { id: `cat-${Date.now()}`, ...payload }; demoCategories = [...demoCategories, category]; return category; },
  merchProducts: async () => demoMerchProducts,
  merchOrders: async () => demoMerchOrders,
  createProduct: async (payload) => {
    const category = demoCategories.find((c) => c.id === payload.categoryId);
    const product = { id: `merch-${Date.now()}`, nombre: payload.nombre, category, variants: [] };
    demoMerchProducts = [...demoMerchProducts, product];
    return product;
  },
  createVariant: async (productId, payload) => {
    const variant = { id: `var-${Date.now()}`, ...payload, activo: true, stocks: [{ sucursal: 'xico', quantity: 0 }, { sucursal: 'coatepec', quantity: 0 }] };
    demoMerchProducts = demoMerchProducts.map((p) => p.id === productId ? { ...p, variants: [...p.variants, variant] } : p);
    return variant;
  },
  updateVariant: async (id, payload) => {
    demoMerchProducts = demoMerchProducts.map((p) => ({ ...p, variants: p.variants.map((v) => v.id === id ? { ...v, ...payload } : v) }));
  },
  updateVariantStock: async (id, { sucursal, quantity }) => {
    demoMerchProducts = demoMerchProducts.map((p) => ({
      ...p,
      variants: p.variants.map((v) => v.id === id
        ? { ...v, stocks: v.stocks.some((s) => s.sucursal === sucursal) ? v.stocks.map((s) => s.sucursal === sucursal ? { ...s, quantity } : s) : [...v.stocks, { sucursal, quantity }] }
        : v),
    }));
  },
  branchSettings: async () => demoBranchSettings,
  updateBranchSettings: async (sucursal, payload) => {
    demoBranchSettings = demoBranchSettings.map((r) => r.sucursal === sucursal ? { ...r, ...payload, envioMinimo: payload.envioMinimo !== undefined ? Number(payload.envioMinimo) : r.envioMinimo } : r);
    return demoBranchSettings.find((r) => r.sucursal === sucursal);
  },
  deliveryZones: async () => demoDeliveryZones,
  createDeliveryZone: async (payload) => {
    const zona = { id: `dz-${Date.now()}`, activo: true, ...payload };
    demoDeliveryZones = [...demoDeliveryZones, zona];
    return zona;
  },
  deleteDeliveryZone: async (id) => { demoDeliveryZones = demoDeliveryZones.filter((z) => z.id !== id); },
  coupons: async () => demoCoupons,
  createCoupon: async (payload) => {
    const cupon = { id: `cp-${Date.now()}`, activo: true, usosActuales: 0, usosMaximos: payload.usosMaximos ? Number(payload.usosMaximos) : null, ...payload, codigo: payload.codigo.toUpperCase(), valor: Number(payload.valor) };
    demoCoupons = [...demoCoupons, cupon];
    return cupon;
  },
  updateCoupon: async (id, payload) => { demoCoupons = demoCoupons.map((c) => c.id === id ? { ...c, ...payload } : c); return demoCoupons.find((c) => c.id === id); },
  deleteCoupon: async (id) => { demoCoupons = demoCoupons.filter((c) => c.id !== id); },
  customers: async () => [{ id: 'cu1', nombre: 'Mariana López', email: 'mariana@ejemplo.com', telefono: '2281234567', fechaNacimiento: null, activo: true, createdAt: new Date().toISOString(), totalPedidos: 3, totalDirecciones: 1 }],
  customerDetail: async (id) => ({
    id, nombre: 'Mariana López', email: 'mariana@ejemplo.com', telefono: '2281234567', fechaNacimiento: null, activo: true, createdAt: new Date().toISOString(),
    addresses: [{ id: 'a1', etiqueta: 'Casa', direccion: 'Av. Hidalgo #212, Centro, CP 91240', esPrincipal: true }],
    loyaltyCard: { puntos: 42 },
    customerOrders: [{ id: 'ord1', total: 279, estado: 'pagado', sucursal: 'xico', tipo: 'domicilio', createdAt: new Date().toISOString() }],
    totalPedidosPagados: 3, totalGastado: 837,
  }),
  passwordResetRequests: async () => demoResetRequests,
  resolvePasswordReset: async (id) => {
    demoResetRequests = demoResetRequests.map((r) => r.id === id ? { ...r, estado: 'atendida' } : r);
  },
};

export default function AdminApp({ api = defaultApi, storage = window.localStorage }) {
  const [token, setToken] = useState(() => storage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [branch, setBranch] = useState('all');
  const [restoring, setRestoring] = useState(Boolean(token));
  const [viewApi, setViewApi] = useState(api);
  const [branchError, setBranchError] = useState('');

  const loadDashboard = async (activeToken, activeBranch = branch) => {
    const next = await api.dashboard({ branch: activeBranch }, activeToken);
    setDashboard(next);
  };

  useEffect(() => {
    if (!token || user) return;
    let live = true;
    api.session(token).then(async (result) => {
      if (result.user.role !== 'admin') throw new Error('Solo las cuentas administradoras pueden entrar.');
      if (!live) return;
      setUser(result.user);
      await loadDashboard(token, branch);
    }).catch(() => { storage.removeItem(TOKEN_KEY); setToken(null); }).finally(() => live && setRestoring(false));
    return () => { live = false; };
    // `user` se actualiza DENTRO de este efecto (setUser) — si estuviera en las
    // dependencias, el cambio de `user` re-dispara el efecto, lo que ejecuta el
    // cleanup (live = false) de la ejecución anterior ANTES de que su propio
    // .finally() corra, dejando `restoring` atascado en true para siempre en
    // cada recarga con sesión guardada. Solo `token` debe re-disparar esto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // El dashboard no se refrescaba solo — un pedido nuevo o un cambio de
  // estado no aparecía hasta cambiar de sucursal o recargar la página a
  // mano. Efecto aparte (no se mete con el de arriba, que ya tiene un
  // timing delicado) para no romper la restauración de sesión.
  useEffect(() => {
    if (!token || !user) return undefined;
    const interval = setInterval(() => { loadDashboard(token, branch).catch(() => {}); }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, branch]);

  const login = async (email, password) => {
    const result = await api.login(email, password);
    if (result.user.role !== 'admin') throw new Error('Solo las cuentas administradoras pueden entrar.');
    storage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    await loadDashboard(result.token, branch);
  };

  const changeBranch = async (nextBranch) => {
    setBranch(nextBranch);
    if (token === 'demo-local') return;
    setBranchError('');
    try {
      await loadDashboard(token, nextBranch);
    } catch (requestError) {
      setBranchError(requestError.message);
    }
  };

  const openDemo = () => {
    setToken('demo-local');
    setViewApi(demoApi);
    setUser({ id: 'demo-admin', nombre: 'Mauricio', role: 'admin' });
    setDashboard(demoDashboard);
  };

  const logout = () => {
    storage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setDashboard(null);
    setViewApi(api);
  };

  return (
    <ThemeProvider theme={adminTheme}>
      {restoring ? <div className="admin-loading"><CircularProgress /><span>Recuperando tu turno…</span></div>
        : !user ? <AdminLogin onLogin={login} onDemo={openDemo} />
          : dashboard ? <AdminDashboard user={user} data={dashboard} branch={branch} onBranchChange={changeBranch} api={viewApi} token={token} error={branchError} onLogout={logout} />
            : <div className="admin-loading"><CircularProgress /><span>Preparando el panel…</span></div>}
    </ThemeProvider>
  );
}
