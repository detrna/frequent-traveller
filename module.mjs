// @ts-check
import { module } from "@prisma/composer";
import { postgres, dataContract } from "@prisma/composer-prisma-cloud/orm";
import apsContractJson from "./src/prisma/contract.json" with { type: "json" };
import apsService from "./service.mjs";

export default module("aps", ({ provision }) => {
  const database = provision(postgres({ name: "database", contract: dataContract(apsContractJson), config: "./prisma.config.ts" }));
  provision(apsService, { deps: { db: database } });
});
