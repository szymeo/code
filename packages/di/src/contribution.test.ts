import { Container } from "inversify";
import { describe, expect, it } from "vitest";
import {
  startWorkbench,
  WORKBENCH_CONTRIBUTION,
  type WorkbenchContribution,
} from "./contribution";

describe("startWorkbench", () => {
  it("resolves nothing when no contribution is bound", async () => {
    const container = new Container();
    await expect(startWorkbench(container)).resolves.toBeUndefined();
  });

  it("starts every bound contribution in binding order", async () => {
    const started: string[] = [];
    const make = (name: string): WorkbenchContribution => ({
      start() {
        started.push(name);
      },
    });

    const container = new Container();
    container.bind(WORKBENCH_CONTRIBUTION).toConstantValue(make("first"));
    container.bind(WORKBENCH_CONTRIBUTION).toConstantValue(make("second"));

    await startWorkbench(container);

    expect(started).toEqual(["first", "second"]);
  });

  it("awaits async contributions before resolving", async () => {
    const order: string[] = [];
    const slow: WorkbenchContribution = {
      async start() {
        await Promise.resolve();
        order.push("slow-start-done");
      },
    };

    const container = new Container();
    container.bind(WORKBENCH_CONTRIBUTION).toConstantValue(slow);

    await startWorkbench(container);
    order.push("after-start-workbench");

    expect(order).toEqual(["slow-start-done", "after-start-workbench"]);
  });
});
