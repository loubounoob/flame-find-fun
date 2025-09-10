import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Plus, 
  Trash2, 
  Eye, 
  Save, 
  Palette, 
  Layout,
  Image,
  Type,
  Settings,
  Upload,
  Play,
  Smartphone,
  Monitor,
  GripVertical,
  Edit3
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PageElement {
  id: string;
  type: string;
  config: Record<string, any>;
  position: number;
  visible: boolean;
}

interface Theme {
  id: string;
  theme_name: string;
  theme_category: string;
  color_palette: any;
  typography: any;
  layout_config: any;
}

const ELEMENT_TYPES = [
  { 
    type: 'hero', 
    label: 'Section Hero', 
    icon: Layout,
    description: 'Bannière d\'accueil avec titre, sous-titre et image' 
  },
  { 
    type: 'about', 
    label: 'À Propos', 
    icon: Edit3,
    description: 'Section descriptive de votre entreprise' 
  },
  { 
    type: 'services', 
    label: 'Services', 
    icon: Settings,
    description: 'Liste de vos services et tarifs' 
  },
  { 
    type: 'gallery', 
    label: 'Galerie', 
    icon: Image,
    description: 'Galerie d\'images de votre entreprise' 
  },
  { 
    type: 'testimonials', 
    label: 'Témoignages', 
    icon: Type,
    description: 'Avis et témoignages clients' 
  },
  { 
    type: 'contact', 
    label: 'Contact', 
    icon: Plus,
    description: 'Informations de contact et horaires' 
  },
  { 
    type: 'cta', 
    label: 'Appel à l\'action', 
    icon: Play,
    description: 'Bouton de réservation ou d\'action' 
  }
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

export default function BusinessPageCustomizer({ businessUserId }: { businessUserId: string }) {
  const [elements, setElements] = useState<PageElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<PageElement | null>(null);
  const [templateName, setTemplateName] = useState('Ma Page Entreprise');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Charger le template existant
  const { data: existingTemplate } = useQuery({
    queryKey: ['business-template', businessUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_page_templates')
        .select(`
          *,
          business_page_elements (*)
        `)
        .eq('business_user_id', businessUserId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
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

  // Charger les médias de l'entreprise
  const { data: mediaLibrary = [] } = useQuery({
    queryKey: ['business-media', businessUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_media_library')
        .select('*')
        .eq('business_user_id', businessUserId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

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
      // Créer ou mettre à jour le template
      const { data: templateData, error: templateError } = await supabase
        .from('business_page_templates')
        .upsert({
          business_user_id: businessUserId,
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
      queryClient.invalidateQueries({ queryKey: ['business-template', businessUserId] });
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

  const uploadMedia = async (file: File, type: 'image' | 'video' | 'logo' | 'banner') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessUserId}/${type}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Sauvegarder dans la media library
      await supabase
        .from('business_media_library')
        .insert({
          business_user_id: businessUserId,
          media_url: publicUrl,
          media_type: type,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type
        });

      queryClient.invalidateQueries({ queryKey: ['business-media', businessUserId] });
      
      toast({
        title: "Média uploadé !",
        description: "Votre fichier a été ajouté à la bibliothèque."
      });

      return publicUrl;
    } catch (error) {
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'uploader le fichier.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const applyTheme = (theme: Theme) => {
    setSelectedTheme(theme);
    toast({
      title: "Thème appliqué !",
      description: `Le thème "${theme.theme_name}" a été appliqué.`
    });
  };

  const renderElementConfig = () => {
    if (!selectedElement) return null;

    const config = selectedElement.config;
    const updateConfig = (newConfig: any) => {
      updateElement(selectedElement.id, { ...config, ...newConfig });
    };

    switch (selectedElement.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hero-title">Titre principal</Label>
              <Input 
                id="hero-title"
                value={config.title || ''} 
                onChange={(e) => updateConfig({ title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="hero-subtitle">Sous-titre</Label>
              <Textarea 
                id="hero-subtitle"
                value={config.subtitle || ''} 
                onChange={(e) => updateConfig({ subtitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="hero-button">Texte du bouton</Label>
              <Input 
                id="hero-button"
                value={config.buttonText || ''} 
                onChange={(e) => updateConfig({ buttonText: e.target.value })}
              />
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="about-title">Titre</Label>
              <Input 
                id="about-title"
                value={config.title || ''} 
                onChange={(e) => updateConfig({ title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="about-content">Contenu</Label>
              <Textarea 
                id="about-content"
                value={config.content || ''} 
                onChange={(e) => updateConfig({ content: e.target.value })}
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="about-layout">Disposition</Label>
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
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="gallery-title">Titre</Label>
              <Input 
                id="gallery-title"
                value={config.title || ''} 
                onChange={(e) => updateConfig({ title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="gallery-columns">Nombre de colonnes</Label>
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
              <div className="grid grid-cols-2 gap-2 mt-2">
                {mediaLibrary
                  .filter(media => media.media_type === 'image')
                  .slice(0, 6)
                  .map(media => (
                    <div key={media.id} className="relative">
                      <img 
                        src={media.media_url} 
                        alt={media.alt_text || ''}
                        className="w-full h-20 object-cover rounded cursor-pointer"
                        onClick={() => {
                          const currentImages = config.images || [];
                          updateConfig({ 
                            images: [...currentImages, media.media_url]
                          });
                        }}
                      />
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-muted-foreground py-8">
            <p>Configuration pour {selectedElement.type}</p>
            <p className="text-sm mt-2">Éléments de configuration à venir...</p>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Control Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}
          >
            {previewMode === 'desktop' ? <Smartphone size={16} /> : <Monitor size={16} />}
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save size={16} className="mr-2" />
            {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel des éléments - Hidden on mobile, drawer on tablet */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="elements" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="elements">Éléments</TabsTrigger>
              <TabsTrigger value="themes">Thèmes</TabsTrigger>
              <TabsTrigger value="media">Médias</TabsTrigger>
            </TabsList>
            
            <TabsContent value="elements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ajouter un élément</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ELEMENT_TYPES.map((elementType) => (
                    <Button
                      key={elementType.type}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addElement(elementType.type)}
                    >
                      <elementType.icon size={16} className="mr-2" />
                      {elementType.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="themes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Thèmes prédéfinis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {themes.map((theme) => (
                    <div 
                      key={theme.id} 
                      className="p-3 border rounded cursor-pointer hover:bg-muted"
                      onClick={() => applyTheme(theme)}
                    >
                      <div className="font-medium text-sm">{theme.theme_name}</div>
                      <div className="text-xs text-muted-foreground">{theme.theme_category}</div>
                      <div className="flex gap-1 mt-2">
                        {Object.values(theme.color_palette).slice(0, 4).map((color, idx) => (
                          <div 
                            key={idx} 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: color as string }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Bibliothèque média</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {mediaLibrary.slice(0, 6).map((media) => (
                      <div key={media.id} className="relative">
                        <img 
                          src={media.media_url} 
                          alt={media.alt_text || ''}
                          className="w-full h-16 object-cover rounded"
                        />
                        <Badge 
                          variant="secondary" 
                          className="absolute top-1 right-1 text-xs"
                        >
                          {media.media_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Upload size={16} className="mr-2" />
                    Ajouter des médias
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Centre - Structure de la page */}
        <div className="lg:col-span-6">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Structure de la page</CardTitle>
                <Input 
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="max-w-xs"
                  placeholder="Nom du template"
                />
              </div>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="elements">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {elements.map((element, index) => {
                        const elementType = ELEMENT_TYPES.find(et => et.type === element.type);
                        return (
                          <Draggable key={element.id} draggableId={element.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`
                                  p-3 border rounded-lg cursor-pointer transition-all
                                  ${selectedElement?.id === element.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted'}
                                  ${snapshot.isDragging ? 'shadow-lg' : ''}
                                `}
                                onClick={() => setSelectedElement(element)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical size={16} className="text-muted-foreground" />
                                    </div>
                                    {elementType?.icon && <elementType.icon size={16} />}
                                    <span className="font-medium">{elementType?.label}</span>
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
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeElement(element.id);
                                      }}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      
                      {elements.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Layout size={48} className="mx-auto mb-4 opacity-50" />
                          <p>Ajoutez des éléments pour construire votre page</p>
                          <p className="text-sm">Utilisez le panneau de gauche pour commencer</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </div>

        {/* Panel de configuration */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">
                {selectedElement ? `Configurer ${ELEMENT_TYPES.find(et => et.type === selectedElement.type)?.label}` : 'Configuration'}
              </CardTitle>
            </CardHeader>          
            <CardContent>
              {selectedElement ? (
                renderElementConfig()
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Settings size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez un élément</p>
                  <p className="text-sm">Cliquez sur un élément pour le configurer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}