# Contributing to Agape Toolkit

Thank you for your interest in contributing to **Agape Toolkit**!

**Agape is a cohesive toolkit for building declarative, model-driven applications — providing a shared model layer with libraries for APIs, data persistence, and UI that build on the same foundation.**

Its goal is to offer a consistent, type-safe development experience where models define the source of truth, and the surrounding libraries use those models to generate behavior and structure automatically.

We welcome contributions of all kinds — code, documentation, tests, bug reports, and feature requests. This guide will help you get started.

---

## 🏗 Project Structure

Agape Toolkit is organized as an **Nx monorepo**, with multiple interrelated libraries stored as **Git submodules**:

- **@agape/model** – Model annotation and validation
- **@agape/orm** – Object-relational mapping
- **@agape/api** – REST API construction
- **@agape/alchemy** – Serialization/deserialization
- **@agape/ui** – Angular Material UI components

These libraries are designed to work together to provide a cohesive development experience.

---

## 🚀 Cloning the Monorepo

Always start by cloning the root repo with submodules:

```bash
git clone --recurse-submodules git@github.com:AgapeToolkit/AgapeToolkit.git
cd AgapeToolkit
```

If you already cloned without `--recurse-submodules`, initialize submodules manually:

```bash
git submodule update --init --recursive
```

---

## 🍴 Forking and Hot-Swapping a Library

Example: you want to work on **@agape/model**.

1. Go to [AgapeToolkit/agape-model](https://github.com/AgapeToolkit/agape-model) and click **Fork**.
2. Copy the SSH URL for your fork (e.g. `git@github.com:your-username/agape-model.git`).

Inside your local monorepo, navigate to the submodule folder and add your fork:

```bash
cd libs/model
git remote add myfork git@github.com:your-username/agape-model.git
git fetch myfork
git checkout -b feature/my-change
git push -u myfork feature/my-change
```

> The `-u` flag sets **myfork** as the default remote for this branch, so you can simply run `git push` and `git pull` going forward.

---

## 💻 Making Changes and Testing

Return to the root of the monorepo to build/test your changes in context:

```bash
cd ../../
npx nx affected --target=test
```

Commit changes inside the submodule:

```bash
cd libs/model
git add .
git commit -m "feat(model): add new feature"
git push
```

---

## 🔀 Opening a Pull Request

1. Go to your fork on GitHub.
2. Open a PR against `AgapeToolkit/agape-model:main` (or `develop` if that is the active development branch).

---

## 🔄 After Your PR is Merged

Once your PR is merged into the official library repo, you may want to sync your local copy:

```bash
cd libs/model
git checkout main
git pull origin main
```

This updates your local submodule to the latest official commit so you can continue working.

> **Important:** You do **not** need to commit this submodule update to the root repo yourself.  
> The root **AgapeToolkit** repository is updated by the maintainers as part of the release process to point to the latest stable commits of each library.  
> When you later run:
>
> ```bash
> git pull
> git submodule update --init --recursive
> ```
>
> Your workspace will sync to the updated references.

---

## 🔄 Switching Between Forked and Official Versions

To switch back to your fork (for additional changes):

```bash
cd libs/model
git checkout feature/my-change
```

To switch back to official after merge:

```bash
git checkout main
git pull origin main
```

Since maintainers handle root repo updates, no root-level commit is required.

---

## 🛠 Working on Multiple Libraries

If you need to work on multiple libraries simultaneously (e.g., `agape-api` and `agape-model`):

1. Fork each library and add a `myfork` remote inside each folder.
2. Create feature branches in each submodule.
3. Make changes, build/test from the root, commit, and push.
4. Open PRs for each library separately.
5. After PRs are merged, update your local submodules with `git pull origin main` in each library.

---

## 🐛 Reporting Issues

If you find a bug, please [open an issue](https://github.com/AgapeToolkit/AgapeToolkit/issues) and include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (Node.js version, OS)

---

## 📚 Documentation Contributions

We use [Typedoc](https://typedoc.org/) to generate documentation.  
If you improve docstrings, run:

```bash
npx nx run agape-website:generate-docs
```

Then verify the output in `apps/agape-website`.

---

## 💡 Feature Requests

We welcome suggestions! Open a [discussion](https://github.com/AgapeToolkit/AgapeToolkit/discussions) or create an issue labeled `enhancement`.

---

## 🤝 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).  
By participating, you agree to uphold this standard.
