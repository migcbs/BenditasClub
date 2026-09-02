import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerAuth, { CUSTOMER_TOKEN_KEY } from './CustomerAuth';
import CustomerProfile from './CustomerProfile';

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

test('logs in a customer and keeps the session token', async () => {
  const storage = memoryStorage();
  const api = {
    login: jest.fn().mockResolvedValue({ token: 'customer-token', user: { id: 'u1', role: 'cliente', nombre: 'Ana' } }),
  };

  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<CustomerAuth api={api} storage={storage} />} />
        <Route path="/perfil" element={<p>Perfil listo</p>} />
      </Routes>
    </MemoryRouter>
  );

  await userEvent.type(screen.getByLabelText(/correo/i), 'ana@benditas.local');
  await userEvent.type(screen.getByLabelText(/contraseña/i), 'Password123');
  await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

  expect(await screen.findByText(/perfil listo/i)).toBeVisible();
  expect(storage.getItem(CUSTOMER_TOKEN_KEY)).toBe('customer-token');
});

test('registers a new customer account online', async () => {
  const storage = memoryStorage();
  const api = {
    register: jest.fn().mockResolvedValue({ token: 'new-token', user: { id: 'u1', role: 'cliente', nombre: 'Ana' } }),
  };

  render(
    <MemoryRouter initialEntries={['/registro']}>
      <Routes>
        <Route path="/registro" element={<CustomerAuth mode="register" api={api} storage={storage} />} />
        <Route path="/perfil" element={<p>Perfil listo</p>} />
      </Routes>
    </MemoryRouter>
  );

  await userEvent.type(screen.getByLabelText(/nombre/i), 'Ana Cliente');
  await userEvent.type(screen.getByLabelText(/correo/i), 'ana@benditas.local');
  await userEvent.type(screen.getByLabelText(/contraseña/i), 'Password123');
  await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

  await waitFor(() => expect(api.register).toHaveBeenCalledWith({ nombre: 'Ana Cliente', email: 'ana@benditas.local', password: 'Password123' }));
  expect(await screen.findByText(/perfil listo/i)).toBeVisible();
});

test('shows customer profile, loyalty progress and order history', async () => {
  const storage = memoryStorage();
  storage.setItem(CUSTOMER_TOKEN_KEY, 'customer-token');
  const api = {
    profile: jest.fn().mockResolvedValue({ user: { id: 'u1', role: 'cliente', nombre: 'Ana', email: 'ana@benditas.local', telefono: '2281234567' } }),
    orders: jest.fn().mockResolvedValue([
      { id: 'order-123456', clienteId: 'u1', estado: 'pendiente', estadoCocina: 'en_preparacion', sucursal: 'xico', tipo: 'para_llevar', total: 177, createdAt: new Date('2026-09-02T18:00:00Z').toISOString(), items: [] },
    ]),
    updateProfile: jest.fn().mockResolvedValue({ user: { id: 'u1', role: 'cliente', nombre: 'Ana Club', email: 'ana@benditas.local', telefono: '2287654321' } }),
  };

  render(
    <MemoryRouter initialEntries={['/perfil']}>
      <Routes>
        <Route path="/perfil" element={<CustomerProfile api={api} storage={storage} />} />
        <Route path="/login" element={<p>Login</p>} />
      </Routes>
    </MemoryRouter>
  );

  expect(await screen.findByText('Ana')).toBeVisible();
  expect(screen.getByText(/en cocina/i)).toBeVisible();
  expect(screen.getByText('$177')).toBeVisible();
  expect(screen.getByLabelText(/sellos de fidelidad/i)).toBeVisible();

  await userEvent.clear(screen.getByLabelText(/^nombre/i));
  await userEvent.type(screen.getByLabelText(/^nombre/i), 'Ana Club');
  await userEvent.clear(screen.getByLabelText(/teléfono/i));
  await userEvent.type(screen.getByLabelText(/teléfono/i), '2287654321');
  await userEvent.click(screen.getByRole('button', { name: /guardar datos/i }));

  await waitFor(() => expect(api.updateProfile).toHaveBeenCalledWith({ nombre: 'Ana Club', telefono: '2287654321' }, 'customer-token'));
});
