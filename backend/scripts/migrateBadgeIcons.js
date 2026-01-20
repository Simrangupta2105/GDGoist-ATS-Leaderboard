require('dotenv').config();
const mongoose = require('mongoose');
const BadgeDefinition = require('../src/models/badgeDefinition.model');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const badges = await BadgeDefinition.find({});
    console.log(`Checking ${badges.length} badge definitions...`);

    const host = 'localhost:4000'; // Hardcoded for this environment
    const protocol = 'http';

    let updateCount = 0;
    for (const badge of badges) {
        if (badge.icon && badge.icon.includes('amazonaws.com') && badge.icon.includes('/badges/')) {
            const parts = badge.icon.split('/badges/');
            const key = `badges/${parts[parts.length - 1]}`;
            const proxyUrl = `${protocol}://${host}/files/${key}`;

            badge.icon = proxyUrl;
            await badge.save();
            console.log(`Updated badge [${badge.name}] to use proxy URL: ${proxyUrl}`);
            updateCount++;
        }
    }

    console.log(`Migration complete. Updated ${updateCount} badge definitions.`);
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
