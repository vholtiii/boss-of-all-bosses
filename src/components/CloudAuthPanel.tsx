import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

interface Props {
  onClose?: () => void;
}

const CloudAuthPanel: React.FC<Props> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleEmail = async (mode: 'signin' | 'signup') => {
    setBusy(true); setMsg(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMsg('Account created. You are signed in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMsg('Signed in.');
      }
      onClose?.();
    } catch (e: any) {
      setMsg(e?.message ?? 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true); setMsg(null);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      // If redirected, browser leaves the page.
    } catch (e: any) {
      setMsg(e?.message ?? 'Google sign-in failed');
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <div className="text-sm font-medium">Sign in to sync saves across devices</div>
      <Tabs defaultValue="signin">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Create Account</TabsTrigger>
        </TabsList>
        <TabsContent value="signin" className="space-y-2 pt-2">
          <Label htmlFor="auth-email-in" className="text-xs">Email</Label>
          <Input id="auth-email-in" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Label htmlFor="auth-pw-in" className="text-xs">Password</Label>
          <Input id="auth-pw-in" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Button size="sm" disabled={busy} onClick={() => handleEmail('signin')} className="w-full">Sign In</Button>
        </TabsContent>
        <TabsContent value="signup" className="space-y-2 pt-2">
          <Label htmlFor="auth-email-up" className="text-xs">Email</Label>
          <Input id="auth-email-up" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Label htmlFor="auth-pw-up" className="text-xs">Password (min 6 chars)</Label>
          <Input id="auth-pw-up" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Button size="sm" disabled={busy} onClick={() => handleEmail('signup')} className="w-full">Create Account</Button>
        </TabsContent>
      </Tabs>
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
      </div>
      <Button size="sm" variant="outline" disabled={busy} onClick={handleGoogle} className="w-full">
        Continue with Google
      </Button>
      {msg && <div className="text-xs text-muted-foreground">{msg}</div>}
    </div>
  );
};

export default CloudAuthPanel;
