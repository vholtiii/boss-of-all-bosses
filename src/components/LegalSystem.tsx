import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { LegalStatus, Lawyer, Charge, BusinessAction } from '@/types/business';

interface LegalSystemProps {
  legalStatus: LegalStatus;
  legalProfit: number;
  onLegalAction: (action: BusinessAction) => void;
}

const LegalSystem: React.FC<LegalSystemProps> = ({
  legalStatus,
  legalProfit,
  onLegalAction
}) => {
  const availableLawyers: Lawyer[] = [
    {
      id: 'public_defender',
      name: 'Public Defender',
      tier: 'public_defender',
      monthlyFee: 0,
      skillLevel: 30,
      specialties: ['racketeering', 'tax_evasion']
    },
    {
      id: 'local_attorney',
      name: 'Tommy "The Shark" Rosetti',
      tier: 'local',
      monthlyFee: 5000,
      skillLevel: 60,
      specialties: ['extortion', 'racketeering', 'money_laundering']
    },
    {
      id: 'prestigious_firm',
      name: 'Goldman & Associates',
      tier: 'prestigious',
      monthlyFee: 15000,
      skillLevel: 85,
      specialties: ['tax_evasion', 'money_laundering', 'racketeering']
    },
    {
      id: 'elite_counsel',
      name: 'Clarence "The Fixer" Mitchell',
      tier: 'elite',
      monthlyFee: 35000,
      skillLevel: 95,
      specialties: ['murder', 'drug_trafficking', 'racketeering', 'money_laundering']
    }
  ];

  const chargeLabels = {
    racketeering: 'Racketeering',
    tax_evasion: 'Tax Evasion',
    extortion: 'Extortion',
    drug_trafficking: 'Drug Trafficking',
    murder: 'Murder',
    money_laundering: 'Money Laundering'
  };

  const severityColors = {
    misdemeanor: 'bg-yellow-500/20 text-yellow-400 border-yellow-400',
    felony: 'bg-orange-500/20 text-orange-400 border-orange-400',
    federal: 'bg-red-500/20 text-red-400 border-red-400'
  };

  const canAffordLawyer = (lawyer: Lawyer) => legalProfit >= lawyer.monthlyFee;

  return (
    <div className="space-y-4">
      {/* Legal Status Overview */}
      <Card className="p-4">
        <h3 className="text-lg font-bold mb-4">Legal Status</h3>
        
        {legalStatus.jailTime > 0 ? (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertDescription className="text-red-400">
              🚨 IMPRISONED: {legalStatus.jailTime} turns remaining. Resources decreasing daily!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-400">
                {legalStatus.prosecutionRisk}%
              </div>
              <div className="text-sm text-muted-foreground">Prosecution Risk</div>
              <Progress value={legalStatus.prosecutionRisk} className="h-2 mt-1" />
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-400">
                ${legalStatus.totalLegalCosts.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Legal Costs/Turn</div>
            </div>
          </div>
        )}
      </Card>

      {/* Active Charges */}
      {legalStatus.charges.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-bold mb-4">Active Charges</h3>
          <div className="space-y-3">
            {legalStatus.charges.map(charge => (
              <div key={charge.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={cn('border', severityColors[charge.severity])}>
                    {charge.severity.toUpperCase()}
                  </Badge>
                  <div>
                    <div className="font-medium">{chargeLabels[charge.type]}</div>
                    <div className="text-sm text-muted-foreground">
                      Evidence: {charge.evidence}% • Penalty: {charge.penalty.jailTime} turns, ${charge.penalty.fine.toLocaleString()}
                    </div>
                  </div>
                </div>
                <Progress value={charge.evidence} className="w-20 h-2" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Current Lawyer */}
      {legalStatus.lawyer && (
        <Card className="p-4">
          <h3 className="text-lg font-bold mb-4">Current Legal Counsel</h3>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <div className="font-medium">{legalStatus.lawyer.name}</div>
              <div className="text-sm text-muted-foreground">
                Skill Level: {legalStatus.lawyer.skillLevel}% • Specialties: {legalStatus.lawyer.specialties.map(s => chargeLabels[s]).join(', ')}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-red-400 font-medium">
                  ${legalStatus.lawyer.monthlyFee.toLocaleString()}/turn
                </div>
              </div>
              <Button
                onClick={() => onLegalAction({ type: 'fire_lawyer' })}
                size="sm"
                variant="destructive"
              >
                Fire
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Available Lawyers */}
      {!legalStatus.lawyer && (
        <Card className="p-4">
          <h3 className="text-lg font-bold mb-4">Hire Legal Counsel</h3>
          <div className="space-y-3">
            {availableLawyers.map(lawyer => (
              <div key={lawyer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{lawyer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Skill: {lawyer.skillLevel}% • {lawyer.specialties.map(s => chargeLabels[s]).join(', ')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={cn(
                      "font-medium",
                      lawyer.monthlyFee === 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {lawyer.monthlyFee === 0 ? 'FREE' : `-$${lawyer.monthlyFee.toLocaleString()}/turn`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {canAffordLawyer(lawyer) ? 'Can afford' : 'Need more legal profit'}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => onLegalAction({ 
                      type: 'hire_lawyer', 
                      lawyerId: lawyer.id 
                    })}
                    disabled={!canAffordLawyer(lawyer) && lawyer.monthlyFee > 0}
                    size="sm"
                  >
                    Hire
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {legalProfit < 5000 && (
            <Alert className="mt-4 border-yellow-500 bg-yellow-500/10">
              <AlertDescription className="text-yellow-400">
                ⚠️ Low legal profit! Build more legal businesses to afford better lawyers.
              </AlertDescription>
            </Alert>
          )}
        </Card>
      )}
    </div>
  );
};

export default LegalSystem;