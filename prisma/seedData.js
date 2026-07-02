const packages = [
  {
    title: 'Diagnostic sécurité',
    description: 'Contrôle des points de sécurité : freins, direction, transmission et serrages. Recommandé avant une longue sortie ou une reprise.',
    price: 29,
    duration_min: 30,
    image: 'https://plus.unsplash.com/premium_photo-1676399365338-8b081178dc1b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  {
    title: 'Réglage freins et vitesses',
    description: 'Réglage des dérailleurs et des freins pour un passage de vitesses fluide et un freinage optimal.',
    price: 45,
    duration_min: 45,
    image: 'https://images.unsplash.com/photo-1671790639553-43973054c51e?q=80&w=1631&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  {
    title: 'Révision standard',
    description: 'Révision générale incluant contrôle sécurité, réglages freins/vitesses, lubrification de la transmission et pression des pneus.',
    price: 69,
    duration_min: 60,
    image: 'https://images.unsplash.com/photo-1676531443468-0e2b5a57e48f?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  {
    title: 'Révision complète',
    description: 'Révision approfondie avec nettoyage transmission, réglages complets, léger dévoilage des roues et contrôle global du vélo.',
    price: 119,
    duration_min: 120,
    image: 'https://images.unsplash.com/photo-1675798227643-da319f8ee8f7?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  }
];

const sectors = [
  {
    name: 'Lyon Centre',
    color: '#3b82f6',
    boundary: 'POLYGON((4.82 45.75, 4.85 45.75, 4.85 45.77, 4.82 45.77, 4.82 45.75))'
  },
  {
    name: 'Villeurbanne',
    color: '#10b981',
    boundary: 'POLYGON((4.86 45.76, 4.89 45.76, 4.89 45.78, 4.86 45.78, 4.86 45.76))'
  }
];

const products = [
  // Category: Pièces
  {
    name: "Plaquettes frein à disque",
    description: "Plaquettes résine pour frein à disque, bonne progressivité et freinage silencieux.",
    price: 18.5,
    category: "Pièces",
    isActive: true,
    image: 'https://images.unsplash.com/photo-1682189165011-d4305d2b0ced?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  {
    name: "Patins de frein V-Brake",
    description: "Paire de patins universels pour freins V-Brake, gommes toutes conditions.",
    price: 9.9,
    category: "Pièces",
    isActive: true,
    image: 'https://images.unsplash.com/photo-1672138227659-97778b8c63bf?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  {
    name: "Câble et gaine de frein",
    description: "Kit complet câble inox et gaine pré-lubrifiée pour freins de vélo.",
    price: 7.5,
    category: "Pièces",
    isActive: true,
    image: 'https://plus.unsplash.com/premium_photo-1676399362819-d1a6d3315180?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  {
    name: "Disque de frein 160mm",
    description: "Disque de frein en acier inoxydable, fixation standard 6 trous.",
    price: 24.0,
    category: "Pièces",
    isActive: true,
    image: 'https://picsum.photos/600/400?random=14'
  },

  // Category: Accessoires
  {
    name: "Pompe à main haute pression",
    description: "Pompe compacte en aluminium avec raccord flexible Presta/Schrader.",
    price: 19.9,
    category: "Accessoires",
    isActive: true,
    image: 'https://static.hema.com/dw/image/v2/BBRK_PRD/on/demandware.static/-/Sites-HEMA-master-catalog/default/dwca8e9c80/product/41120034_01_001.jpg?sw=1600&sfrm=png&bgcolor=FFFFFF'
  },
  {
    name: "Support téléphone étanche",
    description: "Support de guidon universel et étanche pour smartphones jusqu'à 6.7 pouces.",
    price: 15.0,
    category: "Accessoires",
    isActive: true,
    image: 'https://www.lecyclo.com/cdn/shop/products/support-telephone-velo-sur-guidon-ergotec_full.jpg?v=1725241907'
  },
  {
    name: "Kit éclairage LED USB",
    description: "Éclairages avant et arrière puissants, rechargeables en USB.",
    price: 22.9,
    category: "Accessoires",
    isActive: true,
    image: 'https://m.media-amazon.com/images/I/71mat4rVu4L.jpg'
  },
  {
    name: "Antivol en U haute sécurité",
    description: "Antivol en U en acier cémenté avec câble de rappel, homologué FUB.",
    price: 39.9,
    category: "Accessoires",
    isActive: true,
    image: 'https://www.transitionvelo.com/content/uploads/2024/01/antivol-u-velo-d-920-l-art3-3-1024x1024.jpg'
  },

  // Category: Consommables
  {
    name: "Chambre à air 700c",
    description: "Chambre à air standard pour roues de route ou ville 700c, valve Presta.",
    price: 8.9,
    category: "Consommables",
    isActive: true,
    image: 'https://brico-travo.com/314049-thickbox_default/cham-air-700x19-23c-pv-19-23.jpg'
  },
  {
    name: "Pneu 29 pouces",
    description: "Pneu polyvalent pour VTT 29\", crampons latéraux pour une bonne accroche.",
    price: 29.9,
    category: "Consommables",
    isActive: true,
    image: 'https://www.lecyclo.com/cdn/shop/files/schwalbe-hurricane-performance-clincher-tyre-275x225-raceguard-addix-1_890x890_crop_center.jpg?v=1726462877'
  },
  {
    name: "Chaîne 11 vitesses",
    description: "Chaîne robuste et fluide, compatible avec toutes les transmissions 11v.",
    price: 32.0,
    category: "Consommables",
    isActive: true,
    image: 'https://contents.mediadecathlon.com/p2605490/k$8aed8ea14be878bf93e06e68cc498aa5/picture.jpg?format=auto&f=3000x0'
  },
  {
    name: "Lubrifiant chaîne conditions humides",
    description: "Lubrifiant synthétique longue durée pour conditions de pluie et de boue.",
    price: 6.9,
    category: "Consommables",
    isActive: true,
    image: 'https://dynamicbikecare.com/cdn/shop/files/DY-042_Wet_Lube_Front_grande.png?v=1716875848'
  }
];

async function runSeed(prisma) {
  let message = "";

  // 1. Service Packages
  console.log('📦 Seeding service packages...');
  let packagesSeeded = 0;
  for (const pkg of packages) {
    const id = pkg.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    const existing = await prisma.servicePackage.findUnique({ where: { id } });
    if (!existing) {
      await prisma.servicePackage.create({
        data: { ...pkg, id }
      });
      packagesSeeded++;
    } else {
      // Safely update the image if it is missing or has placeholder
      if (!existing.image || existing.image.includes('placeholder') || existing.image.includes('unsplash')) {
        await prisma.servicePackage.update({
          where: { id },
          data: { image: pkg.image }
        });
      }
    }
  }
  if (packagesSeeded > 0) message += `${packagesSeeded} service packages created. `;

  // 2. Sectors (PostGIS)
  console.log('🗺️ Seeding sectors...');
  let sectorsSeeded = 0;
  for (const sector of sectors) {
    const id = sector.name.toLowerCase().replace(/\s+/g, '-');
    const existing = await prisma.$queryRawUnsafe(`SELECT id FROM "Sector" WHERE id = '${id}'`);
    if (existing.length === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Sector" (id, name, color, boundary, "updatedAt")
        VALUES (
          '${id}',
          '${sector.name}',
          '${sector.color}',
          ST_GeomFromText('${sector.boundary}', 4326),
          NOW()
        )
      `);
      sectorsSeeded++;
    }
  }
  if (sectorsSeeded > 0) message += `${sectorsSeeded} sectors created. `;

  // 3. Products
  console.log('🛒 Seeding products...');
  let productsSeeded = 0;
  for (const prod of products) {
    const id = prod.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      await prisma.product.create({
        data: { ...prod, id }
      });
      productsSeeded++;
    } else {
      // Safely update image and category if missing or generic
      const updates = {};
      if (!existing.image || existing.image.includes('unsplash')) updates.image = prod.image;
      if (!existing.category || existing.category === "Pneumatiques" || existing.category === "Freinage" || existing.category === "Transmission") {
        updates.category = prod.category;
      }
      if (Object.keys(updates).length > 0) {
        await prisma.product.update({
          where: { id },
          data: updates
        });
      }
    }
  }
  if (productsSeeded > 0) message += `${productsSeeded} products created. `;

  // 4. Test User Admin
  const adminEmail = process.env.GOOGLE_EMAIL;
  if (adminEmail) {
    console.log('👤 Seeding admin user...');
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
    });
    message += "Admin user ensured. ";
  }

  return { success: true, message: message.trim() || "Nothing to seed, all data already exists." };
}

module.exports = {
  packages,
  sectors,
  products,
  runSeed
};
