import React, { useState } from 'react';
import { PlusCircle, Search, Trophy, Users } from 'lucide-react';

const mockDecks = [
  {
    name: "Ur-Dragon EDH",
    format: "Commander",
    commander: "The Ur-Dragon",
    winRate: 75,
    totalGames: 12,
  },
  {
    name: "Yuriko Ninjas",
    format: "Commander",
    commander: "Yuriko, the Tiger's Shadow",
    winRate: 68,
    totalGames: 15,
  },
  {
    name: "Atraxa Superfriends",
    format: "Commander",
    commander: "Atraxa, Praetors' Voice",
    winRate: 62,
    totalGames: 8,
  },
  {
    name: "Modern Burn",
    format: "Modern",
    winRate: 58,
    totalGames: 25,
  },
  {
    name: "Krenko Goblins",
    format: "Commander",
    commander: "Krenko, Mob Boss",
    winRate: 55,
    totalGames: 11,
  },
  {
    name: "Muldrotha Value",
    format: "Commander",
    commander: "Muldrotha, the Gravetide",
    winRate: 52,
    totalGames: 17,
  }
];

function Decks() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDecks = mockDecks.filter(deck =>
    deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.format.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.commander?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">My Decks</h1>
        <button className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
          <PlusCircle className="w-4 h-4" />
          <span>New Deck</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
        <input
          type="text"
          placeholder="Search decks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDecks.map((deck, index) => (
          <DeckCard key={index} {...deck} />
        ))}
      </div>
    </div>
  );
}

function DeckCard({ name, format, commander, winRate, totalGames }: {
  name: string;
  format: string;
  commander?: string;
  winRate: number;
  totalGames: number;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-indigo-500 transition-colors cursor-pointer">
      <h3 className="text-xl font-semibold text-white mb-2 break-words">{name}</h3>
      <div className="space-y-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-1 bg-white/5 rounded text-sm text-white/80">{format}</span>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">{totalGames} games</span>
          </div>
        </div>
        {commander && (
          <p className="text-white/60 text-sm break-words">
            {commander}
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
        <div className="w-full sm:w-24 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500"
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default Decks;