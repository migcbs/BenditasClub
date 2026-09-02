import React, { useEffect, useState } from 'react';
import { Alert, Chip, CircularProgress, LinearProgress, Typography } from '@mui/material';
import { Banknote, ChefHat, CircleDollarSign, PackageCheck, ReceiptText, ShoppingBasket } from 'lucide-react';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

function Loading() { return <div className="admin-module-loading"><CircularProgress size={28} /><span>Cargando datos operativos…</span></div>; }
function Empty({ children }) { return <div className="admin-empty">{children}</div>; }

function Inventory({ api, token, branch }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    Promise.all([api.inventory(branch === 'all' ? 'xico' : branch, token), api.recipes(token), api.suppliers(token), api.purchases(branch, token)])
      .then(([ingredients, recipes, suppliers, purchases]) => live && setData({ ingredients, recipes, suppliers, purchases }))
      .catch((requestError) => live && setError(requestError.message));
    return () => { live = false; };
  }, [api, token, branch]);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Loading />;
  const low = data.ingredients.filter((item) => item.health !== 'healthy');
  return <section className="admin-module">
    <header><div><Typography component="h1">Inventario y recetas</Typography><Typography>Existencias reales descontadas desde cada pedido.</Typography></div><Chip label={`${low.length} alertas`} color={low.length ? 'warning' : 'success'} /></header>
    <div className="admin-module-stats">
      <article><PackageCheck /><span><b>{data.ingredients.length}</b><small>Ingredientes activos</small></span></article>
      <article><ShoppingBasket /><span><b>{data.recipes.length}</b><small>Productos con receta</small></span></article>
      <article><ReceiptText /><span><b>{data.purchases.filter((item) => item.status !== 'received').length}</b><small>Compras abiertas</small></span></article>
    </div>
    <div className="admin-data-panel">
      <div className="admin-data-heading"><h2>Existencias por ingrediente</h2><span>{branch === 'all' ? 'Xico' : branch}</span></div>
      {!data.ingredients.length ? <Empty>Agrega el primer ingrediente para conectar recetas y pedidos.</Empty> : data.ingredients.map((item) => {
        const ratio = Math.min(100, Math.max(0, Number(item.quantity) / Math.max(Number(item.reorderPoint) * 2, 1) * 100));
        return <div className="admin-stock-row" key={item.id}><div><b>{item.nombre}</b><small>{Number(item.quantity)} {item.unit} · mínimo {Number(item.reorderPoint)} {item.unit}</small></div><div><span className={`stock-${item.health}`}>{item.health === 'healthy' ? 'Saludable' : item.health === 'critical' ? 'Crítico' : 'Bajo'}</span><LinearProgress variant="determinate" value={ratio} color={item.health === 'healthy' ? 'success' : item.health === 'critical' ? 'error' : 'warning'} /></div></div>;
      })}
    </div>
    <div className="admin-two-columns">
      <div className="admin-data-panel"><div className="admin-data-heading"><h2>Recetas configuradas</h2><span>Costo y consumo</span></div>{data.recipes.length ? data.recipes.map((recipe) => <div className="admin-list-row" key={recipe.id}><span><b>{recipe.product.nombre}</b><small>{recipe.items.length} ingredientes · rendimiento {Number(recipe.yield)}</small></span><Chip label="Activa" size="small" /></div>) : <Empty>Aún no hay recetas. Los pedidos no descontarán existencias hasta configurarlas.</Empty>}</div>
      <div className="admin-data-panel"><div className="admin-data-heading"><h2>Compras y proveedores</h2><span>{data.suppliers.length} proveedores</span></div>{data.purchases.length ? data.purchases.slice(0,5).map((purchase) => <div className="admin-list-row" key={purchase.id}><span><b>{purchase.supplier.nombre}</b><small>{purchase.status} · {purchase.items.length} insumos</small></span><b>{money.format(Number(purchase.total))}</b></div>) : <Empty>Sin órdenes de compra. Crea proveedores para preparar el próximo abasto.</Empty>}</div>
    </div>
  </section>;
}

function Operation({ dashboard }) {
  return <section className="admin-module"><header><div><Typography component="h1">Operación</Typography><Typography>Pedidos, tiempos de cocina y desempeño del menú.</Typography></div><Chip label="En vivo" color="primary" /></header><div className="admin-module-stats"><article><ChefHat/><span><b>{dashboard.summary.pendingOrders}</b><small>Pedidos abiertos</small></span></article><article><PackageCheck/><span><b>{dashboard.summary.orders}</b><small>Pedidos del periodo</small></span></article><article><CircleDollarSign/><span><b>{money.format(dashboard.summary.averageTicket)}</b><small>Ticket promedio</small></span></article></div><div className="admin-two-columns"><div className="admin-data-panel"><div className="admin-data-heading"><h2>Pedidos recientes</h2><span>{dashboard.recentOrders.length}</span></div>{dashboard.recentOrders.length ? dashboard.recentOrders.map((order) => <div className="admin-list-row" key={order.id}><span><b>#{order.id.slice(0,6).toUpperCase()} · {order.clienteNombre || order.tipo}</b><small>{order.estadoCocina} · {order.sucursal}</small></span><b>{money.format(order.total)}</b></div>) : <Empty>No hay pedidos en este periodo.</Empty>}</div><div className="admin-data-panel"><div className="admin-data-heading"><h2>Productos líderes</h2><span>Unidades</span></div>{dashboard.topProducts.map((product) => <div className="admin-list-row" key={product.productId || product.name}><span><b>{product.name || product.nombre}</b><small>{money.format(product.sales)} vendidos</small></span><b>{product.quantity}</b></div>)}</div></div></section>;
}

function Finance({ api, token, branch, dashboard }) {
  const [data, setData] = useState(null);
  useEffect(() => { Promise.all([api.cashShifts(branch, token), api.expenses(branch, token)]).then(([shifts, expenses]) => setData({ shifts, expenses })); }, [api, token, branch]);
  if (!data) return <Loading />;
  const expenses = data.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  return <section className="admin-module"><header><div><Typography component="h1">Finanzas y caja</Typography><Typography>Venta, efectivo esperado, gastos y diferencias de cierre.</Typography></div><Chip label={`${data.shifts.filter((item) => item.status === 'open').length} cajas abiertas`} color="secondary" /></header><div className="admin-module-stats"><article><CircleDollarSign/><span><b>{money.format(dashboard.summary.sales)}</b><small>Venta neta</small></span></article><article><Banknote/><span><b>{money.format(dashboard.summary.cashSales)}</b><small>Venta en efectivo</small></span></article><article><ReceiptText/><span><b>{money.format(expenses)}</b><small>Gastos registrados</small></span></article></div><div className="admin-two-columns"><div className="admin-data-panel"><div className="admin-data-heading"><h2>Turnos de caja</h2><span>Últimos 30</span></div>{data.shifts.length ? data.shifts.map((shift) => <div className="admin-list-row" key={shift.id}><span><b>{shift.sucursal} · {shift.status === 'open' ? 'Abierta' : 'Cerrada'}</b><small>Fondo {money.format(Number(shift.openingAmount))}{shift.difference != null ? ` · diferencia ${money.format(Number(shift.difference))}` : ''}</small></span><Chip size="small" color={shift.status === 'open' ? 'success' : 'default'} label={shift.status} /></div>) : <Empty>No hay turnos de caja registrados.</Empty>}</div><div className="admin-data-panel"><div className="admin-data-heading"><h2>Gastos</h2><span>Comprobación</span></div>{data.expenses.length ? data.expenses.map((expense) => <div className="admin-list-row" key={expense.id}><span><b>{expense.concept}</b><small>{expense.category} · {expense.paymentMethod}</small></span><b>{money.format(Number(expense.amount))}</b></div>) : <Empty>Sin gastos en el periodo.</Empty>}</div></div></section>;
}

function Team({ api, token }) {
  const [users, setUsers] = useState(null);
  useEffect(() => { api.users(token).then(setUsers); }, [api, token]);
  if (!users) return <Loading />;
  return <section className="admin-module"><header><div><Typography component="h1">Equipo y permisos</Typography><Typography>Accesos operativos separados para piso y cocina.</Typography></div><Chip label={`${users.filter((user) => user.activo).length} activos`} /></header><div className="admin-data-panel"><div className="admin-data-heading"><h2>Personal</h2><span>PIN individual</span></div>{users.map((user) => <div className="admin-list-row" key={user.id}><span><b>{user.nombre}</b><small>{user.sucursal} · {user.role}</small></span><Chip size="small" color={user.activo ? 'success' : 'default'} label={user.activo ? 'Activo' : 'Inactivo'} /></div>)}</div></section>;
}

export default function AdminWorkspace({ section, api, token, branch, dashboard }) {
  if (section === 'Operación') return <Operation dashboard={dashboard} />;
  if (section === 'Finanzas') return <Finance api={api} token={token} branch={branch} dashboard={dashboard} />;
  if (section === 'Inventario') return <Inventory api={api} token={token} branch={branch} />;
  if (section === 'Equipo') return <Team api={api} token={token} />;
  return null;
}
