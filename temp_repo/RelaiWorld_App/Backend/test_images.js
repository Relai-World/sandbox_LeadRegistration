const fetch = require('node-fetch');

async function testImageUrl() {
    const projectRef = "ihraowxbduhlichzszgk";
    const baseUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/property_images`;

    const variations = [
        "property_images/a2a_20homeland_20builder_20hyderabad_20telangana.png",
        "property_images/4_blocks_20builder_20hyderabad_20telangana.png",
        "property_images/360life_tower_ii_20builder_20hyderabad_20telangana.png",
        "images/a2a_20homeland_20builder_20hyderabad_20telangana.png",
        "a2a_20homeland_20builder_20hyderabad_20telangana.png"
    ];

    for (const v of variations) {
        const url = `${baseUrl}/${v}`;
        const encodedUrl = url.replace(/ /g, '%20');
        try {
            const res = await fetch(encodedUrl, { method: 'HEAD' });
            console.log(`URL: ${encodedUrl} | Status: ${res.status}`);
        } catch (e) {
            console.log(`URL: ${encodedUrl} | Error: ${e.message}`);
        }
    }
}

testImageUrl();
