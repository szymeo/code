import type { MentionItem } from "@posthog/shared/domain-types";
import type {
  DetectedRepo,
  RepoFilesClient,
} from "@posthog/ui/features/repo-files/ports";
import { trpcClient } from "@renderer/trpc/client";
import { injectable } from "inversify";

@injectable()
export class TrpcRepoFilesClient implements RepoFilesClient {
  async listRepoFiles(repoPath: string): Promise<MentionItem[]> {
    return trpcClient.fs.listRepoFiles.query({ repoPath });
  }

  async detectRepo(directoryPath: string): Promise<DetectedRepo | null> {
    return trpcClient.git.detectRepo.query({ directoryPath });
  }
}
