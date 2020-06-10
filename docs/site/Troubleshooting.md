---
lang: en
title: 'Troubleshooting'
keywords: LoopBack 4.0, LoopBack 4, Node.js, TypeScript, OpenAPI
sidebar: lb4_sidebar
permalink: /doc/en/lb4/Troubleshooting.html
---

## Common Troubleshooting Tips

- You can get more information when the application in a debug mode. That is,
  instead of starting the application using `npm start`, use this:

  ```sh
  DEBUG=loopback:* npm start
  ```

See more details on setting debug strings:
https://loopback.io/doc/en/lb4/Setting-debug-strings.html

## General

### The latest change is not reflected in the application behavior

For example, the error keeps complaining about a Controller class I just
deleted.

#### What does that mean?

The transpiled JavaScript files probably are not in sync with the TypeScript
file.

#### How to fix?

Make sure `npm run build` is being run after every change.

If you have done so but still getting this error, it is possible that the
transpiled JavaScript files did not get updated properly. Run `npm run clean` to
delete all the transpiled files. By doing so, it forces the build to generate
the transpiled JS files next time when you start the application using
`npm start` or call `npm run build`.

## Binding related

### Binding key not bound error

You get a similar error as below:

```
500 Error: The key 'services.hasher' is not bound to any value in context application
```

#### What does that mean?

It means the binding key is not bound to a value.

#### How to fix?

Set the value for the binding key in the application. i.e. Go to your
application, typically it is in `src/application.ts`,

```ts
// if your binding key is meant to bind to a class
this.bind(SOME_BINDING_KEY).toClass(AClass);
```

See more details in
[Binding documentation page](https://loopback.io/doc/en/lb4/Binding.html).
