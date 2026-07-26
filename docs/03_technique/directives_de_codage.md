# Directives de Codage et Normes Qualité — HomeCycl'Home

Ce document définit les normes de codage strictes et obligatoires à appliquer dans l'ensemble du projet **HomeCycl'Home** (HomeCycl'Home / Vélo du Pelo).

---

## 1. Clarté, Simplicité & Lisibilité Maximale
* **Code auto-documenté :** Utilisez des noms de variables, fonctions et classes explicites.
* **Code lisible au premier coup d'œil :** Évitez la sur-ingénierie et privilégiez une structure linéaire et compréhensible sans détour.
* **Pas de code mort :** Supprimez immédiatement tout code ou commentaire devenus obsolètes.

---

## 2. Rigueur & Principe "Fail Fast" (Pas de Fallbacks Silencieux)
* **Pas de vérifications défensives superflues :** N'ajoutez pas de chaînage optionnel (`?.`) ou de garde inutile (`if (user && user.id)`) lorsque la structure de données ou le contexte (middleware, guards, types) garantit déjà la présence des propriétés.
* **Pas de fallbacks silencieux :** N'ajoutez pas de valeurs de secours artificielles (ex: `const name = user?.name || ''` ou le retour d'objets/tableaux vides masquant des erreurs) si l'absence d'une donnée reflète un bogue.
* **Échec immédiat :** Laissez les erreurs éclater immédiatement à la source ("Fail Fast") afin qu'elles soient détectées et corrigées sur-le-champ au lieu d'être étouffées.

---

## 3. Principe de Responsabilité Unique (SRP)
* Chaque fonction, hook, composant ou route API doit se concentrer sur une seule responsabilité clairement définie.
* Séparer la couche de présentation (composants React UI) de la logique métier, du fetching de données et des appels API.

---

## 4. Principe DRY (Don't Repeat Yourself) & Modularité
* Ne répétez pas la même logique. Extrayez les fonctions d'aide et utilitaires communs dans des modules réutilisables.
* Réutilisez les wrappers d'authentification centralisés (`withAuth`, `withAdmin`, `withTechnician`) plutôt que de duplicuer la gestion de session ou de gestion d'erreurs dans chaque route API.

---

## 5. Gestion des Erreurs et Logique API
* Dans les handlers d'API avec wrapper (`withAuth`), laissez le wrapper capturer et formater les exceptions plutôt que d'entourer chaque handler d'un bloc `try/catch` redondant qui renvoie des erreurs génériques.
* Renvoyez des messages d'erreur explicites accompagnés du statut HTTP approprié (400, 401, 403, 404, 500).
