#!/usr/bin/env node

import { Command } from "commander"
import { add } from "./add.mjs"
import { logo } from "../logo.mjs"

async function main() {
    console.log(logo)
    const program = new Command()
        .name("Bindle-UI")
        .description("A mega library of UI components.")
    program.addCommand(add)
    program.parse()
}

main()