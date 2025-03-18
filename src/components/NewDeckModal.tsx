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
          properties: {
            format,
            commander: format === 'Commander' ? commander : null,
            colorIdentity: colors
          }
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
            <div className="flex">
              <ColorCheckbox
                color="white"
                label="White"
                checked={colors.white}
                onChange={() => handleColorChange('white')}
                disabled={colors.colorless}
              />
              <ColorCheckbox
                color="blue"
                label="Blue"
                checked={colors.blue}
                onChange={() => handleColorChange('blue')}
                disabled={colors.colorless}
              />
              <ColorCheckbox
                color="black"
                label="Black"
                checked={colors.black}
                onChange={() => handleColorChange('black')}
                disabled={colors.colorless}
              />
              <ColorCheckbox
                color="red"
                label="Red"
                checked={colors.red}
                onChange={() => handleColorChange('red')}
                disabled={colors.colorless}
              />
              <ColorCheckbox
                color="green"
                label="Green"
                checked={colors.green}
                onChange={() => handleColorChange('green')}
                disabled={colors.colorless}
              />
              <ColorCheckbox
                color="colorless"
                label="Colorless"
                checked={colors.colorless}
                onChange={() => handleColorChange('colorless')}
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

function ColorCheckbox({ 
  label,
  checked, 
  onChange, 
  disabled 
}: { 
  color: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
}) {
  return (
    <div className='flex items-center me-4'>
        <input
          id={label}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <label htmlFor={label} className={`ms-2 text-white/60 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} >{label}</label>
    </div>
  );
}

export default NewDeckModal;