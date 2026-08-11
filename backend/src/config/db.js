require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const neo4j = require('neo4j-driver');

const uri = process.env.COGNODB_URI;
const username = process.env.COGNODB_USERNAME;
const password = process.env.COGNODB_PASSWORD;

let driver = null;

function getDriver() {
  if (!driver) {
    if (!uri || !username || !password) {
      console.warn('⚠️ CognoDB credentials missing in environment variables.');
      return null;
    }
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionPoolSize: 10,
      connectionTimeout: 15000
    });
  }
  return driver;
}

function getSession() {
  const d = getDriver();
  if (!d) {
    throw new Error('CognoDB driver is not initialized. Check database credentials.');
  }
  return d.session();
}

async function verifyConnection() {
  try {
    const d = getDriver();
    if (!d) return false;
    await d.verifyConnectivity();
    return true;
  } catch (err) {
    console.error('❌ CognoDB Connectivity Verification Failed:', err.message);
    return false;
  }
}

async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

module.exports = {
  getDriver,
  getSession,
  verifyConnection,
  closeDriver
};
