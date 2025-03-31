import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Trophy, Users, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface GameParticipant {
  player: {
    username: string;
    display_name: string | null;
  };
  deck: {
    name: string;
  };
  won: boolean;
}

interface Game {
  id: string;
  played_at: string;
  location: string | null;
  game_participants: GameParticipant[];
}

function Games() {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGames() {
      try {
        if (!user) return;

        // First get the player ID for the current user
        const { data: player, error: playerError } = await supabase
          .from('players')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (playerError) throw playerError;

        // Get all games where the current player participated, including all participants
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select(`
            id,
            played_at,
            location,
            game_participants!inner (
              won,
              player:players (username, display_name),
              deck:decks (name)
            )
          `)
          .eq('game_participants.player_id', player.id)
          .order('played_at', { ascending: false });

        if (gamesError) throw gamesError;

        // For each game, fetch all participants
        const gamesWithAllParticipants = await Promise.all((gamesData || []).map(async (game) => {
          const { data: allParticipants, error: participantsError } = await supabase
            .from('game_participants')
            .select(`
              won,
              player:players (username, display_name),
              deck:decks (name)
            `)
            .eq('game_id', game.id);

          if (participantsError) throw participantsError;

          return {
            ...game,
            game_participants: allParticipants || []
          };
        }));

        setGames(gamesWithAllParticipants);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading games...</div>
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

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 mb-4">You haven't played any games yet.</p>
        <p className="text-white/60">Click the "New Game" button to record your first game!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Game History</h1>
        <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg">
          <Trophy className="w-5 h-5 text-white/60" />
          <span className="text-white">{games.length} games</span>
        </div>
      </div>

      <div className="space-y-6">
        {games.map((game) => (
          <GameCard key={game.id} {...game} />
        ))}
      </div>
    </div>
  );
}

function GameCard({ played_at, location, game_participants }: Game) {
  const date = new Date(played_at);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <p className="text-white/60">{format(date, 'MMMM d, yyyy')}</p>
          <p className="text-sm text-white/40">{format(date, 'h:mm a')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {location && (
            <div className="flex items-center space-x-2 text-white/60">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-white/60" />
            <span className="text-white/60">{game_participants.length} players</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {game_participants.map((participant, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-grow">
              <div className="flex items-center space-x-2">
                <p className="text-white/60">
                  {participant.player.display_name || participant.player.username}
                </p>
                <span className="text-white/40">with</span>
                <p className="text-white font-medium bg-white/5 px-2 py-1 rounded">
                  {participant.deck.name}
                </p>
              </div>
            </div>
            {participant.won && (
              <div className="flex items-center space-x-1 text-yellow-400 ml-4">
                <Trophy className="w-5 h-5" />
                <span className="font-medium">Winner</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Games;