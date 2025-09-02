import React, { useState, useEffect, useMemo, useRef } from "react";

// --- Helper Components ---

// Komponen untuk menampilkan kartu Pokemon
const PokemonCard = ({
  pokemon,
  isSelected,
  isOpponent = false,
  animationState,
}) => {
  if (!pokemon) return null;

  const getStat = (statName) =>
    pokemon.stats.find((s) => s.stat.name === statName)?.base_stat || 0;

  const hp = getStat("hp");
  const attack = getStat("attack");
  const defense = getStat("defense");

  // Menentukan kelas animasi berdasarkan state
  const animationClass = () => {
    if (animationState === "attacking") return "animate-attack";
    if (animationState === "taking-damage") return "animate-shake";
    return "";
  };

  return (
    <div
      className={`relative bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg transition-all duration-300 border-4 ${
        isSelected ? "border-yellow-400 scale-105" : "border-gray-700"
      } ${isOpponent ? "border-red-500" : ""} ${animationClass()}`}
    >
      <img
        src={pokemon.sprites.front_default}
        alt={pokemon.name}
        className="w-32 h-32 sm:w-40 sm:h-40 mx-auto -mt-12 mb-2 drop-shadow-lg"
      />
      <h2 className="text-xl sm:text-2xl font-bold capitalize text-center text-white mb-4">
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
    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
      <div
        className={`${color} h-3 rounded-full transition-all duration-500 ease-out`}
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
    { type: "system", text: "Selamat datang di Arena Pertarungan Pokémon!" },
  ]);
  const [winner, setWinner] = useState(null);
  const [attackAnimation, setAttackAnimation] = useState({
    player: "idle",
    opponent: "idle",
  });
  const logContainerRef = useRef(null);

  const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [gameLog]);

  const fetchPokemonDetails = async (url) => {
    const response = await fetch(url);
    return await response.json();
  };

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
        fetchNewOpponent();
      } catch (error) {
        console.error("Gagal mengambil data Pokemon:", error);
        addLog("Gagal memuat Pokemon. Coba refresh halaman.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialPokemon();
  }, []);

  const fetchNewOpponent = async () => {
    try {
      setIsLoading(true);
      setWinner(null);
      setSelectedPlayerPokemon(null);
      setGameLog([]);
      addLog(
        "Lawan baru telah muncul! Pilih Pokemon-mu untuk bertarung.",
        "system"
      );
      const randomId = Math.floor(Math.random() * 151) + 1;
      const opponentDetails = await fetchPokemonDetails(
        `${POKEAPI_BASE_URL}/${randomId}`
      );
      setOpponentPokemon(opponentDetails);
    } catch (error) {
      console.error("Gagal mengambil data lawan:", error);
      addLog("Gagal mencari lawan baru.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const addLog = (text, type = "info") => {
    setGameLog((prev) => [...prev, { type, text }]);
  };

  const pokemonStats = useMemo(() => {
    const getStats = (pokemon) => {
      if (!pokemon) return { hp: 0, attack: 0, defense: 0 };
      const get = (name) =>
        pokemon.stats.find((s) => s.stat.name === name)?.base_stat || 1;
      return { hp: get("hp"), attack: get("attack"), defense: get("defense") };
    };
    return {
      player: getStats(selectedPlayerPokemon),
      opponent: getStats(opponentPokemon),
    };
  }, [selectedPlayerPokemon, opponentPokemon]);

  const handleAttack = () => {
    if (
      !selectedPlayerPokemon ||
      !opponentPokemon ||
      winner ||
      attackAnimation.player !== "idle"
    )
      return;

    addLog(`--- Ronde Baru ---`, "system");

    setTimeout(() => {
      addLog(
        `${selectedPlayerPokemon.name} menyerang ${opponentPokemon.name}!`,
        "player-attack"
      );
      setAttackAnimation({ player: "attacking", opponent: "idle" });
    }, 200);

    setTimeout(() => {
      setAttackAnimation({ player: "idle", opponent: "taking-damage" });
      const playerDamage = Math.max(
        1,
        Math.floor(
          pokemonStats.player.attack * 0.8 -
            pokemonStats.opponent.defense * 0.5 +
            (Math.random() * 10 - 5)
        )
      );
      addLog(
        `${opponentPokemon.name} menerima ${playerDamage} kerusakan.`,
        "opponent-damage"
      );
    }, 800);

    setTimeout(() => {
      setAttackAnimation({ player: "idle", opponent: "idle" });
    }, 1200);

    setTimeout(() => {
      addLog(`${opponentPokemon.name} balas menyerang!`, "opponent-attack");
      setAttackAnimation({ player: "idle", opponent: "attacking" });
    }, 1500);

    setTimeout(() => {
      setAttackAnimation({ player: "taking-damage", opponent: "idle" });
      const opponentDamage = Math.max(
        1,
        Math.floor(
          pokemonStats.opponent.attack * 0.8 -
            pokemonStats.player.defense * 0.5 +
            (Math.random() * 10 - 5)
        )
      );
      addLog(
        `${selectedPlayerPokemon.name} menerima ${opponentDamage} kerusakan.`,
        "player-damage"
      );
    }, 2100);

    setTimeout(() => {
      const playerDamage = Math.max(
        1,
        Math.floor(
          pokemonStats.player.attack * 0.8 - pokemonStats.opponent.defense * 0.5
        )
      );
      const opponentDamage = Math.max(
        1,
        Math.floor(
          pokemonStats.opponent.attack * 0.8 - pokemonStats.player.defense * 0.5
        )
      );
      const playerTurnsToWin = Math.ceil(
        pokemonStats.opponent.hp / playerDamage
      );
      const opponentTurnsToWin = Math.ceil(
        pokemonStats.player.hp / opponentDamage
      );

      if (playerTurnsToWin <= opponentTurnsToWin) {
        addLog(`${selectedPlayerPokemon.name} menang!`, "victory");
        setWinner("player");
      } else {
        addLog(`${opponentPokemon.name} menang!`, "defeat");
        setWinner("opponent");
      }
      setAttackAnimation({ player: "idle", opponent: "idle" });
    }, 2500);
  };

  const getLogStyle = (type) => {
    switch (type) {
      case "system":
        return "text-yellow-400";
      case "player-attack":
        return "text-cyan-400";
      case "opponent-attack":
        return "text-orange-400";
      case "player-damage":
        return "text-red-500 font-semibold";
      case "opponent-damage":
        return "text-red-500 font-semibold";
      case "victory":
        return "text-green-400 font-bold text-lg";
      case "defeat":
        return "text-red-400 font-bold text-lg";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-300";
    }
  };

  if (isLoading && playerPokemonList.length === 0) {
    // ... (Loading screen remains the same)
  }

  return (
    <>
      <style>{`
      @keyframes attack {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(20px) scale(1.1); }
      }
      .animate-attack { animation: attack 0.5s ease-in-out; }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-5px); }
        40%, 80% { transform: translateX(5px); }
      }
      .animate-shake { animation: shake 0.3s linear; }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .log-entry { animation: fadeIn 0.3s ease-out; }

      @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .animated-gradient {
        background: linear-gradient(-45deg, #0f172a, #1e293b, #334155, #1e293b);
        background-size: 400% 400%;
        animation: gradient 15s ease infinite;
      }
    `}</style>
      <div className="animated-gradient text-white min-h-screen font-sans p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-8">
            <h1
              className="text-5xl font-extrabold text-yellow-400 tracking-wider drop-shadow-lg"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              Pokémon Battle
            </h1>
            <p className="text-gray-400 mt-2">
              Pilih Pokemon-mu dan kalahkan lawan!
            </p>
          </header>

          <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-8 items-center mb-8">
            {/* Opponent Card (Tampil di atas pada mobile, di kanan pada desktop) */}
            <div className="flex justify-center transition-opacity duration-500 order-1 md:order-3 w-full">
              {opponentPokemon ? (
                <PokemonCard
                  pokemon={opponentPokemon}
                  isOpponent={true}
                  animationState={attackAnimation.opponent}
                />
              ) : (
                <div className="bg-gray-800/50 w-full max-w-sm h-72 rounded-2xl flex items-center justify-center text-gray-500 border-4 border-dashed border-gray-700">
                  <p>Mencari lawan...</p>
                </div>
              )}
            </div>

            {/* Attack Button (Tampil di tengah) */}
            <div className="text-center order-2 md:order-2">
              <button
                onClick={handleAttack}
                disabled={
                  !selectedPlayerPokemon ||
                  !!winner ||
                  attackAnimation.player !== "idle"
                }
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200 border-b-4 border-red-800 active:border-b-0"
              >
                SERANG!
              </button>
              {winner && (
                <div className="mt-6 animate-bounce">
                  <p
                    className={`text-2xl font-bold ${
                      winner === "player" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {winner === "player" ? "KAMU MENANG!" : "KAMU KALAH!"}
                  </p>
                  <button
                    onClick={fetchNewOpponent}
                    className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition-transform duration-200 hover:scale-110"
                  >
                    Cari Lawan Baru
                  </button>
                </div>
              )}
            </div>

            {/* Player Card (Tampil di bawah pada mobile, di kiri pada desktop) */}
            <div className="flex justify-center transition-opacity duration-500 order-3 md:order-1 w-full">
              {selectedPlayerPokemon ? (
                <PokemonCard
                  pokemon={selectedPlayerPokemon}
                  isSelected={true}
                  animationState={attackAnimation.player}
                />
              ) : (
                <div className="bg-gray-800/50 w-full max-w-sm h-72 rounded-2xl flex items-center justify-center text-gray-500 border-4 border-dashed border-gray-700">
                  <p>Pilih Pokemon dari daftar</p>
                </div>
              )}
            </div>
          </div>

          <div
            ref={logContainerRef}
            className="bg-gray-900/70 rounded-lg p-4 h-48 overflow-y-auto border border-gray-700 mb-8 backdrop-blur-sm"
          >
            {gameLog.map((log, index) => (
              <p
                key={index}
                className={`log-entary font-mono text-sm ${getLogStyle(
                  log.type
                )}`}
              >
                <span className="mr-2">&gt;</span>
                {log.text}
              </p>
            ))}
          </div>

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
    </>
  );
}

export default App;
