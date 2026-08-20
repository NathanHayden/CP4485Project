import { MongoClient, ServerApiVersion, Db } from "mongodb";

type Connection = { client: MongoClient; db: Db };

// We cache the PROMISE here rather than the finished connection. On Vercel a
// burst of requests can hit a cold server at the same moment, and if we only
// saved the client after connecting then every one of those requests would
// start its own MongoClient. All but the last would then be left open with
// nobody holding a reference to close them.
let cachedConnection: Promise<Connection> | null = null;

async function openConnection(): Promise<Connection> {
  const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@travelapp.h23e93g.mongodb.net/?appName=TravelApp`;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    // Every serverless instance keeps its own pool and there can be a lot of
    // instances at once. The driver's default of 100 connections each would
    // use up the free Atlas tier's limit long before we ran out of visitors.
    maxPoolSize: 10,
    // Give up after five seconds instead of the default thirty. If Atlas is
    // refusing us the request should fail quickly with a real error, rather
    // than hanging until the whole serverless function times out.
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();

  return { client, db: client.db("travel") };
}

export async function connectToDB(): Promise<Connection> {
  if (!cachedConnection) {
    cachedConnection = openConnection();
  }

  try {
    return await cachedConnection;
  } catch (error) {
    // A failed attempt must not stay in the cache, otherwise every later
    // request handled by this instance would keep getting the same rejected
    // promise back and could never recover.
    cachedConnection = null;
    throw error;
  }
}
