# Agape

A modular TypeScript toolkit for building modern, DRY web applications.

## Overview

**Agape** is a collection of focused libraries designed to work together to streamline backend and frontend development 
in TypeScript. It emphasizes declarative design, reusability, and consistency across layers—so you can define your data 
once and use it everywhere: database, API, UI, and beyond.

Whether you're building APIs, validating payloads, modeling data, or transforming objects, Agape gives you the tools to
do it cleanly and efficiently.

---

## 📦 Libraries

### [`@agape/alchemy`](libs/agape/alchemy/README.md)
Powerful serialization and transformation engine.

Customize how your models are turned into plain objects for network transmission. Deserialize and validate payloads into
usable models—on both the server and client.

### [`@agape/api`](libs/agape/api/README.md)
Elegant REST API construction with Express.

Build robust HTTP controllers and route handlers backed by data models. Automatically validate incoming query parameters
and JSON payloads. Leverage the same models used for persistence and UI generation.


### [`@agape/model`](libs/agape/model/README.md)
Declarative data modeling for TypeScript.

Define your models once and use them across your application—for validation, form rendering, database queries, and API
payloads. Models can be extended with views to shape how they're serialized or queried.

### [`@agape/object`](libs/agape/object/README.md)
Extensible objects

Compose TypeScript classes using mixin-style traits and behavioral decorators.


### [`@agape/orm`](libs/agape/orm/README.md)
A lightweight ORM layer for MongoDB.

Use your Agape models to query, insert, and update MongoDB documents without creating a separate schema layer. Designed 
for model-driven data access with minimal boilerplate.

### [`@agape/string`](libs/agape/string/README.md)
String utilities for common transformations.

Convert strings between casing formats (camelCase, kebab-case, etc.), tokenize identifiers, and perform other helpful 
string manipulations throughout your app.


## 👤 Author

**Maverik Minett**  
📧 maverik.minett@gmail.com

---

## 📄  License

MIT License  
© 2020–2025 Maverik Minett
