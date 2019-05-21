const fetch = require("node-fetch");

const BASE_URL = "https://api.digitalocean.com/v2";

module.exports = {
  listRegions,
  listDbSizes,
  getEngineName,
  deleteCluster,
  createDatabase,
  getAccountInfo,
  getClusterSpecs,
  getCertificates,
  listDatabaseClusters
};

async function getAccountInfo(token) {
  try {
    const response = await fetch(`${BASE_URL}/account`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    const { account } = await response.json();
    return account;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function listDatabaseClusters(token) {
  try {
    const response = await fetch(`${BASE_URL}/databases`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    const { databases } = await response.json();
    return databases;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function listRegions(token) {
  try {
    const response = await fetch(`${BASE_URL}/regions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    const { regions } = await response.json();
    return regions.map(r => ({ name: r.name, slug: r.slug }));
  } catch (e) {
    throw new Error(e.message);
  }
}

function listDbSizes() {
  return [
    {
      slug: "db-s-1vcpu-1gb",
      ram: "1 GB",
      cpu: "1 vCPU",
      storage: "10 GB",
      highAvailability: false
    },
    {
      slug: "db-s-1vcpu-2gb",
      ram: "2 GB",
      cpu: "1 vCPU",
      storage: "25 GB",
      highAvailability: true
    },
    {
      slug: "db-s-2vcpu-4gb",
      ram: "4 GB",
      cpu: "2 vCPU",
      storage: "38 GB",
      highAvailability: true
    },
    {
      slug: "db-s-4vcpu-8gb",
      ram: "8 GB",
      cpu: "4 vCPU",
      storage: "115 GB",
      highAvailability: true
    },
    {
      slug: "db-s-6vcpu-16gb",
      ram: "16 GB",
      cpu: "6 vCPU",
      storage: "270 GB",
      highAvailability: true
    },
    {
      slug: "db-s-8vcpu-32gb",
      ram: "32 GB",
      cpu: "8 vCPU",
      storage: "580 GB",
      highAvailability: true
    },
    {
      slug: "db-s-16vcpu-64gb",
      ram: "64 GB",
      cpu: "16 vCPU",
      storage: "1.12 TB",
      highAvailability: true
    }
  ];
}

function getClusterSpecs(size) {
  const sizes = listDbSizes();
  return sizes.filter(s => s.slug === size)[0];
}

function getEngineName(engine) {
  switch (engine) {
    case "pg":
      return "PostgreSQL";
    default:
      return "PostgreSQL";
  }
}

async function createDatabase(config, token) {
  try {
    const response = await fetch(`${BASE_URL}/databases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...config, num_nodes: Number(config.num_nodes) })
    });
    json = await response.json();
    return json;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function deleteCluster(id, token) {
  try {
    const response = await fetch(`${BASE_URL}/databases/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (response.ok) {
      return 1;
    }
  } catch (e) {
    throw new Error(e.message);
  }
}

async function getCertificates(token) {
  try {
    const response = await fetch(`${BASE_URL}/certificates`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    const { certificates } = await response.json();
    return certificates;
  } catch (e) {
    throw new Error(e.message);
  }
}
