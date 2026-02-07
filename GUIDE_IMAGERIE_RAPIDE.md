# Guide Rapide - Prescription d'Imagerie Médicale

## 🚀 Démarrage rapide

### Pour le médecin

1. **Accéder à la consultation**
   ```
   Dashboard → Consultations prêtes → Sélectionner un patient → Démarrer consultation
   ```

2. **Aller à l'onglet Imagerie**
   ```
   Onglets de consultation → "Examens Imagerie" (onglet 5)
   ```

3. **Remplir le formulaire**
   
   **Champs obligatoires ⭐**
   - Type d'examen (liste déroulante)
   - Région anatomique
   - Indication clinique
   
   **Champs optionnels**
   - Urgence
   - Avec injection
   - Question diagnostique
   - Allergies
   - Examens antérieurs

4. **Actions disponibles**
   
   **Option A : Générer un PDF** 📄
   ```
   Bouton "Générer prescription PDF"
   → Télécharge automatiquement le PDF
   → Peut être imprimé ou envoyé au patient
   ```
   
   **Option B : Prescrire dans le système** 💾
   ```
   Bouton "Prescrire examen"
   → Enregistre dans la base de données
   → Envoie au radiologue si "Envoyer au radiologue" = Oui
   ```

## 📋 Exemple de prescription complète

```
Type d'examen: Scanner (TDM)
Région anatomique: Thorax
Urgence: Urgente
Avec injection: Oui

Indication clinique:
Patient de 45 ans présentant une dyspnée aiguë depuis 48h.
Douleur thoracique à la respiration profonde.
Antécédents de tabagisme (20 paquets-années).

Question diagnostique:
Recherche d'embolie pulmonaire.
Éliminer une pneumopathie.

Allergies connues:
Allergie à l'iode (réaction cutanée en 2020)

Examens antérieurs:
Radio thorax le 15/01/2025 : Normal
```

## 🎯 Résultat

### PDF généré
- Nom du fichier : `Prescription_Imagerie_Jean_Dupont_20260124.pdf`
- Contenu professionnel avec en-tête coloré
- Tous les détails de la prescription
- Espace pour signature

### Prescription dans le système
- Visible dans le dashboard du radiologue
- Statut : `SENT_TO_LAB` (si envoyé)
- Catégorie : `IMAGERIE`

## ⚠️ Points importants

### Validation automatique
- Le système vérifie que les champs obligatoires sont remplis
- Messages d'erreur clairs si données manquantes

### Séparation des workflows
- ✅ Les prescriptions d'imagerie vont au **radiologue**
- ✅ Les prescriptions de biologie vont au **biologiste**
- ✅ L'infirmier ne voit **QUE** les échantillons biologiques

### Sécurité
- Seuls les médecins peuvent créer des prescriptions d'imagerie
- Les prescriptions sont liées à une consultation
- Traçabilité complète (qui, quand, quoi)

## 🔧 Dépannage

### Le bouton PDF est grisé
→ Vérifiez que tous les champs obligatoires sont remplis

### La prescription n'apparaît pas chez le radiologue
→ Vérifiez que "Envoyer au radiologue" = Oui

### Erreur lors de la création
→ Vérifiez votre connexion
→ Vérifiez que la consultation est active

## 📞 Support

Pour plus de détails, consultez :
- `AMELIORATIONS_IMAGERIE.md` : Documentation complète
- `ARCHITECTURE.md` : Architecture technique
