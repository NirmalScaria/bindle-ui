// Cool stuff. Pretty nice.
// It parses a file using babel! And understands what is assignment, what is export, and what is object expression.
// Damnnn. Im smart.
// Then it applies the new config to the tailwind config file and saves it..
// But I don't know. I don't know why I am doing this.
// Open source is cool and all but... What does it help?
// I have to still find food to eat. I have to still find a job.
// Fuck tech. I hate this. And at the same time, I love this.
// I write code because I like to. I wish it gave food too.

import fs from 'fs/promises'
import babel from '@babel/core'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import t from '@babel/types'

export async function applyTailwindConfig({ newConfig }) {
    const targetFile = 'tailwind.config.ts'
    const targetDirectory = process.cwd()

    // TODO: Find the actual tailwind file. It could be in multiple locations.
    // Warn and exit if unable to find tailwind file.    
    const filePath = `${targetDirectory}/${targetFile}`
    const codeString = await fs.readFile(filePath, 'utf-8')

    const ast = babel.parse(codeString, {
        sourceType: 'module',
        plugins: ['@babel/plugin-syntax-typescript']
    });

    traverse.default(ast, {
        AssignmentExpression(path) {
            if (
                t.isMemberExpression(path.node.left) &&
                t.isIdentifier(path.node.left.object, { name: 'module' }) &&
                t.isIdentifier(path.node.left.property, { name: 'exports' })
            ) {
                const right = path.node.right;
                if (t.isIdentifier(right)) {
                    addFieldToObject(ast, right.name);
                }
                else if (t.isObjectExpression(right)) {
                    assignValues(right, newConfig);
                }
            }
        },
        ExportDefaultDeclaration(path) {
            const declaration = path.node.declaration;
            if (t.isIdentifier(declaration)) {
                addFieldToObject(ast, declaration.name);
            }
        }
    });

    function addFieldToObject(ast, exportedName) {
        traverse.default(ast, {
            VariableDeclarator(path) {
                if (t.isIdentifier(path.node.id, { name: exportedName }) && t.isObjectExpression(path.node.init)) {
                    assignValues(path.node.init, newConfig);
                }
            }
        });
    }

    function assignValues(activeNode, properties) {
        for (const key in properties) {
            if (properties.hasOwnProperty(key)) {
                const value = properties[key];
                const existingProperty = activeNode.properties.find(
                    (property) => t.isObjectProperty(property) && (
                        property.key.extra?.raw == key || 
                        property.key.extra?.raw == `"${key}"` || 
                        property.key.extra?.raw == `'${key}'` || 
                        property.key.name == key 
                    )
                )
                if (existingProperty) {
                    if (t.isObjectExpression(existingProperty.value) && typeof value === 'object') {
                        assignValues(existingProperty.value, value);
                    }
                    else if (t.isArrayExpression(existingProperty.value) && Array.isArray(value)) {
                        value.forEach((element) => {
                            existingProperty.value.elements.push(t.valueToNode(element));
                        });
                    }
                } else {
                    const newProperty = t.objectProperty(t.identifier(key), t.valueToNode(value));
                    activeNode.properties.push(newProperty);
                }
            }
        }
    }

    const output = generate.default(ast, {}, codeString);
    await fs.writeFile(filePath, output.code);
}

// const testConfig = {
//     darkMode: ['newclass'],
//     'theme': {
//         extend: {
//             colors: {
//                 newcolor: "#333"
//             }
//         }
//     }
// }

// applyTailwindConfig({ newConfig: testConfig })
