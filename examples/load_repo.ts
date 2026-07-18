import { RuntimeRepository } from "../packages/runtime/index.js";

async function main() {
    const runtime = new RuntimeRepository();

    await runtime.loadRepository(process.cwd());

    const experiment = runtime.getExperiment("quantum-tunneling");

    console.log("Experiment:", experiment.name);

    console.log("\nEnvironment:");
    console.log(experiment.configuration.environment);

    console.log("\nComponents:");
    console.dir(
        experiment.configuration.components[0],
        { depth: null }
    );

    console.log("\nConcepts:");
    for (const concept of experiment.concepts) {
        console.log(" -", concept.name);
    }

    console.log("\nEquations:");
    for (const equation of experiment.equations) {
        console.log(" -", equation.name);
    }

    console.log("\nProcedure:");
    console.dir(
        experiment.procedure,
        { depth: null }
    );
}

main().catch(console.error);