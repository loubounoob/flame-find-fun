export const generateInitialsAvatar = (firstName?: string, lastName?: string): string => {
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  if (!initials) return 'https://api.dicebear.com/7.x/initials/svg?seed=U';
  
  return `https://api.dicebear.com/7.x/initials/svg?seed=${initials}&backgroundColor=random`;
};

export const getAvatarUrl = (avatarUrl?: string | null, firstName?: string, lastName?: string): string => {
  if (avatarUrl) return avatarUrl;
  return generateInitialsAvatar(firstName, lastName);
};