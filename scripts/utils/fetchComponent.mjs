import chalk from "chalk";

export async function fetchComponent(componentId, useTypescript) {
    const url = `http://localhost:3000/api/getComponent?componentId=${componentId}&useTypescript=${useTypescript}`;
    try {
        var response = await fetch(url);
        response = await response.json();
        if(!response.success) {
            console.error(chalk.red(response.message));
            return;
        }
    const content = JSON.parse(response.component);
    return content
    }
    catch (error) {
        console.error(chalk.red("Error fetching component: ", error));
    }
}