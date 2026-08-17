import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardForm from './CardForm';

describe('CardForm', () => {
  const emptyCard = { number: '', holder: '', expiry: '', cvc: '' };

  it('muestra los logos de VISA y Mastercard', () => {
    render(<CardForm initial={emptyCard} onValid={jest.fn()} />);
    expect(screen.getByTestId('brand-visa')).toBeInTheDocument();
    expect(screen.getByTestId('brand-mastercard')).toBeInTheDocument();
  });

  it('activa el logo de la franquicia detectada', async () => {
    const user = userEvent.setup();
    render(<CardForm initial={emptyCard} onValid={jest.fn()} />);

    await user.type(screen.getByTestId('card-number'), '4242424242424242');
    await waitFor(() => {
      expect(screen.getByTestId('brand-visa')).toHaveClass('is-active');
    });
  });

  it('muestra errores de validación al enviar datos incompletos', async () => {
    const user = userEvent.setup();
    const onValid = jest.fn();
    render(<CardForm initial={emptyCard} onValid={onValid} />);

    await user.click(screen.getByTestId('card-continue'));

    expect(await screen.findByText('Ingresa el número de la tarjeta')).toBeInTheDocument();
    expect(screen.getByText('Ingresa el nombre del titular')).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
  });

  it('formatea el número y la expiración al escribir', async () => {
    const user = userEvent.setup();
    render(<CardForm initial={emptyCard} onValid={jest.fn()} />);

    const numberInput = screen.getByTestId('card-number');
    await user.type(numberInput, '4242424242424242');
    expect(numberInput).toHaveValue('4242 4242 4242 4242');

    const expiryInput = screen.getByTestId('card-expiry');
    await user.type(expiryInput, '1228');
    expect(expiryInput).toHaveValue('12/28');
  });

  it('notifica cuando la tarjeta es válida', async () => {
    const user = userEvent.setup();
    const onValid = jest.fn();
    render(<CardForm initial={emptyCard} onValid={onValid} />);

    await user.type(screen.getByTestId('card-number'), '4242424242424242');
    await user.type(screen.getByTestId('card-holder'), 'Juan Perez');
    await user.type(screen.getByTestId('card-expiry'), '12/99');
    await user.type(screen.getByTestId('card-cvc'), '123');
    await user.click(screen.getByTestId('card-continue'));

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
    expect(onValid).toHaveBeenCalledWith({
      number: '4242 4242 4242 4242',
      holder: 'Juan Perez',
      expiry: '12/99',
      cvc: '123',
    });
  });

  it('rechaza una tarjeta que no pasa Luhn', async () => {
    const user = userEvent.setup();
    const onValid = jest.fn();
    render(<CardForm initial={emptyCard} onValid={onValid} />);

    await user.type(screen.getByTestId('card-number'), '4242424242424241');
    await user.type(screen.getByTestId('card-holder'), 'Juan Perez');
    await user.type(screen.getByTestId('card-expiry'), '12/99');
    await user.type(screen.getByTestId('card-cvc'), '123');
    await user.click(screen.getByTestId('card-continue'));

    expect(
      await screen.findByText('El número de la tarjeta no es válido'),
    ).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
  });
});