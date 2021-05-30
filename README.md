# React Query lib :: TLDR VERSION 
# Straight from the docs

# Important Defaults
- query instances via useQuery or useInfiniteQuery by default consider cached data as stale 

- Stale queries are refetched automatically in the background when:
    - New instances of the query mount
    - The window is refocused
    - The network is reconnected.
    - The query is optionally configured with a refetch interval.


## Retrieving Data

# Queries 
- From the docs:::
    `A query is a declarative dependency on an asynchronous source of data that is tied to a unique key. A query can be used with any Promise based method (including GET and POST methods) to fetch data from a server. If your method modifies data on the server, we recommend using Mutations instead.`
    To subscribe to a query in your components or custom hooks, call the useQuery hook with at least:
        *A unique key for the query
        *A function that returns a promise that:
        *Resolves the data, or
        *Throws an error
    Sample:::
        import { useQuery } from 'react-query'
        
        function App() {
            const info = useQuery('todos', fetchTodoList);
        }
    The unique key you provide (above is 'todos') is used internally for refetching, caching, and sharing your queries throughout your application.
    The query results returned by useQuery contains all of the information about the query that you'll need for templating and any other usage of the data:
    The result object contains a few very important states you'll need to be aware of to be productive. A query can only be in one of the following states at any given moment:
        *isLoading or status === 'loading' - The query has no data and is currently fetching
        *isError or status === 'error' - The query encountered an error
        *isSuccess or status === 'success' - The query was successful and data is available
        *isIdle or status === 'idle' - The query is currently disabled 
    For most queries, it's usually sufficient to check for the isLoading state, then the isError state, then finally, assume that the data is available and render the successful state:::
    sample:::
        `function Todos() {
            const { isLoading, isError, data, error } = useQuery('todos', fetchTodoList)
 
            if (isLoading) {
                return <span>Loading...</span>
            }
            
            if (isError) {
                return <span>Error: {error.message}</span>
            }
            
            // We can assume by this point that `isSuccess === true`
            return (
                <ul>
                {data.map(todo => (
                    <li key={todo.id}>{todo.title}</li>
                ))}
                </ul>
            )
        }`
# Query Keys (first argument in useQuery): 
    At its core, React Query manages query caching for you based on query keys. Query keys can be as simple as a string, or as complex as an array of many strings and nested objects. As long as the query key is serializable, and unique to the query's data, you can use it!

    String-Only Query Keys
        The simplest form of a key is actually not an array, but an individual string. When a string query key is passed, it is converted to an array internally with the string as the only item in the query key. This format is useful for:

        Generic List/Index resources
        Non-hierarchical resources

    Array Keys
        When a query needs more information to uniquely describe its data, you can use an array with a string and any number of serializable objects to describe it. This is useful for:

        Hierarchical or nested resources
        It's common to pass an ID, index, or other primitive to uniquely identify the item
        Queries with additional parameters
        It's common to pass an object of additional options
    NOTE:::
        If your query function depends on a variable, include it in your query key
        Since query keys uniquely describe the data they are fetching, they should include any variables you use in your query function that change. For example:
        `
        function Todos({ todoId }) {
            const result = useQuery(['todos', todoId], () => fetchTodoById(todoId))
        }
        `

# Query Functions (second argument in useQuery):
    A query function can be literally any function that returns a promise. The promise that is returned should either resolve the data or throw an error.
    All of the following are valid query function configurations:
    `
    useQuery(['todos', todoId], fetchTodoById)
    useQuery(['todos', todoId], () => fetchTodoById(todoId))
    useQuery(['todos', todoId], async () => {
    const data = await fetchTodoById(todoId)
    return data
    })
    `
    Handling and Throwing Errors::
        For React Query to determine a query has errored, the query function must throw. Any error that is thrown in the query function will be persisted on the error state of the query.
        `
        const { error } = useQuery(['todos', todoId], async () => {
        if (somethingGoesWrong) {
            throw new Error('Oh no!')
        }
        return data
        })
        `
    
    Usage with fetch and other clients that do not throw by default::
        While most utilities like axios or graphql-request automatically throw errors for unsuccessful HTTP calls, some utilities like fetch do not throw errors by default. If that's the case, you'll need to throw them on your own. Here is a simple way to do that with the popular fetch API:
        `
        useQuery(['todos', todoId], async () => {
        const response = await fetch('/todos/' + todoId)
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }
        return response.json()
        })
        `

    Query Function Variables::
        Query keys are not just for uniquely identifying the data you are fetching, but are also conveniently passed into your query function and while not always necessary, this makes it possible to extract your query functions if needed:
            `
            function Todos({ status, page }) {
                const result = useQuery(['todos', { status, page }], fetchTodoList)
            }
                
            // Access the key, status and page variables in your query function!
            function fetchTodoList({ queryKey }) {
                const [_key, { status, page }] = queryKey
                return new Promise()
            }
            `

    Using a Query Object instead of parameters::
        Anywhere the [queryKey, queryFn, config] signature is supported throughout React Query's API, you can also use an object to express the same configuration:
            `
            import { useQuery } from 'react-query'
 
            useQuery({
            queryKey: ['todo', 7],
            queryFn: fetchTodo,
            ...config,
            })
            `
# Dependent Queries
    Dependent (or serial) queries depend on previous ones to finish before they can execute. To achieve this, it's as easy as using the enabled option to tell a query when it is ready to run:
        // Get the user
        const { data: user } = useQuery(['user', email], getUserByEmail)
        const userId = user?.id
 
        // Then get the user's projects
        const { isIdle, data: projects } = useQuery(
            ['projects', userId],
            getProjectsByUser,
            {
            // The query will not execute until the userId exists
            enabled: !!userId,
            }
        )
 
        // isIdle will be `true` until `enabled` is true and the query begins to fetch.
        // It will then go to the `isLoading` stage and hopefully the `isSuccess` stage

# Paginated / Lagged Queries

# Placeholder Query Data
    Placeholder data allows a query to behave as if it already has data, similar to the initialData option, but the data is not persisted to the cache. This comes in handy for situations where you have enough partial (or fake) data to render the query successfully while the actual data is fetched in the background.

    Example: An individual blog post query could pull "preview" data from a parent list of blog posts that only include title and a small snippet of the post body. You would not want to persist this partial data to the query result of the individual query, but it is useful for showing the content layout as quickly as possible while the actual query finishes to fetch the entire object.

    Declaratively:
        Provide placeholderData to a query to prepopulate its cache if empty
    Imperatively:
        Prefetch or fetch the data using queryClient and the placeholderData option

    As a value
        `function Todos() {
            const result = useQuery('todos', () => fetch('/todos'), {
                placeholderData: placeholderTodos,
            })
        }`

# Prefetching :: This one's cool 
    If you're lucky enough, you may know enough about what your users will do to be able to prefetch the data they need before it's needed! If this is the case, you can use the prefetchQuery method to prefetch the results of a query to be placed into the cache:

        `
        const prefetchTodos = async () => {
        // The results of this query will be cached like a normal query
        await queryClient.prefetchQuery('todos', fetchTodos)
        }
        `

    If data for this query is already in the cache and not invalidated, the data will not be fetched
    If a staleTime is passed eg. prefetchQuery('todos', fn, { staleTime: 5000 }) and the data is older than the specified staleTime, the query will be fetched
    If no instances of useQuery appear for a prefetched query, it will be deleted and garbage collected after the time specified in cacheTime.



## Mutating Data 
# Mutations 
    mutations are typically used to create/update/delete data or perform server side-effects. For this purpose, React Query exports a useMutation hook.
    `
    const mutation = useMutation(newTodo => axios.post('/todos', newTodo))

    return (
     <div>
       {mutation.isLoading ? (
         'Adding todo...'
       ) : (
         <>
           {mutation.isError ? (
             <div>An error occurred: {mutation.error.message}</div>
           ) : null}
 
           {mutation.isSuccess ? <div>Todo added!</div> : null}
 
           <button
             onClick={() => {
               mutation.mutate({ id: new Date(), title: 'Do Laundry' })
             }}
           >
             Create Todo
           </button>
         </>
       )}
     </div>
   )
    ` 
    A mutation can only be in one of the following states at any given moment:
        isIdle or status === 'idle' - The mutation is currently idle or in a fresh/reset state
        isLoading or status === 'loading' - The mutation is currently running
        isError or status === 'error' - The mutation encountered an error
        isSuccess or status === 'success' - The mutation was successful and mutation data is available
    Beyond those primary states, more information is available depending on the state of the mutation:
        error - If the mutation is in an isError state, the error is available via the error property.
        data - If the mutation is in a success state, the data is available via the data property.
    In the example above, you also saw that you can pass variables to your mutations function by calling the mutate function with a single variable or object.






