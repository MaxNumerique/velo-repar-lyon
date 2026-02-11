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

  // 2. Bike Types
  const types = ['VTT', 'Route', 'Ville', 'Électrique', 'Cargo']
  for (const typeName of types) {
    await prisma.bikeType.upsert({
      where: { name: typeName },
      update: {},
      create: { name: typeName },
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
