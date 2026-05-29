import * as os from "node:os";
import * as path from "node:path";
import { FOLDERS_SERVICE } from "@posthog/workspace-server/services/folders/identifiers";
import { container } from "../../di/container";
import { MAIN_TOKENS } from "../../di/tokens";
import {
  getMarketplaceInstallPaths,
  readSkillMetadataFromDir,
} from "../../services/agent/discover-plugins";
import { listSkillsOutput } from "../../services/agent/skill-schemas";
import type { FoldersService } from "@posthog/workspace-server/services/folders/folders";
import type { PosthogPluginService } from "@posthog/workspace-server/services/posthog-plugin/posthog-plugin";
import { publicProcedure, router } from "../trpc";

const getPluginService = () =>
  container.get<PosthogPluginService>(MAIN_TOKENS.PosthogPluginService);

const getFoldersService = () =>
  container.get<FoldersService>(FOLDERS_SERVICE);

export const skillsRouter = router({
  list: publicProcedure.output(listSkillsOutput).query(async () => {
    const pluginPath = getPluginService().getPluginPath();
    const folders = await getFoldersService().getFolders();
    const marketplacePaths = await getMarketplaceInstallPaths();

    const results = await Promise.all([
      readSkillMetadataFromDir(path.join(pluginPath, "skills"), "bundled"),
      readSkillMetadataFromDir(
        path.join(os.homedir(), ".claude", "skills"),
        "user",
      ),
      ...folders.map((f) =>
        readSkillMetadataFromDir(
          path.join(f.path, ".claude", "skills"),
          "repo",
          f.name,
        ),
      ),
      ...marketplacePaths.map((p) =>
        readSkillMetadataFromDir(path.join(p, "skills"), "marketplace"),
      ),
    ]);

    return results.flat();
  }),
});
