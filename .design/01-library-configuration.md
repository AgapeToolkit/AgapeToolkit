## Library Configuration

This is an nx monorepo for @agape/* libraries as published on NPM.

The libraries live in <workspace>/libs/*.

This is a polyrepo monorepo, meaning the toplevel workspace is a repository, and then each
individual library is a submodule.

## Setting up a new Library

I will have already cloned a repository into the libs/* directory. You can setup the new library by:

* copying all the files from libs/metadata into the new repo (except the .git directory, do keep the .github directory)
* deleting all the source code files in the new directory (libs/<new-lib>/src/*)
* create a new empty index.ts at (libs/<new-lib>/src/index.ts, and and empty lib directory at libs/<new-lib>/src/lib
* performing a search and replace on "metadata" to the new library name on the remaining files in the directory
