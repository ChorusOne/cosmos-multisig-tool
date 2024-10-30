import { getChainsFromRegistry } from "@/lib/chainRegistry";

async function main() {
    console.log("Getting chains from registry...")
    let chains = await getChainsFromRegistry();
    console.log(chains);
}

main().then(() => {
    console.log("Done");
}).catch((error) => {
    console.error(error);
});