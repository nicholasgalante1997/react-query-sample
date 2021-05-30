/* eslint-disable no-underscore-dangle */
import React, { useEffect } from 'react';
import axios from 'axios';
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
  useQuery,
  useMutation,
} from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import logo from './logo.svg';
import './App.css';

// Create a react-query client
const queryClient = new QueryClient();

const dev = 'http://localhost:4201';

const service = {
  _get: async () => axios.get(dev),
  _post: async (packet) => axios.post(dev, packet),
  _update: async (obj) => axios.put(`${dev}/${obj.id}`, obj.data),
  _delete: async (id) => axios.delete(`${dev}/${id}`),
};

const packet = {
  cartoon: {
    show: 'Futurama',
    creator: 'Matt Groening',
    seasons: 9,
  },
};

const updated = {
  id: 4231,
  data: {
    show: 'FUTURAMA',
    creator: 'Matt Groening',
    seasons: 1000,
  },
};

function App() {
  return (
    // Provide the client to your app as a wrapper similar to a Redux provider
    <QueryClientProvider client={queryClient}>
      <Head />
      <ReactQueryDevtools initialIsOpen={false} />
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

  // adding data to the server, works a little differently
  // create a mutation with the useMutation hook
  const postMutation = useMutation((cartoon) => service._post(cartoon));
  useEffect(() => console.log(postMutation), [postMutation]);
  // To actually send the associated mutating function, we call postMutation.mutate(arg),
  // passing in the desired parameter
  useEffect(() => postMutation.mutate(packet), []);

  return (
    <p>A sample react app that uses react-query for server state management</p>
  );
}

export default App;
