import React, { useState } from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql,
} from "@apollo/client";
import InfiniteScroll from "react-infinite-scroll-component";

const client = new ApolloClient({
  uri: "https://swapi-graphql.netlify.app/.netlify/functions/index",
  cache: new InMemoryCache(),
});

const GET_FILMS = gql`
  query Query($after: String) {
    allFilms(first: 10, after: $after) {
      films {
        title
        director
        releaseDate
        speciesConnection {
          species {
            name
            classification
            homeworld {
              name
            }
          }
        }
      }
      pageInfo {
        endCursor
      }
    }
  }
`;

const FilmList = ({ searchTerm }) => {
  const [films, setFilms] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [cursor, setCursor] = useState(null);

  const { loading, error, data, fetchMore } = useQuery(GET_FILMS, {
    variables: { cursor, searchTerm, after: null },
    onCompleted: (data) => {
      const newFilms = data.allFilms.films;
      setFilms((prevFilms) => [...prevFilms, ...newFilms]);
      // console.log(newFilms);
    },
  });

  const loadMore = () => {
    setCursor(data.allFilms.pageInfo.endCursor);
    setHasNextPage(data.allFilms.pageInfo.hasNextPage);
    // console.log(data.allFilms);
    fetchMore({
      variables: {
        after: cursor,
        searchTerm,
      },
      updateQuery: (prevResult, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prevResult;
        return {
          allFilms: {
            ...fetchMoreResult.allFilms,
            films: [
              ...prevResult.allFilms.films,
              ...fetchMoreResult.allFilms.films,
            ],
          },
        };
      },
    });
  };

  const handleNextPage = () => {
    loadMore();
  };

  if (loading && films.length === 0)
    return <p className="text-center mt-4">Loading...</p>;
  if (error) return <p className="text-center mt-4">Error: {error.message}</p>;

  // Filter films based on search term
  const filteredFilms = films.filter((film) =>
    film.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <InfiniteScroll
        dataLength={filteredFilms.length}
        next={loadMore}
        hasMore={hasNextPage}
        loader={<h4 className="text-center mt-4">Loading...</h4>}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                director
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                releaseDate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFilms.map((film, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap"> {film.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{film.director}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {film.releaseDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </InfiniteScroll>
      {hasNextPage && (
        <div className="text-center mt-4">
          <button
            onClick={handleNextPage}
            className="bg-blue-500 text-white px-4 py-2 rounded-md focus:outline-none focus:bg-blue-600"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};
const Searchbar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(searchTerm);
    setSearchTerm("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 mb-8">
      <input
        type="text"
        placeholder="Search films..."
        value={searchTerm}
        onChange={handleChange}
        className="border border-gray-300 rounded-md px-4 py-2 mr-2 focus:outline-none focus:ring focus:border-blue-300"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-md focus:outline-none focus:bg-blue-600"
      >
        Search
      </button>
    </form>
  );
};

function App() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  return (
    <ApolloProvider client={client}>
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mt-8 mb-4">Star Wars Films</h1>
        <Searchbar onSearch={handleSearch} />
        <FilmList searchTerm={searchTerm} />
      </div>
    </ApolloProvider>
  );
}

export default App;
