import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDeckId: string | null;
}

interface Player {
  id: string;
  username: string;
  decks: {
    id: string;
    name: string;
  }[];
}

interface GameParticipant {
  playerId: string;
  deckId: string;
  won: boolean;
}

function NewGameModal({ isOpen, onClose, selectedDeckId }: NewGameModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [participants, setParticipants] = useState<GameParticipant[]>([]);
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().slice(0, 16));
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current player
      const { data: currentPlayerData, error: currentPlayerError } = await supabase
        .from('players')
        .select(`
          id,
          username,
          decks (
            id,
            name
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (currentPlayerError) throw currentPlayerError;
      setCurrentPlayer(currentPlayerData);

      // Initialize current player as first participant if they have decks
      if (currentPlayerData && currentPlayerData.decks.length > 0) {
        const initialDeckId = selectedDeckId || currentPlayerData.decks[0].id;
        setParticipants([{
          playerId: currentPlayerData.id,
          deckId: initialDeckId,
          won: false
        }]);
      }

      // Get all other players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select(`
          id,
          username,
          decks (
            id,
            name
          )
        `)
        .neq('user_id', user?.id);

      if (playersError) throw playersError;
      setPlayers(playersData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = (playerId: string, deckId: string) => {
    if (!participants.some(p => p.playerId === playerId)) {
      setParticipants([...participants, { playerId, deckId, won: false }]);
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    setParticipants(participants.filter(p => p.playerId !== playerId));
  };

  const handleWinStateChange = (playerId: string, won: boolean) => {
    setParticipants(participants.map(p => 
      p.playerId === playerId ? { ...p, won } : { ...p, won: false }
    ));
  };

  const handleDeckChange = (playerId: string, deckId: string) => {
    setParticipants(participants.map(p =>
      p.playerId === playerId ? { ...p, deckId } : p
    ));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate that exactly one player has won
      const winners = participants.filter(p => p.won);
      if (winners.length !== 1) {
        throw new Error('Exactly one player must be marked as the winner');
      }

      // Create new game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          played_at: new Date(playedAt).toISOString(),
          location: location || null
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Create game participants
      const { error: participantsError } = await supabase
        .from('game_participants')
        .insert(
          participants.map(p => ({
            game_id: gameData.id,
            player_id: p.playerId,
            deck_id: p.deckId,
            won: p.won
          }))
        );

      if (participantsError) throw participantsError;

      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredPlayers = players.filter(player =>
    player.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.decks.some(deck => deck.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const hasWinner = participants.some(p => p.won);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">New Game</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          {loading ? (
            <div className="text-center text-white/60">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Date and Time</span>
                    </div>
                  </label>
                  <input
                    type="datetime-local"
                    value={playedAt}
                    onChange={(e) => setPlayedAt(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Location (Optional)</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Local Game Store"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <h3 className="block text-sm font-medium text-white/60 mb-2">Game Participants</h3>
                <div className='flex flex-col gap-4'>
                  {participants.map((participant) => {
                    const player = participant.playerId === currentPlayer?.id 
                      ? currentPlayer 
                      : players.find(p => p.id === participant.playerId);
                    
                    return player ? (
                      <div
                        key={participant.playerId}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-white/5 rounded-lg"
                      >
                        <div>
                          <p className="text-white font-medium">{player.username}</p>
                        </div>
                        <div>
                        <select
                            value={participant.deckId}
                            onChange={(e) => handleDeckChange(participant.playerId, e.target.value)}
                            className="px-2 py-1 text-sm bg-white/10 rounded-lg text-white/80 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {player.decks.map((deck) => (
                              <option key={deck.id} value={deck.id} className="bg-gray-900">
                                {deck.name}
                              </option>
                            ))}
                          </select>
                          </div>
                        <div className="flex items-center space-x-4">
                          <label className="inline-flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={participant.won}
                              onChange={() => handleWinStateChange(participant.playerId, true)}
                              className="text-indigo-500 bg-white/10 border-white/20 focus:ring-indigo-500"
                            />
                            <span className="text-white/60">Winner</span>
                          </label>
                          {participant.playerId !== currentPlayer?.id && (
                            <button
                              onClick={() => handleRemovePlayer(participant.playerId)}
                              className="text-white/60 hover:text-white transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })}
              </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Add Players (Optional)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by player name or deck..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {searchQuery && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredPlayers.map(player => (
                    <div
                      key={player.id}
                      className="p-3 bg-white/5 rounded-lg space-y-2"
                    >
                      <p className="text-white font-medium">{player.username}</p>
                      <div className="flex flex-wrap gap-2">
                        {player.decks.map((deck) => (
                          <button
                            key={deck.id}
                            onClick={() => handleAddPlayer(player.id, deck.id)}
                            disabled={participants.some(p => p.playerId === player.id)}
                            className="px-2 py-1 text-sm bg-white/10 rounded-lg text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deck.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || submitting || !hasWinner || participants.length < 2}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Game'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewGameModal;