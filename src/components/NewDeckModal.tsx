import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface NewDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ColorIdentity {
  white: boolean;
  blue: boolean;
  black: boolean;
  red: boolean;
  green: boolean;
  colorless: boolean;
}

const formats = ['Commander', 'Standard', 'Modern', 'Legacy', 'Vintage', 'Pioneer', 'Pauper'];

function NewDeckModal({ isOpen, onClose }: NewDeckModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [format, setFormat] = useState(formats[0]);
  const [commander, setCommander] = useState('');
  const [colors, setColors] = useState<ColorIdentity>({
    white: false,
    blue: false,
    black: false,
    red: false,
    green: false,
    colorless: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleColorChange = (color: keyof ColorIdentity) => {
    if (color === 'colorless') {
      setColors({
        white: false,
        blue: false,
        black: false,
        red: false,
        green: false,
        colorless: !colors.colorless,
      });
    } else {
      setColors({
        ...colors,
        [color]: !colors[color],
        colorless: false,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get the player ID for the current user
      const { data: players, error: playerError } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (playerError) throw playerError;

      const { error: deckError } = await supabase
        .from('decks')
        .insert({
          player_id: players.id,
          name,
          format,
          commander: format === 'Commander' ? commander : null,
          is_white: colors.white,
          is_blue: colors.blue,
          is_black: colors.black,
          is_red: colors.red,
          is_green: colors.green,
          is_colorless: colors.colorless,
        });

      if (deckError) throw deckError;

      // Reset form
      setName('');
      setFormat(formats[0]);
      setCommander('');
      setColors({
        white: false,
        blue: false,
        black: false,
        red: false,
        green: false,
        colorless: false,
      });

      // Close modal and force a page reload to refresh the data
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasColors = Object.values(colors).some(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">New Deck</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Deck Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter deck name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {formats.map((f) => (
                <option key={f} value={f} className="bg-gray-900">
                  {f}
                </option>
              ))}
            </select>
          </div>

          {format === 'Commander' && (
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Commander
              </label>
              <input
                type="text"
                value={commander}
                onChange={(e) => setCommander(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter commander name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Color Identity
            </label>
            <div className="flex flex-wrap gap-2">
              <ColorButton
                color="white"
                active={colors.white}
                onClick={() => handleColorChange('white')}
                disabled={colors.colorless}
              />
              <ColorButton
                color="blue"
                active={colors.blue}
                onClick={() => handleColorChange('blue')}
                disabled={colors.colorless}
              />
              <ColorButton
                color="black"
                active={colors.black}
                onClick={() => handleColorChange('black')}
                disabled={colors.colorless}
              />
              <ColorButton
                color="red"
                active={colors.red}
                onClick={() => handleColorChange('red')}
                disabled={colors.colorless}
              />
              <ColorButton
                color="green"
                active={colors.green}
                onClick={() => handleColorChange('green')}
                disabled={colors.colorless}
              />
              <ColorButton
                color="colorless"
                active={colors.colorless}
                onClick={() => handleColorChange('colorless')}
                disabled={Object.values(colors).some((v, i) => i < 5 && v)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </form>

        <div className="p-6 border-t border-white/10 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name || !hasColors}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Deck'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorButton({ 
  color, 
  active, 
  onClick, 
  disabled 
}: { 
  color: string; 
  active: boolean; 
  onClick: () => void;
  disabled: boolean;
}) {
  const getColorClasses = () => {
    const baseClasses = "w-10 h-10 rounded-lg border-2 transition-all";
    const activeClasses = active ? "border-white shadow-lg" : "border-transparent";
    const disabledClasses = disabled ? "opacity-30 cursor-not-allowed" : "hover:border-white/60 cursor-pointer";
    
    const colorClasses = {
      white: "bg-yellow-100",
      blue: "bg-blue-500",
      black: "bg-white/20", // Changed to a lighter shade for better contrast
      red: "bg-red-500",
      green: "bg-green-500",
      colorless: "bg-gray-400", // Changed to light gray
    }[color];

    return `${baseClasses} ${activeClasses} ${disabledClasses} ${colorClasses}`;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={getColorClasses()}
      aria-label={`Toggle ${color} color`}
    />
  );
}

export default NewDeckModal;