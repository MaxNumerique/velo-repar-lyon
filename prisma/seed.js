const { PrismaClient } = require('@prisma/client')
try {
  require('dotenv').config()
} catch (e) {
  // dotenv ignored in prod
}

const prisma = new PrismaClient()

async function main() {
  const productCount = await prisma.product.count()
  if (productCount > 0) {
    console.log('ℹ️ Products already exist in the database. Skipping seed.')
    return
  }

  console.log('🚀 Start seeding...')

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
    }
  ]

  console.log('📦 Seeding service packages...')
  for (const pkg of packages) {
    const id = pkg.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')
    await prisma.servicePackage.upsert({
      where: { id },
      update: pkg,
      create: { ...pkg, id },
    })
  }
  
  // 2. Sectors (PostGIS)
  console.log('🗺️ Seeding sectors...')
  const sectors = [
    {
      name: 'Lyon Centre',
      color: '#3b82f6',
      // WKT for a rough Lyon Center polygon
      boundary: 'POLYGON((4.82 45.75, 4.85 45.75, 4.85 45.77, 4.82 45.77, 4.82 45.75))'
    },
    {
      name: 'Villeurbanne',
      color: '#10b981',
      boundary: 'POLYGON((4.86 45.76, 4.89 45.76, 4.89 45.78, 4.86 45.78, 4.86 45.76))'
    }
  ]

  for (const sector of sectors) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Sector" (id, name, color, boundary, "updatedAt")
      VALUES (
        '${sector.name.toLowerCase().replace(/\s+/g, '-')}',
        '${sector.name}',
        '${sector.color}',
        ST_GeomFromText('${sector.boundary}', 4326),
        NOW()
      )
      ON CONFLICT (name) DO NOTHING;
    `)
  }

  // 3. Products
  console.log('🛒 Seeding products...')
  const products = [
    {
      name: "Chambre à air 700c",
      description: "Chambre à air standard pour roues 700c, valve Presta.",
      price: 8.9,
      category: "Pneumatiques",
      isActive: true
    },
    {
      name: "Plaquettes frein à disque",
      description: "Plaquettes résine pour frein à disque, bonne progressivité.",
      price: 18.5,
      category: "Freinage",
      isActive: true
    },
    {
      name: "Chaîne 11 vitesses",
      description: "Chaîne compatible transmissions 11 vitesses.",
      price: 32.0,
      category: "Transmission",
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

  // 4. Test Users (Now in the simplified User model)
  console.log('👤 Seeding test users...')
  
  // Admin
  const adminEmail = process.env.GOOGLE_EMAIL
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      firstName: 'Maximilien',
      lastName: 'LANDOIS',
      role: 'ADMIN',
      clerkId: 'user_39Xejz0e2UXnqzPInkxN2uOPnqg',
    }
  })

  console.log('✨ Seeding finished successfully.')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
