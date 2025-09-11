import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Calendar, 
  User, 
  Gamepad2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useGameSaveLoad, SaveGameData } from '@/hooks/useGameSaveLoad';
import { EnhancedMafiaGameState } from '@/hooks/useEnhancedMafiaGameState';
import { useSoundSystem } from '@/hooks/useSoundSystem';

interface SaveLoadDialogProps {
  gameState: EnhancedMafiaGameState;
  onLoadGame: (gameState: EnhancedMafiaGameState) => void;
  trigger?: React.ReactNode;
}

const SaveLoadDialog: React.FC<SaveLoadDialogProps> = ({ 
  gameState, 
  onLoadGame, 
  trigger 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('save');
  const [saveSlots, setSaveSlots] = useState<Array<{ slot: number; saveData?: SaveGameData; exists: boolean }>>([]);
  const [playerName, setPlayerName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { 
    saveGame, 
    loadGame, 
    getSaveSlots, 
    deleteSave, 
    exportSave, 
    importSave 
  } = useGameSaveLoad();
  
  const { playSound } = useSoundSystem();

  // Load save slots when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSaveSlots(getSaveSlots());
    }
  }, [isOpen, getSaveSlots]);

  const handleSave = async (slot: number) => {
    playSound('success');
    const result = saveGame(gameState, slot, playerName || undefined);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    
    if (result.success) {
      setSaveSlots(getSaveSlots());
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleLoad = async (slot: number) => {
    playSound('click');
    const result = loadGame(slot);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    
    if (result.success && result.gameState) {
      onLoadGame(result.gameState);
      setIsOpen(false);
    }
  };

  const handleDelete = async (slot: number) => {
    playSound('error');
    const result = deleteSave(slot);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    
    if (result.success) {
      setSaveSlots(getSaveSlots());
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleExport = async (slot: number) => {
    playSound('success');
    const result = exportSave(slot);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    playSound('success');
    const result = await importSave(file, 1);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    
    if (result.success) {
      setSaveSlots(getSaveSlots());
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFamilyEmoji = (family: string) => {
    const emojis: Record<string, string> = {
      gambino: '🎩',
      genovese: '💼',
      lucchese: '🎭',
      bonanno: '🎪',
      colombo: '🎯',
    };
    return emojis[family] || '🎲';
  };

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
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Game Save & Load
          </DialogTitle>
        </DialogHeader>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-3 rounded-md flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
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
            <div className="space-y-4">
              <div>
                <Label htmlFor="playerName">Player Name (Optional)</Label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map((slot) => (
                  <Card key={slot} className="relative">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        Save Slot {slot}
                        {saveSlots.find(s => s.slot === slot)?.exists && (
                          <Badge variant="secondary" className="text-xs">
                            Occupied
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {saveSlots.find(s => s.slot === slot)?.exists ? (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(saveSlots.find(s => s.slot === slot)?.saveData?.saveDate || '')}
                            </div>
                            {saveSlots.find(s => s.slot === slot)?.saveData?.playerName && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {saveSlots.find(s => s.slot === slot)?.saveData?.playerName}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSave(slot)}
                            className="w-full"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Overwrite
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSave(slot)}
                          className="w-full"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save Game
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="load" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {saveSlots.map((slot) => (
                <Card key={slot.slot} className="relative">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Save Slot {slot.slot}
                      {slot.exists && (
                        <Badge variant="default" className="text-xs">
                          Available
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {slot.exists && slot.saveData ? (
                      <div className="space-y-3">
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(slot.saveData.saveDate)}
                          </div>
                          {slot.saveData.playerName && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {slot.saveData.playerName}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="text-lg">
                              {getFamilyEmoji(slot.saveData.gameState.playerFamily)}
                            </span>
                            {slot.saveData.gameState.playerFamily.toUpperCase()} Family
                          </div>
                          <div className="text-xs">
                            Turn {slot.saveData.gameState.turn} • ${slot.saveData.gameState.resources.money.toLocaleString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleLoad(slot.slot)}
                          className="w-full"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Load Game
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No save data
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Export Save</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Export save data as a JSON file
                    </p>
                    <div className="space-y-2">
                      {saveSlots.filter(s => s.exists).map((slot) => (
                        <Button
                          key={slot.slot}
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport(slot.slot)}
                          className="w-full justify-start"
                        >
                          <Upload className="h-3 w-3 mr-2" />
                          Export Slot {slot.slot}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Import Save</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      Import save data from a JSON file
                    </p>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Delete Saves</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    Permanently delete save data
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {saveSlots.filter(s => s.exists).map((slot) => (
                      <Button
                        key={slot.slot}
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(slot.slot)}
                        className="w-full"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Slot {slot.slot}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SaveLoadDialog;
