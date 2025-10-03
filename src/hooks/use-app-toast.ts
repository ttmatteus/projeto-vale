import { toast } from "@/hooks/use-toast"

interface ToastOptions {
  title?: string
  description?: string
  variant?: "success" | "error" | "warning" | "info"
}

export const useAppToast = () => {
  const showSuccess = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "success",
    })
  }

  const showError = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "error",
    })
  }

  const showWarning = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "warning",
    })
  }

  const showInfo = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "info",
    })
  }

  const showToast = ({ title, description, variant = "success" }: ToastOptions) => {
    toast({
      title,
      description,
      variant,
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast,
  }
}