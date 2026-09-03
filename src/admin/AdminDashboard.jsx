import React, { useState } from 'react';
import { Avatar, ButtonBase, Card, Chip, Typography } from '@mui/material';
import { AlertTriangle, ArrowUpRight, Banknote, ChefHat, ChevronRight, Flame, Gauge, House, PackageSearch, ReceiptText, Sparkles, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminWorkspace from './AdminWorkspace';

const brand = '/assets/plates/brand-lockup.png';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const nav = [
  ['Inicio', House], ['Operación', Gauge], ['Finanzas', ReceiptText], ['Inventario', PackageSearch], ['Fidelidad', Sparkles], ['Equipo', UsersRound],
];

function AlertRow({ icon: Icon, tone, title, detail, action, onClick }) {
  return (
    <ButtonBase className={`admin-alert admin-alert--${tone}`} onClick={onClick} aria-label={`${title} — ${action}`}>
      <span className="admin-alert-icon"><Icon size={20} /></span>
      <span><b>{title}</b><small>{detail}</small></span>
      <span className="admin-alert-action">{action}<ChevronRight size={18} /></span>
    </ButtonBase>
  );
}

export default function AdminDashboard({ user, data, branch, onBranchChange, api, token }) {
  const [section, setSection] = useState('Inicio');
  const summary = data.summary;
  const stockAlerts = data.alerts?.filter((alert) => alert.type === 'stock').length || 0;
  const sucursalLabel = branch === 'all' ? 'ambas sucursales' : branch === 'xico' ? 'Xico' : 'Coatepec';

  return (
    <main className="admin-app-shell">
      <header className="admin-masthead">
        <img src={brand} alt="Benditas Club" />
        <label className="admin-branch-picker">
          <span>Sucursal</span>
          <select value={branch} onChange={(event) => onBranchChange(event.target.value)}>
            <option value="all">Todas</option><option value="xico">Xico</option><option value="coatepec">Coatepec</option>
          </select>
        </label>
        <Avatar aria-label={`Cuenta de ${user.nombre}`}>{user.nombre?.[0] || 'A'}</Avatar>
      </header>

      <div className={`admin-content ${section !== 'Inicio' ? 'admin-content--module' : ''}`}>
        {section !== 'Inicio' ? <AdminWorkspace section={section} api={api} token={token} branch={branch} dashboard={data} /> : <>
        <section className="admin-welcome">
          <Typography component="h1">Buenas, {user.nombre?.split(' ')[0]}</Typography>
          <Typography>Esto necesita tu atención hoy.</Typography>
        </section>

        <motion.section className="admin-shift-card" initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: [0.16, 1, 0.3, 1] }}>
          <div className="admin-shift-heading">
            <div><Typography component="h2">Pulso del turno</Typography><Typography>Hoy · actualización en vivo</Typography></div>
            <Flame className="admin-flame" aria-hidden="true" />
          </div>
          <div className="admin-sales">
            <strong>{money.format(summary.sales)}</strong>
            <Chip icon={<ArrowUpRight size={15} />} label={`${sucursalLabel}, hoy`} color="primary" size="small" />
          </div>
          <div className="admin-metrics">
            <span><b>{money.format(summary.averageTicket)}</b><small>Ticket promedio</small></span>
            <span><b>{summary.orders} pedidos</b><small>{summary.pendingOrders} siguen abiertos</small></span>
          </div>
          {stockAlerts > 0 && (
            <ButtonBase className="admin-stock-warning" onClick={() => setSection('Inventario')} aria-label="Ver inventario">
              <AlertTriangle size={21} /><span><b>{stockAlerts} insumo{stockAlerts !== 1 ? 's' : ''} con stock bajo</b><small>Revisa inventario antes de que frene una venta</small></span><ChevronRight />
            </ButtonBase>
          )}
        </motion.section>

        <section className="admin-pulse">
            <div className="admin-section-title"><Typography component="h2">Ahora en el restaurante</Typography><span>En vivo</span></div>
            {summary.kitchenDelays === 0 && stockAlerts === 0 && summary.cashSales === 0 ? (
              <Typography color="text.secondary">Todo tranquilo por ahora — sin comandas retrasadas, insumos bajos ni venta registrada aún.</Typography>
            ) : (
            <div className="admin-alert-board">
              {summary.kitchenDelays > 0 && (
                <AlertRow
                  icon={ChefHat}
                  tone="amber"
                  title={`${summary.kitchenDelays} comanda${summary.kitchenDelays !== 1 ? 's' : ''} lleva${summary.kitchenDelays !== 1 ? 'n' : ''} más de 15 min`}
                  detail="Cocina"
                  action="Ver operación"
                  onClick={() => setSection('Operación')}
                />
              )}
              {stockAlerts > 0 && (
                <AlertRow
                  icon={PackageSearch}
                  tone="pink"
                  title={`${stockAlerts} insumo${stockAlerts !== 1 ? 's' : ''} están por agotarse`}
                  detail="Inventario"
                  action="Revisar"
                  onClick={() => setSection('Inventario')}
                />
              )}
              {summary.cashSales > 0 && (
                <AlertRow
                  icon={Banknote}
                  tone="neutral"
                  title={`Venta en efectivo hoy: ${money.format(summary.cashSales)}`}
                  detail={sucursalLabel}
                  action="Ver caja"
                  onClick={() => setSection('Finanzas')}
                />
              )}
            </div>
            )}
        </section>

        <section className="admin-summary-grid">
          <Card className="admin-summary-card"><Banknote /><span><small>Venta en efectivo</small><b>{money.format(summary.cashSales)}</b><em>Hoy</em></span></Card>
          <Card className="admin-summary-card"><ChefHat /><span><small>Operación</small><b>{summary.orders - summary.pendingOrders} completados</b><em>{summary.kitchenDelays} con demora</em></span></Card>
        </section>
        </>}
      </div>

      <nav className="admin-bottom-nav" aria-label="Navegación administrativa">
        {nav.map(([label, Icon]) => <ButtonBase aria-label={label} onClick={() => setSection(label)} key={label} className={section === label ? 'is-active' : ''}><Icon size={21} /><span>{label}</span></ButtonBase>)}
      </nav>
    </main>
  );
}
