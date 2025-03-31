import React, { useEffect, useState } from 'react';
import { Search, Trophy, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface Player {
  id: string;
  username: string;
  display_name: string | null;
  totalGames: number;
  winRate: number;
  recentGames: number;
  favoriteDecks: Array<{
    name: string;
    gamesPlayed: number;
  }>;
}

function Players() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        if (!user) return;

        // Get all players and their game statistics
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select(`
            id,
            username,
            display_name,
            game_participants (
              id,
              won,
              created_at,
              deck:decks (
                id,
                name
              )
            )
          `);

        if (playersError) throw playersError;

        // Process the data to calculate statistics
        const processedPlayers = (playersData || []).map(player => {
          const games = player.game_participants || [];
          const totalGames = games.length;
          const wins = games.filter(game => game.won).length;
          const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

          // Calculate recent games (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const recentGames = games.filter(game => 
            new Date(game.created_at) > thirtyDaysAgo
          ).length;

          // Calculate favorite decks
          const deckStats = games.reduce((acc, game) => {
            const deckName = game.deck.name;
            acc[deckName] = (acc[deckName] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const favoriteDecks = Object.entries(deckStats)
            .map(([name, gamesPlayed]) => ({ name, gamesPlayed }))
            .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
            .slice(0, 3);

          return {
            id: player.id,
            username: player.username,
            display_name: player.display_name,
            totalGames,
            winRate,
            recentGames,
            favoriteDecks,
          };
        });

        setPlayers(processedPlayers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, [user]);

  const filteredPlayers = players.filter(player => {
    const searchString = searchQuery.toLowerCase();
    const displayName = (player.display_name || player.username).toLowerCase();
    return displayName.includes(searchString) ||
           player.favoriteDecks.some(deck => deck.name.toLowerCase().includes(searchString));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading players...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Players</h1>
        <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg">
          <Users className="w-5 h-5 text-white/60" />
          <span className="text-white">{players.length} players</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlayers.map((player) => (
          <PlayerCard key={player.id} {...player} />
        ))}
      </div>
    </div>
  );
}

function PlayerCard({ username, display_name, totalGames, winRate, favoriteDecks, recentGames }: Player) {
  const displayedName = display_name || username;
  
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
          <span className="text-white font-bold text-xl">
            {displayedName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">{displayedName}</h3>
          <div className="flex items-center space-x-2 text-white/60">
            <span>{totalGames} games total</span>
            <span className="text-white/40">•</span>
            <span>{recentGames} this month</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white/60">Win Rate</span>
          <div className="flex items-center space-x-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-medium">{winRate}%</span>
          </div>
        </div>

        <div>
          <p className="text-white/60 mb-2">Favorite Decks</p>
          <div className="flex flex-wrap gap-2">
            {favoriteDecks.map((deck, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/5 rounded text-sm text-white/80"
                title={`${deck.gamesPlayed} games played`}
              >
                {deck.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Players;