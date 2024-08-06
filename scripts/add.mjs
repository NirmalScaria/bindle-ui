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
    if(component === undefined) {
        console.log(chalk.red("Component not found! Make sure the name is correct."));
        return;
    }
    var targetFile = path.join(process.cwd(), component.location);
    const targetDirectory = path.dirname(targetFile);
    try {
        await fs.access(targetDirectory);
    } catch (error) {
        await fs.mkdir(targetDirectory, { recursive: true });
    }
    await fs
        .writeFile(targetFile, component.content)
        .then(() => {
            console.log(chalk.green("✔ Component added successfully!"));
        })
        .catch((error) => {
            console.error(chalk.red("Error adding component: ", error));
        });
}