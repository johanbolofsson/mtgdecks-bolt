import React from 'react';
import { format } from 'date-fns';
import { Trophy, Users } from 'lucide-react';

const mockGames = [
  {
    id: 1,
    date: new Date('2024-02-28T15:30:00'),
    players: [
      { name: 'Sarah Chen', deck: 'Ur-Dragon EDH', won: true },
      { name: 'Mike Ross', deck: 'Atraxa Superfriends', won: false },
      { name: 'David Kim', deck: 'Krenko Goblins', won: false },
    ],
  },
  {
    id: 2,
    date: new Date('2024-02-27T20:15:00'),
    players: [
      { name: 'Sarah Chen', deck: 'Ur-Dragon EDH', won: false },
      { name: 'Alex Wong', deck: 'Yuriko Ninjas', won: true },
      { name: 'Emma Davis', deck: 'Muldrotha Value', won: false },
      { name: 'James Wilson', deck: 'Prosper Artifacts', won: false },
    ],
  },
  {
    id: 3,
    date: new Date('2024-02-27T18:00:00'),
    players: [
      { name: 'Mike Ross', deck: 'Modern Burn', won: true },
      { name: 'David Kim', deck: 'Krenko Goblins', won: false },
      { name: 'Emma Davis', deck: 'Muldrotha Value', won: false },
    ],
  },
  {
    id: 4,
    date: new Date('2024-02-26T19:45:00'),
    players: [
      { name: 'Alex Wong', deck: 'Yuriko Ninjas', won: true },
      { name: 'James Wilson', deck: 'Prosper Artifacts', won: false },
      { name: 'Sarah Chen', deck: 'Ur-Dragon EDH', won: false },
      { name: 'Mike Ross', deck: 'Atraxa Superfriends', won: false },
    ],
  },
];

function Games() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Game History</h1>

      <div className="space-y-6">
        {mockGames.map((game) => (
          <GameCard key={game.id} {...game} />
        ))}
      </div>
    </div>
  );
}

function GameCard({ date, players }: {
  date: Date;
  players: Array<{ name: string; deck: string; won: boolean }>;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-white/60">{format(date, 'MMMM d, yyyy')}</p>
          <p className="text-sm text-white/40">{format(date, 'h:mm a')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-white/60" />
          <span className="text-white/60">{players.length} players</span>
        </div>
      </div>

      <div className="space-y-4">
        {players.map((player, index) => (
          <div key={index} className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{player.name}</p>
              <p className="text-white/60 text-sm">{player.deck}</p>
            </div>
            {player.won && (
              <div className="flex items-center space-x-1 text-yellow-400">
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