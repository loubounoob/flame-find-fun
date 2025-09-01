import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, Save, X, Users, Clock, Calendar, Percent, Euro } from "lucide-react";
import { usePricingRules, PricingRule } from "@/hooks/usePricingRules";
import { useToast } from "@/hooks/use-toast";

interface PricingRulesManagerProps {
  offerId?: string;
  className?: string;
}

const RULE_TYPE_LABELS = {
  participant_tiers: "Tarif par nombre de participants",
  time_slots: "Tarif par créneaux horaires",
  day_of_week: "Tarif par jour de la semaine",
  seasonal: "Tarif saisonnier",
  duration_multiplier: "Multiplicateur de durée",
};

const RULE_TYPE_ICONS = {
  participant_tiers: Users,
  time_slots: Clock,
  day_of_week: Calendar,
  seasonal: Calendar,
  duration_multiplier: Clock,
};

const DAYS_OF_WEEK = [
  { value: 0, label: "Dimanche" },
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
];

export function PricingRulesManager({ offerId, className = "" }: PricingRulesManagerProps) {
  const { pricingRules, createRule, updateRule, deleteRule, isLoading } = usePricingRules(offerId);
  const { toast } = useToast();
  
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PricingRule>>({
    rule_type: 'participant_tiers',
    rule_name: '',
    conditions: {},
    price_modifier: 0,
    is_percentage: false,
    is_active: true,
    priority: 0,
  });

  const resetForm = () => {
    setNewRule({
      rule_type: 'participant_tiers',
      rule_name: '',
      conditions: {},
      price_modifier: 0,
      is_percentage: false,
      is_active: true,
      priority: 0,
    });
    setShowCreateForm(false);
    setEditingRule(null);
  };

  const handleSaveRule = () => {
    if (!newRule.rule_name || newRule.price_modifier === undefined) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const ruleData = {
      ...newRule,
      offer_id: offerId,
    } as Omit<PricingRule, 'id' | 'business_user_id' | 'created_at' | 'updated_at'>;

    if (editingRule) {
      updateRule({ id: editingRule.id, updates: ruleData });
    } else {
      createRule(ruleData);
    }
    
    resetForm();
  };

  const startEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setNewRule(rule);
    setShowCreateForm(true);
  };

  const renderConditionsForm = () => {
    switch (newRule.rule_type) {
      case 'participant_tiers':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_participants" className="text-sm font-medium">Minimum participants</Label>
              <Input
                id="min_participants"
                type="number"
                value={newRule.conditions?.min_participants || ''}
                onChange={(e) => setNewRule({
                  ...newRule,
                  conditions: {
                    ...newRule.conditions,
                    min_participants: parseInt(e.target.value) || 0
                  }
                })}
                className="h-10"
              />
            </div>
            <div>
              <Label htmlFor="max_participants" className="text-sm font-medium">Maximum participants</Label>
              <Input
                id="max_participants"
                type="number"
                value={newRule.conditions?.max_participants || ''}
                onChange={(e) => setNewRule({
                  ...newRule,
                  conditions: {
                    ...newRule.conditions,
                    max_participants: parseInt(e.target.value) || 999
                  }
                })}
                className="h-10"
              />
            </div>
          </div>
        );

      case 'time_slots':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time" className="text-sm font-medium">Heure de début</Label>
              <Input
                id="start_time"
                type="time"
                value={newRule.conditions?.start_time || ''}
                onChange={(e) => setNewRule({
                  ...newRule,
                  conditions: {
                    ...newRule.conditions,
                    start_time: e.target.value
                  }
                })}
                className="h-10"
              />
            </div>
            <div>
              <Label htmlFor="end_time" className="text-sm font-medium">Heure de fin</Label>
              <Input
                id="end_time"
                type="time"
                value={newRule.conditions?.end_time || ''}
                onChange={(e) => setNewRule({
                  ...newRule,
                  conditions: {
                    ...newRule.conditions,
                    end_time: e.target.value
                  }
                })}
                className="h-10"
              />
            </div>
          </div>
        );

      case 'day_of_week':
        return (
          <div>
            <Label className="text-sm font-medium">Jours de la semaine</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`day-${day.value}`}
                    checked={newRule.conditions?.days?.includes(day.value) || false}
                    onChange={(e) => {
                      const currentDays = newRule.conditions?.days || [];
                      const newDays = e.target.checked
                        ? [...currentDays, day.value]
                        : currentDays.filter(d => d !== day.value);
                      
                      setNewRule({
                        ...newRule,
                        conditions: {
                          ...newRule.conditions,
                          days: newDays
                        }
                      });
                    }}
                    className="rounded"
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className={`bg-gradient-card border-border/50 ${className}`}>
        <CardHeader>
          <CardTitle>Chargement des règles de tarification...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-card border-border/50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Euro className="h-4 w-4 sm:h-5 sm:w-5" />
            Règles de tarification dynamique
          </CardTitle>
          <Button 
            onClick={() => setShowCreateForm(true)}
            size="sm"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nouvelle règle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
        {/* Existing Rules */}
        <div className="space-y-3">
          {pricingRules.map((rule) => {
            const IconComponent = RULE_TYPE_ICONS[rule.rule_type];
            return (
              <div key={rule.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg gap-3">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <IconComponent className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{rule.rule_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {RULE_TYPE_LABELS[rule.rule_type]}
                    </p>
                  </div>
                  <Badge variant={rule.is_active ? "default" : "secondary"} className="shrink-0">
                    {rule.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <div className="text-left sm:text-right">
                    <p className="font-medium flex items-center gap-1">
                      {rule.is_percentage ? (
                        <>
                          <Percent className="h-4 w-4" />
                          {rule.price_modifier > 0 ? '+' : ''}{rule.price_modifier}%
                        </>
                      ) : (
                        <>
                          <Euro className="h-4 w-4" />
                          {rule.price_modifier > 0 ? '+' : ''}{rule.price_modifier}€
                        </>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Priorité: {rule.priority}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(rule)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {pricingRules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucune règle de tarification configurée
            </div>
          )}
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card className="bg-background border-border">
            <CardHeader>
              <CardTitle>
                {editingRule ? 'Modifier la règle' : 'Nouvelle règle de tarification'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-3 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rule_name" className="text-sm font-medium">Nom de la règle</Label>
                  <Input
                    id="rule_name"
                    value={newRule.rule_name || ''}
                    onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                    placeholder="ex: Tarif groupe"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="rule_type" className="text-sm font-medium">Type de règle</Label>
                  <Select
                    value={newRule.rule_type}
                    onValueChange={(value) => setNewRule({ 
                      ...newRule, 
                      rule_type: value as PricingRule['rule_type'],
                      conditions: {} // Reset conditions when type changes
                    })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RULE_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {renderConditionsForm()}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price_modifier" className="text-sm font-medium">Modification du prix</Label>
                  <Input
                    id="price_modifier"
                    type="number"
                    step="0.01"
                    value={newRule.price_modifier || ''}
                    onChange={(e) => setNewRule({ 
                      ...newRule, 
                      price_modifier: parseFloat(e.target.value) || 0 
                    })}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="priority" className="text-sm font-medium">Priorité</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={newRule.priority || 0}
                    onChange={(e) => setNewRule({ 
                      ...newRule, 
                      priority: parseInt(e.target.value) || 0 
                    })}
                    className="h-10"
                  />
                </div>
                <div className="flex items-center space-x-3 sm:col-span-2 lg:col-span-1 lg:mt-6">
                  <Switch
                    id="is_percentage"
                    checked={newRule.is_percentage}
                    onCheckedChange={(checked) => setNewRule({ 
                      ...newRule, 
                      is_percentage: checked 
                    })}
                  />
                  <Label htmlFor="is_percentage" className="text-sm font-medium cursor-pointer">En pourcentage</Label>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <Switch
                  id="is_active"
                  checked={newRule.is_active}
                  onCheckedChange={(checked) => setNewRule({ 
                    ...newRule, 
                    is_active: checked 
                  })}
                />
                <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Règle active</Label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-border/30">
                <Button variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSaveRule} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {editingRule ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
