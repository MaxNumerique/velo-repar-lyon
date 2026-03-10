import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/notifications";

/**
 * Custom hook for standardizing admin form logic (Create/Edit).
 *
 * @param {Object} options
 * @param {string} options.id - The record ID (if editing).
 * @param {string} options.basePath - API and Navigation base path (e.g., '/api/admin/products').
 * @param {Object} options.initialData - Default empty form state.
 * @param {Function} options.entityToast - The toast object from showToast (e.g., showToast.product).
 * @param {string} options.redirectPath - Path to redirect after success.
 */
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

  // Fetch data if editing
  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        const res = await fetch(`${basePath}/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        // Transform numeric fields if necessary (some APIs return strings or Numbers)
        // We set the state and hope the component handles specific transformations if needed
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
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
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
      } else {
        const error = await res.json();
        showToast.error(error.message || "Une erreur est survenue");
      }
    } catch (error) {
      showToast.error("Erreur réseau");
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
