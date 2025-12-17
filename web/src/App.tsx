import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { InventoryListPage } from './pages/InventoryListPage';
import { StoreDetailPage } from './pages/StoreDetailPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<InventoryListPage />} />
        <Route path="/stores/:storeId" element={<StoreDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
