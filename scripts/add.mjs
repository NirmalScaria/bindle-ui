#!/usr/bin/env node

import { Command } from "commander";

export const add = new Command("add")
    .description("Add a new component")
    .argument("<component>", "Name of the component to be added.")
    .action((component) => {
        addAction(component);
    })

function addAction(component) {
    console.log("Adding a new component...")
    console.log(`Component name: ${component}`)
}