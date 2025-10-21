import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OfferMediaUploadProps {
  businessUserId: string;
  selectedUrls: string[];
  onMediaChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function OfferMediaUpload({ 
  businessUserId,
  selectedUrls,
  onMediaChange,
  maxFiles = 10
}: OfferMediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (selectedUrls.length + files.length > maxFiles) {
      toast({
        title: "Limite atteinte",
        description: `Vous ne pouvez ajouter que ${maxFiles} médias maximum par offre.`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

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

        // Validate video file size (max 50MB for short videos)
        if (isVideo) {
          const maxSizeMB = 50;
          const maxSizeBytes = maxSizeMB * 1024 * 1024;
          if (file.size > maxSizeBytes) {
            toast({
              title: "Fichier trop volumineux",
              description: `Les vidéos doivent faire moins de ${maxSizeMB}MB. Votre vidéo fait ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
              variant: "destructive"
            });
            continue;
          }
        }

        // Validate image file size (max 10MB)
        if (isImage) {
          const maxSizeMB = 10;
          const maxSizeBytes = maxSizeMB * 1024 * 1024;
          if (file.size > maxSizeBytes) {
            toast({
              title: "Fichier trop volumineux",
              description: `Les images doivent faire moins de ${maxSizeMB}MB.`,
              variant: "destructive"
            });
            continue;
          }
        }

        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `offer-media/${businessUserId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        newUrls.push(publicUrl);
      }

      onMediaChange([...selectedUrls, ...newUrls]);

      toast({
        title: "Upload réussi",
        description: `${newUrls.length} média(s) ajouté(s) à l'offre !`,
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

  const removeMedia = (urlToRemove: string) => {
    onMediaChange(selectedUrls.filter(url => url !== urlToRemove));
    toast({
      title: "Média retiré",
      description: "Le média a été retiré de l'offre.",
    });
  };

  const getMediaType = (url: string): 'image' | 'video' => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext)) ? 'video' : 'image';
  };

  return (
    <div className="space-y-3">
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm mb-1">Médias de l'offre</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Ajoutez des photos et vidéos pour cette offre ({selectedUrls.length}/{maxFiles})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  disabled={uploading || selectedUrls.length >= maxFiles}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  disabled={uploading || selectedUrls.length >= maxFiles}
                  asChild
                >
                  <div>
                    <Camera className="mr-2" size={14} />
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
                  disabled={uploading || selectedUrls.length >= maxFiles}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  disabled={uploading || selectedUrls.length >= maxFiles}
                  asChild
                >
                  <div>
                    <Video className="mr-2" size={14} />
                    {uploading ? "Upload..." : "Vidéos"}
                  </div>
                </Button>
              </label>
            </div>

            {/* Media Grid */}
            {selectedUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {selectedUrls.map((url, index) => {
                  const mediaType = getMediaType(url);
                  return (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        {mediaType === 'image' ? (
                          <img 
                            src={url} 
                            alt={`Média ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video 
                            src={url}
                            className="w-full h-full object-cover"
                            controls={false}
                            muted
                          />
                        )}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="absolute top-1 left-1 text-xs h-5 px-1"
                      >
                        {mediaType === 'image' ? <ImageIcon size={10} /> : <Video size={10} />}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeMedia(url)}
                      >
                        <X size={10} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
