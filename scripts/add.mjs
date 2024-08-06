#!/usr/bin/env node

import { Command } from "commander";
import { getConfig } from "./utils/getConfig.mjs";
import fs from "fs/promises";
import path from "path";
import { fetchComponent } from "./utils/fetchComponent.mjs";
import chalk from 'chalk';
import { execSync } from "child_process";

export const add = new Command("add")
    .description("Add a new component")
    .argument("<component>", "Name of the component to be added.")
    .action((componentId) => {
        addAction(componentId);
    })

async function addAction(componentId) {
    console.log(`Adding component ${componentId}`)
    var relativeImports = [];
    var remoteDependencies = [];
    var relativeImportLocations = {};
    var filesToAdd = {}
    var tailwindAdditionalConfig = {};
    const component = await fetchComponent(componentId, true)
    await parseTree({ currentComponent: component });
    var remoteInstallCommand = "npm install ";
    for (const remoteDependancy of remoteDependencies) {
        remoteInstallCommand += `${remoteDependancy.name}@${remoteDependancy.version} `;
    }
    if (remoteDependencies.length > 0) {
        console.log(chalk.blue("Installing remote dependancies..."));
        execSync(remoteInstallCommand, { stdio: 'inherit' });
    }
    if (component === undefined) {
        console.log(chalk.red("Failed to install the component."));
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

    async function parseTree({ currentComponent }) {
        filesToAdd[currentComponent.location] = currentComponent.content;
        relativeImportLocations[currentComponent.id] = currentComponent.location;
        if (currentComponent.tailwindConfig != "") {
            const additionalConfig = JSON.parse(currentComponent.tailwindConfig);
            if (additionalConfig) {
                tailwindAdditionalConfig = { ...tailwindAdditionalConfig, ...additionalConfig };
            }
        }
        if (currentComponent.relativeImports.length > 0) {
            for (const relativeImport of currentComponent.relativeImports) {
                if (relativeImports.includes(relativeImport)) return;
                relativeImports.push(relativeImport);
                const nextComponent = await fetchComponent(relativeImport)
                await parseTree({ currentComponent: nextComponent });
            }
        }
        if (currentComponent.remoteDependancies.length > 0) {
            for (const remoteDependancy of currentComponent.remoteDependancies) {
                if (remoteDependencies.includes(remoteDependancy)) return;
                remoteDependencies.push(remoteDependancy);
            };
        }
    }
}

