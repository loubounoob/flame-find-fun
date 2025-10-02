import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Building, Camera } from "lucide-react";
import { generateInitialsAvatar } from "@/utils/avatarUtils";
import { GlobalAddressInput } from "@/components/GlobalAddressInput";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [accountType, setAccountType] = useState("student");
  const [companyName, setCompanyName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessLocation, setBusinessLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Redirect based on user type stored in metadata
        const userType = session.user.user_metadata?.account_type;
        if (userType === "business") {
          navigate("/business-dashboard");
        } else {
          navigate("/");
        }
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const userType = session.user.user_metadata?.account_type;
        if (userType === "business") {
          navigate("/business-dashboard");
        } else {
          navigate("/");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Erreur de connexion",
            description: "Email ou mot de passe incorrect.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erreur",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur Ludigo !",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier image.",
        variant: "destructive"
      });
      return;
    }

    // Convert to base64 preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
      setAvatarFile(file);
      toast({
        title: "Photo ajoutée",
        description: "Votre photo de profil a été ajoutée avec succès.",
      });
    };
    reader.readAsDataURL(file);
  };

  const signUp = async () => {
    if (!avatarFile && !avatarUrl) {
      toast({
        title: "Photo requise",
        description: "Veuillez ajouter une photo de profil avant de continuer.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      let finalAvatarUrl = avatarUrl;
      
      // Upload avatar if file is present
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `temp-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
        
        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          finalAvatarUrl = publicUrl;
        }
      }
      
      if (!finalAvatarUrl) {
        finalAvatarUrl = generateInitialsAvatar(firstName, lastName);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            account_type: accountType,
            avatar_url: finalAvatarUrl,
            company_name: accountType === "business" ? companyName : null,
            business_address: accountType === "business" ? businessAddress : null,
            business_latitude: accountType === "business" && businessLocation ? businessLocation.lat : null,
            business_longitude: accountType === "business" && businessLocation ? businessLocation.lng : null
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Compte existant",
            description: "Un compte existe déjà avec cet email. Connectez-vous plutôt !",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erreur",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        // If business account, update profile with additional info
        if (accountType === "business" && data.user) {
          await supabase
            .from('profiles')
            .update({
              business_name: companyName,
              address: businessAddress,
              latitude: businessLocation?.lat,
              longitude: businessLocation?.lng,
              account_type: 'business'
            })
            .eq('user_id', data.user.id);
        }

        setShowEmailConfirmation(true);
        toast({
          title: "Inscription réussie !",
          description: "📧 Un email de confirmation vous a été envoyé.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">📧 Vérifiez votre email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Un email de confirmation a été envoyé à <strong>{email}</strong>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Cliquez sur le lien dans l'email pour activer votre compte et terminer l'inscription.
            </p>
            <div className="flex flex-col gap-2 pt-4">
              <Button 
                onClick={() => window.open('https://mail.google.com', '_blank')}
                className="w-full"
                variant="default"
              >
                Ouvrir Gmail
              </Button>
              <Button 
                onClick={() => window.open('https://outlook.live.com', '_blank')}
                className="w-full"
                variant="outline"
              >
                Ouvrir Outlook
              </Button>
              <Button 
                onClick={() => setShowEmailConfirmation(false)}
                className="w-full mt-4"
                variant="ghost"
              >
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-poppins font-bold text-gradient-primary mb-2">
            Ludigo
          </h1>
          <p className="text-muted-foreground">
            Découvre les meilleures offres de loisirs
          </p>
        </div>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-foreground">Rejoins l'aventure</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="votre.email@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={signIn} 
                  disabled={loading || !email || !password}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-type">Type de compte</Label>
                    <Select value={accountType} onValueChange={setAccountType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisis ton type de compte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            Particulier
                          </div>
                        </SelectItem>
                        <SelectItem value="business">
                          <div className="flex items-center gap-2">
                            <Building size={16} />
                            Entreprise
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {accountType === "business" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Nom de l'entreprise</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="company-name"
                            placeholder="Mon Entreprise"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="business-address">Adresse de l'activité *</Label>
                        <GlobalAddressInput
                          value={businessAddress}
                          onChange={setBusinessAddress}
                          onAddressSelect={(address, location) => {
                            setBusinessAddress(address);
                            setBusinessLocation(location);
                          }}
                          placeholder="123 rue de la République, 69002 Lyon"
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Adresse exacte pour apparaître sur la carte des utilisateurs
                        </p>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">{accountType === "business" ? "Prénom du contact" : "Prénom"}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="first-name"
                          placeholder="Alex"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">{accountType === "business" ? "Nom du contact" : "Nom"}</Label>
                      <Input
                        id="last-name"
                        placeholder="Dubois"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar-upload">Photo de profil (obligatoire)</Label>
                  {avatarUrl && (
                    <div className="flex justify-center mb-2">
                      <img 
                        src={avatarUrl} 
                        alt="Aperçu" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-border"
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    className="w-full"
                    disabled={loading}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {avatarUrl ? "Changer la photo" : "Choisir une photo"}
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <p className="text-xs text-muted-foreground">
                    Si aucune photo n'est fournie, un avatar avec tes initiales sera créé automatiquement.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">{accountType === "business" ? "Email professionnel" : "Email"}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={accountType === "business" ? "contact@entreprise.com" : "votre.email@exemple.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={signUp} 
                  disabled={loading || !email || !password || !firstName || !lastName || (accountType === "business" && (!companyName || !businessAddress))}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {loading ? "Inscription..." : "S'inscrire"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}