import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Bell, Mic, Music, CloudRain } from 'lucide-react';
import type { SoundConfig } from '@/hooks/useSoundSystem';

interface SoundSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  soundConfig: SoundConfig;
  onUpdateConfig: (config: Partial<SoundConfig>) => void;
  onTestSound: (type: string) => void;
}

interface CategorySliderProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  onTest?: () => void;
  testLabel?: string;
  note?: string;
  disabled: boolean;
}

const CategorySlider: React.FC<CategorySliderProps> = ({
  icon, label, description, value, onChange, onTest, testLabel, note, disabled,
}) => {
  const isMuted = value <= 0;

  return (
    <div className={`space-y-3 rounded-lg border border-border/50 bg-card/50 p-4 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <Label className="text-sm font-semibold text-foreground">{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          data-no-sound
          onClick={() => onChange(isMuted ? 0.5 : 0)}
        >
          {isMuted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-foreground" />}
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Slider
          value={[Math.round(value * 100)]}
          min={0}
          max={100}
          step={1}
          onValueChange={([v]) => onChange(v / 100)}
          className="flex-1"
        />
        <span className="w-9 text-right text-xs font-mono text-muted-foreground">{Math.round(value * 100)}%</span>
      </div>
      {onTest && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          data-no-sound
          onClick={onTest}
          disabled={isMuted}
        >
          🔊 Test {testLabel}
        </Button>
      )}
      {note && <p className="text-[11px] italic text-muted-foreground">{note}</p>}
    </div>
  );
};

const SoundSettingsDialog: React.FC<SoundSettingsDialogProps> = ({
  open,
  onOpenChange,
  soundConfig,
  onUpdateConfig,
  onTestSound,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Volume2 className="h-5 w-5 text-primary" />
            Sound Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Master mute toggle */}
          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              {soundConfig.enabled
                ? <Volume2 className="h-5 w-5 text-primary" />
                : <VolumeX className="h-5 w-5 text-muted-foreground" />
              }
              <div>
                <Label className="text-sm font-bold text-foreground">Master Sound</Label>
                <p className="text-xs text-muted-foreground">Toggle all audio</p>
              </div>
            </div>
            <Switch
              checked={soundConfig.enabled}
              onCheckedChange={(enabled) => onUpdateConfig({ enabled })}
              data-no-sound
            />
          </div>

          {/* Channel sliders */}
          <CategorySlider
            icon={<Music className="h-4 w-4 text-amber-400" />}
            label="Music"
            description="Menu theme"
            value={soundConfig.musicVolume ?? 0.35}
            onChange={(musicVolume) => onUpdateConfig({ musicVolume })}
            note="Plays on the family selection screen."
            disabled={!soundConfig.enabled}
          />

          <CategorySlider
            icon={<CloudRain className="h-4 w-4 text-slate-300" />}
            label="Ambience"
            description="City bed under the map"
            value={soundConfig.ambienceVolume ?? 0.3}
            onChange={(ambienceVolume) => onUpdateConfig({ ambienceVolume })}
            note="Rain, traffic, crowds, sirens and distant gunfire."
            disabled={!soundConfig.enabled}
          />

          <div className={`flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-4 ${!soundConfig.enabled || (soundConfig.ambienceVolume ?? 0) <= 0 ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <Label className="text-sm font-semibold text-foreground">Ambience reacts to the game</Label>
              <p className="text-xs text-muted-foreground">
                Sirens with heat, gunfire in wartime, crowds when you're thriving.
              </p>
            </div>
            <Switch
              checked={soundConfig.ambienceReactive !== false}
              onCheckedChange={(ambienceReactive) => onUpdateConfig({ ambienceReactive })}
              data-no-sound
            />
          </div>


          <CategorySlider
            icon={<Bell className="h-4 w-4 text-blue-400" />}
            label="SFX"
            description="Beeps, clicks & alerts"
            value={soundConfig.sfxVolume}
            onChange={(sfxVolume) => onUpdateConfig({ sfxVolume })}
            onTest={() => onTestSound('upgrade')}
            testLabel="SFX"
            disabled={!soundConfig.enabled}
          />

          <CategorySlider
            icon={<Mic className="h-4 w-4 text-red-400" />}
            label="Voice"
            description="Spoken lines & gunshots"
            value={soundConfig.voiceVolume}
            onChange={(voiceVolume) => onUpdateConfig({ voiceVolume })}
            onTest={() => onTestSound('arrest')}
            testLabel="Voice"
            disabled={!soundConfig.enabled}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SoundSettingsDialog;
