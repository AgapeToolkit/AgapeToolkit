## Library Configuration

This is an nx monorepo for @agape/* libraries as published on NPM.

The libraries live in <workspace>/libs/*.

This is a polyrepo monorepo, meaning the toplevel workspace is a repository, and then each
individual library is a submodule.

## Setting up a new Library

I will have already cloned a repository into the libs/* directory as a submodule. You can setup the new library by:

* copying all the files from libs/metadata into the new repo 
  * do not copy over the .git directory, the target directory will have an existing git directory which must stay intact
  * do copy in the .github and .husky directories (and update them)
(except the .git directory, do not copy the .keep the .github directory)
* deleting all the source code files in the new directory (libs/<new-lib>/src/*)
* create a new empty index.ts at (libs/<new-lib>/src/index.ts, and and empty lib directory at libs/<new-lib>/src/lib
* performing a search and replace on "metadata" to the new library name on the remaining files in the directory
* update the tsconfig.base.json with the new library path
* updtate package json to have the required build scripts for the new library 
  * copy all build:metadata* scripts in package json
  * rename "metadata" to <library-name>
* update package json to generate json docs for the new library 
  * create docs:json:<library-name> script
  * add to docs:json script before docs:process:json script
* add a publishing github workflow called publish-<library-name>.yml in .github/workflows
  * copy publish-metadata.yml
  * rename metadata to <library-name>
* update files in .github and .husky directories of the library  
## Testing a Library

npx nx test <library-name>

## Building a Library

npm run build:<library-name>