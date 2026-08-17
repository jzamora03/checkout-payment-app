import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProductPage from './features/product/ProductPage';
import PaymentModal from './features/payment/PaymentModal';
import SummaryBackdrop from './features/summary/SummaryBackdrop';
import ResultView from './features/result/ResultView';
import { refreshTransactionStatus } from './features/checkout/checkoutSlice';
import type { AppDispatch, RootState } from './app/store';
import './styles/global.css';
import './styles/pages.css';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const step = useSelector((state: RootState) => state.checkout.step);
  const transactionReference = useSelector(
    (state: RootState) => state.checkout.transactionReference,
  );

  useEffect(() => {
    if (
      transactionReference &&
      (step === 'processing' || step === 'result')
    ) {
      void dispatch(refreshTransactionStatus(transactionReference));
    }
  }, [dispatch, transactionReference, step]);

  return (
    <div className="app">
      <ProductPage />
      {step === 'payment' && <PaymentModal />}
      {step === 'summary' && <SummaryBackdrop />}
      {(step === 'processing' || step === 'result') && <ResultView />}
    </div>
  );
}

export default App;