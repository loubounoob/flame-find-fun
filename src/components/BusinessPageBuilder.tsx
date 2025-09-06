import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Trash2, 
  Eye, 
  Save, 
  Layout, 
  Image, 
  DollarSign, 
  MessageSquare,
  Phone,
  Palette
} from 'lucide-react';

interface PageElement {
  id: string;
  type: 'hero' | 'pricing' | 'gallery' | 'testimonials' | 'cta' | 'form';
  config: Record<string, any>;
  position: number;
  visible: boolean;
}

interface BusinessPageBuilderProps {
  businessUserId: string;
  onPreview?: (templateId: string) => void;
  onSave?: () => void;
}

const elementTypes = [
  { type: 'hero', icon: Layout, label: 'Section Héro', description: 'Bannière principale avec image et texte' },
  { type: 'pricing', icon: DollarSign, label: 'Tarification', description: 'Grille de prix et services' },
  { type: 'gallery', icon: Image, label: 'Galerie', description: 'Images et vidéos de votre activité' },
  { type: 'testimonials', icon: MessageSquare, label: 'Témoignages', description: 'Avis clients et évaluations' },
  { type: 'cta', icon: Phone, label: 'Call-to-Action', description: 'Boutons de réservation et contact' },
  { type: 'form', icon: Layout, label: 'Formulaire', description: 'Formulaire de réservation personnalisé' },
];

const defaultConfigs = {
  hero: {
    title: 'Bienvenue chez nous',
    subtitle: 'Découvrez une expérience unique',
    backgroundImage: '',
    backgroundColor: 'hsl(var(--primary))',
    textColor: 'hsl(var(--primary-foreground))',
    buttonText: 'Réserver maintenant',
    buttonStyle: 'primary'
  },
  pricing: {
    title: 'Nos Tarifs',
    showPrices: true,
    layout: 'grid',
    columns: 3,
    theme: 'modern'
  },
  gallery: {
    title: 'Galerie Photos',
    layout: 'masonry',
    showTitles: true,
    autoplay: false
  },
  testimonials: {
    title: 'Ce que disent nos clients',
    layout: 'carousel',
    showRatings: true,
    autoplay: true
  },
  cta: {
    title: 'Prêt à réserver ?',
    subtitle: 'Contactez-nous dès maintenant',
    primaryButton: 'Réserver',
    secondaryButton: 'Nous contacter',
    backgroundColor: 'hsl(var(--accent))'
  },
  form: {
    title: 'Formulaire de réservation',
    fields: ['name', 'email', 'date', 'participants', 'message'],
    layout: 'vertical',
    submitText: 'Envoyer'
  }
};

export function BusinessPageBuilder({ businessUserId, onPreview, onSave }: BusinessPageBuilderProps) {
  const [elements, setElements] = useState<PageElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<PageElement | null>(null);
  const [templateName, setTemplateName] = useState('Ma page personnalisée');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing template
  const { data: template, isLoading } = useQuery({
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

  // Load template data
  React.useEffect(() => {
    if (template) {
      setTemplateName(template.template_name);
      if (template.business_page_elements) {
        const pageElements = template.business_page_elements
          .sort((a, b) => a.position_order - b.position_order)
          .map((el, index) => ({
            id: el.id,
            type: el.element_type as PageElement['type'],
            config: el.element_config as Record<string, any>,
            position: index,
            visible: el.is_visible
          }));
        setElements(pageElements);
      }
    }
  }, [template]);

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      // First save/update template
      const { data: templateData, error: templateError } = await supabase
        .from('business_page_templates')
        .upsert({
          id: template?.id,
          business_user_id: businessUserId,
          template_name: templateName,
          is_active: true,
          template_config: { theme: 'custom', version: '1.0' }
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Delete existing elements
      if (template?.id) {
        await supabase
          .from('business_page_elements')
          .delete()
          .eq('template_id', template.id);
      }

      // Insert new elements
      const elementsToInsert = elements.map((element, index) => ({
        template_id: templateData.id,
        element_type: element.type,
        element_config: element.config,
        position_order: index,
        is_visible: element.visible
      }));

      const { error: elementsError } = await supabase
        .from('business_page_elements')
        .insert(elementsToInsert);

      if (elementsError) throw elementsError;

      return templateData;
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Votre page a été sauvegardée !",
      });
      queryClient.invalidateQueries({ queryKey: ['business-template'] });
      onSave?.();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la page",
        variant: "destructive",
      });
      console.error(error);
    }
  });

  const addElement = useCallback((type: PageElement['type']) => {
    const newElement: PageElement = {
      id: `element-${Date.now()}`,
      type,
      config: defaultConfigs[type],
      position: elements.length,
      visible: true
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement);
  }, [elements]);

  const removeElement = useCallback((elementId: string) => {
    setElements(elements.filter(el => el.id !== elementId));
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
  }, [elements, selectedElement]);

  const updateElement = useCallback((elementId: string, config: Record<string, any>) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, config: { ...el.config, ...config } } : el
    ));
    if (selectedElement?.id === elementId) {
      setSelectedElement({ ...selectedElement, config: { ...selectedElement.config, ...config } });
    }
  }, [elements, selectedElement]);

  const onDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const items = Array.from(elements);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setElements(items.map((item, index) => ({ ...item, position: index })));
  }, [elements]);

  const renderElementConfig = () => {
    if (!selectedElement) return null;

    const { type, config } = selectedElement;

    switch (type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hero-title">Titre principal</Label>
              <Input
                id="hero-title"
                value={config.title}
                onChange={(e) => updateElement(selectedElement.id, { title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="hero-subtitle">Sous-titre</Label>
              <Textarea
                id="hero-subtitle"
                value={config.subtitle}
                onChange={(e) => updateElement(selectedElement.id, { subtitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="hero-button">Texte du bouton</Label>
              <Input
                id="hero-button"
                value={config.buttonText}
                onChange={(e) => updateElement(selectedElement.id, { buttonText: e.target.value })}
              />
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pricing-title">Titre</Label>
              <Input
                id="pricing-title"
                value={config.title}
                onChange={(e) => updateElement(selectedElement.id, { title: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.showPrices}
                onCheckedChange={(checked) => updateElement(selectedElement.id, { showPrices: checked })}
              />
              <Label>Afficher les prix</Label>
            </div>
            <div>
              <Label htmlFor="pricing-layout">Disposition</Label>
              <Select 
                value={config.layout} 
                onValueChange={(value) => updateElement(selectedElement.id, { layout: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grille</SelectItem>
                  <SelectItem value="list">Liste</SelectItem>
                  <SelectItem value="cards">Cartes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="element-title">Titre</Label>
              <Input
                id="element-title"
                value={config.title || ''}
                onChange={(e) => updateElement(selectedElement.id, { title: e.target.value })}
              />
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Panel - Elements Library */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Éléments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {elementTypes.map(({ type, icon: Icon, label, description }) => (
            <div
              key={type}
              className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
              onClick={() => addElement(type as PageElement['type'])}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium">{label}</h4>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Center Panel - Page Structure */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Structure de la page</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Nom de la page"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="elements">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {elements.map((element, index) => (
                    <Draggable key={element.id} draggableId={element.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-3 border rounded-lg transition-all ${
                            selectedElement?.id === element.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-accent'
                          } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                          onClick={() => setSelectedElement(element)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <Layout className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span className="font-medium">
                                {elementTypes.find(et => et.type === element.type)?.label}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeElement(element.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <Separator className="my-4" />

          <div className="flex gap-2">
            <Button 
              onClick={() => saveTemplateMutation.mutate()}
              disabled={saveTemplateMutation.isPending}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveTemplateMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => template?.id && onPreview?.(template.id)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Prévisualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Element Configuration */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedElement ? (
            <div className="space-y-4">
              <h4 className="font-medium">
                {elementTypes.find(et => et.type === selectedElement.type)?.label}
              </h4>
              {renderElementConfig()}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Sélectionnez un élément pour le configurer</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}