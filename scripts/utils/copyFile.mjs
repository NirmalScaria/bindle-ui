import fs from "fs/promises";
import path from "path";
export async function copyFile({ fileName, content }) {
    var targetFile = path.join(process.cwd(), fileName);
    const targetDirectory = path.dirname(targetFile);
    try {
        await fs.access(targetDirectory);
    } catch (error) {
        await fs.mkdir(targetDirectory, { recursive: true });
    }
    await fs
        .writeFile(targetFile, content)
        .then(() => {
        })
        .catch((error) => {
            throw("Error adding component: ", error);
        });
}
