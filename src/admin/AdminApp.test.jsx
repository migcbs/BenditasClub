import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminApp from './AdminApp';

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

const dashboard = {
  filters: { branch: 'all' },
  summary: {
    sales: 18460,
    orders: 64,
    averageTicket: 288,
    cashSales: 10460,
    cardSales: 8000,
    pendingOrders: 2,
    cancelledOrders: 1,
    kitchenDelays: 2,
  },
  byBranch: [],
  topProducts: [],
  hourlySales: [],
  recentOrders: [],
  alerts: [],
};

test('rejects a valid login that does not belong to an admin', async () => {
  const user = userEvent;
  const api = {
    login: jest.fn().mockResolvedValue({
      token: 'client-token',
      user: { id: 'client-1', nombre: 'Cliente', role: 'cliente' },
    }),
  };

  render(<AdminApp api={api} storage={memoryStorage()} />);
  await user.type(screen.getByLabelText(/correo/i), 'cliente@benditas.local');
  await user.type(screen.getByLabelText(/contraseña/i), 'Password123');
  await user.click(screen.getByRole('button', { name: /entrar al panel/i }));

  expect(await screen.findByText(/solo las cuentas administradoras/i)).toBeVisible();
  expect(screen.getByRole('button', { name: /entrar al panel/i })).toBeEnabled();
});

test('renders live dashboard metrics after an admin signs in', async () => {
  const user = userEvent;
  const storage = memoryStorage();
  const api = {
    login: jest.fn().mockResolvedValue({
      token: 'admin-token',
      user: { id: 'admin-1', nombre: 'Mauricio', role: 'admin' },
    }),
    dashboard: jest.fn().mockResolvedValue(dashboard),
  };

  render(<AdminApp api={api} storage={storage} />);
  await user.type(screen.getByLabelText(/correo/i), 'admin@benditas.local');
  await user.type(screen.getByLabelText(/contraseña/i), 'Password123');
  await user.click(screen.getByRole('button', { name: /entrar al panel/i }));

  expect(await screen.findByText('$18,460')).toBeVisible();
  expect(screen.getByText(/64 pedidos/i)).toBeVisible();
  expect(screen.getByText(/buenas/i)).toBeVisible();
  expect(storage.getItem('bc_admin_token')).toBe('admin-token');
});

test('restores a stored admin session before loading the dashboard', async () => {
  const storage = memoryStorage();
  storage.setItem('bc_admin_token', 'stored-token');
  const api = {
    session: jest.fn().mockResolvedValue({ user: { id: 'admin-1', nombre: 'Mauricio', role: 'admin' } }),
    dashboard: jest.fn().mockResolvedValue(dashboard),
  };

  render(<AdminApp api={api} storage={storage} />);

  expect(await screen.findByText('$18,460')).toBeVisible();
  await waitFor(() => expect(api.session).toHaveBeenCalledWith('stored-token'));
});

test('opens the ingredient inventory from the mobile navigation', async () => {
  const user = userEvent;
  const storage = memoryStorage();
  storage.setItem('bc_admin_token', 'stored-token');
  const api = {
    session: jest.fn().mockResolvedValue({ user: { id: 'admin-1', nombre: 'Mauricio', role: 'admin' } }),
    dashboard: jest.fn().mockResolvedValue(dashboard),
    inventory: jest.fn().mockResolvedValue([{ id: 'ing-1', nombre: 'Pollo', unit: 'kg', quantity: 4, reorderPoint: 5, health: 'low' }]),
    recipes: jest.fn().mockResolvedValue([]),
    suppliers: jest.fn().mockResolvedValue([]),
    purchases: jest.fn().mockResolvedValue([]),
  };

  render(<AdminApp api={api} storage={storage} />);
  await screen.findByText('$18,460');
  await user.click(screen.getByRole('button', { name: /inventario/i }));

  expect(await screen.findByText('Pollo')).toBeVisible();
  expect(screen.getByText(/4 kg/i)).toBeVisible();
  expect(api.inventory).toHaveBeenCalledWith('xico', 'stored-token');
});
