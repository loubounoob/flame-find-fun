import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Mail,
  Calendar,
  Euro
} from 'lucide-react';

interface PageElement {
  id: string;
  element_type: string;
  element_config: Record<string, any>;
  position_order: number;
  is_visible: boolean;
}

interface BusinessTemplate {
  id: string;
  template_name: string;
  template_config: Record<string, any>;
  business_page_elements: PageElement[];
}

export function CustomizableStorefront() {
  const { id } = useParams<{ id: string }>();

  // Fetch business template and data
  const { data: businessData, isLoading } = useQuery({
    queryKey: ['customizable-storefront', id],
    queryFn: async () => {
      // Get offer and business info
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select('*')
        .eq('id', id)
        .single();

      if (offerError) throw offerError;

      // Get business profile
      const { data: businessProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', offer.business_user_id)
        .single();

      // Get business template
      const { data: template, error: templateError } = await supabase
        .from('business_page_templates')
        .select(`
          *,
          business_page_elements (*)
        `)
        .eq('business_user_id', offer.business_user_id)
        .eq('is_active', true)
        .single();

      // Get business pricing
      const { data: pricing, error: pricingError } = await supabase
        .from('business_pricing')
        .select('*')
        .eq('business_user_id', offer.business_user_id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      // Get business media
      const { data: media, error: mediaError } = await supabase
        .from('business_media')
        .select('*')
        .eq('business_user_id', offer.business_user_id)
        .order('created_at', { ascending: false });

      // Get ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from('offer_ratings')
        .select(`
          *
        `)
        .eq('offer_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get profiles for ratings
      const userIds = ratings?.map(r => r.user_id) || [];
      const { data: ratingProfiles, error: ratingProfilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, avatar_url')
        .in('user_id', userIds);

      return {
        offer,
        business: businessProfile,
        template: template || null,
        pricing: pricing || [],
        media: media || [],
        ratings: ratings?.map(rating => ({
          ...rating,
          profile: ratingProfiles?.find(p => p.user_id === rating.user_id)
        })) || []
      };
    }
  });

  const renderElement = (element: PageElement) => {
    const { element_type, element_config } = element;

    switch (element_type) {
      case 'hero':
        return (
          <section 
            key={element.id}
            className="relative overflow-hidden rounded-lg"
            style={{ 
              backgroundColor: element_config.backgroundColor || 'hsl(var(--primary))',
              color: element_config.textColor || 'hsl(var(--primary-foreground))'
            }}
          >
            {element_config.backgroundImage && (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${element_config.backgroundImage})` }}
              />
            )}
            <div className="relative z-10 bg-black/20 p-12 text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {element_config.title || businessData?.offer?.title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                {element_config.subtitle || businessData?.offer?.description}
              </p>
              <Button 
                size="lg"
                variant={element_config.buttonStyle === 'secondary' ? 'secondary' : 'default'}
                onClick={() => window.location.href = `/booking/${businessData?.offer?.id}`}
              >
                {element_config.buttonText || 'Réserver maintenant'}
              </Button>
            </div>
          </section>
        );

      case 'pricing':
        return (
          <section key={element.id} className="py-12">
            <h2 className="text-3xl font-bold text-center mb-8">
              {element_config.title || 'Nos Tarifs'}
            </h2>
            <div className={`grid gap-6 ${
              element_config.layout === 'list' 
                ? 'grid-cols-1' 
                : element_config.layout === 'cards'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : `grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(element_config.columns || 3, businessData?.pricing?.length || 3)}`
            }`}>
              {businessData?.pricing?.map((price, index) => (
                <Card key={index} className="relative">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span>{price.service_name}</span>
                      {element_config.showPrices && (
                        <Badge variant="secondary" className="text-lg">
                          {price.price_amount}€
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {price.description && (
                      <p className="text-muted-foreground">{price.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {price.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {price.duration_minutes} min
                        </div>
                      )}
                      {price.max_participants && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Max {price.max_participants} pers.
                        </div>
                      )}
                    </div>
                    {price.special_conditions && (
                      <p className="text-xs text-muted-foreground italic">
                        {price.special_conditions}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );

      case 'gallery':
        return (
          <section key={element.id} className="py-12">
            <h2 className="text-3xl font-bold text-center mb-8">
              {element_config.title || 'Galerie'}
            </h2>
            <div className={`grid gap-4 ${
              element_config.layout === 'masonry' 
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {businessData?.media?.map((item, index) => (
                <div key={index} className="relative overflow-hidden rounded-lg aspect-square">
                  {item.media_type === 'image' ? (
                    <img 
                      src={item.media_url} 
                      alt={item.description || ''}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <video 
                      src={item.media_url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  )}
                  {element_config.showTitles && item.description && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white text-sm">{item.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'testimonials':
        return (
          <section key={element.id} className="py-12">
            <h2 className="text-3xl font-bold text-center mb-8">
              {element_config.title || 'Témoignages'}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {businessData?.ratings?.slice(0, 6).map((rating, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={rating.profile?.avatar_url} />
                        <AvatarFallback>
                          {rating.profile?.first_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">
                            {rating.profile?.first_name || 'Utilisateur'}
                          </span>
                          {element_config.showRatings && (
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < rating.rating 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">{rating.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );

      case 'cta':
        return (
          <section 
            key={element.id}
            className="py-16 text-center rounded-lg"
            style={{ backgroundColor: element_config.backgroundColor || 'hsl(var(--accent))' }}
          >
            <h2 className="text-3xl font-bold mb-4">
              {element_config.title || 'Prêt à réserver ?'}
            </h2>
            <p className="text-lg mb-8 opacity-90">
              {element_config.subtitle || 'Contactez-nous dès maintenant'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => window.location.href = `/booking/${businessData?.offer?.id}`}
              >
                {element_config.primaryButton || 'Réserver'}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = `tel:${businessData?.business?.phone || ''}`}
              >
                {element_config.secondaryButton || 'Nous contacter'}
              </Button>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement de votre page personnalisée...</p>
        </div>
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Page introuvable</h1>
          <p className="text-muted-foreground">Cette page n'existe pas ou n'est plus disponible.</p>
        </div>
      </div>
    );
  }

  // If no custom template, show default layout
  if (!businessData.template || !businessData.template.business_page_elements?.length) {
    return (
      <div className="min-h-screen">
        {/* Default Hero */}
        <section className="relative bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {businessData.offer.title}
            </h1>
            <p className="text-xl mb-8 opacity-90">
              {businessData.offer.description}
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => window.location.href = `/booking/${businessData.offer.id}`}
            >
              Réserver maintenant
            </Button>
          </div>
        </section>

        {/* Default Content */}
        <div className="container mx-auto px-4 py-12 space-y-16">
          {/* Business Info */}
          <section className="text-center">
            <div className="flex justify-center mb-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={businessData.business.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {businessData.business.business_name?.charAt(0) || 'B'}
                </AvatarFallback>
              </Avatar>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {businessData.business.business_name || businessData.business.first_name}
            </h2>
            {businessData.business.bio && (
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {businessData.business.bio}
              </p>
            )}
          </section>

          {/* Pricing */}
          {businessData.pricing.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-center mb-8">Nos Tarifs</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {businessData.pricing.map((price, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start">
                        <span>{price.service_name}</span>
                        <Badge variant="secondary" className="text-lg">
                          {price.price_amount}€
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {price.description && (
                        <p className="text-muted-foreground mb-4">{price.description}</p>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {price.duration_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {price.duration_minutes} min
                          </div>
                        )}
                        {price.max_participants && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Max {price.max_participants}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Final CTA */}
          <section className="bg-accent rounded-lg p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Prêt à réserver ?</h2>
            <p className="text-lg mb-8">Contactez-nous pour réserver votre créneau</p>
            <Button 
              size="lg"
              onClick={() => window.location.href = `/booking/${businessData.offer.id}`}
            >
              Réserver maintenant
            </Button>
          </section>
        </div>
      </div>
    );
  }

  // Render custom template
  const sortedElements = businessData.template.business_page_elements
    .filter(el => el.is_visible)
    .sort((a, b) => a.position_order - b.position_order);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 space-y-16">
        {sortedElements.map((element: any) => renderElement({
        id: element.id,
        element_type: element.element_type,
        element_config: element.element_config,
        position_order: element.position_order,
        is_visible: element.is_visible
      }))}
      </div>
    </div>
  );
}