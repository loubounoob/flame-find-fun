import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  Image, 
  Video, 
  FileText,
  Trash2,
  Plus,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MediaUploadManagerProps {
  businessUserId: string;
  onMediaSelect?: (url: string) => void;
  selectedUrls?: string[];
  maxSelection?: number;
  acceptedTypes?: string[];
}

export default function MediaUploadManager({ 
  businessUserId, 
  onMediaSelect,
  selectedUrls = [],
  maxSelection,
  acceptedTypes = ['image/*', 'video/*']
}: MediaUploadManagerProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch media library
  const { data: mediaLibrary = [], isLoading } = useQuery({
    queryKey: ['business-media-library', businessUserId],
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

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploads = [];
      
      for (const file of files) {
        setIsUploading(true);
        const fileExt = file.name.split('.').pop();
        const mediaType = file.type.startsWith('image/') ? 'image' : 
                         file.type.startsWith('video/') ? 'video' : 'document';
        const fileName = `${businessUserId}/${mediaType}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Save to media library
        const { data: mediaData, error: mediaError } = await supabase
          .from('business_media_library')
          .insert({
            business_user_id: businessUserId,
            media_url: publicUrl,
            media_type: mediaType,
            original_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            alt_text: file.name.split('.')[0]
          })
          .select()
          .single();

        if (mediaError) throw mediaError;
        uploads.push(mediaData);
      }
      
      return uploads;
    },
    onSuccess: (data) => {
      setIsUploading(false);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ['business-media-library', businessUserId] });
      toast({
        title: "Médias uploadés !",
        description: `${data.length} fichier(s) ajouté(s) à votre bibliothèque.`
      });
    },
    onError: (error) => {
      setIsUploading(false);
      setUploadProgress(0);
      console.error('Upload error:', error);
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'uploader les fichiers.",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const { error } = await supabase
        .from('business_media_library')
        .update({ is_active: false })
        .eq('id', mediaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-media-library', businessUserId] });
      toast({
        title: "Média supprimé",
        description: "Le fichier a été retiré de votre bibliothèque."
      });
    }
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      uploadMutation.mutate(files);
    }
  }, [uploadMutation]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Check if adding these files would exceed the limit
      if (mediaLibrary.length + files.length > 10) {
        toast({
          title: "Limite atteinte",
          description: `Vous ne pouvez avoir que 10 médias maximum. Actuellement: ${mediaLibrary.length}`,
          variant: "destructive"
        });
        return;
      }
      
      uploadMutation.mutate(files);
    }
  };

  const handleMediaClick = (url: string) => {
    if (onMediaSelect) {
      onMediaSelect(url);
    }
  };

  const isSelected = (url: string) => selectedUrls.includes(url);
  const canSelectMore = !maxSelection || selectedUrls.length < maxSelection;

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Uploader des médias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-4 md:p-6 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm md:text-base font-medium">
                  Glissez vos fichiers ici ou cliquez pour sélectionner
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Images, vidéos • Max 10MB par fichier
                </p>
              </div>
              <div>
                <Input
                  type="file"
                  multiple
                  accept={acceptedTypes.join(',')}
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading || mediaLibrary.length >= 10}
                />
                <Label htmlFor="file-upload">
                  <Button 
                    variant="outline" 
                    disabled={isUploading || mediaLibrary.length >= 10}
                    className="cursor-pointer text-sm"
                    asChild
                  >
                    <span>
                      <Plus className="h-4 w-4 mr-2" />
                      Sélectionner des fichiers
                    </span>
                  </Button>
                </Label>
              </div>
            </div>
          </div>
          
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload en cours...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Library */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Bibliothèque média ({mediaLibrary.length}/10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mediaLibrary.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun média dans votre bibliothèque</p>
              <p className="text-sm">Uploadez vos premiers fichiers pour commencer</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaLibrary.map((media) => (
                <div key={media.id} className="relative group">
                  <div 
                    className={`relative overflow-hidden rounded-lg cursor-pointer transition-all ${
                      isSelected(media.media_url) 
                        ? 'ring-2 ring-primary' 
                        : 'hover:ring-2 hover:ring-primary/50'
                    }`}
                    onClick={() => canSelectMore || isSelected(media.media_url) ? handleMediaClick(media.media_url) : null}
                  >
                    {media.media_type === 'image' ? (
                      <img
                        src={media.media_url}
                        alt={media.alt_text || ''}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 bg-muted flex items-center justify-center">
                        <Video className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Selection indicator */}
                    {isSelected(media.media_url) && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}

                    {/* Type badge */}
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 left-2 text-xs"
                    >
                      {getMediaIcon(media.media_type)}
                    </Badge>

                    {/* Delete button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(media.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {media.original_name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection info */}
      {maxSelection && (
        <div className="text-sm text-muted-foreground">
          {selectedUrls.length} / {maxSelection} sélectionné(s)
        </div>
      )}
    </div>
  );
}