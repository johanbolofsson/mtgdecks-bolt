import React, { useEffect, useState } from 'react';
import { Trophy, ScrollText, TrendingUp, Users, Calendar, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { format, differenceInDays } from 'date-fns';

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
    location: string | null;
    winner: {
      username: string;
      display_name: string | null;
    } | null;
  }>;
  inactiveDecksSummary: Array<{
    name: string;
    lastPlayed: string | null;
    daysSinceLastPlayed: number | null;
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
    inactiveDecksSummary: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

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

        // Get all decks for the current player
        const { data: decks, error: decksError } = await supabase
          .from('decks')
          .select('id, name, properties')
          .eq('player_id', player.id);

        if (decksError) throw decksError;

        // Filter out inactive decks if not included
        const filteredDecks = includeInactive 
          ? decks 
          : decks.filter(deck => !deck.properties.inactive);

        // Get all games and decks for the current player
        const { data: participations, error: gamesError } = await supabase
          .from('game_participants')
          .select(`
            won,
            deck:decks (
              id,
              name,
              properties
            ),
            game:games (
              id,
              played_at,
              location,
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

        // Filter participations to only include active decks if necessary
        const filteredParticipations = includeInactive
          ? participations
          : participations?.filter(p => !p.deck.properties.inactive);

        // Calculate statistics
        const totalGames = filteredParticipations?.length || 0;
        const wins = filteredParticipations?.filter(p => p.won)?.length || 0;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

        // Calculate deck statistics including decks with zero games
        const deckStats = filteredDecks.reduce((acc, deck) => {
          acc[deck.id] = {
            name: deck.name,
            gamesPlayed: 0,
            wins: 0,
            lastPlayed: null,
          };
          return acc;
        }, {} as Record<string, { 
          name: string; 
          gamesPlayed: number; 
          wins: number; 
          lastPlayed: string | null; 
        }>);

        // Update stats for decks that have been played
        filteredParticipations?.forEach(game => {
          const deckId = game.deck.id;
          if (deckStats[deckId]) {
            deckStats[deckId].gamesPlayed++;
            if (game.won) deckStats[deckId].wins++;
            const playedAt = game.game.played_at;
            if (!deckStats[deckId].lastPlayed || playedAt > deckStats[deckId].lastPlayed) {
              deckStats[deckId].lastPlayed = playedAt;
            }
          }
        });

        const mostPlayedDeck = Object.values(deckStats)
          .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
          .map(deck => ({
            name: deck.name,
            gamesPlayed: deck.gamesPlayed,
            winRate: deck.gamesPlayed > 0 ? Math.round((deck.wins / deck.gamesPlayed) * 100) : 0,
          }))[0] || null;

        const leastPlayedDeck = Object.values(deckStats)
          .sort((a, b) => a.gamesPlayed - b.gamesPlayed)
          .map(deck => ({
            name: deck.name,
            gamesPlayed: deck.gamesPlayed,
            winRate: deck.gamesPlayed > 0 ? Math.round((deck.wins / deck.gamesPlayed) * 100) : 0,
          }))[0] || null;

        // Calculate inactive decks (not played in the last 30 days)
        const inactiveDecksSummary = Object.values(deckStats)
          .map(deck => ({
            name: deck.name,
            lastPlayed: deck.lastPlayed,
            daysSinceLastPlayed: deck.lastPlayed 
              ? differenceInDays(new Date(), new Date(deck.lastPlayed))
              : null,
          }))
          .filter(deck => deck.daysSinceLastPlayed === null || deck.daysSinceLastPlayed > 30)
          .sort((a, b) => {
            if (a.lastPlayed === null) return -1;
            if (b.lastPlayed === null) return 1;
            return new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime();
          });

        // Get total unique players played against
        const uniquePlayers = new Set(
          filteredParticipations?.flatMap(p => 
            p.game.game_participants
              .filter(gp => gp.player.username !== player.username)
              .map(gp => gp.player.username)
          )
        );

        // Get recent games
        const recentGames = filteredParticipations
          ?.map(p => ({
            id: p.game.id,
            played_at: p.game.played_at,
            location: p.game.location,
            winner: p.game.game_participants.find(gp => gp.won)?.player || null,
          }))
          .sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
          .slice(0, 5) || [];

        setStats({
          totalGames,
          totalDecks: filteredDecks.length,
          winRate,
          totalPlayers: uniquePlayers.size,
          mostPlayedDeck,
          leastPlayedDeck,
          recentGames,
          inactiveDecksSummary,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStatistics();
  }, [user, includeInactive]);

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Statistics</h1>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="w-4 h-4 text-indigo-500 bg-white/5 border-white/20 rounded focus:ring-indigo-500"
          />
          <span className="text-white/60">Include inactive decks</span>
        </label>
      </div>
      
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
                {stats.leastPlayedDeck.gamesPlayed > 0 && (
                  <div>
                    <p className="text-sm text-white/60">Win Rate</p>
                    <p className="text-lg font-semibold text-white">{stats.leastPlayedDeck.winRate}%</p>
                  </div>
                )}
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
                  {game.location && (
                    <>
                      <span className="text-white/40">•</span>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 text-white/60" />
                        <span className="text-white/60">{game.location}</span>
                      </div>
                    </>
                  )}
                </div>
                {game.winner && (
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-white">
                      {game.winner.display_name || game.winner.username}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inactive Decks */}
      {stats.inactiveDecksSummary.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">Inactive Decks</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.inactiveDecksSummary.map((deck, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <p className="font-medium text-white mb-2">{deck.name}</p>
                <p className="text-sm text-white/60">
                  {deck.lastPlayed
                    ? `Last played ${differenceInDays(new Date(), new Date(deck.lastPlayed))} days ago`
                    : 'Never played'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
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