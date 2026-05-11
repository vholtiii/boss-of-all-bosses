import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save, Download, Upload, Trash2, Calendar, User, Gamepad2,
  AlertTriangle, CheckCircle, Cloud, CloudOff, LogOut,
} from 'lucide-react';
import { useGameSaveLoad, SaveSlotInfo, SlotId } from '@/hooks/useGameSaveLoad';
import { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import { useSoundSystem } from '@/hooks/useSoundSystem';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import CloudAuthPanel from '@/components/CloudAuthPanel';

interface SaveLoadDialogProps {
  gameState: EnhancedMafiaGameState;
  onLoadGame: (gameState: EnhancedMafiaGameState) => void;
  trigger?: React.ReactNode;
}

const SaveLoadDialog: React.FC<SaveLoadDialogProps> = ({ gameState, onLoadGame, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('save');
  const [saveSlots, setSaveSlots] = useState<SaveSlotInfo[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  const {
    saveGame, loadGame, getSaveSlots, deleteSave, exportSave, importSave,
    cloudSyncing, isSignedIn,
  } = useGameSaveLoad();
  const { user } = useAuth();
  const { playSound } = useSoundSystem();

  const refreshSlots = async () => setSaveSlots(await getSaveSlots());

  useEffect(() => {
    if (isOpen) refreshSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isSignedIn]);

  const flash = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleSave = async (slot: SlotId) => {
    playSound('success');
    const result = await saveGame(gameState, slot, playerName || undefined);
    flash(result.success ? 'success' : 'error', result.message);
    if (result.success) await refreshSlots();
  };

  const handleLoad = async (slot: SlotId, source: 'local' | 'cloud' = 'local') => {
    playSound('click');
    const result = await loadGame(slot, source);
    flash(result.success ? 'success' : 'error', result.message);
    if (result.success && result.gameState) {
      onLoadGame(result.gameState);
      setIsOpen(false);
    }
  };

  const handleDelete = async (slot: SlotId) => {
    if (!window.confirm(`Delete save in slot ${slot}? This removes both local and cloud copies.`)) return;
    playSound('error');
    const result = await deleteSave(slot, 'both');
    flash(result.success ? 'success' : 'error', result.message);
    if (result.success) await refreshSlots();
  };

  const handleExport = async (slot: SlotId) => {
    playSound('success');
    const result = await exportSave(slot);
    flash(result.success ? 'success' : 'error', result.message);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    playSound('success');
    const result = await importSave(file, 1);
    flash(result.success ? 'success' : 'error', result.message);
    if (result.success) await refreshSlots();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    flash('success', 'Signed out');
    await refreshSlots();
  };

  const formatDate = (s: string) => new Date(s).toLocaleString();
  const getFamilyEmoji = (family: string) => (
    ({ gambino: '🎩', genovese: '💼', lucchese: '🎭', bonanno: '🎪', colombo: '🎯' } as Record<string, string>)[family] || '🎲'
  );

  const slotLabel = (id: SlotId) => (id === 'auto' ? 'Auto Save' : `Save Slot ${id}`);

  const renderSlotBadges = (s: SaveSlotInfo) => (
    <div className="flex flex-wrap gap-1">
      {s.hasLocal && <Badge variant="secondary" className="text-[10px]">Local</Badge>}
      {s.hasCloud && <Badge variant="default" className="text-[10px] gap-1"><Cloud className="h-3 w-3" />Cloud</Badge>}
      {s.conflict && (
        <Badge variant="destructive" className="text-[10px]">
          {s.newer === 'cloud' ? 'Cloud newer' : 'Local newer'}
        </Badge>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save/Load
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Game Save & Load
          </DialogTitle>
        </DialogHeader>

        {/* Cloud sync strip */}
        <div className="rounded-md border bg-card/40 p-3 flex flex-col gap-2">
          {isSignedIn ? (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Cloud className="h-4 w-4 text-primary" />
                <span>Signed in as <strong>{user?.email}</strong></span>
                <Badge variant="outline" className="text-[10px]">
                  {cloudSyncing ? 'Syncing…' : 'Cloud sync on'}
                </Badge>
              </div>
              <Button size="sm" variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-3 w-3 mr-1" /> Sign out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CloudOff className="h-4 w-4" />
                  Saves are local-only. Sign in to back them up and play across devices.
                </div>
                <Button size="sm" variant="default" onClick={() => setShowSignIn(v => !v)}>
                  {showSignIn ? 'Hide' : 'Sign in to sync'}
                </Button>
              </div>
              {showSignIn && <CloudAuthPanel onClose={() => setShowSignIn(false)} />}
            </div>
          )}
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-md flex items-center gap-2 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message.text}
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="save">Save Game</TabsTrigger>
            <TabsTrigger value="load">Load Game</TabsTrigger>
            <TabsTrigger value="manage">Manage Saves</TabsTrigger>
          </TabsList>

          <TabsContent value="save" className="space-y-4">
            {!isSignedIn ? (
              <div className="space-y-3">
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground text-center">
                  <Save className="h-6 w-6 mx-auto mb-2 opacity-60" />
                  Sign in to save your progress. Saves are stored to your account and synced across devices.
                </div>
                <CloudAuthPanel />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="playerName">Player Name (Optional)</Label>
                  <Input id="playerName" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Enter your name..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5].map((slot) => {
                    const info = saveSlots.find(s => s.slot === slot);
                    return (
                      <Card key={slot}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            Save Slot {slot}
                            {info && renderSlotBadges(info)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {info?.exists ? (
                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(info.saveData!.saveDate)}
                                </div>
                                {info.saveData!.playerName && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {info.saveData!.playerName}
                                  </div>
                                )}
                              </div>
                              <Button size="sm" className="w-full"
                                onClick={() => { if (window.confirm(`Overwrite save in slot ${slot}?`)) handleSave(slot); }}>
                                <Save className="h-3 w-3 mr-1" /> Overwrite
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => handleSave(slot)} className="w-full">
                              <Save className="h-3 w-3 mr-1" /> Save Game
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="load" className="space-y-4">
            {!isSignedIn ? (
              <div className="space-y-3">
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground text-center">
                  <Download className="h-6 w-6 mx-auto mb-2 opacity-60" />
                  Sign in to load your saved games. Or import a previously exported JSON from the Manage tab.
                </div>
                <CloudAuthPanel />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {saveSlots.map(s => (
                  <Card key={String(s.slot)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between gap-2">
                        <span>{slotLabel(s.slot)}</span>
                        {renderSlotBadges(s)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {s.exists && s.saveData ? (
                        <div className="space-y-3">
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(s.saveData.saveDate)}
                            </div>
                            {s.saveData.playerName && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />{s.saveData.playerName}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="text-lg">{getFamilyEmoji(s.saveData.gameState.playerFamily)}</span>
                              {s.saveData.gameState.playerFamily.toUpperCase()} Family
                            </div>
                            <div className="text-xs">
                              Turn {s.saveData.gameState.turn} • ${s.saveData.gameState.resources.money.toLocaleString()}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleLoad(s.slot, s.newer === 'cloud' ? 'cloud' : 'local')} className="w-full">
                            <Download className="h-3 w-3 mr-1" />
                            Load {s.newer === 'cloud' ? '(Cloud)' : ''}
                          </Button>
                          {s.conflict && (
                            <div className="grid grid-cols-2 gap-1">
                              <Button size="sm" variant="outline" onClick={() => handleLoad(s.slot, 'local')}>
                                Use Local
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleLoad(s.slot, 'cloud')}>
                                Use Cloud
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">No save data</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Export Save</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">Export save data as a JSON file</p>
                  <div className="space-y-2">
                    {saveSlots.filter(s => s.exists).map(s => (
                      <Button key={String(s.slot)} size="sm" variant="outline"
                        onClick={() => handleExport(s.slot)} className="w-full justify-start">
                        <Upload className="h-3 w-3 mr-2" />
                        Export {slotLabel(s.slot)}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Import Save</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">Import save data from a JSON file</p>
                  <Input type="file" accept=".json" onChange={handleImport} className="text-xs" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-sm">Delete Saves</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Permanently delete save data (local + cloud)</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {saveSlots.filter(s => s.exists).map(s => (
                    <Button key={String(s.slot)} size="sm" variant="destructive"
                      onClick={() => handleDelete(s.slot)} className="w-full">
                      <Trash2 className="h-3 w-3 mr-1" />
                      {s.slot === 'auto' ? 'Auto' : `Slot ${s.slot}`}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SaveLoadDialog;
