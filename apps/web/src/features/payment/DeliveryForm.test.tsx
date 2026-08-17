import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeliveryForm from './DeliveryForm';
import { isDeliveryValid } from './DeliveryForm';

const empty = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'CO',
  notes: '',
};

describe('DeliveryForm', () => {
  it('valida la dirección y el código postal', async () => {
    const user = userEvent.setup();
    render(<DeliveryForm initial={empty} onChange={jest.fn()} />);

    await user.type(screen.getByTestId('delivery-address'), 'Ca');
    await fireEvent.blur(screen.getByTestId('delivery-address'));
    expect(
      await screen.findByText('Ingresa la dirección (mínimo 5 caracteres)'),
    ).toBeInTheDocument();

    await user.type(screen.getByTestId('delivery-postal'), '12');
    await fireEvent.blur(screen.getByTestId('delivery-postal'));
    expect(await screen.findByText('Código postal no válido')).toBeInTheDocument();
  });

  it('notifica los cambios', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<DeliveryForm initial={empty} onChange={onChange} />);

    await user.type(screen.getByTestId('delivery-city'), 'Bogota');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ city: 'Bogota' }),
    );
  });

  it('isDeliveryValid valida los datos', () => {
    expect(
      isDeliveryValid({
        addressLine1: 'Calle 123 # 45-67',
        addressLine2: '',
        city: 'Bogota',
        state: 'Cundinamarca',
        postalCode: '110111',
        country: 'CO',
        notes: '',
      }),
    ).toBe(true);

    expect(
      isDeliveryValid({
        addressLine1: 'x',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'CO',
        notes: '',
      }),
    ).toBe(false);
  });
});
