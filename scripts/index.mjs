#!/usr/bin/env node

import { Command } from "commander"

async function main() {
    console.log("🔥🔥🔥 Welcome to Bundle-UI 🔥🔥🔥")
    const program = new Command()
        .name("Bundle-UI")
        .description("A mega library of UI components.")
    program.parse()
}

main()