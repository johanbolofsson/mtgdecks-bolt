import React, { useState } from 'react';
import { Search, Trophy, Users } from 'lucide-react';

const mockPlayers = [
  {
    username: "Sarah Chen",
    totalGames: 45,
    winRate: 68,
    favoriteDecks: ['Ur-Dragon EDH', 'Modern Burn'],
    recentGames: 12,
  },
  {
    username: "Mike Ross",
    totalGames: 38,
    winRate: 55,
    favoriteDecks: ['Atraxa Superfriends', 'Modern Burn'],
    recentGames: 8,
  },
  {
    username: "Alex Wong",
    totalGames: 52,
    winRate: 62,
    favoriteDecks: ['Yuriko Ninjas', 'Prosper Artifacts'],
    recentGames: 15,
  },
  {
    username: "Emma Davis",
    totalGames: 33,
    winRate: 48,
    favoriteDecks: ['Muldrotha Value', 'Atraxa Superfriends'],
    recentGames: 6,
  },
  {
    username: "David Kim",
    totalGames: 41,
    winRate: 58,
    favoriteDecks: ['Krenko Goblins', 'Modern Burn'],
    recentGames: 9,
  },
  {
    username: "James Wilson",
    totalGames: 29,
    winRate: 52,
    favoriteDecks: ['Prosper Artifacts', 'Yuriko Ninjas'],
    recentGames: 7,
  }
];

function Players() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlayers = mockPlayers.filter(player =>
    player.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.favoriteDecks.some(deck => deck.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Players</h1>
        <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg">
          <Users className="w-5 h-5 text-white/60" />
          <span className="text-white">{mockPlayers.length} players</span>
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
        {filteredPlayers.map((player, index) => (
          <PlayerCard key={index} {...player} />
        ))}
      </div>
    </div>
  );
}

function PlayerCard({ username, totalGames, winRate, favoriteDecks, recentGames }: {
  username: string;
  totalGames: number;
  winRate: number;
  favoriteDecks: string[];
  recentGames: number;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
          <span className="text-white font-bold text-xl">
            {username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">{username}</h3>
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
              >
                {deck}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Players;