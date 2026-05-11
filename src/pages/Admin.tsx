import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Search, Loader2 } from 'lucide-react';

type SortKey = 'created_at' | 'last_seen_at' | 'total_saves' | 'email';

interface ProfileRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  last_family_played: string | null;
  last_seen_at: string | null;
  total_saves: number;
  created_at: string;
}

interface SaveRow {
  slot: string;
  game_version: string;
  schema_version: number;
  save_date: string;
  updated_at: string;
}

const PAGE_SIZE = 50;

const Admin: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);

  const [drawerUser, setDrawerUser] = useState<ProfileRow | null>(null);
  const [drawerSaves, setDrawerSaves] = useState<SaveRow[] | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('user_id,email,display_name,last_family_played,last_seen_at,total_saves,created_at')
      .order('created_at', { ascending: false })
      .limit(5000)
      .then(({ data, error }) => {
        if (error) console.error(error);
        setProfiles((data ?? []) as ProfileRow[]);
        setLoading(false);
      });
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = profiles;
    if (q) {
      rows = rows.filter(p =>
        (p.email ?? '').toLowerCase().includes(q) ||
        (p.display_name ?? '').toLowerCase().includes(q) ||
        (p.last_family_played ?? '').toLowerCase().includes(q)
      );
    }
    rows = [...rows].sort((a, b) => {
      const av = (a as any)[sortKey] ?? '';
      const bv = (b as any)[sortKey] ?? '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [profiles, search, sortKey, sortDir]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const exportCSV = () => {
    const header = ['email', 'display_name', 'created_at', 'last_seen_at', 'last_family_played', 'total_saves'];
    const lines = [header.join(',')];
    for (const p of filtered) {
      const row = [p.email, p.display_name, p.created_at, p.last_seen_at, p.last_family_played, p.total_saves]
        .map(v => v == null ? '' : `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
      lines.push(row);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `players_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDrawer = async (p: ProfileRow) => {
    setDrawerUser(p);
    setDrawerSaves(null);
    const { data } = await supabase
      .from('cloud_saves')
      .select('slot,game_version,schema_version,save_date,updated_at')
      .eq('user_id', p.user_id)
      .order('save_date', { ascending: false });
    setDrawerSaves((data ?? []) as SaveRow[]);
  };

  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="text-sm text-muted-foreground">You need admin access to view this page.</p>
        <Link to="/"><Button variant="outline">Back to game</Button></Link>
      </div>
    );
  }

  const fmt = (s: string | null) => s ? new Date(s).toLocaleString() : '—';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Game</Button></Link>
            <h1 className="text-2xl font-bold">Player Admin</h1>
            <Badge variant="secondary">{filtered.length} players</Badge>
          </div>
          <Button onClick={exportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="h-4 w-4" /> Search players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by email, display name, or family..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="animate-spin inline-block" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => toggleSort('email')} className="cursor-pointer">Email</TableHead>
                    <TableHead>Display name</TableHead>
                    <TableHead onClick={() => toggleSort('created_at')} className="cursor-pointer">Signed up</TableHead>
                    <TableHead onClick={() => toggleSort('last_seen_at')} className="cursor-pointer">Last seen</TableHead>
                    <TableHead>Last family</TableHead>
                    <TableHead onClick={() => toggleSort('total_saves')} className="cursor-pointer text-right">Saves</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map(p => (
                    <TableRow key={p.user_id} onClick={() => openDrawer(p)} className="cursor-pointer">
                      <TableCell className="font-medium">{p.email ?? '—'}</TableCell>
                      <TableCell>{p.display_name ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(p.created_at)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmt(p.last_seen_at)}</TableCell>
                      <TableCell><Badge variant="outline">{p.last_family_played ?? '—'}</Badge></TableCell>
                      <TableCell className="text-right">{p.total_saves}</TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No players found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      </div>

      <Sheet open={!!drawerUser} onOpenChange={o => !o && setDrawerUser(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{drawerUser?.email ?? 'Player'}</SheetTitle>
          </SheetHeader>
          {drawerUser && (
            <div className="mt-4 space-y-3 text-sm">
              <div><span className="text-muted-foreground">Display name:</span> {drawerUser.display_name ?? '—'}</div>
              <div><span className="text-muted-foreground">Signed up:</span> {fmt(drawerUser.created_at)}</div>
              <div><span className="text-muted-foreground">Last seen:</span> {fmt(drawerUser.last_seen_at)}</div>
              <div><span className="text-muted-foreground">Last family:</span> {drawerUser.last_family_played ?? '—'}</div>
              <div><span className="text-muted-foreground">Total saves:</span> {drawerUser.total_saves}</div>
              <div className="pt-3 border-t">
                <div className="font-medium mb-2">Cloud save slots</div>
                {drawerSaves === null ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : drawerSaves.length === 0 ? (
                  <div className="text-muted-foreground text-xs">No cloud saves</div>
                ) : (
                  <ul className="space-y-2">
                    {drawerSaves.map(s => (
                      <li key={s.slot} className="rounded border p-2 text-xs">
                        <div className="flex justify-between"><strong>Slot {s.slot}</strong><span className="text-muted-foreground">v{s.game_version}</span></div>
                        <div className="text-muted-foreground">Saved: {fmt(s.save_date)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Admin;
