import React, { useEffect, useState } from 'react';
import { Trophy, Users, PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface DeckProperties {
  format: string;
  commander: string | null;
  colorIdentity: {
    white: boolean;
    blue: boolean;
    black: boolean;
    red: boolean;
    green: boolean;
    colorless: boolean;
  };
}

interface Deck {
  id: string;
  name: string;
  properties: DeckProperties;
}

interface DeckWithStats extends Deck {
  totalGames: number;
  winRate: number;
}

interface DashboardProps {
  onNewGame: (deckId: string) => void;
}

function Dashboard({ onNewGame }: DashboardProps) {
  const { user } = useAuth();
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDecks() {
      try {
        // First get the player ID for the current user
        const { data: player, error: playerError } = await supabase
          .from('players')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (playerError) throw playerError;

        // Then get all decks for this player
        const { data: decksData, error: decksError } = await supabase
          .from('decks')
          .select('*')
          .eq('player_id', player.id)
          .order('name')

        if (decksError) throw decksError;

        // For each deck, get its games and calculate stats
        const decksWithStats = await Promise.all(decksData.map(async (deck) => {
          const { data: participations, error: gamesError } = await supabase
            .from('game_participants')
            .select('won')
            .eq('deck_id', deck.id);

          if (gamesError) throw gamesError;

          const totalGames = participations?.length || 0;
          const wins = participations?.filter(p => p.won)?.length || 0;
          const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

          return {
            ...deck,
            totalGames,
            winRate,
          };
        }));
        setDecks(decksWithStats.sort((d1, d2) => d2.winRate - d1.winRate || d2.totalGames - d1.totalGames));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchDecks();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading decks...</div>
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

  if (decks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-4">You haven't created any decks yet.</p>
        <p className="text-white/60">Click the "New Deck" button to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((deck) => (
          <DeckCard key={deck.id} {...deck} onNewGame={onNewGame} />
        ))}
      </div>
    </div>
  );
}

interface DeckCardProps extends DeckWithStats {
  onNewGame: (deckId: string) => void;
}

function DeckCard({ id, name, properties, winRate, totalGames, onNewGame }: DeckCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-semibold text-white mb-2 break-words">{name}</h3>
      <div className="space-y-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-1 bg-white/5 rounded text-sm text-white/80">{properties.format}</span>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">{totalGames} games</span>
          </div>
        </div>
        {properties.commander && (
          <p className="text-white/60 text-sm break-words">
            {properties.commander}
          </p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-white/10">
        <div>
          <p className="text-sm text-white/60">Win Rate</p>
          <div className="flex items-center space-x-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <p className="text-lg font-semibold text-white">{winRate}%</p>
          </div>
        </div>
        <button
          onClick={() => onNewGame(id)}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Game</span>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;