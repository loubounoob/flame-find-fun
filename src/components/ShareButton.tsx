import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share, MessageCircle, Instagram, Send, Copy, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  title: string;
  description: string;
  url?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ShareButton({ 
  title, 
  description, 
  url = window.location.href,
  variant = "outline",
  size = "default"
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const shareText = `🔥 Découvre cette super offre : ${title}\n\n${description}\n\n`;
  
  const shareOptions = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "text-green-500",
      bgColor: "hover:bg-green-50 dark:hover:bg-green-900/20",
      action: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + url)}`;
        window.open(whatsappUrl, '_blank');
        setIsOpen(false);
      }
    },
    {
      name: "Telegram",
      icon: Send,
      color: "text-blue-500",
      bgColor: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
      action: () => {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`;
        window.open(telegramUrl, '_blank');
        setIsOpen(false);
      }
    },
    {
      name: "Messenger",
      icon: MessageCircle,
      color: "text-blue-600",
      bgColor: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
      action: () => {
        const messengerUrl = `https://www.messenger.com/t/?link=${encodeURIComponent(url)}`;
        window.open(messengerUrl, '_blank');
        setIsOpen(false);
      }
    },
    {
      name: "Instagram",
      icon: Instagram,
      color: "text-pink-500",
      bgColor: "hover:bg-pink-50 dark:hover:bg-pink-900/20",
      action: () => {
        // Instagram doesn't have direct URL sharing, so we copy the text
        navigator.clipboard.writeText(shareText + url);
        toast({
          title: "Texte copié !",
          description: "Colle ce texte dans ton story Instagram",
        });
        setIsOpen(false);
      }
    },
    {
      name: "Copier le lien",
      icon: Copy,
      color: "text-gray-500",
      bgColor: "hover:bg-gray-50 dark:hover:bg-gray-900/20",
      action: () => {
        navigator.clipboard.writeText(url);
        toast({
          title: "Lien copié !",
          description: "Tu peux maintenant le partager où tu veux",
        });
        setIsOpen(false);
      }
    }
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url,
        });
        setIsOpen(false);
      } catch (error) {
        // User cancelled or error occurred, fall back to custom share menu
        console.log('Native share cancelled or error:', error);
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      handleNativeShare();
    } else {
      setIsOpen(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} onClick={handleShare}>
          <Share size={size === "icon" ? 20 : 16} className={size !== "icon" ? "mr-2" : ""} />
          {size !== "icon" && "Partager"}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[90%] max-w-md rounded-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Partager cette offre</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Offer preview */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-3">
              <h4 className="font-semibold text-sm text-foreground mb-1">{title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
            </CardContent>
          </Card>
          
          {/* Share options */}
          <div className="grid grid-cols-2 gap-2">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                variant="outline"
                className={`flex flex-col gap-2 h-16 ${option.bgColor}`}
                onClick={option.action}
              >
                <option.icon size={20} className={option.color} />
                <span className="text-xs">{option.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}