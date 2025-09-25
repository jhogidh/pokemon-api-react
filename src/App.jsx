import { Analytics } from "@vercel/analytics/react";
import React, { useState, useEffect, useMemo, useRef } from "react";

// --- DATA: Type Chart for Gen 1 ---
const TYPE_CHART = {
  normal: { not_very_effective: ["rock"], no_effect: ["ghost"] },
  fire: {
    super_effective: ["grass", "ice", "bug"],
    not_very_effective: ["fire", "water", "rock", "dragon"],
  },
  water: {
    super_effective: ["fire", "ground", "rock"],
    not_very_effective: ["water", "grass", "dragon"],
  },
  electric: {
    super_effective: ["water", "flying"],
    not_very_effective: ["electric", "grass", "dragon"],
    no_effect: ["ground"],
  },
  grass: {
    super_effective: ["water", "ground", "rock"],
    not_very_effective: ["fire", "grass", "poison", "flying", "bug", "dragon"],
  },
  ice: {
    super_effective: ["grass", "ground", "flying", "dragon"],
    not_very_effective: ["water", "ice"],
  },
  fighting: {
    super_effective: ["normal", "ice", "rock"],
    not_very_effective: ["poison", "flying", "psychic", "bug"],
    no_effect: ["ghost"],
  },
  poison: {
    super_effective: ["grass"],
    not_very_effective: ["poison", "ground", "rock", "ghost"],
  },
  ground: {
    super_effective: ["fire", "electric", "poison", "rock"],
    not_very_effective: ["grass", "bug"],
    no_effect: ["flying"],
  },
  flying: {
    super_effective: ["grass", "fighting", "bug"],
    not_very_effective: ["electric", "rock"],
  },
  psychic: {
    super_effective: ["fighting", "poison"],
    not_very_effective: ["psychic"],
  },
  bug: {
    super_effective: ["grass", "poison", "psychic"],
    not_very_effective: ["fire", "fighting", "flying", "ghost"],
  },
  rock: {
    super_effective: ["fire", "ice", "flying", "bug"],
    not_very_effective: ["fighting", "ground"],
  },
  ghost: {
    super_effective: ["ghost"],
    not_very_effective: ["psychic"],
    no_effect: ["normal"],
  },
  dragon: { super_effective: ["dragon"] },
};

const TYPE_COLORS = {
  normal: "bg-gray-400",
  fire: "bg-red-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-cyan-300",
  fighting: "bg-orange-700",
  poison: "bg-purple-600",
  ground: "bg-yellow-600",
  flying: "bg-indigo-400",
  psychic: "bg-pink-500",
  bug: "bg-lime-500",
  rock: "bg-yellow-700",
  ghost: "bg-indigo-800",
  dragon: "bg-indigo-600",
};

// --- Helper Components ---
const PokemonCard = ({ pokemon, animationState, battleStats }) => {
  if (!pokemon) return null;

  const animationClass = () => {
    if (animationState === "attacking") return "animate-attack";
    if (animationState === "taking-damage") return "animate-shake";
    return "";
  };

  return (
    <div
      className={`bg-gray-800 w-64 p-4 rounded-2xl shadow-lg transition-all duration-300 border-4 flex flex-col ${
        battleStats.isSelected
          ? "border-yellow-400 scale-105"
          : "border-gray-700"
      } ${battleStats.isOpponent ? "border-red-500" : ""} ${animationClass()}`}
    >
      {/* Image Container with Types */}
      <div className="relative bg-gray-900/50 rounded-xl h-36 mb-3">
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
          {pokemon.types.map(({ type }) => (
            <span
              key={type.name}
              className={`px-2 py-1 text-xs font-bold text-white rounded-full ${
                TYPE_COLORS[type.name] || "bg-gray-500"
              }`}
            >
              {type.name.toUpperCase()}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-center h-full">
          <img
            src={pokemon.sprites.front_default}
            alt={pokemon.name}
            className="h-32 w-32 drop-shadow-lg"
          />
        </div>
      </div>

      {/* Name */}
      <h2 className="text-xl font-bold capitalize text-center text-white mb-3">
        {pokemon.name}
      </h2>

      {/* Stats */}
      <div className="space-y-2 text-sm mt-auto">
        <StatBar
          label="HP"
          value={battleStats.currentHp}
          maxValue={battleStats.maxHp}
          color="bg-green-500"
          isHp={true}
        />
        <StatBar
          label="Attack"
          value={pokemon.stats.find((s) => s.stat.name === "attack").base_stat}
          maxValue={190}
          color="bg-red-500"
        />
        <StatBar
          label="Defense"
          value={pokemon.stats.find((s) => s.stat.name === "defense").base_stat}
          maxValue={250}
          color="bg-blue-500"
        />
      </div>
    </div>
  );
};

const StatBar = ({ label, value, maxValue, color, isHp = false }) => (
  <div>
    <div className="flex justify-between font-semibold text-gray-300 mb-1">
      <span>{label}</span>
      <span>{isHp ? `${value} / ${maxValue}` : value}</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden border-2 border-gray-600">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
        style={{ width: `${(value / maxValue) * 100}%` }}
      ></div>
    </div>
  </div>
);

// --- Footer Component ---
const Footer = () => (
  <footer className="text-center py-6 mt-12 border-t border-gray-700/50">
    <p className="text-gray-400 text-sm">Dibuat menggunakan React & PokéAPI.</p>
    <p className="text-gray-500 text-xs mt-1">
      Simple Minigame Pokemon{" "}
      <a href="https://instagram.com/jo.gidion">@jo.gidion</a>.
    </p>
  </footer>
);

// --- Main App Component ---
function App() {
  // PENTING: Jika latar belakang Anda masih putih,
  // periksa file src/index.css atau src/App.css Anda.
  // Hapus semua aturan `background-color` dari tag `body` atau `html`
  // agar latar belakang gradasi ini dapat terlihat.

  const [playerPokemonList, setPlayerPokemonList] = useState([]);
  const [selectedPlayerPokemon, setSelectedPlayerPokemon] = useState(null);
  const [opponentPokemon, setOpponentPokemon] = useState(null);
  const [battleState, setBattleState] = useState({
    playerHp: 0,
    opponentHp: 0,
  });
  const [currentTurn, setCurrentTurn] = useState("player"); // 'player', 'opponent', 'gameOver'
  const [isLoading, setIsLoading] = useState(true);
  const [gameLog, setGameLog] = useState([
    { type: "system", text: "Selamat datang di Arena Pertarungan Pokémon!" },
  ]);
  const [attackAnimation, setAttackAnimation] = useState({
    player: "idle",
    opponent: "idle",
  });
  const logContainerRef = useRef(null);

  const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";

  useEffect(() => {
    if (logContainerRef.current)
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [gameLog]);

  const fetchPokemonDetails = async (url) => (await fetch(url)).json();

  useEffect(() => {
    const fetchInitialPokemon = async () => {
      try {
        setIsLoading(true);
        const { results } = await (
          await fetch(`${POKEAPI_BASE_URL}?limit=12`)
        ).json();
        const detailedList = await Promise.all(
          results.map((p) => fetchPokemonDetails(p.url))
        );
        setPlayerPokemonList(detailedList);
        await fetchNewOpponent();
      } catch (error) {
        console.error("Gagal mengambil data Pokemon:", error);
        addLog("Gagal memuat Pokemon.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialPokemon();
  }, []);

  const playerMaxHp = useMemo(
    () =>
      selectedPlayerPokemon?.stats.find((s) => s.stat.name === "hp")
        .base_stat || 0,
    [selectedPlayerPokemon]
  );
  const opponentMaxHp = useMemo(
    () =>
      opponentPokemon?.stats.find((s) => s.stat.name === "hp").base_stat || 0,
    [opponentPokemon]
  );

  useEffect(() => {
    if (selectedPlayerPokemon && opponentPokemon) {
      setBattleState({ playerHp: playerMaxHp, opponentHp: opponentMaxHp });
      setCurrentTurn("player");
      setGameLog([]);
      addLog(
        `Pertarungan dimulai! ${selectedPlayerPokemon.name} vs ${opponentPokemon.name}.`,
        "system"
      );
    }
  }, [selectedPlayerPokemon, opponentPokemon, playerMaxHp, opponentMaxHp]);

  useEffect(() => {
    if (currentTurn === "opponent" && battleState.opponentHp > 0) {
      const timeout = setTimeout(opponentAttack, 1500);
      return () => clearTimeout(timeout);
    }
  }, [currentTurn, battleState.opponentHp]);

  const calculateTypeMultiplier = (attackerTypes, defenderTypes) => {
    let multiplier = 1;
    for (const aType of attackerTypes) {
      const chart = TYPE_CHART[aType.type.name];
      if (!chart) continue;
      for (const dType of defenderTypes) {
        if (chart.super_effective?.includes(dType.type.name)) multiplier *= 2;
        if (chart.not_very_effective?.includes(dType.type.name))
          multiplier *= 0.5;
        if (chart.no_effect?.includes(dType.type.name)) return 0;
      }
    }
    return multiplier;
  };

  const calculateDamage = (attacker, defender) => {
    const attackerStats = attacker.stats;
    const defenderStats = defender.stats;
    const attack = attackerStats.find(
      (s) => s.stat.name === "attack"
    ).base_stat;
    const defense = defenderStats.find(
      (s) => s.stat.name === "defense"
    ).base_stat;

    const multiplier = calculateTypeMultiplier(attacker.types, defender.types);

    if (multiplier > 1) addLog("Serangan ini sangat efektif!", "victory");
    if (multiplier < 1 && multiplier > 0)
      addLog("Serangan ini kurang efektif...", "info");
    if (multiplier === 0) addLog("Serangan tidak berpengaruh...", "info");

    const baseDamage = Math.floor(
      (((2 * 50) / 5 + 2) * attack * 60) / defense / 50 + 2
    );
    return Math.floor(baseDamage * multiplier * (Math.random() * 0.15 + 0.85));
  };

  const handleAttack = () => {
    if (currentTurn !== "player" || !selectedPlayerPokemon) return;

    addLog(`${selectedPlayerPokemon.name} menyerang!`, "player-attack");
    setAttackAnimation({ player: "attacking", opponent: "idle" });

    setTimeout(() => {
      const damage = calculateDamage(selectedPlayerPokemon, opponentPokemon);
      const newOpponentHp = Math.max(0, battleState.opponentHp - damage);
      setBattleState((prev) => ({ ...prev, opponentHp: newOpponentHp }));
      setAttackAnimation({ player: "idle", opponent: "taking-damage" });
      addLog(
        `${opponentPokemon.name} menerima ${damage} kerusakan.`,
        "opponent-damage"
      );

      setTimeout(() => {
        setAttackAnimation({ player: "idle", opponent: "idle" });
        if (newOpponentHp === 0) {
          addLog(`${opponentPokemon.name} pingsan! Kamu menang!`, "victory");
          setCurrentTurn("gameOver");
        } else {
          setCurrentTurn("opponent");
        }
      }, 500);
    }, 600);
  };

  const opponentAttack = () => {
    addLog(`${opponentPokemon.name} balas menyerang!`, "opponent-attack");
    setAttackAnimation({ player: "idle", opponent: "attacking" });

    setTimeout(() => {
      const damage = calculateDamage(opponentPokemon, selectedPlayerPokemon);
      const newPlayerHp = Math.max(0, battleState.playerHp - damage);
      setBattleState((prev) => ({ ...prev, playerHp: newPlayerHp }));
      setAttackAnimation({ player: "taking-damage", opponent: "idle" });
      addLog(
        `${selectedPlayerPokemon.name} menerima ${damage} kerusakan.`,
        "player-damage"
      );

      setTimeout(() => {
        setAttackAnimation({ player: "idle", opponent: "idle" });
        if (newPlayerHp === 0) {
          addLog(
            `${selectedPlayerPokemon.name} pingsan! Kamu kalah!`,
            "defeat"
          );
          setCurrentTurn("gameOver");
        } else {
          setCurrentTurn("player");
        }
      }, 500);
    }, 600);
  };

  const fetchNewOpponent = async () => {
    try {
      setIsLoading(true);
      setCurrentTurn("gameOver");
      setSelectedPlayerPokemon(null);
      addLog("Mencari lawan baru...", "system");
      const randomId = Math.floor(Math.random() * 151) + 1;
      const opponentDetails = await fetchPokemonDetails(
        `${POKEAPI_BASE_URL}/${randomId}`
      );
      setOpponentPokemon(opponentDetails);
    } catch (error) {
      console.error("Gagal mengambil data lawan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addLog = (text, type = "info") =>
    setGameLog((prev) => [...prev, { type, text }]);

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
            <div className="flex justify-center transition-opacity duration-500 order-1 md:order-3 w-full">
              {opponentPokemon && (
                <PokemonCard
                  pokemon={opponentPokemon}
                  animationState={attackAnimation.opponent}
                  battleStats={{
                    isOpponent: true,
                    currentHp: battleState.opponentHp,
                    maxHp: opponentMaxHp,
                  }}
                />
              )}
            </div>

            <div className="text-center order-2 md:order-2">
              <button
                onClick={handleAttack}
                disabled={currentTurn !== "player" || !selectedPlayerPokemon}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all duration-200 border-b-4 border-red-800 active:border-b-0"
              >
                SERANG!
              </button>
              {currentTurn === "gameOver" && battleState.playerHp > 0 && (
                <div className="mt-6 animate-bounce">
                  <p className="text-2xl font-bold text-green-400">
                    KAMU MENANG!
                  </p>
                  <button
                    onClick={fetchNewOpponent}
                    className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg"
                  >
                    Cari Lawan Baru
                  </button>
                </div>
              )}
              {currentTurn === "gameOver" && battleState.playerHp === 0 && (
                <div className="mt-6">
                  <p className="text-2xl font-bold text-red-400">KAMU KALAH!</p>
                  <button
                    onClick={fetchNewOpponent}
                    className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-center transition-opacity duration-500 order-3 md:order-1 w-full">
              {selectedPlayerPokemon ? (
                <PokemonCard
                  pokemon={selectedPlayerPokemon}
                  animationState={attackAnimation.player}
                  battleStats={{
                    isSelected: true,
                    currentHp: battleState.playerHp,
                    maxHp: playerMaxHp,
                  }}
                />
              ) : (
                <div className="bg-gray-800/50 w-64 h-[356px] rounded-2xl flex items-center justify-center text-gray-500 border-4 border-dashed border-gray-700">
                  <p>Pilih Pokemon untuk Bertarung</p>
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
                className={`log-entry font-mono text-sm ${getLogStyle(
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
                  onClick={() =>
                    currentTurn === "gameOver"
                      ? fetchNewOpponent().then(() =>
                          setSelectedPlayerPokemon(p)
                        )
                      : setSelectedPlayerPokemon(p)
                  }
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
        <Footer />
        <Analytics />
      </div>
    </>
  );
}

export default App;
