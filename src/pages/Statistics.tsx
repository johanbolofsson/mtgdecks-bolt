import React from 'react';
import { Trophy, ScrollText, TrendingUp } from 'lucide-react';

function Statistics() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Statistics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Trophy className="w-8 h-8 text-yellow-400" />}
          title="Total Games"
          value="24 games"
        />
        <StatCard
          icon={<ScrollText className="w-8 h-8 text-blue-400" />}
          title="Total Decks"
          value="8 decks"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8 text-green-400" />}
          title="Overall Win Rate"
          value="65%"
        />
      </div>

      {/* Add more statistics sections here */}
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