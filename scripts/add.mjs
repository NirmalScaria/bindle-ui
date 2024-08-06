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

    async function copyFile({ fileName, content }) {
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

    async function decodeLocations() {
        for (const [key, value] of Object.entries(filesToAdd)) {
            filesToAdd[key] = await decodeImports({ sourceCode: value, replacements: relativeImportLocations, currentLocation: key });
        }
    }
    async function decodeImports({ sourceCode, replacements, currentLocation }) {
        // Regex to match any string enclosed in quotes (single, double, or backticks) and starts with @@
        const stringPattern = /(['"`])(@@[\s\S]*?)\1/g;

        // Replace all matches
        const result = sourceCode.replace(stringPattern, (match, quote, str) => {
            // Check if the replacement exists in the map
            const rawString = str.slice(3);
            const replacement = replacements[rawString];
            if (replacement !== undefined) {
                // replacement string contains the location of a target file.
                // We need to convert this to a relative path from the current file
                // find the level of nesting of the current file
                const currentLocationParts = currentLocation.split('/');
                // add a ../ for each part in the current location
                const relativePath = '../'.repeat(currentLocationParts.length - 1);
                // add the replacement to the relative path
                return `${quote}${relativePath}${replacement}${quote}`;
            }
            // If no replacement found, return the original match
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

