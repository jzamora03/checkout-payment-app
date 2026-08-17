import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerForm from './CustomerForm';
import { isCustomerValid } from './CustomerForm';

const empty = {
  email: '',
  firstName: '',
  lastName: '',
  documentType: 'CC',
  documentNumber: '',
  phone: '',
};

describe('CustomerForm', () => {
  it('valida el correo y el documento', async () => {
    const user = userEvent.setup();
    render(<CustomerForm initial={empty} onChange={jest.fn()} />);

    await user.type(screen.getByTestId('customer-email'), 'no-es-correo');
    await fireEvent.blur(screen.getByTestId('customer-email'));
    expect(await screen.findByText('Ingresa un correo válido')).toBeInTheDocument();

    await user.type(screen.getByTestId('customer-documentNumber'), '12');
    await fireEvent.blur(screen.getByTestId('customer-documentNumber'));
    expect(
      await screen.findByText('El documento debe tener entre 4 y 20 dígitos'),
    ).toBeInTheDocument();
  });

  it('notifica los cambios', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<CustomerForm initial={empty} onChange={onChange} />);

    await user.type(screen.getByTestId('customer-email'), 'a@b.com');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ email: 'a@b.com' }),
    );
  });

  it('isCustomerValid detecta datos válidos e inválidos', () => {
    expect(
      isCustomerValid({
        email: 'a@b.com',
        firstName: 'Juan',
        lastName: 'Perez',
        documentType: 'CC',
        documentNumber: '1067981234',
        phone: '3001234567',
      }),
    ).toBe(true);

    expect(
      isCustomerValid({
        email: 'malo',
        firstName: 'Juan',
        lastName: 'Perez',
        documentType: 'CC',
        documentNumber: '1067981234',
        phone: '',
      }),
    ).toBe(false);
  });
});
