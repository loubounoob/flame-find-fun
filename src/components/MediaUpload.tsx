import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [uploading, setUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<Array<{url: string, type: 'image' | 'video', name: string}>>([]);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (uploadedMedia.length + files.length > maxFiles) {
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
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        const newMedia = {
          url: publicUrl,
          type: mediaType as 'image' | 'video',
          name: file.name
        };

        setUploadedMedia(prev => [...prev, newMedia]);
        onMediaUploaded?.(publicUrl, mediaType);
      }

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

  const removeMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Ajouter des médias</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Partagez des photos et vidéos de votre activité ({uploadedMedia.length}/{maxFiles})
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
                  disabled={uploading || uploadedMedia.length >= maxFiles}
                />
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={uploading || uploadedMedia.length >= maxFiles}
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
                  disabled={uploading || uploadedMedia.length >= maxFiles}
                />
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={uploading || uploadedMedia.length >= maxFiles}
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
            {uploadedMedia.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {uploadedMedia.map((media, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      {media.type === 'image' ? (
                        <img 
                          src={media.url} 
                          alt={media.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video 
                          src={media.url}
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
                      {media.type === 'image' ? <ImageIcon size={12} /> : <Video size={12} />}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMedia(index)}
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