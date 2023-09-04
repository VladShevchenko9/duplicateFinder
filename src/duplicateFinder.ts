import * as fs from 'fs';
import {resolve} from 'path';
import * as crypto from 'crypto';
import * as readline from 'node:readline/promises'
import {stdin as input, stdout as output} from 'node:process';

type FileData = {
    name: string,
    size: number,
}

async function getDuplicates(filesData: FileData[]): Promise<Record<string, string[]>> {
    filesData.sort((a: FileData, b: FileData) => {
        return a.size - b.size;
    });

    let duplicates: Record<string, string[]> = {};

    for (let i = 0; i < filesData.length - 1; i++) {
        let hasDuplicates: boolean = false;
        let duplicatesHash: string = '';

        for (let j = i + 1; j < filesData.length && filesData[i].size === filesData[j].size; j++) {
            const fileHash1 = await fileToHash(filesData[i].name);
            const fileHash2 = await fileToHash(filesData[j].name);

            if (fileHash1 === fileHash2) {
                if (!duplicates.hasOwnProperty(fileHash1)) {
                    duplicates[fileHash1] = [];
                }

                hasDuplicates = true;
                duplicatesHash = fileHash1;
                duplicates[fileHash1].push(filesData[j].name);
            }
        }

        if (hasDuplicates && duplicatesHash) {
            duplicates[duplicatesHash].push(filesData[i].name);
        }
    }

    return duplicates;
}

function getFilesData(path: string, filesData: FileData[] = []): FileData[] {
    if (!fs.existsSync(path)) {
        throw new Error('the path does not exist');
    }

    if (!fs.lstatSync(path).isDirectory()) {
        throw new Error('the path is not a directory');
    }

    if (!filesData.length) {
        console.log('Searching in ' + resolve(path));
    }

    fs.readdirSync(path, {withFileTypes: true}).forEach(directoryItem => {
        const fullPath = resolve(path + '/' + directoryItem.name);

        if (directoryItem.isFile()) {
            const stats = fs.statSync(fullPath);
            filesData.push({
                name: fullPath,
                size: stats.size,
            });
        }

        if (directoryItem.isDirectory()) {
            getFilesData(fullPath, filesData);
        }
    });

    return filesData;
}

function fileToHash(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
        throw new Error('file does not exist: ' + filePath);
    }

    if (!fs.lstatSync(filePath).isFile()) {
        throw new Error('The "filePath" is not a file');
    }

    return new Promise(resolve1 => {
        const fd = fs.createReadStream(filePath);
        const hash = crypto.createHash('sha256');
        hash.setEncoding('hex');

        fd.on('end', function () {
            hash.end();
            resolve1(hash.read());
        });

        fd.pipe(hash);
    });
}

function duplicatesDataToArray(duplicates: Record<string, string[]>): string[][] {
    return Object.keys(duplicates).map(key => duplicates[key]);
}

async function getFileDuplicates(
    dirToSearch: string,
    baseFile: string,
    duplicates: FileData[] = [],
    baseFileHash: string = ''
): Promise<FileData[]> {
    if (!fs.existsSync(dirToSearch)) {
        throw new Error('the dir for searching does not exist');
    }

    if (!fs.lstatSync(dirToSearch).isDirectory()) {
        throw new Error('the dir for searching must be a directory');
    }

    if (!fs.existsSync(baseFile)) {
        throw new Error('the base file does not exist');
    }

    if (!fs.lstatSync(baseFile).isFile()) {
        throw new Error('the base file must be a file');
    }

    if (!baseFileHash) {
        baseFileHash = await fileToHash(baseFile);
    }

    const baseFileSize = fs.statSync(baseFile).size;
    baseFile = resolve(baseFile);

    for (const directoryItem of fs.readdirSync(dirToSearch, {withFileTypes: true})) {
        const dirItemFullPath = resolve(dirToSearch + '/' + directoryItem.name);
        const dirItemSize = fs.statSync(dirItemFullPath).size;

        if (
            directoryItem.isFile()
            && dirItemFullPath !== baseFile
            && dirItemSize === baseFileSize
            && await fileToHash(dirItemFullPath) === baseFileHash
        ) {
            duplicates.push({
                name: dirItemFullPath,
                size: fs.statSync(dirItemFullPath).size,
            });
        }

        if (directoryItem.isDirectory()) {
            await getFileDuplicates(dirItemFullPath, baseFile, duplicates, baseFileHash);
        }
    }

    return duplicates;
}

async function displayDuplicates(duplicatesSearchDir: string): Promise<void> {
    const filesData = getFilesData(duplicatesSearchDir);
    const duplicates = await getDuplicates(filesData);
    const duplicatesArray = duplicatesDataToArray(duplicates);
    for (let i = 0; i < duplicatesArray.length; i++) {
        console.log('Duplicates group # ' + (i + 1));

        for (let j = 0; j < duplicatesArray[i].length; j++) {
            console.log(duplicatesArray[i][j]);
        }

        if (i < duplicatesArray.length - 1) {
            console.log('');
        }
    }
}

type DuplicatesData = {
    duplicates: FileData[],
    rl: readline.Interface,
};

async function processRemovingFileDuplicates(duplicatesData: DuplicatesData): Promise<boolean> {
    console.log('\r\nThe list of duplicates\r\n');

    for (let i = 0; i < duplicatesData.duplicates.length; i++) {
        console.log((i + 1) + ') ' + duplicatesData.duplicates[i].name);
    }

    const removeFile = await duplicatesData.rl.question('Type a file number to remove or -1 to EXIT\r\n');
    const removeFileId: number = Number(removeFile);

    if (removeFileId === -1) {
        return false;
    }

    if (removeFileId < duplicatesData.duplicates.length || removeFileId >= 0) {
        console.log('Removing the following file: ' + duplicatesData.duplicates[removeFileId - 1].name);

        try {
            fs.unlinkSync(duplicatesData.duplicates[removeFileId - 1].name);
        } catch (e) {
            throw new Error('Unable to delete the file');
        }

        duplicatesData.duplicates = duplicatesData.duplicates.filter((value, index) => index !== (removeFileId - 1));
    }

    return true;
}

(async () => {
    let duplicatesSearchDir: string = '.';
    const rl = readline.createInterface({input, output});
    let answer;
    do {
        answer = await rl.question('What would you like to do?\r\n' +
            '1) Search Duplicates in some dir.\r\n' +
            '2) Search Duplicate of specific File.\r\n'
        );
        answer = parseInt(answer);
    } while (answer < 1 || answer > 2);

    switch (answer) {
        case 1:
            duplicatesSearchDir = await rl.question('In which directory would you like to search? (Full path)\r\n');
            await displayDuplicates(duplicatesSearchDir);
            break;
        case 2:
            const dirToSearch = await rl.question('In which directory would you like to search? (Full path)\r\n');
            const baseFile = await rl.question('Please, type a path for a base file.\r\n');
            let duplicatesData = {
                duplicates: await getFileDuplicates(dirToSearch, baseFile),
                rl: rl
            };

            while (duplicatesData.duplicates.length) {
                if (!await processRemovingFileDuplicates(duplicatesData)) {
                    break;
                }
            }

            console.log('No more duplicates');

            break;
    }

    rl.close();

    return;
})();
