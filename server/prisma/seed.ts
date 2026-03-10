import { FeatureCategory } from "generated/prisma/enums";
import { prisma } from "src/lib/prisma";


async function main() {
  console.log('🌱 Seeding Membership & User Management Permissions...');

  const membershipPermissions = [
    {
      action: 'VIEW',
      name: 'View Members',
      description: 'Allows the user to see the list of members in the organization',
    },
    {
      action: 'INVITE',
      name: 'Invite Members',
      description: 'Allows the user to send invitations to new members',
    },
    {
      action: 'REMOVE',
      name: 'Remove Members',
      description: 'Allows the user to kick/remove members from the organization',
    },
    {
      action: 'ROLE_MANAGE',
      name: 'Manage Roles',
      description: 'Allows the user to create roles and change permissions for others',
    },
    {
      action: 'OWNER_TRANSFER',
      name: 'Transfer Ownership',
      description: 'Extremely sensitive: Allows transferring organization ownership',
    },
  ];

  for (const p of membershipPermissions) {
    const slug = `${FeatureCategory.USERS}_${p.action}`;

    await prisma.permissionDefinition.upsert({
      where: { slug },
      update: {
        name: p.name,
        category: FeatureCategory.USERS,
        action: p.action,
        description: p.description
      },
      create: {
        slug,
        name: p.name,
        category: FeatureCategory.USERS,
        action: p.action,
        description: p.description,
      },
    });
  }

  console.log(`✅ Successfully seeded ${membershipPermissions.length} membership permissions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
