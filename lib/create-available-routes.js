const fs = require('fs')
const path = require('path')
const { createRouteParser } = require('./create-route-parser')

let mainRouterTree = {}
let processingDir

module.exports = async (directory) => {
    processingDir = directory
    await processDirectory(directory, '.')
    return mainRouterTree
}

async function processDirectory(currPath, dir) {
    const pathToCheck = path.join(currPath, dir)

    if (!fs.existsSync(pathToCheck)) {
        throw new Error(`Couldn't find initial directory:${pathToCheck}`)
    }

    return new Promise((resolve, reject) => {
        fs.stat(pathToCheck, async (err, pathStat) => {
            if (err) {
                console.error(err)
                return reject(err)
            }

            if (pathStat.isDirectory() && dir !== '.DS_Store') {
                const dirContent = fs.readdirSync(pathToCheck)

                const treeMods = dirContent.map(async (fileRecord) => {
                    if (fileRecord === '.DS_Store') {
                        return
                    }
                    const nextPathToCheck = path.join(pathToCheck, fileRecord)
                    return new Promise((innerResolve, innerReject) => {
                        fs.stat(nextPathToCheck, async (err, nextFile) => {
                            if (err) {
                                console.error(err)
                                return innerReject(err)
                            }
                            if (nextFile.isDirectory()) {
                                await processDirectory(pathToCheck, fileRecord)
                            } else if (nextFile.isFile()) {
                                processFile(fileRecord, pathToCheck)
                            }
                            return innerResolve()
                        })
                    })
                })

                await Promise.all(treeMods)
            } else if (pathStat.isFile() && dir !== '.DS_Store') {
                processFile(dir, currPath)
            }
            resolve()
        })
    })
}

function processFile(file, filePath) {
    const _basePath = processingDir
    const ignoredPath = filePath.replace(_basePath, '')

    const paramRegex = /^\[(\w+)\].js$/
    if (paramRegex.test(file)) {
        const noExt = file.replace('.js', '')
        mainRouterTree[`${ignoredPath}/${noExt}`] = {
            handler: requireHandler(`${filePath}/${file}`),
            parser: createRouteParser(`${ignoredPath}/${noExt}`),
        }
    } else if (file === 'index.js') {
        if (!ignoredPath) {
            mainRouterTree[`/`] = {
                handler: requireHandler(`${filePath}/index.js`),
                parser: createRouteParser(`${ignoredPath}`),
            }
        } else {
            mainRouterTree[`${ignoredPath}`] = {
                handler: requireHandler(`${filePath}/index.js`),
                parser: createRouteParser(`${ignoredPath}`),
            }
        }
    } else {
        const noExt = file.replace('.js', '')
        mainRouterTree[`${ignoredPath}/${noExt}`] = {
            handler: requireHandler(`${filePath}/${file}`),
            parser: createRouteParser(`${ignoredPath}/${noExt}`),
        }
    }
}

function requireHandler(path) {
    const handler = require(path)
    return handler.default || handler
}
