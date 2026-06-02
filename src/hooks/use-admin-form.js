import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/notifications";
import { apiRequest } from "@/lib/api-client";

export function useAdminForm({
  id,
  basePath,
  initialData,
  entityToast,
  redirectPath,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        const data = await apiRequest(`${basePath}/${id}`);
        setFormData(data);
      } catch (error) {
        showToast.error("Erreur lors du chargement des données");
        router.push(redirectPath);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, basePath, router, redirectPath]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

    const isEdit = !!id;
    const url = isEdit ? `${basePath}/${id}` : basePath;
    const method = isEdit ? "PATCH" : "POST";

    try {
      await apiRequest(url, {
        method,
        body: formData,
      });

      if (isEdit) {
        entityToast.updated
          ? entityToast.updated()
          : showToast.success("Mis à jour");
      } else {
        entityToast.created
          ? entityToast.created()
          : showToast.success("Créé avec succès");
      }
      router.push(redirectPath);
    } catch (error) {
      if (error.isApiResponseError) {
        showToast.error(error.message || "Une erreur est survenue");
      } else {
        showToast.error("Erreur réseau");
      }
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    setFormData,
    updateField,
    loading,
    saving,
    handleSubmit,
  };
}
