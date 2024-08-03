#!/usr/bin/env node

import { Command } from "commander";
import { getConfig } from "./utils/getConfig.mjs";
import { buttonComponent } from "./components/button.mjs";
import fs from "fs/promises";
import path from "path";

export const add = new Command("add")
    .description("Add a new component")
    .argument("<component>", "Name of the component to be added.")
    .action((component) => {
        addAction(component);
    })

async function addAction(component) {
    console.log(`Adding component ${component}`)
    const config = await getConfig();
    const targetDirectory = path.join(process.cwd(), config.componentDirectory, buttonComponent.location);
    try {
        await fs.access(targetDirectory);
    } catch (error) {
        await fs.mkdir(targetDirectory, { recursive: true });
    }
    const targetFile = path.join(targetDirectory, `${buttonComponent.name}.tsx`)
    await fs
        .writeFile(targetFile, buttonComponent.content)
        .then(() => {
            console.log("Component added successfully!");
        })
        .catch((error) => {
            console.error("Error adding component: ", error);
        });
}