# Enhanced Webex Widget

Enhanced Webex Widget is a Javascript project that aims to resolve some gripping issues with existing widget such as conversation caching and integrated video/messaging system.

## Introduction

### Base Folder Structure

| Folder       | Description                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| /build       | static files generated when you run `yarn build`. You should aim to host this either using ExpressJS or Nginx or other platform |
| /integration | sample integration to iframe this application on your application                                                               |
| /mock        | mock application to host grouping/hunting (note: this feature is not production-level but an example)                           |
| /public      | static files for the application                                                                                                |
| /src         | main application                                                                                                                |
| .env         | environment variables used in application                                                                                       |
| package.json | packages used to develop this application                                                                                       |
| server.js    | example ExpressJS file to host both mock application and main application (after running `yarn build`)                          |

### App Folder Structure

You can find these folders in `/src`

| Folder      | Description                                                        |
| ----------- | ------------------------------------------------------------------ |
| /app        | redux store                                                        |
| /components | ui components used in application                                  |
| /features   | redux/react context features such as messaging/users/meeting logic |
| /img        | image assets used such as loading/placeholder-images               |
| /utils      | utility/helper functions used throughout the application           |
| index.js    | entry function to application                                      |

### Internal vs Public API

| Features                 | Public API | Internal API                  | On-Prem  |
| ------------------------ | ---------- | ----------------------------- | -------- |
| Basic Messaging          |            | - conversation - mercury (mq) |          |
| Threads                  |            | - conversation - mercury (mq) |          |
| Reactions                |            | - mercury (mq)                |          |
| Indicators (read/unread) |            | - device - mercury (mq)       |          |
| File Download/Upload     |            | - conversation                |          |
| Users                    |            | - user - device               |          |
| Avatars                  |            | - conversation                |          |
| Meeting                  | - meeting  |                               |          |
| Grouping/Hunting         |            |                               | - server |

## Installation

The widget is built and can be served using Express.js. To access this widget, you can use an iframe and point the source to the Express server.

Below is a simple step-by-step guide on how to use this project.

1. Use the package manager `yarn` to install the necessary packages (based on package.json)

```bash
yarn install
```

2. Add in necessary environment file `.env`. It should look like this. Use appropriate server url accordingly.

```bash
REACT_APP_SERVER_URL=http://localhost:5555/server
```

3. Build the widget into assets

```bash
yarn build
```

4. Add in files for mock-up server - `/mock/filter.json` and `/mock/hunting.json`.

`filter.json` - a hash of user to organizations. This is to enforce which user has access to conversations that belong to specific organizations.

```bash
{
  "webex_user1_id": [
    "webex_org1_id",
    "webex_org2_id"
  ],
  "webex_user2_id": [
    "webex_org1_id"
  ]
}
```

`hunting.json` - an array that states which conversations belongs to the type - hunting line. This usage is specific for call-center functionality.

```bash
{ "spaces" : [ "webex_space1_id" ] }
```

5. Start the server

```bash
node server.js
```

6. Open widget through an iframe HTML - `/integration/test.html`

## Note on Project

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app), using the [Redux](https://redux.js.org/) and [Redux Toolkit](https://redux-toolkit.js.org/) template.

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `yarn build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
