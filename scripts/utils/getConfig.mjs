// Gets the configuration from the bindle-config.json file

import fs from 'fs/promises';

export async function getConfig() {
    try {
        await fs.access('./bindle-config.json');
    } catch (error) {
        return null;
    }
    const data = await fs.readFile('./bindle-config.json', 'utf-8');
    return JSON.parse(data);
}