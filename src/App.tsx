import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Users, PlusCircle, Trophy, Layout, Menu, X, BarChart, LogOut, ScrollText, UserCircle } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import Players from './pages/Players';
import Statistics from './pages/Statistics';
import Profile from './pages/Profile';
import Login from './pages/Login';
import NewGameModal from './components/NewGameModal';
import NewDeckModal from './components/NewDeckModal';
import { PrivateRoute } from './components/PrivateRoute';
import { AuthProvider, useAuth } from './lib/auth';

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);
  const [isNewDeckModalOpen, setIsNewDeckModalOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const { signOut } = useAuth();

  const handleNewGame = (deckId?: string) => {
    setSelectedDeckId(deckId || null);
    setIsNewGameModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Layout className="w-8 h-8 text-white" />
              <span className="text-xl font-bold text-white">MtG Deck Stats</span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <NavLink to="/decks" icon={<ScrollText />} text="Decks" />
              <NavLink to="/games" icon={<Trophy />} text="Games" />
              <NavLink to="/players" icon={<Users />} text="Players" />
              <NavLink to="/statistics" icon={<BarChart />} text="Statistics" />
              <NavLink to="/profile" icon={<UserCircle />} text="Profile" />
              <button 
                onClick={() => setIsNewDeckModalOpen(true)} 
                className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Deck</span>
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-1 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <MobileNavLink to="/decks" icon={<ScrollText />} text="Decks" onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink to="/games" icon={<Trophy />} text="Games" onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink to="/players" icon={<Users />} text="Players" onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink to="/statistics" icon={<BarChart />} text="Statistics" onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink to="/profile" icon={<UserCircle />} text="Profile" onClick={() => setIsMenuOpen(false)} />
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                setIsNewDeckModalOpen(true);
              }}
              className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Deck</span>
            </button>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard onNewGame={handleNewGame} />
            </PrivateRoute>
          } />
          <Route path="/decks" element={
            <PrivateRoute>
              <Dashboard onNewGame={handleNewGame} />
            </PrivateRoute>
          } />
          <Route path="/games" element={
            <PrivateRoute>
              <Games />
            </PrivateRoute>
          } />
          <Route path="/players" element={
            <PrivateRoute>
              <Players />
            </PrivateRoute>
          } />
          <Route path="/statistics" element={
            <PrivateRoute>
              <Statistics />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />
        </Routes>
      </main>

      <NewGameModal 
        isOpen={isNewGameModalOpen} 
        onClose={() => setIsNewGameModalOpen(false)}
        selectedDeckId={selectedDeckId}
      />
      <NewDeckModal
        isOpen={isNewDeckModalOpen}
        onClose={() => setIsNewDeckModalOpen(false)}
      />
    </div>
  );
}

function NavLink({ to, icon, text }: { to: string; icon: React.ReactNode; text: string }) {
  return (
    <Link
      to={to}
      className="flex items-center space-x-1 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
}

function MobileNavLink({ to, icon, text, onClick }: { 
  to: string; 
  icon: React.ReactNode; 
  text: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;