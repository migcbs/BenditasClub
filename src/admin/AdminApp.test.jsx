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

test('adds stock to an inventory ingredient', async () => {
  const user = userEvent;
  const storage = memoryStorage();
  storage.setItem('bc_admin_token', 'stored-token');
  const ingredient = { id: 'ing-1', nombre: 'Pollo', unit: 'kg', quantity: 4, reorderPoint: 5, health: 'low' };
  const api = {
    session: jest.fn().mockResolvedValue({ user: { id: 'admin-1', nombre: 'Mauricio', role: 'admin' } }),
    dashboard: jest.fn().mockResolvedValue(dashboard),
    inventory: jest.fn().mockResolvedValueOnce([ingredient]).mockResolvedValueOnce([{ ...ingredient, quantity: 10, health: 'healthy' }]).mockResolvedValueOnce([{ ...ingredient, quantity: 10, health: 'healthy' }, { id: 'ing-2', nombre: 'Queso', unit: 'kg', quantity: 2, reorderPoint: 1, health: 'healthy' }]),
    recipes: jest.fn().mockResolvedValue([]), suppliers: jest.fn().mockResolvedValue([]), purchases: jest.fn().mockResolvedValue([]),
    addStock: jest.fn().mockResolvedValue({}),
    createIngredient: jest.fn().mockResolvedValue({}),
  };
  render(<AdminApp api={api} storage={storage} />);
  await screen.findByText('$18,460');
  await user.click(screen.getByRole('button', { name: /inventario/i }));
  await user.click(await screen.findByRole('button', { name: /agregar stock a pollo/i }));
  await user.type(screen.getByLabelText(/cantidad/i), '6');
  await user.click(screen.getByRole('button', { name: /guardar stock/i }));

  await waitFor(() => expect(api.addStock).toHaveBeenCalledWith({ ingredientId: 'ing-1', sucursal: 'xico', quantity: 6, reason: 'Entrada manual de inventario' }, 'stored-token'));
  expect(await screen.findByText(/10 kg/i)).toBeVisible();
  await waitFor(() => expect(screen.queryByRole('dialog', { name: /agregar stock/i })).not.toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: /agregar producto/i }));
  await user.type(screen.getByLabelText(/^nombre/i), 'Queso');
  await user.type(screen.getByLabelText(/stock inicial/i), '2');
  await user.click(screen.getByRole('button', { name: /guardar producto/i }));
  await waitFor(() => expect(api.createIngredient).toHaveBeenCalled());
  expect(await screen.findByText('Queso')).toBeVisible();
});

test('manages inventory workflows expected in a restaurant back office', async () => {
  const user = userEvent;
  const storage = memoryStorage();
  storage.setItem('bc_admin_token', 'stored-token');
  const ingredients = [
    { id: 'ing-1', nombre: 'Pollo', unit: 'kg', quantity: 4, reorderPoint: 5, health: 'low' },
    { id: 'ing-2', nombre: 'Aceite', unit: 'l', quantity: 18, reorderPoint: 8, health: 'healthy' },
  ];
  const purchase = {
    id: 'po-1',
    status: 'draft',
    total: 980,
    supplier: { nombre: 'Proveedor Uno' },
    items: [
      { id: 'poi-1', ingredientId: 'ing-1', quantityOrdered: 10, quantityReceived: 0, ingredient: { nombre: 'Pollo', unit: 'kg' } },
    ],
  };
  const api = {
    session: jest.fn().mockResolvedValue({ user: { id: 'admin-1', nombre: 'Mauricio', role: 'admin' } }),
    dashboard: jest.fn().mockResolvedValue(dashboard),
    inventory: jest.fn().mockResolvedValue(ingredients),
    recipes: jest.fn().mockResolvedValue([
      { id: 'rec-1', yield: 1, productId: 'prod-1', product: { id: 'prod-1', nombre: '8 Alitas' }, items: [{ ingredientId: 'ing-1', quantity: 0.5, ingredient: ingredients[0] }] },
    ]),
    suppliers: jest.fn().mockResolvedValue([{ id: 'sup-1', nombre: 'Proveedor Uno' }]),
    purchases: jest.fn().mockResolvedValue([purchase]),
    products: jest.fn().mockResolvedValue([{ id: 'prod-1', nombre: '8 Alitas' }, { id: 'prod-2', nombre: 'Boneless 250g' }]),
    saveRecipe: jest.fn().mockResolvedValue({}),
    createPurchase: jest.fn().mockResolvedValue({}),
    receivePurchase: jest.fn().mockResolvedValue({}),
    inventoryMovements: jest.fn().mockResolvedValue([]),
  };

  render(<AdminApp api={api} storage={storage} />);
  await screen.findByText('$18,460');
  await user.click(screen.getByRole('button', { name: /inventario/i }));

  await user.type(await screen.findByLabelText(/buscar insumo/i), 'ace');
  expect(screen.getByText('Aceite')).toBeVisible();
  expect(screen.queryByText('Pollo')).not.toBeInTheDocument();

  await user.clear(screen.getByLabelText(/buscar insumo/i));
  await user.click(screen.getByRole('button', { name: /editar receta de 8 alitas/i }));
  expect(await screen.findByDisplayValue('0.5')).toBeVisible();
  await user.click(screen.getByRole('button', { name: /agregar ingrediente a receta/i }));
  expect(screen.getAllByLabelText(/ingrediente/i)).toHaveLength(2);

  await user.click(screen.getByRole('button', { name: /cancelar/i }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: /configurar receta/i })).not.toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: /nueva compra/i }));
  await user.click(screen.getByRole('button', { name: /agregar insumo a compra/i }));
  expect(screen.getAllByLabelText(/ingrediente/i)).toHaveLength(2);

  await user.click(screen.getByRole('button', { name: /cancelar/i }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: /nueva orden de compra/i })).not.toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: /recibir compra de proveedor uno/i }));
  await waitFor(() => expect(api.receivePurchase).toHaveBeenCalledWith('po-1', { items: [{ id: 'poi-1', quantityReceived: 10 }] }, 'stored-token'));
}, 15000);
