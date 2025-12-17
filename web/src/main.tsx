import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { Provider as UrqlProvider, cacheExchange, createClient, fetchExchange } from 'urql';

const client = createClient({
  url: (import.meta.env.VITE_GRAPHQL_URL as string | undefined) ?? '/graphql',
  exchanges: [cacheExchange, fetchExchange],
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UrqlProvider value={client}>
        <App />
      </UrqlProvider>
    </BrowserRouter>
  </StrictMode>,
);
