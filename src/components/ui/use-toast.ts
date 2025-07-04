import { useToast as useToastOriginal, toast as toastOriginal } from "@/hooks/use-toast";

// Wrapper to make toasts disappear faster
export const useToast = () => {
  const originalUseToast = useToastOriginal();
  
  return {
    ...originalUseToast,
    toast: (props: any) => originalUseToast.toast({
      ...props,
      duration: 2000, // 2 seconds instead of default 5
    })
  };
};

export const toast = (props: any) => toastOriginal({
  ...props,
  duration: 2000, // 2 seconds instead of default 5
});
