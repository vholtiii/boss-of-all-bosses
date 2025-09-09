import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PoliceHeat, BribedOfficial, BusinessAction } from "@/types/business";
import { Shield, AlertTriangle, Eye, X, DollarSign } from "lucide-react";

interface PoliceSystemProps {
  policeHeat: PoliceHeat;
  cleanMoney: number;
  onAction: (action: BusinessAction) => void;
}

const AVAILABLE_OFFICIALS = [
  {
    id: 'officer_murphy',
    rank: 'officer' as const,
    name: 'Officer Murphy',
    monthlyBribe: 2000,
    heatReduction: 1,
    permissions: ['run_prostitution']
  },
  {
    id: 'sergeant_kowalski',
    rank: 'sergeant' as const,
    name: 'Sergeant Kowalski',
    monthlyBribe: 5000,
    heatReduction: 2,
    permissions: ['patrol_protection']
  },
  {
    id: 'captain_rodriguez',
    rank: 'captain' as const,
    name: 'Captain Rodriguez',
    monthlyBribe: 12000,
    heatReduction: 4,
    permissions: ['run_gambling', 'run_loan_sharking']
  },
  {
    id: 'chief_sullivan',
    rank: 'chief' as const,
    name: 'Chief Sullivan',
    monthlyBribe: 30000,
    heatReduction: 8,
    permissions: ['rival_intelligence']
  },
  {
    id: 'mayor_thompson',
    rank: 'mayor' as const,
    name: 'Mayor Thompson',
    monthlyBribe: 75000,
    heatReduction: 15,
    permissions: ['shutdown_rivals']
  }
];

export const PoliceSystem = ({ policeHeat, cleanMoney, onAction }: PoliceSystemProps) => {
  const getHeatColor = (level: number) => {
    if (level < 30) return "text-green-400";
    if (level < 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getHeatStatus = (level: number) => {
    if (level < 30) return "Low";
    if (level < 70) return "Medium";
    return "High";
  };

  const totalMonthlyCosts = policeHeat.bribedOfficials.reduce((sum, official) => sum + official.monthlyBribe, 0);
  const canAffordBribe = (amount: number) => cleanMoney >= amount;

  return (
    <div className="space-y-6">
      {/* Police Heat Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Police Heat System
          </CardTitle>
          <CardDescription>
            Manage law enforcement attention and build corrupt networks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getHeatColor(policeHeat.level)}`}>
                {policeHeat.level}%
              </div>
              <div className="text-sm text-muted-foreground">Heat Level</div>
              <Badge variant={policeHeat.level < 30 ? "default" : policeHeat.level < 70 ? "secondary" : "destructive"}>
                {getHeatStatus(policeHeat.level)}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                -{policeHeat.reductionPerTurn}
              </div>
              <div className="text-sm text-muted-foreground">Heat Reduction/Turn</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                ${totalMonthlyCosts.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Monthly Bribes</div>
            </div>
          </div>

          {policeHeat.level > 80 && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">
                High heat increases prosecution risk and limits illegal operations!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Bribes */}
      {policeHeat.bribedOfficials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Bribes</CardTitle>
            <CardDescription>Officials currently on your payroll</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {policeHeat.bribedOfficials.map((official) => (
                <div key={official.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {official.rank}
                      </Badge>
                      <span className="font-medium">{official.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Heat Reduction: -{official.heatReduction}/turn • Permissions: {official.permissions.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-medium">
                      ${official.monthlyBribe.toLocaleString()}/turn
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAction({ type: 'stop_bribe', officialId: official.id })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Officials to Bribe */}
      <Card>
        <CardHeader>
          <CardTitle>Available Officials</CardTitle>
          <CardDescription>Corrupt law enforcement and government officials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {AVAILABLE_OFFICIALS.map((official) => {
              const isAlreadyBribed = policeHeat.bribedOfficials.some(b => b.id === official.id);
              const canAfford = canAffordBribe(official.monthlyBribe);

              return (
                <div key={official.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {official.rank}
                      </Badge>
                      <span className="font-medium">{official.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Heat Reduction: -{official.heatReduction}/turn
                    </div>
                    <div className="text-xs text-blue-400 mt-1">
                      Unlocks: {official.permissions.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-red-400 font-medium">
                        ${official.monthlyBribe.toLocaleString()}/turn
                      </div>
                      {!canAfford && (
                        <div className="text-xs text-muted-foreground">
                          Need ${(official.monthlyBribe - cleanMoney).toLocaleString()} more
                        </div>
                      )}
                    </div>
                    <Button
                      variant={isAlreadyBribed ? "secondary" : "default"}
                      size="sm"
                      disabled={isAlreadyBribed || !canAfford}
                      onClick={() => onAction({ type: 'bribe_official', officialId: official.id })}
                    >
                      {isAlreadyBribed ? "Active" : <DollarSign className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Special Operations */}
      {(policeHeat.bribedOfficials.some(o => o.permissions.includes('rival_intelligence')) ||
        policeHeat.bribedOfficials.some(o => o.permissions.includes('shutdown_rivals'))) && (
        <Card>
          <CardHeader>
            <CardTitle>Intelligence Operations</CardTitle>
            <CardDescription>Special operations available through corruption</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {policeHeat.bribedOfficials.some(o => o.permissions.includes('rival_intelligence')) && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onAction({ type: 'rival_info' })}
              >
                <Eye className="h-4 w-4 mr-2" />
                Get Rival Family Intelligence
                <span className="ml-auto text-sm text-blue-400">Chief Access</span>
              </Button>
            )}
            {policeHeat.bribedOfficials.some(o => o.permissions.includes('shutdown_rivals')) && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Shutdown Rival Operations:</div>
                {['genovese', 'lucchese', 'bonanno', 'colombo'].map((family) => (
                  <Button
                    key={family}
                    variant="outline"
                    size="sm"
                    className="mr-2 capitalize"
                    onClick={() => onAction({ type: 'shutdown_rival', rivalFamily: family })}
                  >
                    {family} Family
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};