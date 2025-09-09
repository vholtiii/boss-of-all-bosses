import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Business, BusinessFinances, BusinessAction } from '@/types/business';

interface BusinessManagementProps {
  businesses: Business[];
  finances: BusinessFinances;
  onBusinessAction: (action: BusinessAction) => void;
  playerMoney: number;
}

const BusinessManagement: React.FC<BusinessManagementProps> = ({
  businesses,
  finances,
  onBusinessAction,
  playerMoney
}) => {
  const legalBusinesses = businesses.filter(b => b.type === 'legal');
  const illegalBusinesses = businesses.filter(b => b.type === 'illegal');

  const businessIcons = {
    restaurant: '🍝',
    laundromat: '🧺',
    casino: '🎰',
    construction: '🏗️',
    drug_trafficking: '💊',
    gambling: '🎲',
    prostitution: '💋',
    loan_sharking: '💰'
  };

  const businessCosts = {
    restaurant: 25000,
    laundromat: 15000,
    casino: 50000,
    construction: 40000,
    drug_trafficking: 30000,
    gambling: 20000,
    prostitution: 15000,
    loan_sharking: 10000
  };

  const upgradeCost = (business: Business) => business.level * 15000;

  return (
    <div className="space-y-4">
      {/* Financial Overview */}
      <Card className="p-4">
        <h3 className="text-lg font-bold mb-4">Business Finances</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              ${finances.totalProfit.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Profit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              ${finances.legalProfit.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Legal Profit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              ${finances.illegalProfit.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Illegal Profit</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-400">
              -${finances.totalExpenses.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Expenses</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">
              ${finances.dirtyMoney.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Dirty Money (Unlaundered)</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">
              ${finances.totalIncome.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Income</div>
          </div>
        </div>
      </Card>

      {/* Money Laundering */}
      {finances.dirtyMoney > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-bold mb-2">Money Laundering</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-2">
                Laundering Capacity: ${legalBusinesses.reduce((sum, b) => sum + b.launderingCapacity, 0).toLocaleString()}/turn
              </div>
              <Progress 
                value={(finances.dirtyMoney / (finances.dirtyMoney + finances.cleanMoney)) * 100} 
                className="h-2"
              />
            </div>
            <Button 
              onClick={() => onBusinessAction({ type: 'launder' })}
              disabled={legalBusinesses.length === 0}
              size="sm"
            >
              Launder Money
            </Button>
          </div>
        </Card>
      )}

      {/* Legal Businesses */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Legal Businesses</h3>
          <div className="flex gap-2">
            {(['restaurant', 'laundromat', 'casino', 'construction'] as const).map(type => (
              <Button
                key={type}
                onClick={() => onBusinessAction({ 
                  type: 'build_legal', 
                  businessType: type 
                })}
                disabled={playerMoney < businessCosts[type]}
                size="sm"
                variant="outline"
              >
                {businessIcons[type]} ${(businessCosts[type] / 1000)}k
              </Button>
            ))}
          </div>
        </div>
        
        <div className="grid gap-3">
          {legalBusinesses.map(business => (
            <div key={business.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{businessIcons[business.category]}</span>
                <div>
                  <div className="font-medium">{business.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Level {business.level} • {business.district}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-blue-400">
                    +${business.monthlyIncome.toLocaleString()}
                  </div>
                  <div className="text-xs text-red-400">
                    -${business.monthlyExpenses.toLocaleString()}
                  </div>
                </div>
                
                {business.isExtorted && (
                  <Badge variant="destructive" className="text-xs">
                    {business.extortionRate * 100}% Extorted
                  </Badge>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => onBusinessAction({ 
                      type: 'upgrade', 
                      businessId: business.id 
                    })}
                    disabled={playerMoney < upgradeCost(business) || business.level >= 5}
                    size="sm"
                    variant="outline"
                  >
                    Upgrade ${upgradeCost(business) / 1000}k
                  </Button>
                  
                  {!business.isExtorted && (
                    <Button
                      onClick={() => onBusinessAction({ 
                        type: 'extort', 
                        businessId: business.id 
                      })}
                      size="sm"
                      variant="destructive"
                    >
                      Extort
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {legalBusinesses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No legal businesses. Build some to launder money!
            </div>
          )}
        </div>
      </Card>

      {/* Illegal Businesses */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Underground Operations</h3>
          <div className="flex gap-2">
            {(['drug_trafficking', 'gambling', 'prostitution', 'loan_sharking'] as const).map(type => (
              <Button
                key={type}
                onClick={() => onBusinessAction({ 
                  type: 'build_illegal', 
                  businessType: type 
                })}
                disabled={playerMoney < businessCosts[type]}
                size="sm"
                variant="outline"
              >
                {businessIcons[type]} ${(businessCosts[type] / 1000)}k
              </Button>
            ))}
          </div>
        </div>
        
        <div className="grid gap-3">
          {illegalBusinesses.map(business => (
            <div key={business.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-l-4 border-orange-500">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{businessIcons[business.category]}</span>
                <div>
                  <div className="font-medium">{business.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Level {business.level} • {business.district}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-orange-400">
                    +${business.monthlyIncome.toLocaleString()}
                  </div>
                  <div className="text-xs text-red-400">
                    -${business.monthlyExpenses.toLocaleString()}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => onBusinessAction({ 
                      type: 'upgrade', 
                      businessId: business.id 
                    })}
                    disabled={playerMoney < upgradeCost(business) || business.level >= 5}
                    size="sm"
                    variant="outline"
                  >
                    Upgrade ${upgradeCost(business) / 1000}k
                  </Button>
                  
                  <Button
                    onClick={() => onBusinessAction({ 
                      type: 'collect', 
                      businessId: business.id 
                    })}
                    size="sm"
                  >
                    Collect
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {illegalBusinesses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No underground operations. Start some to generate dirty money!
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BusinessManagement;