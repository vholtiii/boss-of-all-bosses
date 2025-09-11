import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Business, PoliceHeat, BusinessAction } from "@/types/business";
import { Eye, DollarSign, MapPin, Building, Users, Lock, AlertTriangle, UserCheck, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntelligencePanelProps {
  businesses: Business[];
  policeHeat: PoliceHeat;
  currentTurn: number;
  familyControl: {
    gambino: number;
    genovese: number;
    lucchese: number;
    bonanno: number;
    colombo: number;
  };
  onAction: (action: BusinessAction) => void;
  territories?: Array<{
    district: string;
    family: string;
    businesses: Array<{
      businessId: string;
      businessType: string;
      income: number;
      district: string;
      family: string;
      capo?: {
        name: string;
        family: string;
        level: number;
      };
      soldiers?: {
        count: number;
        family: string;
      };
    }>;
  }>;
  playerFamily?: string;
}

export const IntelligencePanel = ({ 
  businesses, 
  policeHeat, 
  currentTurn, 
  familyControl, 
  onAction,
  territories = [],
  playerFamily = 'gambino'
}: IntelligencePanelProps) => {
  const activeBribes = policeHeat.bribedOfficials;
  const activeArrests = policeHeat.arrests.filter(arrest => 
    currentTurn - arrest.turn < arrest.sentence
  );

  const hasChiefAccess = activeBribes.some(o => o.permissions.includes('rival_intelligence'));
  const hasMayorAccess = activeBribes.some(o => o.permissions.includes('shutdown_rivals'));

  // Calculate capo information
  const playerCapos = territories
    .filter(territory => territory.family === playerFamily)
    .flatMap(territory => 
      territory.businesses
        .filter(business => business.capo && business.capo.family === playerFamily)
        .map(business => ({
          ...business.capo!,
          territory: territory.district,
          businessType: business.businessType,
          income: business.income,
          incomeMultiplier: 1.0 // Capos provide 100% income
        }))
    );

  const totalCapoIncome = playerCapos.reduce((total, capo) => total + (capo.income * capo.incomeMultiplier), 0);
  const totalSoldierIncome = territories
    .filter(territory => territory.family === playerFamily)
    .flatMap(territory => 
      territory.businesses
        .filter(business => business.soldiers && business.soldiers.family === playerFamily && !business.capo)
        .map(business => business.income * 0.3) // Soldiers provide 30% income
    )
    .reduce((total, income) => total + income, 0);

  // Calculate territory profitability
  const territoryProfits = businesses.reduce((acc, business) => {
    if (!acc[business.district]) {
      acc[business.district] = { 
        profit: 0, 
        businesses: [], 
        legal: 0, 
        illegal: 0 
      };
    }
    const profit = business.monthlyIncome - business.monthlyExpenses;
    acc[business.district].profit += profit;
    acc[business.district].businesses.push(business);
    if (business.type === 'legal') {
      acc[business.district].legal += profit;
    } else {
      acc[business.district].illegal += profit;
    }
    return acc;
  }, {} as Record<string, { profit: number; businesses: Business[]; legal: number; illegal: number }>);

  const sortedTerritories = Object.entries(territoryProfits)
    .sort(([,a], [,b]) => b.profit - a.profit);

  const rivalFamilies = Object.entries(familyControl)
    .filter(([family]) => family !== 'gambino')
    .sort(([,a], [,b]) => b - a);

  const getRankBadgeColor = (rank: string) => {
    switch (rank) {
      case 'mayor': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'chief': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'captain': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'sergeant': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'officer': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="w-80 border-l border-noir-light bg-noir-dark/50 flex flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Intelligence Header */}
          <Card className="bg-noir-dark border-noir-light">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-mafia-gold font-playfair flex items-center gap-2">
                <Eye className="h-5 w-5" />
                INTELLIGENCE NETWORK
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time intel on operations and rivals
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Active Bribes */}
          <Card className="bg-noir-dark border-noir-light">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-mafia-gold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Corrupted Officials ({activeBribes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeBribes.length > 0 ? (
                activeBribes.map((official) => (
                  <div key={official.id} className="p-2 bg-card/50 border border-green-500/20 rounded text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-400">{official.name}</span>
                      <Badge className={`text-xs ${getRankBadgeColor(official.rank)}`}>
                        {official.rank.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-1">
                      <span className="font-medium text-yellow-400">{official.territory}</span> • ${official.monthlyBribe.toLocaleString()}/turn • -{official.heatReduction} heat
                    </div>
                    <div className="text-blue-400 text-xs">
                      Access: {official.permissions.join(', ')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">No officials corrupted</div>
              )}
            </CardContent>
          </Card>

          {/* Active Arrests */}
          {activeArrests.length > 0 && (
            <Card className="bg-noir-dark border-noir-light">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Current Arrests ({activeArrests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeArrests.map((arrest) => {
                  const turnsLeft = arrest.sentence - (currentTurn - arrest.turn);
                  return (
                    <div key={arrest.id} className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-red-400">{arrest.target}</span>
                        <Badge variant="destructive" className="text-xs capitalize">
                          {arrest.type}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground mt-1">
                        {turnsLeft} turns left • -{arrest.impactOnProfit}% profit impact
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Rival Family Intelligence */}
          <Card className="bg-noir-dark border-noir-light">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-mafia-gold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Rival Families
                {!hasChiefAccess && (
                  <AlertTriangle className="h-3 w-3 text-yellow-400" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hasChiefAccess ? (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs bg-blue-500/10 border-blue-500/20 text-blue-400"
                    onClick={() => onAction({ type: 'rival_info' })}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Gather Intel
                  </Button>
                  {rivalFamilies.map(([family, control]) => (
                    <div key={family} className="p-2 bg-card/50 border rounded text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize text-families-{family}">{family}</span>
                        <Badge variant="outline" className="text-xs">
                          {control}% control
                        </Badge>
                      </div>
                      <div className="text-muted-foreground mt-1">
                        {control > 25 ? 'Strong presence' : control > 15 ? 'Moderate influence' : 'Weak position'}
                      </div>
                      {hasMayorAccess && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-1 text-xs bg-purple-500/10 border-purple-500/20 text-purple-400"
                          onClick={() => onAction({ type: 'shutdown_rival', rivalFamily: family })}
                        >
                          Shutdown Operations
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {rivalFamilies.map(([family, control]) => (
                    <div key={family} className="flex justify-between text-xs">
                      <span className="capitalize">{family}</span>
                      <span className="text-muted-foreground">{control}% control</span>
                    </div>
                  ))}
                  <div className="text-xs text-yellow-400 mt-2">
                    Bribe Police Chief for detailed intelligence
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Territory Profitability */}
          <Card className="bg-noir-dark border-noir-light">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-mafia-gold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Territory Profits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedTerritories.length > 0 ? (
                sortedTerritories.map(([district, data]) => (
                  <div key={district} className="p-2 bg-card/50 border rounded text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{district}</span>
                      <Badge variant="secondary" className="text-xs">
                        ${data.profit.toLocaleString()}/turn
                      </Badge>
                    </div>
                    <div className="flex justify-between text-muted-foreground mt-1">
                      <span className="text-blue-400">${data.legal.toLocaleString()} legal</span>
                      <span className="text-orange-400">${data.illegal.toLocaleString()} illegal</span>
                    </div>
                    <div className="text-muted-foreground">
                      {data.businesses.length} business{data.businesses.length !== 1 ? 'es' : ''}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">No territories under control</div>
              )}
            </CardContent>
          </Card>

          {/* Business Locations */}
          <Card className="bg-noir-dark border-noir-light">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-mafia-gold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Business Network ({businesses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {businesses.length > 0 ? (
                businesses
                  .sort((a, b) => (b.monthlyIncome - b.monthlyExpenses) - (a.monthlyIncome - a.monthlyExpenses))
                  .map((business) => {
                    const profit = business.monthlyIncome - business.monthlyExpenses;
                    return (
                      <div key={business.id} className="p-2 bg-card/50 border rounded text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{business.name}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${business.type === 'legal' ? 'text-blue-400' : 'text-orange-400'}`}
                          >
                            {business.type}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-muted-foreground mt-1">
                          <span>{business.district}</span>
                          <span className="text-green-400">${profit.toLocaleString()}/turn</span>
                        </div>
                        <div className="text-muted-foreground capitalize">
                          {business.category.replace('_', ' ')} • Level {business.level}
                        </div>
                        {business.isExtorted && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Extorted ({business.extortionRate * 100}%)
                          </Badge>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="text-xs text-muted-foreground">No businesses established</div>
              )}
            </CardContent>
          </Card>

          {/* Capo Management */}
          <Card className="bg-noir-dark border-noir-light">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-mafia-gold flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Capo Regime ({playerCapos.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Your trusted lieutenants managing territories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Income Summary */}
              <div className="bg-noir-light/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-400">Total Territory Income</span>
                  <span className="text-sm font-bold text-mafia-gold">
                    ${(totalCapoIncome + totalSoldierIncome).toLocaleString()}/turn
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-400">Capo Income:</span>
                    <span className="text-white">${totalCapoIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-400">Soldier Income:</span>
                    <span className="text-white">${totalSoldierIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Capo List */}
              {playerCapos.length > 0 ? (
                <div className="space-y-2">
                  {playerCapos.map((capo, index) => (
                    <div key={index} className="bg-noir-light/20 rounded-lg p-3 border border-noir-light/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <UserCheck className="h-3 w-3 text-purple-400" />
                          </div>
                          <span className="font-medium text-white">{capo.name}</span>
                          <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                            Level {capo.level}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                          ${capo.income.toLocaleString()}/turn
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Territory:</span>
                          <span className="text-white">{capo.territory}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Business:</span>
                          <span className="text-white capitalize">{capo.businessType.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Income Rate:</span>
                          <span className="text-green-400">100% (Capo)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Crown className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground mb-1">No Capos Deployed</div>
                  <div className="text-xs text-muted-foreground">
                    Deploy capos to your territories to maximize income
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};