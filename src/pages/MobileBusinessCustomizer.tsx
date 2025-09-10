import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Smartphone, Monitor, Plus, Palette, Layout, Image, Type, Settings, Play, Edit3, Trash2, GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import BusinessPageCustomizer from '@/components/BusinessPageCustomizer';
import BusinessPageRenderer from '@/components/BusinessPageRenderer';
import MediaUploadManager from '@/components/MediaUploadManager';

interface PageElement {
  id: string;
  type: string;
  config: Record<string, any>;
  position: number;
  visible: boolean;
}

const ELEMENT_TYPES = [
  { type: 'hero', label: 'Section Hero', icon: Layout, description: 'Bannière d\'accueil' },
  { type: 'about', label: 'À Propos', icon: Edit3, description: 'Description entreprise' },
  { type: 'services', label: 'Services', icon: Settings, description: 'Liste des services' },
  { type: 'gallery', label: 'Galerie', icon: Image, description: 'Photos entreprise' },
  { type: 'testimonials', label: 'Témoignages', icon: Type, description: 'Avis clients' },
  { type: 'contact', label: 'Contact', icon: Plus, description: 'Informations contact' },
  { type: 'cta', label: 'Réservation', icon: Play, description: 'Bouton d\'action' }
];

const DEFAULT_CONFIGS = {
  hero: {
    title: 'Bienvenue chez nous',
    subtitle: 'Découvrez notre expérience unique',
    backgroundImage: '',
    buttonText: 'Réserver maintenant',
    buttonLink: '/booking'
  },
  about: {
    title: 'Notre Histoire',
    content: 'Nous sommes passionnés par ce que nous faisons...',
    image: '',
    layout: 'left'
  },
  services: {
    title: 'Nos Services',
    services: [
      { name: 'Service 1', description: 'Description du service', price: '25€' }
    ]
  },
  gallery: {
    title: 'Galerie',
    images: [],
    layout: 'grid',
    columns: 3
  },
  testimonials: {
    title: 'Ce que disent nos clients',
    testimonials: [
      { name: 'Client 1', comment: 'Excellente expérience !', rating: 5 }
    ]
  },
  contact: {
    title: 'Nous Contacter',
    address: 'Votre adresse',
    phone: 'Votre téléphone',
    email: 'Votre email',
    hours: 'Lun-Ven 9h-18h'
  },
  cta: {
    title: 'Prêt à vivre l\'expérience ?',
    subtitle: 'Réservez dès maintenant',
    buttonText: 'Réserver',
    buttonLink: '/booking'
  }
};

export default function MobileBusinessCustomizer() {
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<'elements' | 'preview' | 'settings'>('elements');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [elements, setElements] = useState<PageElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<PageElement | null>(null);
  const [templateName, setTemplateName] = useState('Ma Page Entreprise');
  const [selectedTheme, setSelectedTheme] = useState<any>(null);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

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

  // Charger le template existant
  const { data: existingTemplate } = useQuery({
    queryKey: ['business-template', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('business_page_templates')
        .select(`
          *,
          business_page_elements (*)
        `)
        .eq('business_user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Charger les thèmes disponibles
  const { data: themes = [] } = useQuery({
    queryKey: ['business-themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_themes')
        .select('*')
        .order('theme_name');

      if (error) throw error;
      return data;
    }
  });

  // Initialiser avec le template existant
  useEffect(() => {
    if (existingTemplate) {
      setTemplateName(existingTemplate.template_name || 'Ma Page Entreprise');
      
      if (existingTemplate.business_page_elements) {
        const formattedElements = existingTemplate.business_page_elements
          .sort((a: any, b: any) => a.position_order - b.position_order)
          .map((el: any) => ({
            id: el.id,
            type: el.element_type,
            config: el.element_config || DEFAULT_CONFIGS[el.element_type as keyof typeof DEFAULT_CONFIGS] || {},
            position: el.position_order,
            visible: el.is_visible
          }));
        setElements(formattedElements);
      }
    }
  }, [existingTemplate]);

  // Mutation pour sauvegarder
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not found');
      
      // Créer ou mettre à jour le template
      const { data: templateData, error: templateError } = await supabase
        .from('business_page_templates')
        .upsert({
          business_user_id: user.id,
          template_name: templateName,
          is_active: true,
          template_config: selectedTheme ? {
            theme_id: selectedTheme.id,
            theme_colors: selectedTheme.color_palette,
            theme_typography: selectedTheme.typography,
            theme_layout: selectedTheme.layout_config
          } : {}
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Supprimer les anciens éléments
      await supabase
        .from('business_page_elements')
        .delete()
        .eq('template_id', templateData.id);

      // Insérer les nouveaux éléments
      if (elements.length > 0) {
        const elementsToInsert = elements.map((element, index) => ({
          template_id: templateData.id,
          element_type: element.type,
          element_config: element.config,
          element_data: {},
          position_order: index,
          is_visible: element.visible
        }));

        const { error: elementsError } = await supabase
          .from('business_page_elements')
          .insert(elementsToInsert);

        if (elementsError) throw elementsError;
      }

      return templateData;
    },
    onSuccess: () => {
      toast({
        title: "Page sauvegardée !",
        description: "Votre page personnalisée a été mise à jour avec succès."
      });
      queryClient.invalidateQueries({ queryKey: ['business-template', user?.id] });
    },
    onError: (error) => {
      console.error('Erreur sauvegarde:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive"
      });
    }
  });

  const addElement = (type: string) => {
    const newElement: PageElement = {
      id: Date.now().toString(),
      type,
      config: DEFAULT_CONFIGS[type as keyof typeof DEFAULT_CONFIGS] || {},
      position: elements.length,
      visible: true
    };
    
    setElements([...elements, newElement]);
    setSelectedElement(newElement);
    setConfigDrawerOpen(true);
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  };

  const updateElement = (id: string, config: Record<string, any>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, config } : el
    ));
    
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, config });
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(elements);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setElements(items.map((item, index) => ({ ...item, position: index })));
  };

  const applyTheme = (theme: any) => {
    setSelectedTheme(theme);
    toast({
      title: "Thème appliqué !",
      description: `Le thème "${theme.theme_name}" a été appliqué.`
    });
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
              <Button size="sm" className="bg-gradient-primary" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save size={16} className="mr-1" />
                {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
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
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Éléments disponibles</h2>
                <Input
                  placeholder="Nom du template"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-40"
                />
              </div>
              
              {/* Current Elements */}
              {elements.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Éléments ajoutés ({elements.length})</h3>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="elements">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {elements.map((element, index) => (
                            <Draggable key={element.id} draggableId={element.id} index={index}>
                              {(provided) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="cursor-pointer hover:bg-muted/50"
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-3">
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical size={16} className="text-muted-foreground" />
                                      </div>
                                      <div className="p-2 bg-primary/10 rounded-lg">
                                        {(() => {
                                          const ElementIcon = ELEMENT_TYPES.find(t => t.type === element.type)?.icon;
                                          return ElementIcon ? <ElementIcon size={16} className="text-primary" /> : null;
                                        })()}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium">
                                          {ELEMENT_TYPES.find(t => t.type === element.type)?.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {element.config.title || 'Sans titre'}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={element.visible}
                                          onCheckedChange={(checked) => 
                                            setElements(elements.map(el => 
                                              el.id === element.id ? { ...el, visible: checked } : el
                                            ))
                                          }
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedElement(element);
                                            setConfigDrawerOpen(true);
                                          }}
                                        >
                                          <Edit3 size={14} />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => removeElement(element.id)}
                                        >
                                          <Trash2 size={14} />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              )}

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
                        <Button size="sm" variant="outline" onClick={() => addElement(elementType.type)}>
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
              
              <div className="border rounded-lg bg-background min-h-[400px] overflow-y-auto">
                <BusinessPageRenderer 
                  elements={elements}
                  theme={selectedTheme}
                  previewMode={previewMode}
                />
              </div>
            </div>
          )}

          {/* Themes Section */}
          {activeSection === 'settings' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Thèmes et styles</h2>
              <div className="grid gap-3">
                {themes.map((theme) => (
                  <Card 
                    key={theme.id} 
                    className={`cursor-pointer hover:bg-muted/50 ${
                      selectedTheme?.id === theme.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => applyTheme(theme)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{theme.theme_name}</p>
                          <p className="text-sm text-muted-foreground">{theme.theme_category}</p>
                        </div>
                        <div className="flex gap-2">
                          {(theme.color_palette as any)?.primary && (
                            <div 
                              className="w-6 h-6 rounded-full border-2 border-background"
                              style={{ backgroundColor: (theme.color_palette as any).primary }}
                            />
                          )}
                          {(theme.color_palette as any)?.secondary && (
                            <div 
                              className="w-6 h-6 rounded-full border-2 border-background"
                              style={{ backgroundColor: (theme.color_palette as any).secondary }}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Element Configuration Drawer */}
        <Drawer open={configDrawerOpen} onOpenChange={setConfigDrawerOpen}>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader>
              <DrawerTitle>
                Configurer : {selectedElement ? ELEMENT_TYPES.find(t => t.type === selectedElement.type)?.label : ''}
              </DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto">
              {selectedElement && <ElementConfigForm element={selectedElement} onUpdate={updateElement} businessUserId={user?.id} />}
            </div>
          </DrawerContent>
        </Drawer>
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

// Element Configuration Form Component
function ElementConfigForm({ element, onUpdate, businessUserId }: { 
  element: PageElement; 
  onUpdate: (id: string, config: any) => void;
  businessUserId: string;
}) {
  const config = element.config;
  const updateConfig = (newConfig: any) => {
    onUpdate(element.id, { ...config, ...newConfig });
  };

  const [mediaDrawerOpen, setMediaDrawerOpen] = useState(false);
  const [currentMediaField, setCurrentMediaField] = useState<string>('');

  const handleMediaSelect = (url: string) => {
    if (currentMediaField) {
      if (currentMediaField === 'images') {
        const currentImages = config.images || [];
        updateConfig({ images: [...currentImages, url] });
      } else {
        updateConfig({ [currentMediaField]: url });
      }
      setMediaDrawerOpen(false);
      setCurrentMediaField('');
    }
  };

  const removeImage = (index: number) => {
    const currentImages = config.images || [];
    updateConfig({ images: currentImages.filter((_: any, i: number) => i !== index) });
  };

  switch (element.type) {
    case 'hero':
      return (
        <div className="space-y-4">
          <div>
            <Label>Titre principal</Label>
            <Input 
              value={config.title || ''} 
              onChange={(e) => updateConfig({ title: e.target.value })}
              placeholder="Bienvenue chez nous"
            />
          </div>
          <div>
            <Label>Sous-titre</Label>
            <Textarea 
              value={config.subtitle || ''} 
              onChange={(e) => updateConfig({ subtitle: e.target.value })}
              placeholder="Découvrez notre expérience unique"
              rows={3}
            />
          </div>
          <div>
            <Label>Texte du bouton</Label>
            <Input 
              value={config.buttonText || ''} 
              onChange={(e) => updateConfig({ buttonText: e.target.value })}
              placeholder="Réserver maintenant"
            />
          </div>
          <div>
            <Label>Image de fond</Label>
            <div className="flex gap-2">
              <Input 
                value={config.backgroundImage || ''} 
                onChange={(e) => updateConfig({ backgroundImage: e.target.value })}
                placeholder="URL de l'image"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentMediaField('backgroundImage');
                  setMediaDrawerOpen(true);
                }}
              >
                <Image size={16} />
              </Button>
            </div>
          </div>
        </div>
      );

    case 'about':
      return (
        <div className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input 
              value={config.title || ''} 
              onChange={(e) => updateConfig({ title: e.target.value })}
              placeholder="Notre Histoire"
            />
          </div>
          <div>
            <Label>Contenu</Label>
            <Textarea 
              value={config.content || ''} 
              onChange={(e) => updateConfig({ content: e.target.value })}
              placeholder="Décrivez votre entreprise..."
              rows={6}
            />
          </div>
          <div>
            <Label>Disposition</Label>
            <Select value={config.layout || 'left'} onValueChange={(value) => updateConfig({ layout: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Image à gauche</SelectItem>
                <SelectItem value="right">Image à droite</SelectItem>
                <SelectItem value="top">Image en haut</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Image</Label>
            <div className="flex gap-2">
              <Input 
                value={config.image || ''} 
                onChange={(e) => updateConfig({ image: e.target.value })}
                placeholder="URL de l'image"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentMediaField('image');
                  setMediaDrawerOpen(true);
                }}
              >
                <Image size={16} />
              </Button>
            </div>
          </div>
        </div>
      );

    case 'services':
      return (
        <div className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input 
              value={config.title || ''} 
              onChange={(e) => updateConfig({ title: e.target.value })}
              placeholder="Nos Services"
            />
          </div>
          <div>
            <Label>Services</Label>
            <div className="space-y-3">
              {(config.services || []).map((service: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-3 space-y-2">
                    <Input
                      value={service.name || ''}
                      onChange={(e) => {
                        const newServices = [...(config.services || [])];
                        newServices[index] = { ...service, name: e.target.value };
                        updateConfig({ services: newServices });
                      }}
                      placeholder="Nom du service"
                    />
                    <Input
                      value={service.description || ''}
                      onChange={(e) => {
                        const newServices = [...(config.services || [])];
                        newServices[index] = { ...service, description: e.target.value };
                        updateConfig({ services: newServices });
                      }}
                      placeholder="Description"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={service.price || ''}
                        onChange={(e) => {
                          const newServices = [...(config.services || [])];
                          newServices[index] = { ...service, price: e.target.value };
                          updateConfig({ services: newServices });
                        }}
                        placeholder="Prix"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newServices = [...(config.services || [])];
                          newServices.splice(index, 1);
                          updateConfig({ services: newServices });
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  const newServices = [...(config.services || []), { name: '', description: '', price: '' }];
                  updateConfig({ services: newServices });
                }}
              >
                <Plus size={16} className="mr-2" />
                Ajouter un service
              </Button>
            </div>
          </div>
        </div>
      );

    case 'gallery':
      return (
        <div className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input 
              value={config.title || ''} 
              onChange={(e) => updateConfig({ title: e.target.value })}
              placeholder="Galerie"
            />
          </div>
          <div>
            <Label>Nombre de colonnes</Label>
            <Slider
              value={[config.columns || 3]}
              onValueChange={([value]) => updateConfig({ columns: value })}
              min={1}
              max={6}
              step={1}
              className="mt-2"
            />
            <div className="text-sm text-muted-foreground mt-1">
              {config.columns || 3} colonnes
            </div>
          </div>
          <div>
            <Label>Images</Label>
            <div className="space-y-3">
              {config.images && config.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {config.images.map((image: string, index: number) => (
                    <div key={index} className="relative">
                      <img 
                        src={image} 
                        alt={`Galerie ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1"
                        onClick={() => removeImage(index)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentMediaField('images');
                  setMediaDrawerOpen(true);
                }}
              >
                <Plus size={16} className="mr-2" />
                Ajouter des images
              </Button>
            </div>
          </div>
        </div>
      );

    case 'contact':
      return (
        <div className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input 
              value={config.title || ''} 
              onChange={(e) => updateConfig({ title: e.target.value })}
              placeholder="Nous Contacter"
            />
          </div>
          <div>
            <Label>Adresse</Label>
            <Input 
              value={config.address || ''} 
              onChange={(e) => updateConfig({ address: e.target.value })}
              placeholder="Votre adresse"
            />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input 
              value={config.phone || ''} 
              onChange={(e) => updateConfig({ phone: e.target.value })}
              placeholder="Votre téléphone"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input 
              value={config.email || ''} 
              onChange={(e) => updateConfig({ email: e.target.value })}
              placeholder="Votre email"
            />
          </div>
          <div>
            <Label>Horaires</Label>
            <Input 
              value={config.hours || ''} 
              onChange={(e) => updateConfig({ hours: e.target.value })}
              placeholder="Lun-Ven 9h-18h"
            />
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input 
              value={config.title || ''} 
              onChange={(e) => updateConfig({ title: e.target.value })}
              placeholder="Prêt à réserver ?"
            />
          </div>
          <div>
            <Label>Sous-titre</Label>
            <Input 
              value={config.subtitle || ''} 
              onChange={(e) => updateConfig({ subtitle: e.target.value })}
              placeholder="Contactez-nous dès maintenant"
            />
          </div>
          <div>
            <Label>Texte du bouton</Label>
            <Input 
              value={config.buttonText || ''} 
              onChange={(e) => updateConfig({ buttonText: e.target.value })}
              placeholder="Réserver"
            />
          </div>
        </div>
      );

    default:
      return <div>Configuration non disponible pour ce type d'élément.</div>;
  }

  return (
    <>
      {/* Media Selection Drawer */}
      <Drawer open={mediaDrawerOpen} onOpenChange={setMediaDrawerOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Sélectionner un média</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto">
            <MediaUploadManager
              businessUserId={businessUserId}
              onMediaSelect={handleMediaSelect}
              acceptedTypes={['image/*']}
              maxSelection={1}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}