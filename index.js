const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const commandLineArgs = require('command-line-args');
const sharp = require('sharp');

const PATH_SRC = './src-images';
const PATH_OUTPUT = './output-images';
const PATH_OUTPUT_LIFESTYLE = path.join(PATH_OUTPUT, './lifestyle');
const PATH_OUTPUT_SLIDE = path.join(PATH_OUTPUT, './slide');
const PATH_OUTPUT_PRODUCT = path.join(PATH_OUTPUT, './product');
const PATH_OUTPUT_SWATCH = path.join(PATH_OUTPUT, './swatch');
const PATH_OUTPUT_RESIZE = path.join(PATH_OUTPUT, './resize');

const clOptions = [
    {name: 'verbose', alias: 'v', type: Boolean},
    {name: 'src', type: String, multiple: false, defaultOption: true, defaultValue: './'},
    {name: 'action', type: String},
    {name: 'help', description: 'Print the help'},
    {name: 'width', alias: 'w', type: Number},
    {name: 'height', alias: 'h', type: Number},
    {name: 'position', alias: 'p', type: String},
    {name: 'gravity', alias: 'g', type: String},
    {name: 'filename', alias: 'f', type: String},
];
const options = commandLineArgs(clOptions);

const slideSizes = {
    xs: 480,
    sm: 640,
    md: 800,
    lg: 1600,
    xl: 2000,
};

const slide3Sizes = {
    hint: 25,
    xs: 200,
    sm: 400,
    md: 600,
    lg: 800,
    xl: 1334,
};

const swatchSizes = [100];

const productSizes = [80, 125, 400, 800];



async function getSourceFile(srcDirectory, filename) {
    const srcFile = path.join(srcDirectory, filename);
    return await fsPromises.readFile(srcFile);
}

function splitFilename(input) {
    try {
        const extension = path.extname(input);
        const basename = path.basename(input, extension);
        return {extension: extension.replace(/^\./, ''), basename}
    } catch(err) {
        console.log("splitFilename()", err.message);
        return Promise.reject(err);
    }
}

async function writeResizedImage({buffer, width, outputPath = './', filename}) {
    const fullPath = path.join('./', outputPath, filename);
    console.log('writing: ', fullPath);
    return await sharp(buffer)
        .resize({width})
        .toFile(fullPath);
}

async function emptyDirectory(dir) {
    const directory = path.join('./', dir);
    const files = await fsPromises.readdir(directory);
    await Promise.all(files.map(file => {
        const filename = path.join(directory, file);
        return fsPromises.unlink(filename);
    }));
}

async function writeLifestyleImages(srcDirectory, input, sizes = [1, 0.75, 0.5, 0.25]) {
    const {extension, basename} = splitFilename(input);
    const buffer = await getSourceFile(srcDirectory, input);
    const {width} = await sharp(buffer).metadata();


    return await Promise.all(sizes.map(size => {
        const filename = size === 1
            ? `${basename}.${extension}`
            : `${basename}@${String(size).replace(/\./, ',')}x.${extension}`;
        return writeResizedImage({buffer, width: width * size, outputPath: PATH_OUTPUT_LIFESTYLE, filename})
    }));
}

async function writeHomeSlideImages(srcDirectory, input, sizes = ['xs', 'sm', 'md', 'lg', 'xl']) {
    const {extension, basename} = splitFilename(input);
    const buffer = await getSourceFile(srcDirectory, input);
    return await Promise.all(sizes.map(size => {
        const filename = `${basename}-${size}.${extension}`;
        return writeResizedImage({buffer, width: slideSizes[size], outputPath: PATH_OUTPUT_SLIDE, filename})
    }));
}

async function writeSlide3Images(srcDirectory, input, sizes = ['hint', 'xs', 'sm', 'md', 'lg', 'xl']) {
    const {extension, basename} = splitFilename(input);
    const buffer = await getSourceFile(srcDirectory, input);
    return await Promise.all(sizes.map(size => {
        const filename = `${basename}-${size}.${extension}`;
        return writeResizedImage({buffer, width: slide3Sizes[size], outputPath: PATH_OUTPUT_SLIDE, filename})
    }));
}

async function writeProductImages(srcDirectory, input, sizes = [80, 125, 400, 800]) {
    const {extension, basename} = splitFilename(input);
    const buffer = await getSourceFile(srcDirectory, input);
    const filename = `${basename}.${extension}`;
    return await Promise.all(sizes.map(size => {
        return writeResizedImage({buffer, width: size, outputPath: path.join(PATH_OUTPUT_PRODUCT, String(size)), filename});
    }));
}

async function writeSwatchImages(srcDirectory, input, sizes = [100]) {
    const {extension, basename} = splitFilename(input);
    const buffer = await getSourceFile(srcDirectory, input);
    const filename = `${basename}.${extension}`;
    return await Promise.all(sizes.map(size => {
        return writeResizedImage({buffer, width: size, outputPath: PATH_OUTPUT_SWATCH, filename});
    }));
}

async function processLifestyle(src = PATH_SRC) {
    try {
        await emptyDirectory(PATH_OUTPUT_LIFESTYLE);
        const srcFile = path.join(PATH_SRC, src);
        const stats = await fsPromises.stat(path.join(srcFile));
        const srcDirectory = stats.isDirectory() ? srcFile : path.dirname(srcFile);
        console.log({isDirectory: stats.isDirectory(), srcDirectory});
        const files = stats.isDirectory() ? await fsPromises.readdir(srcDirectory) : [src];
        console.log({files});
        return await Promise.all(files.map(file => writeLifestyleImages(srcDirectory, file)));
    } catch(err) {
        console.log("processLifestyle()", err.message);
        return Promise.reject(err);
    }
}

async function processSlides({src = PATH_SRC}) {
    try {
        await emptyDirectory(PATH_OUTPUT_SLIDE);
        const srcFile = path.join(PATH_SRC, src);
        const stats = await fsPromises.stat(path.join(srcFile));
        const srcDirectory = stats.isDirectory() ? srcFile : path.dirname(srcFile);
        console.log({isDirectory: stats.isDirectory(), srcDirectory});
        const files = stats.isDirectory() ? await fsPromises.readdir(srcDirectory) : [src];
        console.log({files});
        return await Promise.all(files.map(file => writeHomeSlideImages(srcDirectory, file)));
    } catch(err) {
        console.log("processSlides()", err.message);
        return Promise.reject(err);
    }
}

async function processSlides3({src = PATH_SRC}) {
    try {
        await emptyDirectory(PATH_OUTPUT_SLIDE);
        const srcFile = path.join(PATH_SRC, src);
        const stats = await fsPromises.stat(path.join(srcFile));
        const srcDirectory = stats.isDirectory() ? srcFile : path.dirname(srcFile);
        console.log({isDirectory: stats.isDirectory(), srcDirectory});
        const files = stats.isDirectory() ? await fsPromises.readdir(srcDirectory) : [src];
        console.log({files});
        return await Promise.all(files.map(file => writeSlide3Images(srcDirectory, file)));
    } catch(err) {
        console.log("processSlides()", err.message);
        return Promise.reject(err);
    }
}

async function resizeImage({src, filename, ...options}) {
    try {
        const buffer = await getSourceFile(PATH_SRC, src);
        const output = path.join('./', PATH_OUTPUT_RESIZE, filename || src);
        fsPromises.stat(output)
            .then(() => {
                return fsPromises.unlink(output);
            })
            .catch(err => {
                console.log('unable to stat', err.message);
            });
        // await fsPromises.unlink(output);
        return await sharp(buffer)
            .resize(options)
            .toFile(output);
    } catch(err) {
        console.log("resizeImage()", err.message);
        return Promise.reject(err);
    }
}

async function processProduct(src = '') {
    try {
        await Promise.all(productSizes.map(size => {
            const path = PATH_OUTPUT_PRODUCT + '/' + String(size);
            return emptyDirectory(path);
        }));
        const srcFile = path.join(PATH_SRC, src);
        const stats = await fsPromises.stat(path.join(srcFile));
        const srcDirectory = stats.isDirectory() ? srcFile : path.dirname(srcFile);
        console.log({isDirectory: stats.isDirectory(), srcDirectory});
        const files = stats.isDirectory() ? await fsPromises.readdir(srcDirectory) : [src];
        console.log({files});
        return await Promise.all(files.map(file => writeProductImages(srcDirectory, file)));
    } catch(err) {
        console.log("processProduct()", err.message);
        return Promise.reject(err);
    }
}

async function processSwatch(src = '') {
    try {
        await Promise.all(swatchSizes.map(size => {
            return emptyDirectory(PATH_OUTPUT_SWATCH);
        }));
        const srcFile = path.join(PATH_SRC, src);
        const stats = await fsPromises.stat(path.join(srcFile));
        const srcDirectory = stats.isDirectory() ? srcFile : path.dirname(srcFile);
        console.log({isDirectory: stats.isDirectory(), srcDirectory});
        const files = stats.isDirectory() ? await fsPromises.readdir(srcDirectory) : [src];
        console.log({files});
        return await Promise.all(files.map(file => writeSwatchImages(srcDirectory, file)));
    } catch(err) {
        console.log("processProduct()", err.message);
        return Promise.reject(err);
    }
}

console.log(options);
switch (options.action) {
case 'lifestyle':
    processLifestyle(options.src)
        .then(() => console.log('done.'))
        .catch(err => console.trace(err.name, err.message));
    break;
case 'slide':
    processSlides(options)
        .then(() => console.log('done.'))
        .catch(err => console.trace(err.name, err.message));
    break;
case 'slide3':
    processSlides3(options)
        .then(() => console.log('done.'))
        .catch(err => console.trace(err.name, err.message));
    break;
case 'resize':
    resizeImage(options)
        .then(() => console.log('done'))
        .catch(err => console.log(err.name, err.message));
    break;
case 'product':
    processProduct(options.src)
        .then(() => console.log('done.'))
        .catch(err => console.trace(err.name, err.message));
    break;
case 'swatch':
    processSwatch(options.src)
        .then(() => console.log('done.'))
        .catch(err => console.trace(err.name, err.message));
    break;
default:
    console.log('Valid action: lifestyle, slide, slide3, resize, product');
    console.log(clOptions);
}

