const pg = require('pg')
const when = require('when')
const util = require('util')

let pool

const initPG = () => {
  const pgUrl = process.env.DATABASE_URL
  console.log('pgUrl', pgUrl)
  pool = new pg.Pool({ 
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false }
  })
  return pool
}

const createTable = async () => {
  if (!pool) throw new Error('No PG instance')
  console.log('create pg tables')
  const query = `
    CREATE TABLE IF NOT EXISTS "e_configs" (
      id SERIAL PRIMARY KEY,
      appname character varying(255) NOT NULL,
      flows text,
      credentials text,
      packages text,
      settings text,
      "secure_link" text
    );
    CREATE TABLE IF NOT EXISTS "e_libs" (
      id SERIAL PRIMARY KEY,
      appname character varying(255) NOT NULL,
      type text,
      path text,
      meta text,
      body text
    );
    CREATE TABLE IF NOT EXISTS "e_private_nodes" (
      id SERIAL PRIMARY KEY,
      appname character varying(255) NOT NULL,
      "package_name" text,
      data text
    );
  `
  await doSQL(query, null);
}

const doSQL = async (query, values) => {
  let client
  try {
    if (!pool) throw new Error('No PG instance')
    client = await pool.connect()
    return await client.query(query, values)
  } finally {
    if (client) {
      client.release()
    }
  }
}

const loadConfig = async (appname) => {
  const query = 'SELECT * FROM "e_configs" WHERE appname = $1'
  const data = await doSQL(query, [JSON.stringify(appname)])
  if (data && data.rowCount > 0) {
    let retData = data.rows[0]
    for (let key in retData) {
      if (retData[key]) {
        retData[key] = JSON.parse(retData[key])
      }
    }
    return retData
  }
  return null
}

const saveConfig = async (appname, params) => {
  const columns = [
    'appname',
    'flows',
    'credentials',
    'packages',
    'settings',
    'secure_link',
    'id'
  ]
  let data = await loadConfig(appname)
  let query
  let values
  if (data) {
    data = Object.assign(data, params)
    query =
      'UPDATE "e_configs" SET appname = $1, flows = $2, credentials = $3, packages = $4, settings = $5, "secure_link" = $6 WHERE id = $7 RETURNING *'
    values = columns.map((c) => (data[c] ? JSON.stringify(data[c]) : ''))
  } else {
    data = params
    query =
      'INSERT INTO "e_configs"(appname, flows, credentials, packages, settings, "secure_link") VALUES($1, $2, $3, $4, $5, $6) RETURNING *'
    values = columns
      .slice(0, 6)
      .map((c) => (data[c] ? JSON.stringify(data[c]) : ''))
  }
  await doSQL(query, values)
}

const removeConfig = async (appname) => {
  const query = 'DELETE FROM "e_configs" WHERE appname = $1'
  await doSQL(query, [JSON.stringify(appname)])
}

const loadLib = async (appname, type, path) => {
  const query =
    'SELECT * FROM "e_libs" WHERE appname = $1 and type = $2 and path = $3'
  const data = await doSQL(query, [
    JSON.stringify(appname),
    JSON.stringify(type),
    JSON.stringify(path)
  ])
  if (data && data.rowCount > 0) {
    let retData = data.rows[0]
    for (let key in retData) {
      if (retData[key]) {
        retData[key] = JSON.parse(retData[key])
      }
    }
    return retData
  }
  return null
}

const loadLibList = async (appname, type, dir) => {
  const query =
    'SELECT * FROM "e_libs" WHERE appname = $1 and type = $2 and path LIKE $3 ORDER BY path'
  const data = await doSQL(query, [
    JSON.stringify(appname),
    JSON.stringify(type),
    `"${dir}%`
  ])
  let retDataList = data.rows.map((d) => {
    let retData = {}
    for (let key in d) {
      if (d[key]) {
        retData[key] = JSON.parse(d[key])
      }
    }
    return retData
  })
  return retDataList
}

const saveLib = async (appname, params) => {
  const columns = ['appname', 'type', 'path', 'meta', 'body', 'id']
  let data = await loadLib(appname, params.type, params.path)
  let query
  let values
  if (data) {
    data = Object.assign(data, params)
    query =
      'UPDATE "e_libs" SET appname = $1, type = $2, path = $3, meta = $4, body = $5 WHERE id = $6 RETURNING *'
    values = columns.map((c) => (data[c] ? JSON.stringify(data[c]) : ''))
  } else {
    data = params
    query =
      'INSERT INTO "e_libs"(appname, type, path, meta, body) VALUES($1, $2, $3, $4, $5) RETURNING *'
    values = columns
      .slice(0, 5)
      .map((c) => (data[c] ? JSON.stringify(data[c]) : ''))
  }
  await doSQL(query, values)
}

const loadPrivateNodes = async (appname, package_name) => {
  const query =
    'SELECT * FROM "e_private_nodes" WHERE appname = $1 and "package_name" = $2'
  const data = await doSQL(query, [
    JSON.stringify(appname),
    JSON.stringify(package_name)
  ])
  if (data && data.rowCount > 0) {
    let retData = data.rows[0]
    for (let key in retData) {
      if (retData[key]) {
        retData[key] = JSON.parse(retData[key])
      }
    }
    return retData
  }
  return null
}

const savePrivateNodes = async (appname, params) => {
  const columns = ['appname', 'package_name', 'data', 'id']
  let data = await loadPrivateNodes(appname, params.package_name)
  let query
  let values
  if (data) {
    data = Object.assign(data, params)
    query =
      'UPDATE "e_private_nodes" SET appname = $1, "package_name" = $2, data = $3 WHERE id = $4 RETURNING *'
    values = columns.map((c) => (data[c] ? JSON.stringify(data[c]) : ''))
  } else {
    data = params
    query =
      'INSERT INTO "e_private_nodes"(appname, "package_name", data) VALUES($1, $2, $3) RETURNING *'
    values = columns
      .slice(0, 3)
      .map((c) => (data[c] ? JSON.stringify(data[c]) : ''))
  }
  await doSQL(query, values)
}

const removePrivateNodes = async (appname) => {
  const query = 'DELETE FROM "e_private_nodes" WHERE appname = $1'
  await doSQL(query, [JSON.stringify(appname)])
}

exports.initPG = initPG
exports.createTable = createTable
exports.loadConfig = loadConfig
exports.saveConfig = saveConfig
exports.removeConfig = removeConfig
exports.loadLib = loadLib
exports.loadLibList = loadLibList
exports.saveLib = saveLib
exports.loadPrivateNodes = loadPrivateNodes
exports.savePrivateNodes = savePrivateNodes
exports.removePrivateNodes = removePrivateNodes