import { useEffect, useState } from "react";

import "./App.css";

function CallPokemon() {
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pokemonDetail, setPokemonDetail] = useState(null);
  const [urlDetail, setUrlDetail] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPage = Math.ceil(pokemon.length / itemsPerPage);

  useEffect(() => {
    getpokemon();
  }, [urlDetail]);

  useEffect(() => {
    if (urlDetail !== "") {
      getpokemonDetail();
    }
  }, [urlDetail]);

  async function getpokemon() {
    try {
      setLoading(true);
      const response = await fetch("https://pokeapi.co/api/v2/pokemon");
      const pokemon = await response.json();
      setPokemon(pokemon.results);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function getpokemonDetail() {
    try {
      setLoading(true);
      const response = await fetch(urlDetail);
      const pokemon = await response.json();
      setPokemonDetail(pokemon);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div>
        <h1>Pokemon</h1>
        {loading && <p>Loading...</p>}
        <ul>
          {pokemon
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((pokemon) => (
              <li key={pokemon.name}>
                {pokemon.name}
                <button
                  onClick={() => {
                    setUrlDetail(pokemon.url);
                  }}
                >
                  Show Detail
                </button>
              </li>
            ))}
          <button
            onClick={() => {
              currentPage > 1 && setCurrentPage(currentPage - 1);
            }}
          >
            Prev
          </button>
          <p style={{ display: "inline" }}>
            {currentPage}/{totalPage}
          </p>
          <button
            onClick={() => {
              currentPage < totalPage && setCurrentPage(currentPage + 1);
            }}
          >
            Next
          </button>
        </ul>
        <div>
          {loading && <p>Loading...</p>}
          {pokemonDetail !== null && (
            <>
              <p>{pokemonDetail.name}</p>{" "}
              <img src={pokemonDetail.sprites.front_default} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <>
      <CallPokemon />
    </>
  );
}

export default App;
