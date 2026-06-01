import { toast } from "sonner";

export const showToast = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message || "Une erreur est survenue"),
  info: (message) => toast.info(message),
  loading: (message) => toast.loading(message),

  user: {
    created: () => toast.success("Utilisateur créé avec succès"),
    updated: () => toast.success("Utilisateur mis à jour"),
    deleted: () => toast.success("Utilisateur supprimé"),
    blocked: (blocked) =>
      toast.success(blocked ? "Utilisateur bloqué" : "Utilisateur débloqué"),
    error: (msg) =>
      toast.error(msg || "Erreur lors de la gestion de l'utilisateur"),
  },

  service: {
    created: () => toast.success("Forfait créé avec succès"),
    updated: () => toast.success("Forfait mis à jour"),
    deleted: () => toast.success("Forfait supprimé"),
    error: (msg) => toast.error(msg || "Erreur lors de la gestion du forfait"),
  },

  product: {
    created: () => toast.success("Produit créé avec succès"),
    updated: () => toast.success("Produit mis à jour"),
    deleted: () => toast.success("Produit supprimé"),
    error: (msg) => toast.error(msg || "Erreur lors de la gestion du produit"),
  },

  sector: {
    saved: () => toast.success("Secteur enregistré avec succès !"),
    deleted: () => toast.success("Secteur supprimé"),
    error: (msg) => toast.error(msg || "Erreur lors de la gestion du secteur"),
  },
};
