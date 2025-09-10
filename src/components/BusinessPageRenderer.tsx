import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, Users, Phone, Mail, MapPin, Calendar } from 'lucide-react';

interface PageElement {
  id: string;
  type: string;
  config: Record<string, any>;
  position: number;
  visible: boolean;
}

interface BusinessPageRendererProps {
  elements: PageElement[];
  businessData?: any;
  theme?: any;
  previewMode?: 'mobile' | 'desktop';
}

export default function BusinessPageRenderer({ 
  elements, 
  businessData, 
  theme, 
  previewMode = 'desktop' 
}: BusinessPageRendererProps) {
  const containerClass = previewMode === 'mobile' 
    ? 'w-full max-w-sm mx-auto' 
    : 'w-full max-w-6xl mx-auto';

  const renderElement = (element: PageElement) => {
    const { type, config } = element;

    switch (type) {
      case 'hero':
        return (
          <section 
            key={element.id}
            className="relative overflow-hidden rounded-lg mb-8"
            style={{ 
              backgroundColor: config.backgroundColor || theme?.color_palette?.primary || 'hsl(var(--primary))',
              color: config.textColor || 'hsl(var(--primary-foreground))',
              minHeight: previewMode === 'mobile' ? '300px' : '400px'
            }}
          >
            {config.backgroundImage && (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${config.backgroundImage})` }}
              />
            )}
            <div className="relative z-10 bg-black/30 p-8 md:p-12 text-center h-full flex flex-col justify-center">
              <h1 className={`font-bold mb-4 ${
                previewMode === 'mobile' ? 'text-2xl' : 'text-4xl md:text-6xl'
              }`}>
                {config.title || 'Titre Hero'}
              </h1>
              <p className={`mb-8 opacity-90 ${
                previewMode === 'mobile' ? 'text-base' : 'text-xl md:text-2xl'
              }`}>
                {config.subtitle || 'Sous-titre descriptif'}
              </p>
              <div>
                <Button 
                  size={previewMode === 'mobile' ? 'default' : 'lg'}
                  variant="secondary"
                >
                  {config.buttonText || 'Réserver maintenant'}
                </Button>
              </div>
            </div>
          </section>
        );

      case 'about':
        return (
          <section key={element.id} className="py-8 mb-8">
            <div className={`grid gap-8 ${
              config.layout === 'right' 
                ? 'md:grid-cols-2' 
                : config.layout === 'left'
                ? 'md:grid-cols-2'
                : 'grid-cols-1'
            } ${previewMode === 'mobile' ? 'grid-cols-1' : ''}`}>
              <div className={config.layout === 'right' ? 'md:order-2' : ''}>
                <h2 className={`font-bold mb-4 ${
                  previewMode === 'mobile' ? 'text-xl' : 'text-3xl'
                }`}>
                  {config.title || 'À Propos'}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {config.content || 'Votre description d\'entreprise apparaîtra ici. Décrivez votre passion, votre expertise et ce qui vous rend unique.'}
                </p>
              </div>
              {config.image && (
                <div className={config.layout === 'right' ? 'md:order-1' : ''}>
                  <img 
                    src={config.image} 
                    alt="À propos"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </section>
        );

      case 'services':
        return (
          <section key={element.id} className="py-8 mb-8">
            <h2 className={`font-bold text-center mb-8 ${
              previewMode === 'mobile' ? 'text-xl' : 'text-3xl'
            }`}>
              {config.title || 'Nos Services'}
            </h2>
            <div className={`grid gap-6 ${
              previewMode === 'mobile' 
                ? 'grid-cols-1' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {(config.services || [{ name: 'Service exemple', description: 'Description du service', price: '25€' }]).map((service: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span className={previewMode === 'mobile' ? 'text-lg' : 'text-xl'}>
                        {service.name}
                      </span>
                      <Badge variant="secondary">{service.price}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );

      case 'gallery':
        return (
          <section key={element.id} className="py-8 mb-8">
            <h2 className={`font-bold text-center mb-8 ${
              previewMode === 'mobile' ? 'text-xl' : 'text-3xl'
            }`}>
              {config.title || 'Galerie'}
            </h2>
            <div className={`grid gap-4 ${
              previewMode === 'mobile' 
                ? 'grid-cols-2' 
                : `grid-cols-2 md:grid-cols-${Math.min(config.columns || 3, 4)}`
            }`}>
              {(config.images || []).slice(0, 8).map((image: string, index: number) => (
                <div key={index} className="relative overflow-hidden rounded-lg aspect-square">
                  <img 
                    src={image} 
                    alt={`Galerie ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
              {(!config.images || config.images.length === 0) && (
                <div className="col-span-full text-center p-8 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                  <p className="text-muted-foreground">Ajoutez des images à votre galerie</p>
                </div>
              )}
            </div>
          </section>
        );

      case 'testimonials':
        return (
          <section key={element.id} className="py-8 mb-8">
            <h2 className={`font-bold text-center mb-8 ${
              previewMode === 'mobile' ? 'text-xl' : 'text-3xl'
            }`}>
              {config.title || 'Témoignages'}
            </h2>
            <div className={`grid gap-6 ${
              previewMode === 'mobile' 
                ? 'grid-cols-1' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {(config.testimonials || [{ name: 'Client Exemple', comment: 'Service excellent !', rating: 5 }]).map((testimonial: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {testimonial.name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{testimonial.name}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i}
                                className={`h-4 w-4 ${
                                  i < testimonial.rating 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm">{testimonial.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );

      case 'contact':
        return (
          <section key={element.id} className="py-8 mb-8">
            <h2 className={`font-bold text-center mb-8 ${
              previewMode === 'mobile' ? 'text-xl' : 'text-3xl'
            }`}>
              {config.title || 'Nous Contacter'}
            </h2>
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>{config.address || 'Votre adresse'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <span>{config.phone || 'Votre téléphone'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <span>{config.email || 'Votre email'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="font-medium">Horaires</span>
                    </div>
                    <p className="text-muted-foreground ml-8">
                      {config.hours || 'Lun-Ven 9h-18h'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        );

      case 'cta':
        return (
          <section 
            key={element.id}
            className="py-16 text-center rounded-lg mb-8"
            style={{ 
              backgroundColor: config.backgroundColor || theme?.color_palette?.accent || 'hsl(var(--accent))',
              color: config.textColor || 'hsl(var(--accent-foreground))'
            }}
          >
            <h2 className={`font-bold mb-4 ${
              previewMode === 'mobile' ? 'text-xl' : 'text-3xl'
            }`}>
              {config.title || 'Prêt à réserver ?'}
            </h2>
            <p className={`mb-8 opacity-90 ${
              previewMode === 'mobile' ? 'text-base' : 'text-lg'
            }`}>
              {config.subtitle || 'Contactez-nous dès maintenant'}
            </p>
            <div className={`flex gap-4 justify-center ${
              previewMode === 'mobile' ? 'flex-col items-center' : 'flex-row'
            }`}>
              <Button size={previewMode === 'mobile' ? 'default' : 'lg'}>
                {config.buttonText || 'Réserver'}
              </Button>
              <Button 
                size={previewMode === 'mobile' ? 'default' : 'lg'} 
                variant="outline"
              >
                Nous contacter
              </Button>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (!elements || elements.length === 0) {
    return (
      <div className={`${containerClass} p-8`}>
        <div className="text-center text-muted-foreground">
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-12">
            <h3 className="text-xl font-semibold mb-2">Votre page est vide</h3>
            <p>Ajoutez des éléments pour voir votre page prendre forme</p>
          </div>
        </div>
      </div>
    );
  }

  const visibleElements = elements
    .filter(el => el.visible)
    .sort((a, b) => a.position - b.position);

  return (
    <div className={`${containerClass} p-4`}>
      {/* Apply theme styles if available */}
      <div 
        style={{
          fontFamily: theme?.typography?.fontFamily || 'inherit',
          fontSize: theme?.typography?.fontSize || 'inherit'
        }}
      >
        {visibleElements.map(renderElement)}
      </div>
    </div>
  );
}