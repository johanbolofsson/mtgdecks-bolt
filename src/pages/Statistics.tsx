import React, { useEffect, useState } from 'react';
import { Trophy, ScrollText, TrendingUp, Users, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { format } from 'date-fns';

interface Statistics {
  totalGames: number;
  totalDecks: number;
  winRate: number;
  totalPlayers: number;
  mostPlayedDeck: {
    name: string;
    gamesPlayed: number;
    winRate: number;
  } | null;
  leastPlayedDeck: {
    name: string;
    gamesPlayed: number;
    winRate: number;
  } | null;
  recentGames: Array<{
    id: string;
    played_at: string;
    winner: {
      username: string;
      display_name: string | null;
    };
  }>;
}

function Statistics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Statistics>({
    totalGames: 0,
    totalDecks: 0,
    winRate: 0,
    totalPlayers: 0,
    mostPlayedDeck: null,
    leastPlayedDeck: null,
    recentGames: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatistics() {
      try {
        if (!user) return;

        // Get the player ID for the current user
        const { data: player, error: playerError } = await supabase
          .from('players')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (playerError) throw playerError;

        // Get all games and decks for the current player
        const { data: participations, error: gamesError } = await supabase
          .from('game_participants')
          .select(`
            won,
            deck:decks (
              id,
              name
            ),
            game:games (
              id,
              played_at,
              game_participants (
                player:players (
                  username,
                  display_name
                ),
                won
              )
            )
          `)
          .eq('player_id', player.id);

        if (gamesError) throw gamesError;

        // Calculate statistics
        const totalGames = participations?.length || 0;
        const wins = participations?.filter(p => p.won)?.length || 0;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

        // Get total decks
        const { count: totalDecks, error: decksError } = await supabase
          .from('decks')
          .select('*', { count: 'exact', head: true })
          .eq('player_id', player.id);

        if (decksError) throw decksError;

        // Calculate deck statistics
        const deckStats = participations?.reduce((acc, game) => {
          const deckId = game.deck.id;
          if (!acc[deckId]) {
            acc[deckId] = {
              name: game.deck.name,
              gamesPlayed: 0,
              wins: 0,
            };
          }
          acc[deckId].gamesPlayed++;
          if (game.won) acc[deckId].wins++;
          return acc;
        }, {} as Record<string, { name: string; gamesPlayed: number; wins: number; }>);

        const mostPlayedDeck = Object.values(deckStats || {})
          .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
          .map(deck => ({
            name: deck.name,
            gamesPlayed: deck.gamesPlayed,
            winRate: Math.round((deck.wins / deck.gamesPlayed) * 100),
          }))[0] || null;

          const leastPlayedDeck = Object.values(deckStats || {})
          .sort((a, b) => a.gamesPlayed - b.gamesPlayed)
          .map(deck => ({
            name: deck.name,
            gamesPlayed: deck.gamesPlayed,
            winRate: Math.round((deck.wins / deck.gamesPlayed) * 100),
          }))[0] || null;

        // Get total unique players played against
        const uniquePlayers = new Set(
          participations?.flatMap(p => 
            p.game.game_participants
              .filter(gp => gp.player.username !== player.username)
              .map(gp => gp.player.username)
          )
        );

        // Get recent games
        const recentGames = participations
          ?.map(p => ({
            id: p.game.id,
            played_at: p.game.played_at,
            winner: p.game.game_participants.find(gp => gp.won)?.player || {
              username: '',
              display_name: null
            },
          }))
          .sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
          .slice(0, 5) || [];

        setStats({
          totalGames,
          totalDecks: totalDecks || 0,
          winRate,
          totalPlayers: uniquePlayers.size,
          mostPlayedDeck,
          leastPlayedDeck,
          recentGames,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStatistics();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading statistics...</div>
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
      <h1 className="text-3xl font-bold text-white">Statistics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Trophy className="w-8 h-8 text-yellow-400" />}
          title="Total Games"
          value={`${stats.totalGames} games`}
        />
        <StatCard
          icon={<ScrollText className="w-8 h-8 text-blue-400" />}
          title="Total Decks"
          value={`${stats.totalDecks} decks`}
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8 text-green-400" />}
          title="Overall Win Rate"
          value={`${stats.winRate}%`}
        />
        <StatCard
          icon={<Users className="w-8 h-8 text-indigo-400" />}
          title="Players Faced"
          value={`${stats.totalPlayers} players`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Most Played Deck */}
        {stats.mostPlayedDeck && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Most Played Deck</h2>
            <div className="space-y-4">
              <p className="text-2xl font-bold text-white">{stats.mostPlayedDeck.name}</p>
              <div className="flex space-x-4">
                <div>
                  <p className="text-sm text-white/60">Games Played</p>
                  <p className="text-lg font-semibold text-white">{stats.mostPlayedDeck.gamesPlayed}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Win Rate</p>
                  <p className="text-lg font-semibold text-white">{stats.mostPlayedDeck.winRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Least Played Deck */}
        {stats.leastPlayedDeck && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Least Played Deck</h2>
            <div className="space-y-4">
              <p className="text-2xl font-bold text-white">{stats.leastPlayedDeck.name}</p>
              <div className="flex space-x-4">
                <div>
                  <p className="text-sm text-white/60">Games Played</p>
                  <p className="text-lg font-semibold text-white">{stats.leastPlayedDeck.gamesPlayed}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Win Rate</p>
                  <p className="text-lg font-semibold text-white">{stats.leastPlayedDeck.winRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Games */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Games</h2>
          <div className="space-y-4">
            {stats.recentGames.map((game) => (
              <div key={game.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-white/60" />
                  <span className="text-white/80">{format(new Date(game.played_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-white">
                    {game.winner.display_name || game.winner.username}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  title, 
  value
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-white/5 rounded-lg">{icon}</div>
        <div>
          <h3 className="text-sm font-medium text-white/60">{title}</h3>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default Statistics;