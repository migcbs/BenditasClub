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
const demoApi = {
  inventory: async () => [
    { id: 'i1', nombre: 'Alita de pollo', unit: 'kg', quantity: 8.4, reorderPoint: 12, health: 'low' },
    { id: 'i2', nombre: 'Salsa mango habanero', unit: 'l', quantity: .8, reorderPoint: 4, health: 'critical' },
    { id: 'i3', nombre: 'Papa francesa', unit: 'kg', quantity: 28, reorderPoint: 15, health: 'healthy' },
    { id: 'i4', nombre: 'Aceite vegetal', unit: 'l', quantity: 17, reorderPoint: 10, health: 'healthy' },
  ],
  recipes: async () => [{ id: 'r1', yield: 1, product: { nombre: '8 Alitas' }, items: [{}, {}, {}, {}] }, { id: 'r2', yield: 1, product: { nombre: 'Boneless 250g' }, items: [{}, {}, {}] }],
  suppliers: async () => [{ id: 's1', nombre: 'Distribuidora Avícola Veracruz' }],
  purchases: async () => [],
  cashShifts: async () => [{ id: 'c1', sucursal: 'xico', status: 'open', openingAmount: 1500, difference: null, movements: [] }],
  expenses: async () => [{ id: 'e1', concept: 'Gas', category: 'Servicios', paymentMethod: 'efectivo', amount: 620 }],
  users: async () => [{ id: 'u1', nombre: 'Ana', role: 'empleado', sucursal: 'xico', activo: true }, { id: 'u2', nombre: 'Luis', role: 'cocina', sucursal: 'xico', activo: true }],
};

export default function AdminApp({ api = defaultApi, storage = window.localStorage }) {
  const [token, setToken] = useState(() => storage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [branch, setBranch] = useState('all');
  const [restoring, setRestoring] = useState(Boolean(token));
  const [viewApi, setViewApi] = useState(api);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

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
    await loadDashboard(token, nextBranch);
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
          : dashboard ? <AdminDashboard user={user} data={dashboard} branch={branch} onBranchChange={changeBranch} api={viewApi} token={token} />
            : <div className="admin-loading"><CircularProgress /><span>Preparando el panel…</span></div>}
    </ThemeProvider>
  );
}
