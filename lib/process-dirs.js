const fs = require('fs');
const path = require('path');
const createRouteDir = require('./create-route-dir');
const ora = require('ora');
const createAvailableRoutes = require('./create-available-routes');

module.exports = async (directory) => {
    const spinner = ora('Compiling...').start();
    try {
        const availableRoutesTree = await createAvailableRoutes(directory);

        const routePath = await createRouteDir();

        await new Promise((resolve, reject) => {
            fs.writeFile(
                path.join(routePath, 'routes.json'),
                JSON.stringify(availableRoutesTree),
                (err, done) => {
                    if (err) reject(err);
                    resolve(done);
                }
            );
        });

        setTimeout(() => {
            spinner.color = 'green';
            spinner.text = 'Compiled';
            spinner.succeed();
        }, 1000);
    } catch (err) {
        spinner.color = 'red';
        spinner.text = 'Failed';
        spinner.fail();
        console.error(err);
        throw err;
    }
};