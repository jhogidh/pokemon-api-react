import React, { useState, useEffect, useMemo } from "react";

// --- Helper Components ---

// Komponen untuk menampilkan kartu Pokemon
const PokemonCard = ({ pokemon, onSelect, isSelected, isOpponent = false }) => {
  if (!pokemon) return null;

  const getStat = (statName) =>
    pokemon.stats.find((s) => s.stat.name === statName)?.base_stat || 0;

  const hp = getStat("hp");
  const attack = getStat("attack");
  const defense = getStat("defense");

  return (
    <div
      className={`bg-gray-800 p-6 rounded-2xl shadow-lg transition-all duration-300 border-4 ${
        isSelected ? "border-yellow-400 scale-105" : "border-gray-700"
      } ${isOpponent ? "border-red-500" : ""}`}
    >
      <img
        src={pokemon.sprites.front_default}
        alt={pokemon.name}
        className="w-40 h-40 mx-auto -mt-12 mb-2"
      />
      <h2 className="text-2xl font-bold capitalize text-center text-white mb-4">
        {pokemon.name}
      </h2>
      <div className="space-y-2 text-sm">
        <StatBar label="HP" value={hp} maxValue={255} color="bg-green-500" />
        <StatBar
          label="Attack"
          value={attack}
          maxValue={190}
          color="bg-red-500"
        />
        <StatBar
          label="Defense"
          value={defense}
          maxValue={250}
          color="bg-blue-500"
        />
      </div>
      {onSelect && (
        <button
          onClick={() => onSelect(pokemon)}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Pilih Pokemon Ini
        </button>
      )}
    </div>
  );
};

// Komponen untuk menampilkan bar statistik
const StatBar = ({ label, value, maxValue, color }) => (
  <div>
    <div className="flex justify-between font-semibold text-gray-300 mb-1">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-3">
      <div
        className={`${color} h-3 rounded-full`}
        style={{ width: `${(value / maxValue) * 100}%` }}
      ></div>
    </div>
  </div>
);

// --- Main App Component ---

function App() {
  const [playerPokemonList, setPlayerPokemonList] = useState([]);
  const [selectedPlayerPokemon, setSelectedPlayerPokemon] = useState(null);
  const [opponentPokemon, setOpponentPokemon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameLog, setGameLog] = useState([
    "Selamat datang di Arena Pertarungan Pokémon!",
  ]);
  const [winner, setWinner] = useState(null); // null, 'player', or 'opponent'

  const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";

  // Fungsi untuk mengambil detail lengkap dari Pokemon
  const fetchPokemonDetails = async (url) => {
    const response = await fetch(url);
    return await response.json();
  };

  // Mengambil daftar Pokemon untuk pemain saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchInitialPokemon = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${POKEAPI_BASE_URL}?limit=12`);
        const data = await response.json();
        const detailedList = await Promise.all(
          data.results.map((p) => fetchPokemonDetails(p.url))
        );
        setPlayerPokemonList(detailedList);
        fetchNewOpponent(); // Langsung cari lawan pertama
      } catch (error) {
        console.error("Gagal mengambil data Pokemon:", error);
        setGameLog((prev) => [
          ...prev,
          "Gagal memuat Pokemon. Coba refresh halaman.",
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialPokemon();
  }, []);

  // Fungsi untuk mendapatkan lawan baru secara acak
  const fetchNewOpponent = async () => {
    try {
      setIsLoading(true);
      setWinner(null);
      setSelectedPlayerPokemon(null);
      setGameLog([
        "Lawan baru telah muncul! Pilih Pokemon-mu untuk bertarung.",
      ]);
      const randomId = Math.floor(Math.random() * 151) + 1; // Ambil dari 151 Pokemon original
      const opponentDetails = await fetchPokemonDetails(
        `${POKEAPI_BASE_URL}/${randomId}`
      );
      setOpponentPokemon(opponentDetails);
    } catch (error) {
      console.error("Gagal mengambil data lawan:", error);
      setGameLog((prev) => [...prev, "Gagal mencari lawan baru."]);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize statistik untuk performa
  const pokemonStats = useMemo(() => {
    const getStats = (pokemon) => {
      if (!pokemon) return { hp: 0, attack: 0, defense: 0 };
      const get = (name) =>
        pokemon.stats.find((s) => s.stat.name === name)?.base_stat || 1;
      return {
        hp: get("hp"),
        attack: get("attack"),
        defense: get("defense"),
      };
    };
    return {
      player: getStats(selectedPlayerPokemon),
      opponent: getStats(opponentPokemon),
    };
  }, [selectedPlayerPokemon, opponentPokemon]);

  // Logika saat tombol "Serang!" diklik
  const handleAttack = () => {
    if (!selectedPlayerPokemon || !opponentPokemon || winner) return;

    let log = [`--- Ronde Baru ---`];
    log.push(
      `${selectedPlayerPokemon.name} menyerang ${opponentPokemon.name}!`
    );

    const { player, opponent } = pokemonStats;

    // Formula pertarungan sederhana
    const playerDamage = Math.max(
      1,
      Math.floor(
        player.attack * 0.8 - opponent.defense * 0.5 + (Math.random() * 10 - 5)
      )
    );
    const opponentDamage = Math.max(
      1,
      Math.floor(
        opponent.attack * 0.8 - player.defense * 0.5 + (Math.random() * 10 - 5)
      )
    );

    log.push(`${opponentPokemon.name} menerima ${playerDamage} kerusakan.`);
    log.push(
      `${selectedPlayerPokemon.name} menerima ${opponentDamage} kerusakan.`
    );

    // Tentukan pemenang berdasarkan siapa yang bisa bertahan lebih lama
    const playerTurnsToWin = Math.ceil(opponent.hp / playerDamage);
    const opponentTurnsToWin = Math.ceil(player.hp / opponentDamage);

    if (playerTurnsToWin <= opponentTurnsToWin) {
      log.push(`Serangan ${selectedPlayerPokemon.name} lebih efektif!`);
      log.push(`${selectedPlayerPokemon.name} menang!`);
      setWinner("player");
    } else {
      log.push(`Serangan ${opponentPokemon.name} lebih kuat!`);
      log.push(`${opponentPokemon.name} menang!`);
      setWinner("opponent");
    }

    setGameLog((prev) => [...prev, ...log]);
  };

  if (isLoading && playerPokemonList.length === 0) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-white mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-xl font-semibold">Mempersiapkan Arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1
            className="text-5xl font-extrabold text-yellow-400 tracking-wider"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            Pokémon Battle
          </h1>
          <p className="text-gray-400 mt-2">
            Pilih Pokemon-mu dan kalahkan lawan!
          </p>
        </header>

        {/* --- Arena Pertarungan --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-8">
          <div className="flex justify-center">
            {selectedPlayerPokemon ? (
              <PokemonCard pokemon={selectedPlayerPokemon} isSelected={true} />
            ) : (
              <div className="bg-gray-800 w-full max-w-sm h-72 rounded-2xl flex items-center justify-center text-gray-500 border-4 border-dashed border-gray-700">
                <p>Pilih Pokemon dari daftar di bawah</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-4xl font-bold mb-4">VS</p>
            <button
              onClick={handleAttack}
              disabled={!selectedPlayerPokemon || !!winner}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              SERANG!
            </button>
            {winner && (
              <div className="mt-4">
                <p
                  className={`text-2xl font-bold ${
                    winner === "player" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {winner === "player" ? "KAMU MENANG!" : "KAMU KALAH!"}
                </p>
                <button
                  onClick={fetchNewOpponent}
                  className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg"
                >
                  Cari Lawan Baru
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {opponentPokemon ? (
              <PokemonCard pokemon={opponentPokemon} isOpponent={true} />
            ) : (
              <div className="bg-gray-800 w-full max-w-sm h-72 rounded-2xl flex items-center justify-center text-gray-500 border-4 border-dashed border-gray-700">
                <p>Mencari lawan...</p>
              </div>
            )}
          </div>
        </div>

        {/* --- Log Pertarungan --- */}
        <div className="bg-gray-800 rounded-lg p-4 h-40 overflow-y-auto border border-gray-700 mb-8">
          <div className="flex flex-col-reverse">
            {gameLog
              .slice()
              .reverse()
              .map((log, index) => (
                <p key={index} className="text-sm text-gray-300 font-mono">
                  &gt; {log}
                </p>
              ))}
          </div>
        </div>

        {/* --- Pilihan Pokemon Pemain --- */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-6">
            Daftar Pokemon-mu
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {playerPokemonList.map((p) => (
              <div
                key={p.id}
                onClick={() => !winner && setSelectedPlayerPokemon(p)}
                className={`bg-gray-800 p-3 rounded-lg text-center cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-gray-700 border-2 ${
                  selectedPlayerPokemon?.id === p.id
                    ? "border-yellow-400"
                    : "border-transparent"
                }`}
              >
                <img
                  src={p.sprites.front_default}
                  alt={p.name}
                  className="w-24 h-24 mx-auto"
                />
                <p className="capitalize font-semibold mt-2">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
