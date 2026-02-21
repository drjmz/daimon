
const { Clanker } = require("clanker-sdk/v4");
const { createWalletClient, createPublicClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { base } = require("viem/chains");

async function deploy() {
  console.log("Initiating LIVE Clanker deployment for Diagnostic Intelligence Network (DI)...");
  
  const rpc = process.env.BASE_RPC || "https://mainnet.base.org";
  let privateKey = process.env.DAIMON_WALLET_KEY;
  if (!privateKey.startsWith("0x")) privateKey = "0x" + privateKey;
  
  const account = privateKeyToAccount(privateKey);
  const transport = http(rpc);
  const viemClient = createPublicClient({ chain: base, transport });
  const viemWallet = createWalletClient({ account, chain: base, transport });
  const clanker = new Clanker({ publicClient: viemClient, wallet: viemWallet });

  console.log("Wallet connected: " + account.address);
  console.log("Sending transaction to Base network...");

  const result = await clanker.deploy({
    name: "Diagnostic Intelligence Network",
    symbol: "DI",
    tokenAdmin: account.address,
    image: "https://raw.githubusercontent.com/drjmz/daimon/main/media/face.jpg",
    metadata: { description: "Autonomous Diagnostic Intelligence Network" },
    pool: {
      pairedToken: "0x4200000000000000000000000000000000000006", // Base WETH
      tickIfToken0IsClanker: -53000,    
      tickSpacing: 200,
      positions: [{ tickLower: -53000, tickUpper: 0, positionBps: 10000 }],
    },
    rewards: {
      recipients: [{
        admin: account.address,
        recipient: account.address,
        bps: 10000,
        token: "Both",
      }],
    },
  });

  if (result.error) throw new Error(result.error);
  
  console.log("Transaction broadcasted! Hash: " + result.txHash);
  console.log("Waiting for block confirmation...");
  
  const { address: tokenAddress } = await result.waitForTransaction();
  console.log("Deployment successful!");
  console.log("Contract Address: " + tokenAddress);
}

deploy().catch((e) => {
  console.error("Deploy Script Error: " + e.message);
  process.exit(1);
});
        