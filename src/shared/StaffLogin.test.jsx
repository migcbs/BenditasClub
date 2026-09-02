import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import StaffLogin from './StaffLogin';
import { theme } from './theme';

const renderWithTheme = (ui) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('StaffLogin', () => {
  it('renders the given title and the sucursal selector', () => {
    renderWithTheme(<StaffLogin title="BenditasClub Cocina" onLogin={jest.fn()} />);
    expect(screen.getByText('BenditasClub Cocina')).toBeInTheDocument();
    expect(screen.getByText('Xico')).toBeInTheDocument();
  });

  it('keeps "Entrar" disabled until 4 digits are entered, then calls onLogin(sucursal, pin)', async () => {
    const onLogin = jest.fn().mockResolvedValue();
    renderWithTheme(<StaffLogin onLogin={onLogin} />);

    const entrar = screen.getByText('Entrar');
    expect(entrar).toBeDisabled();

    ['5', '5', '6', '6'].forEach((d) => fireEvent.click(screen.getByText(d, { selector: 'button' })));

    await waitFor(() => expect(entrar).not.toBeDisabled());
    fireEvent.click(entrar);

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('xico', '5566'));
  });

  it('shows the API error message and clears the PIN when login fails', async () => {
    const onLogin = jest.fn().mockRejectedValue(new Error('PIN o sucursal incorrectos'));
    renderWithTheme(<StaffLogin onLogin={onLogin} />);

    ['0', '0', '0', '0'].forEach((d) => fireEvent.click(screen.getByText(d, { selector: 'button' })));
    fireEvent.click(await screen.findByText('Entrar'));

    expect(await screen.findByText('PIN o sucursal incorrectos')).toBeInTheDocument();
  });
});
