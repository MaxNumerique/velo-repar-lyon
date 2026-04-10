const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const pg = require('pg')

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Start seeding...')

  // 1. Service Packages
  const packages = [
    {
      title: 'Diagnostic sécurité',
      description: 'Contrôle des points de sécurité : freins, direction, transmission et serrages. Recommandé avant une longue sortie ou une reprise.',
      price: 29,
      duration_min: 30
    },
    {
      title: 'Réglage freins et vitesses',
      description: 'Réglage des dérailleurs et des freins pour un passage de vitesses fluide et un freinage optimal.',
      price: 45,
      duration_min: 45
    },
    {
      title: 'Révision standard',
      description: 'Révision générale incluant contrôle sécurité, réglages freins/vitesses, lubrification de la transmission et pression des pneus.',
      price: 69,
      duration_min: 60
    },
    {
      title: 'Révision complète',
      description: 'Révision approfondie avec nettoyage transmission, réglages complets, léger dévoilage des roues et contrôle global du vélo.',
      price: 119,
      duration_min: 120
    },
    {
      title: 'Nettoyage et lubrification transmission',
      description: 'Nettoyage complet de la chaîne, cassette et plateaux suivi d’une lubrification adaptée.',
      price: 39,
      duration_min: 35
    },
    {
      title: 'Remplacement chambre à air ou pneu',
      description: 'Remplacement d’une chambre à air ou d’un pneu. Pièces non incluses.',
      price: 25,
      duration_min: 20
    },
    {
      title: 'Diagnostic vélo électrique (VAE)',
      description: 'Contrôle du système électrique, batterie, moteur et câblage avec vérification des erreurs courantes.',
      price: 59,
      duration_min: 60
    },
    {
      title: 'Préparation vélo neuf',
      description: 'Montage, serrages de sécurité et réglages complets d’un vélo neuf sorti du carton.',
      price: 79,
      duration_min: 90
    }
  ]

  for (const pkg of packages) {
    const id = pkg.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')
    await prisma.servicePackage.upsert({
      where: { id },
      update: pkg,
      create: { ...pkg, id },
    })
  }
  
  // 3. Products
  const products = [
    {
      name: "Chambre à air 700c",
      description: "Chambre à air standard pour roues 700c, valve Presta.",
      price: 8.9,
      image: null,
      category: "Pneumatiques",
      isActive: true
    },
    {
      name: "Pneu route 700x25",
      description: "Pneu route polyvalent avec bonne résistance à la crevaison.",
      price: 29.9,
      image: null,
      category: "Pneumatiques",
      isActive: true
    },
    {
      name: "Lubrifiant chaîne toutes conditions",
      description: "Lubrifiant longue durée adapté au sec et à l’humide.",
      price: 12.5,
      image: null,
      category: "Entretien",
      isActive: true
    },
    {
      name: "Dégraissant transmission",
      description: "Spray dégraissant pour chaîne, cassette et plateaux.",
      price: 14.0,
      image: null,
      category: "Entretien",
      isActive: true
    },
    {
      name: "Jeu de patins de frein",
      description: "Patins de frein compatibles V-Brake, paire avant ou arrière.",
      price: 11.9,
      image: null,
      category: "Freinage",
      isActive: true
    },
    {
      name: "Plaquettes frein à disque",
      description: "Plaquettes résine pour frein à disque, bonne progressivité.",
      price: 18.5,
      image: null,
      category: "Freinage",
      isActive: true
    },
    {
      name: "Câble de dérailleur",
      description: "Câble inox pour dérailleur avec embout.",
      price: 6.5,
      image: null,
      category: "Transmission",
      isActive: true
    },
    {
      name: "Câble de frein",
      description: "Câble de frein universel avec gaine.",
      price: 7.5,
      image: null,
      category: "Freinage",
      isActive: true
    },
    {
      name: "Chaîne 11 vitesses",
      description: "Chaîne compatible transmissions 11 vitesses.",
      price: 32.0,
      image: null,
      category: "Transmission",
      isActive: true
    },
    {
      name: "Cassette 11-28",
      description: "Cassette 11 vitesses 11-28 dents polyvalente.",
      price: 54.9,
      image: null,
      category: "Transmission",
      isActive: true
    },
    {
      name: "Éclairage avant LED",
      description: "Éclairage blanc rechargeable USB, forte visibilité.",
      price: 19.9,
      image: null,
      category: "Accessoires",
      isActive: true
    },
    {
      name: "Éclairage arrière LED",
      description: "Feu arrière rouge rechargeable USB.",
      price: 14.9,
      image: null,
      category: "Accessoires",
      isActive: true
    },
    {
      name: "Antivol en U",
      description: "Antivol robuste niveau sécurité élevé.",
      price: 39.0,
      image: null,
      category: "Sécurité",
      isActive: true
    },
    {
      name: "Sonnette aluminium",
      description: "Sonnette compacte au son clair.",
      price: 9.5,
      image: null,
      category: "Accessoires",
      isActive: true
    }
  ]

  for (const prod of products) {
    const id = prod.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')
    await prisma.product.upsert({
      where: { id },
      update: prod,
      create: { ...prod, id },
    })
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
