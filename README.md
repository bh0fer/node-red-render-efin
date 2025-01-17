# Node-RED on Render EFIN

A wrapper for deploying [Node-RED](http://nodered.org) to [Render](https://render.com/). Click on the following button to create a new instance...

[![](https://avatars.githubusercontent.com/u/5375661?s=100&v=4)](http://nodered.org) [![](https://avatars.githubusercontent.com/u/36424661?s=100&v=4)](https://render.com/)

*Based on @joeartsea's [node-red-heroku](https://github.com/joeartsea/node-red-heroku)*

In this version, no database server is spawned and configured. You need to provide a `DATABASE_URL`. 

## Deploying Node-RED to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/bh0fer/node-red-render-efin)

### Password protect the flow editor

You will be prompted before deploying to set the following environment variables to prevent public access to your flow editor.

- `NODE_RED_USERNAME` [default: `admin`] - the username to secure the editor with
- `NODE_RED_PASSWORD` - the password to secure the editor with
- `DATABASE_URL` - db connection string of the form `postgresql://[user[:password]@][netloc][:port][/dbname]`

### Possible Databse Service

- [ElephantSQL](https://www.elephantsql.com/)
