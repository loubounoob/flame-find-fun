import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface MediaUploadProps {
  onMediaUploaded?: (url: string, type: 'image' | 'video') => void;
  maxFiles?: number;
  allowedTypes?: ('image' | 'video')[];
}

export function MediaUpload({ 
  onMediaUploaded, 
  maxFiles = 5,
  allowedTypes = ['image', 'video']
}: MediaUploadProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Récupérer les médias existants depuis la base de données
  const { data: existingMedia = [] } = useQuery({
    queryKey: ['business-media', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('business_media')
        .select('*')
        .eq('business_user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Mutation pour supprimer un média
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const { error } = await supabase
        .from('business_media')
        .delete()
        .eq('id', mediaId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-media', user?.id] });
      toast({
        title: "Média supprimé",
        description: "Le média a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer le média.",
        variant: "destructive"
      });
      console.error('Error deleting media:', error);
    }
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user?.id) return;

    if (existingMedia.length + files.length > maxFiles) {
      toast({
        title: "Limite atteinte",
        description: `Vous ne pouvez uploader que ${maxFiles} fichiers maximum.`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (!isImage && !isVideo) {
          toast({
            title: "Format non supporté",
            description: "Seules les images et vidéos sont autorisées.",
            variant: "destructive"
          });
          continue;
        }

        const mediaType = isImage ? 'image' : 'video';
        if (!allowedTypes.includes(mediaType)) {
          toast({
            title: "Type non autorisé",
            description: `Les fichiers de type ${mediaType} ne sont pas autorisés.`,
            variant: "destructive"
          });
          continue;
        }

        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `business-media/${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Enregistrer en base de données
        const { error: dbError } = await supabase
          .from('business_media')
          .insert({
            business_user_id: user.id,
            media_url: publicUrl,
            media_type: mediaType,
            description: file.name
          });

        if (dbError) throw dbError;

        onMediaUploaded?.(publicUrl, mediaType);
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['business-media', user?.id] });

      toast({
        title: "Upload réussi",
        description: "Vos fichiers ont été uploadés avec succès !",
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'uploader les fichiers.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (mediaId: string) => {
    deleteMediaMutation.mutate(mediaId);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Ajouter des médias</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Partagez des photos et vidéos de votre activité ({existingMedia.length}/{maxFiles})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  disabled={uploading || existingMedia.length >= maxFiles}
                />
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={uploading || existingMedia.length >= maxFiles}
                  asChild
                >
                  <div>
                    <Camera className="mr-2" size={16} />
                    {uploading ? "Upload..." : "Photos"}
                  </div>
                </Button>
              </label>

              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  disabled={uploading || existingMedia.length >= maxFiles}
                />
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={uploading || existingMedia.length >= maxFiles}
                  asChild
                >
                  <div>
                    <Video className="mr-2" size={16} />
                    {uploading ? "Upload..." : "Vidéos"}
                  </div>
                </Button>
              </label>
            </div>

            {/* Media Grid */}
            {existingMedia.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {existingMedia.map((media) => (
                  <div key={media.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      {media.media_type === 'image' ? (
                        <img 
                          src={media.media_url} 
                          alt={media.description || 'Media'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video 
                          src={media.media_url}
                          className="w-full h-full object-cover"
                          controls={false}
                          muted
                        />
                      )}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 left-2 text-xs"
                    >
                      {media.media_type === 'image' ? <ImageIcon size={12} /> : <Video size={12} />}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMedia(media.id)}
                      disabled={deleteMediaMutation.isPending}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}