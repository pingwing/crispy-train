import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { Provider as UrqlProvider, cacheExchange, createClient, fetchExchange } from 'urql';

const client = createClient({
  url: (import.meta.env.VITE_GRAPHQL_URL as string | undefined) ?? '/graphql',
  // Apollo Server v4/v5 enables CSRF prevention by default and will block "simple" browser requests
  // (e.g. GET queries) unless a non-simple content-type is used or an explicit header is present.
  // Sending this header keeps the frontend compatible regardless of transport details.
  fetchOptions: () => ({
    headers: {
      'apollo-require-preflight': 'true',
    },
  }),
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
