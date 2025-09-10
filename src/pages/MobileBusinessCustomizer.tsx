import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Smartphone, Monitor, Plus, Palette, Layout, Image, Type, Settings, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import BusinessPageCustomizer from '@/components/BusinessPageCustomizer';

interface PageElement {
  id: string;
  type: string;
  config: Record<string, any>;
  position: number;
  visible: boolean;
}

const ELEMENT_TYPES = [
  { type: 'hero', label: 'Section Hero', icon: Layout, description: 'Bannière d\'accueil' },
  { type: 'about', label: 'À Propos', icon: Type, description: 'Description entreprise' },
  { type: 'services', label: 'Services', icon: Settings, description: 'Liste des services' },
  { type: 'gallery', label: 'Galerie', icon: Image, description: 'Photos entreprise' },
  { type: 'contact', label: 'Contact', icon: Plus, description: 'Informations contact' },
  { type: 'cta', label: 'Réservation', icon: Play, description: 'Bouton d\'action' }
];

export default function MobileBusinessCustomizer() {
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'elements' | 'preview' | 'settings'>('elements');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || session.user.user_metadata?.account_type !== "business") {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Accès non autorisé</h2>
          <p className="text-muted-foreground">Redirection...</p>
        </div>
      </div>
    );
  }

  // Mobile-first layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Fixed Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/business-dashboard')}
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="font-semibold text-lg">Personnalisation</h1>
                <p className="text-xs text-muted-foreground">Créez votre page</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(previewMode === 'mobile' ? 'desktop' : 'mobile')}
              >
                {previewMode === 'mobile' ? <Monitor size={16} /> : <Smartphone size={16} />}
              </Button>
              <Button size="sm" className="bg-gradient-primary">
                <Save size={16} className="mr-1" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-4 pb-20">
          {/* Quick Action Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card 
              className={`cursor-pointer transition-all ${activeSection === 'elements' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveSection('elements')}
            >
              <CardContent className="p-4 text-center">
                <Layout className="mx-auto mb-2 text-primary" size={24} />
                <p className="text-sm font-medium">Éléments</p>
                <p className="text-xs text-muted-foreground">Ajouter sections</p>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all ${activeSection === 'preview' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveSection('preview')}
            >
              <CardContent className="p-4 text-center">
                <Eye className="mx-auto mb-2 text-primary" size={24} />
                <p className="text-sm font-medium">Aperçu</p>
                <p className="text-xs text-muted-foreground">Voir résultat</p>
              </CardContent>
            </Card>
          </div>

          {/* Element Types */}
          {activeSection === 'elements' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Éléments disponibles</h2>
              <div className="grid gap-3">
                {ELEMENT_TYPES.map((elementType) => (
                  <Card key={elementType.type} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <elementType.icon size={20} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{elementType.label}</p>
                          <p className="text-sm text-muted-foreground">{elementType.description}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Plus size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Preview Section */}
          {activeSection === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Aperçu de votre page</h2>
                <Badge variant={previewMode === 'mobile' ? 'default' : 'secondary'}>
                  {previewMode === 'mobile' ? 'Mobile' : 'Desktop'}
                </Badge>
              </div>
              
              <Card className="bg-muted/20">
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    <Eye size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Aperçu de votre page</p>
                    <p className="text-sm">Ajoutez des éléments pour voir le résultat</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/50 p-4">
          <div className="flex justify-around">
            <button
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeSection === 'elements' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              }`}
              onClick={() => setActiveSection('elements')}
            >
              <Layout size={20} />
              <span className="text-xs">Éléments</span>
            </button>
            
            <button
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeSection === 'preview' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              }`}
              onClick={() => setActiveSection('preview')}
            >
              <Eye size={20} />
              <span className="text-xs">Aperçu</span>
            </button>
            
            <button
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                activeSection === 'settings' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              }`}
              onClick={() => setActiveSection('settings')}
            >
              <Palette size={20} />
              <span className="text-xs">Thèmes</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout - use existing BusinessPageCustomizer
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/business-dashboard')}
            >
              <ArrowLeft size={20} className="mr-2" />
              Retour au Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Personnalisation</h1>
              <p className="text-muted-foreground">Créez une page unique pour votre entreprise</p>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Content */}
      <BusinessPageCustomizer businessUserId={user.id} />
    </div>
  );
}