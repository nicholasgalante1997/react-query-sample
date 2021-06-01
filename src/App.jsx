/* eslint-disable no-console */
/* eslint-disable no-shadow */
/* eslint-disable react/prop-types */
/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-unused-vars */
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
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
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

const useStyles = makeStyles({
  root: {
    minWidth: '100px',
    minHeight: '100px',
  },
  head: {
    fontSize: '16px',
  },
});

const packet = {
  cartoon: {
    show: 'Futurama',
    creator: 'Matt Groening',
    seasons: 9,
  },
};

const updated = {
  id: 3613,
  data: {
    cartoon: {
      show: 'FUTURAMA',
      creator: 'Matt Groening',
      seasons: 1000,
    },
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

  // retrieving data and tagging it as 'cartoons'
  const query = useQuery('cartoons', service._get);
  const {
    data, error, isLoading, status, isError,
  } = query;
  // adding data to the server, works a little differently
  // create a mutation with the useMutation hook
  // using mutation side effects is how we invalidate stale queries, and force refetches
  // side effect functions are available as the second argument in the useMutation hook
  const postMutation = useMutation((cartoon) => service._post(cartoon), {
    onMutate: (variables) => {
      console.log('attempting a "post" mutation');
      return { currentContext: 'cartoon query worker, post service' };
    },
    onError: (error, variables, context) => {
      console.error('An error occurred!');
      console.log(`error in context ${context.currentContext}`);
      console.error(error.message);
    },
    // When this mutation succeeds, invalidate any queries with the 'cartoons' query key
    onSuccess: (data, variables, context) => {
      queryRef.invalidateQueries('cartoons');
    },
    onSettled: () => {
      console.log('mutation complete');
    },
  });
  // // To actually send the associated mutating function, we call postMutation.mutate(arg),
  // // passing in the desired parameter
  const firePostMutation = async () => postMutation.mutate(packet);

  const updateMutation = useMutation((updatedCartoon) => service._update(updatedCartoon), {
    onMutate: async (newCartoon) => {
      queryRef.cancelQueries('cartoons');
      const current = queryRef.getQueryData('cartoons');
      // OPTIMISTIC UPDATING OF VALUES
      const { id } = newCartoon;
      const refactor = current.filter((cartoon) => cartoon.id !== id);
      queryRef.setQueryData('cartoons', (old) => [...refactor, newCartoon.data.cartoon]);

      // return a context object with the old state of 'cartoons' in case of failure
      return { existingState: current };
    },
    onError: (error, newCartoon, context) => {
      // if there is an error we want to rollback the state of 'cartoons' to the previous state
      // supplied by context
      queryRef.setQueryData('cartoons', context.existingState);
    },
    onSuccess: (data, variables, context) => console.log('successful creation logged at'.concat(new Date().toString())),
    onSettled: () => {
      // always refetch after success or error to maintain congruity
      queryRef.invalidateQueries('cartoons');
    },
  });
  const fireUpdateMutation = async () => updateMutation.mutate(updated);

  const deleteMutation = useMutation((id) => service._delete(id));
  const fireDeleteMutation = async () => deleteMutation.mutate(updated.id);

  return (
    <>
      <p>A sample react app that uses react-query for server state management</p>
      { isLoading ? <p><em><i>Retrieving data</i></em></p> : null }
      { isError ? <p><em><b>{error.message}</b></em></p> : null }
      <div className="cartoons">
        { status === 'success'
          ? data.data.map((cartoon) => (
            <CartoonCard
              key={cartoon.id}
              show={cartoon.show}
              creator={cartoon.creator}
              seasons={cartoon.seasons}
            />
          )) : null }
      </div>
      <div className="action">
        <Button variant="contained" color="secondary" size="large" onClick={() => firePostMutation()} className="button">
          Create Mutation
        </Button>
        <Button variant="contained" color="primary" size="large" onClick={() => fireUpdateMutation()} className="button">
          Update Mutation
        </Button>
        <Button variant="contained" color="default" size="large" onClick={() => fireDeleteMutation()} className="button">
          Delete Mutation
        </Button>
      </div>
    </>
  );
}

function CartoonCard({ show, creator, seasons }) {
  // Material UI
  const classes = useStyles();

  return (
    <Card className={classes.root} variant="outlined">
      <CardContent>
        <Typography className={classes.head} variant="h5">
          {show}
        </Typography>
        <Typography variant="caption">
          {creator}
        </Typography>
        <Typography variant="subtitle1">
          {seasons}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default App;
