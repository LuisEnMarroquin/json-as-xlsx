# Dev environment

Here are the **node** and **npm** versions that we use to develop this project

```shell
$ node --version && npm --version
v16.13.0
8.1.0
```

After cloning the repository, run `npm install` to install the dependencies

## Run in dev mode

You'll have to use 2 consoles to run the app, one for the actual package `index.ts`

```shell
$ npm run dev
```

Then if you want to test the package with `ReactJS` you can execute the following

```shell
$ cd examples/reactjs-app
$ npm run dev
```

Otherwise if you want to test with `Express` use the following command

```shell
$ cd examples/express-app
$ npm run dev
```

## Linting code

This project uses `prettier` for linting code

## Deploy to NPM

There is a pipeline for that, just do a PR and I'll merge it
