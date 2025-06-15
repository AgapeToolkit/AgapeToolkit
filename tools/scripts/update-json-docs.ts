import fs from 'fs';
import path from 'path';

const JSON_DOCS_PATH = 'docs/json'

function updateName(file: string, name: string) {

  console.log(`Updating ${file} → ${name}`)

  const filepath = `${JSON_DOCS_PATH}/${file}`
  try {
    const content = fs.readFileSync(filepath, 'utf8')
    const json = JSON.parse(content)
    json.name = name;

    const output = JSON.stringify(json, undefined, 2)
    fs.writeFileSync(filepath, output)
  }
  catch (error: unknown) {
    console.log(error)
    return
  }
}

function createIndex(): { [key: string]: string } {
  const files = getJsonFilePaths(JSON_DOCS_PATH)

  const index: { [key: string]: string } = {}
  for (const file of files) {
    const name = getModuleName(file)
    index[name] = file
  }

  return index
}

function writeIndex(index: { [key: string]: string }, file: string) {
  const filepath = `${JSON_DOCS_PATH}/${file}`
  const output = JSON.stringify(index, undefined, 2)
  fs.writeFileSync(filepath, output)
}

function getModuleName(file: string) {
  const filepath = `${JSON_DOCS_PATH}/${file}`
  const content = fs.readFileSync(filepath, 'utf8')
  const json = JSON.parse(content)
  return json.name
}

function getJsonFilePaths(dirPath: string, baseDir: string = dirPath): string[] {
  const jsonFiles: string[] = [];

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.relative(baseDir, fullPath);

      if (fs.statSync(fullPath).isDirectory()) {
          // Recursive call for directories
          jsonFiles.push(...getJsonFilePaths(fullPath, baseDir));
      } else if (item.endsWith('.json')) {
          // Add relative path of JSON files
          jsonFiles.push(relativePath);
      }
  }

  return jsonFiles;
}


updateName('model-formats.json', '@agape/model/formats')
updateName('model-temporal.json', '@agape/model/temporal')

const index = createIndex()
writeIndex(index, 'index.json')
