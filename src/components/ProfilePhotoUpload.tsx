import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateInitialsAvatar } from "@/utils/avatarUtils";

interface ProfilePhotoUploadProps {
  currentAvatarUrl?: string | null;
  firstName?: string;
  lastName?: string;
  onPhotoUpdated?: (newUrl: string) => void;
}

export function ProfilePhotoUpload({ 
  currentAvatarUrl, 
  firstName, 
  lastName, 
  onPhotoUpdated 
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // First, ensure the avatars bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError);
      }

      const avatarsBucket = buckets?.find(bucket => bucket.id === 'avatars');
      
      if (!avatarsBucket) {
        // Create the bucket if it doesn't exist
        const { error: createBucketError } = await supabase.storage.createBucket('avatars', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 1024 * 1024 * 5, // 5MB
        });

        if (createBucketError) {
          console.error("Error creating bucket:", createBucketError);
          throw createBucketError;
        }
      }

      // Upload the file
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      onPhotoUpdated?.(publicUrl);
      
      toast({
        title: "Photo mise à jour !",
        description: "Votre photo de profil a été mise à jour avec succès.",
      });

    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de votre photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const displayAvatarUrl = currentAvatarUrl || generateInitialsAvatar(firstName, lastName);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage src={displayAvatarUrl} alt="Photo de profil" />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
            {firstName?.charAt(0) || ''}{lastName?.charAt(0) || ''}
          </AvatarFallback>
        </Avatar>
        
        <label
          htmlFor="photo-upload"
          className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Camera size={16} />
        </label>
        
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => document.getElementById('photo-upload')?.click()}
        disabled={isUploading}
        className="flex items-center gap-2"
      >
        <Upload size={16} />
        {isUploading ? "Mise à jour..." : "Changer la photo"}
      </Button>
    </div>
  );
}