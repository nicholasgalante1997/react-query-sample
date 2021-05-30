/* eslint-disable no-underscore-dangle */
import React, { useEffect } from 'react';
import axios from 'axios';
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
  useQuery,
} from 'react-query';
import logo from './logo.svg';
import './App.css';

// Create a react-query client
const queryClient = new QueryClient();

const service = {
  _get: async () => axios.get('http://localhost:4201'),
};

function App() {
  return (
    // Provide the client to your app as a wrapper similar to a Redux provider
    <QueryClientProvider client={queryClient}>
      <Head />
    </QueryClientProvider>
  );
}

function Head() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <Content />
      </header>
    </div>
  );
}

function Content() {
  // Access the client using the useQueryClient hook to retrieve our wrapper client
  const queryRef = useQueryClient();

  useEffect(() => console.log({ queryRef }), []);

  // retrieving data and tagging it as 'cartoons'
  const query = useQuery('cartoons', service._get);

  useEffect(() => console.log({ query }), [query]);

  return (
    <p>A sample react app that uses react-query for server state management</p>
  );
}
export default App;
