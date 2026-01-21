require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../src/models/user.model');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({ profilePicture: { $ne: '', $exists: true } });
    console.log(`Checking ${users.length} users for broken profile pictures...`);

    let fixCount = 0;
    for (const user of users) {
        let broken = false;

        // Check local upload links
        if (user.profilePicture.includes('/uploads/')) {
            const filename = user.profilePicture.split('/uploads/').pop();
            const filePath = path.join(__dirname, '..', 'uploads', filename);
            if (!fs.existsSync(filePath)) {
                broken = true;
                console.log(`User ${user.email}: Local file missing [${filename}]`);
            }
        }

        // Check direct S3 links (if any - though we usually use proxy now)
        // We already checked S3 and only two avatars exist.
        if (user.profilePicture.includes('amazonaws.com')) {
            // For now, if it's an S3 link but not in our verified S3 list, we could flag it.
            // But let's stick to the local ones first as that's what the user reported.
        }

        if (broken) {
            await User.findByIdAndUpdate(user._id, { $set: { profilePicture: '' } });
            console.log(`Fixed: Unset profilePicture for ${user.email}`);
            fixCount++;
        }
    }

    console.log(`Cleanup complete. Fixed ${fixCount} users.`);
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
