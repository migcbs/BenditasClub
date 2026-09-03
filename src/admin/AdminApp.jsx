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
    { id: 'bdt001', clienteNombre: 'Mesa 4', tipo: 'mesa', estadoCocina: 'en_preparacion', sucursal: 'xico', total: 599 },
    { id: 'bdt002', clienteNombre: 'Mariana', tipo: 'para_llevar', estadoCocina: 'lista', sucursal: 'xico', total: 279 },
  ],
  topProducts: [{ productId: 'p1', name: '8 Alitas', quantity: 21, sales: 2079 }, { productId: 'p2', name: 'Boneless 250g', quantity: 16, sales: 2224 }],
  alerts: [{ type: 'stock' }, { type: 'stock' }, { type: 'stock' }],
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
const demoApi = {
  inventory: async () => demoInventory,
  addStock: async ({ ingredientId, quantity, reason }) => { const ingredient = demoInventory.find((item) => item.id === ingredientId); demoInventory = demoInventory.map((item) => item.id === ingredientId ? { ...item, quantity: item.quantity + quantity, health: stockHealth(item.quantity + quantity, item.reorderPoint) } : item); demoMovements.unshift({ id:`m-${Date.now()}`, quantity, reason, createdAt:new Date().toISOString(), ingredient:{nombre:ingredient.nombre,unit:ingredient.unit} }); },
  createIngredient: async (payload) => { const quantity = Number(Object.values(payload.initialStock || {})[0] || 0); demoInventory = [...demoInventory, { id: `demo-${Date.now()}`, ...payload, quantity, health: stockHealth(quantity, payload.reorderPoint) }]; },
  updateIngredient: async (id,payload) => { demoInventory=demoInventory.map((item)=>item.id===id?{...item,...payload,health:stockHealth(item.quantity,payload.reorderPoint)}:item); },
  inventoryMovements: async () => demoMovements,
  products: async () => [{id:'p1',nombre:'8 Alitas'},{id:'p2',nombre:'Boneless 250g'}],
  saveRecipe: async (productId,payload) => { const product=(await demoApi.products()).find((item)=>item.id===productId); const record={id:`r-${Date.now()}`,productId,yield:payload.yield,product,items:payload.items}; demoRecipes=demoRecipes.some((item)=>item.productId===productId)?demoRecipes.map((item)=>item.productId===productId?{...item,...record,id:item.id}:item):[...demoRecipes,record]; },
  recipes: async () => demoRecipes,
  suppliers: async () => demoSuppliers,
  createSupplier: async (payload) => { demoSuppliers=[...demoSuppliers,{id:`s-${Date.now()}`,...payload}]; },
  purchases: async () => demoPurchases,
  createPurchase: async (payload) => { const supplier=demoSuppliers.find((item)=>item.id===payload.supplierId); demoPurchases=[{id:`po-${Date.now()}`,status:'draft',supplier,items:payload.items,total:payload.items.reduce((sum,item)=>sum+item.quantityOrdered*item.unitCost,0)},...demoPurchases]; },
  receivePurchase: async (id,payload) => { demoPurchases=demoPurchases.map((purchase)=>purchase.id===id?{...purchase,status:'received',receivedAt:new Date().toISOString(),items:purchase.items.map((item)=>({ ...item, quantityReceived:(payload.items.find((entry)=>entry.id===item.id)?.quantityReceived || item.quantityOrdered) }))}:purchase); },
  cashShifts: async () => [{ id: 'c1', sucursal: 'xico', status: 'open', openingAmount: 1500, difference: null, movements: [] }],
  expenses: async () => [{ id: 'e1', concept: 'Gas', category: 'Servicios', paymentMethod: 'efectivo', amount: 620 }],
  users: async () => [{ id: 'u1', nombre: 'Ana', role: 'empleado', sucursal: 'xico', activo: true }, { id: 'u2', nombre: 'Luis', role: 'cocina', sucursal: 'xico', activo: true }],
  loyaltyRewards: async () => demoRewards,
  loyaltyRedemptions: async () => demoRedemptions,
  createLoyaltyReward: async (payload) => { demoRewards = [...demoRewards.map((r) => ({ ...r, activo: false })), { id: `lr-${Date.now()}`, ...payload, activo: true }]; },
  updateLoyaltyReward: async (id, payload) => { demoRewards = demoRewards.map((r) => (payload.activo ? { ...r, activo: r.id === id } : r.id === id ? { ...r, ...payload } : r)); },
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

  return (
    <ThemeProvider theme={adminTheme}>
      {restoring ? <div className="admin-loading"><CircularProgress /><span>Recuperando tu turno…</span></div>
        : !user ? <AdminLogin onLogin={login} onDemo={openDemo} />
          : dashboard ? <AdminDashboard user={user} data={dashboard} branch={branch} onBranchChange={changeBranch} api={viewApi} token={token} error={branchError} />
            : <div className="admin-loading"><CircularProgress /><span>Preparando el panel…</span></div>}
    </ThemeProvider>
  );
}
