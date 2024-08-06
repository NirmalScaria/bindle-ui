#!/usr/bin/env node

import { Command } from "commander";
import { getConfig } from "./utils/getConfig.mjs";

import { fetchComponent } from "./utils/fetchComponent.mjs";
import chalk from 'chalk';
import { execSync } from "child_process";
import { copyFile } from "./utils/copyFile.mjs";

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
    await decodeLocations();
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

    for (const [fileName, content] of Object.entries(filesToAdd)) {
        await copyFile({ fileName, content });
    }

    console.log(chalk.green(`✔ Component ${component.id} added successfully!`));

    async function decodeLocations() {
        for (const [key, value] of Object.entries(filesToAdd)) {
            filesToAdd[key] = await decodeImports({ sourceCode: value, replacements: relativeImportLocations, currentLocation: key });
        }
    }
    async function decodeImports({ sourceCode, replacements, currentLocation }) {
        const stringPattern = /(['"`])(@@[\s\S]*?)\1/g;
        const result = sourceCode.replace(stringPattern, (match, quote, str) => {
            const rawString = str.slice(3);
            const replacement = replacements[rawString];
            if (replacement !== undefined) {
                const currentLocationParts = currentLocation.split('/');
                const relativePath = '../'.repeat(currentLocationParts.length - 1);
                return `${quote}${relativePath}${replacement}${quote}`;
            }
            return match;
        });

        return result;
    }

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

