#!/usr/bin/env node

import { Command } from "commander";
import { getConfig } from "./utils/getConfig.mjs";
import fs from "fs/promises";
import path from "path";
import { fetchComponent } from "./utils/fetchComponent.mjs";
import chalk from 'chalk';

export const add = new Command("add")
    .description("Add a new component")
    .argument("<component>", "Name of the component to be added.")
    .action((componentId) => {
        addAction(componentId);
    })

async function addAction(componentId) {
    console.log(`Adding component ${componentId}`)
    const component = await fetchComponent(componentId, true)
    const config = await getConfig();
    if(component === undefined) {
        console.log(chalk.red("Component not found! Make sure the name is correct."));
        return;
    }
    const targetDirectory = path.join(process.cwd(), config.componentDirectory, component.location);
    try {
        await fs.access(targetDirectory);
    } catch (error) {
        await fs.mkdir(targetDirectory, { recursive: true });
    }
    const targetFile = path.join(targetDirectory, `${component.name}.tsx`)
    await fs
        .writeFile(targetFile, component.content)
        .then(() => {
            console.log(chalk.green("✔ Component added successfully!"));
        })
        .catch((error) => {
            console.error(chalk.red("Error adding component: ", error));
        });
}