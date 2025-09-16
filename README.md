# AgapeToolkit

AgapeToolkit is a collection of TypeScript libraries for building modern APIs
and UIs with clarity, consistency, and confidence.

It provides a **single source of truth** for your data models and powers validation,
serialization, ORM, API layers, and user interfaces — all from the same definitions.

> **Status:** Active development. Expect rapid iteration and breaking changes until v1.0.

---

## 📦 Packages

This monorepo contains multiple packages published under the `@agape/*` scope. Each can be used independently or together.

| Package            | Description                                                        | npm                                                                 | Docs                                   |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------- |----------------------------------------|
| `@agape/model`     | Annotate and validate models for APIs and UIs.                     | [![npm](https://img.shields.io/npm/v/@agape/model.svg)](https://www.npmjs.com/package/@agape/model) | [Docs](https://agape.dev/api)          |
| `@agape/api`       | Build REST APIs directly from your models.                         | [![npm](https://img.shields.io/npm/v/@agape/api.svg)](https://www.npmjs.com/package/@agape/api) | [Docs](https://agape.dev/docs/api)     |
| `@agape/orm`       | Simple ORM for mapping models to relational databases.             | [![npm](https://img.shields.io/npm/v/@agape/orm.svg)](https://www.npmjs.com/package/@agape/orm) | [Docs](https://agape.dev/docs/orm)     |
| `@agape/alchemy`   | Serialization and deserialization utilities for models.            | [![npm](https://img.shields.io/npm/v/@agape/alchemy.svg)](https://www.npmjs.com/package/@agape/alchemy) | [Docs](https://agape.dev/docs/alchemy) |
| `@agape/object`    | Compose classes with mixin-style traits and behavioral decorators.  | [![npm](https://img.shields.io/npm/v/@agape/object.svg)](https://www.npmjs.com/package/@agape/object) | [Docs](https://agape.dev/docs/object)   |
### Supporting Packages

These packages are used internally by the main libraries but can also be useful on their own.


| Package           | Description                                                        | npm                                                                                                       | Docs                          |
|-------------------| ------------------------------------------------------------------ |-----------------------------------------------------------------------------------------------------------|-------------------------------|
| `@agape/locale`   | Serialization and deserialization utilities for models.            | [![npm](https://img.shields.io/npm/v/@agape/locale.svg)](https://www.npmjs.com/package/@agape/locale)     | [Docs](https://agape.dev/api) |
| `@agape/metadata` | Annotate and validate models for APIs and UIs.                     | [![npm](https://img.shields.io/npm/v/@agape/metadata.svg)](https://www.npmjs.com/package/@agape/metadata) | [Docs](https://agape.dev/api) |
| `@agape/string`   | Build REST APIs directly from your models.                         | [![npm](https://img.shields.io/npm/v/@agape/string.svg)](https://www.npmjs.com/package/@agape/string)     | [Docs](https://agape.dev/api) |
| `@agape/types`    | Simple ORM for mapping models to relational databases.             | [![npm](https://img.shields.io/npm/v/@agape/types.svg)](https://www.npmjs.com/package/@agape/types)       | [Docs](https://agape.dev/api) |


See [agape.dev](https://agape.dev) for the full list of packages and documentation.

---

## 🚀 Quick Example

Let's build a complete application for editing employee records.

### Create the model

```ts
import { Model, Field } from '@agape/model';

@Model
class Employee {
  @Field
  @PrimaryKey
  id!: number;
  
  @Field 
  @Alphanumeric
  number!: string;
  
  @Field 
  @MaxLength(64)
  name!: string;
  
  @Field
  @Email
  email!: string;
}
```

### Register the model with the ORM

```ts
import { orm } from '@agape/orm';

orm.register(Employee);
```

### Create the API controller

```ts
import { Controller } from '@agape/api';
import { Traits } from '@agape/object';

interface EmployeeController extends HasCrudOperations<Employee> { }

@Controller('employees')
@Traits(CanPerformCrud(Employee))
class EmployeeController { }
```

### Bootstrap the API

```ts
import express from 'express';
import { bootstrapExpress } from '@agape/api';

const app = express();
boostrapExpress(app, EmployeeController);
app.listen(3000);
```

### Create the API Client

```ts
ag g client --name EmployeeApi \
  --server http://localhost:3000 \
  --root /api
  --controller EmployeeController
  --models @myapp/models
  --output apps/frontend/src/app/shared/services/employee-api.ts
```

### Create the UI

```ts
import { Route } from '@angular/router';
import { crudRoutes } from '@agape/ui';
import { EmployeeApi } from './shared/services/employee-api';

export const appRoutes: Route[] = [
  ...crudRoutes(
    { 
      path: '/employees',
      model: Employee,
      api: EmployeeApi
    }
  )      
];
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

MIT © 2025 [Maverik Minett](https://github.com/maverikminett)
