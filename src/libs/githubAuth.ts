import { createAppAuth } from '@octokit/auth-app';
import { githubAppId, githubPrivateKey } from '../config';
import { readFileSync } from 'node:fs';
import { Octokit } from '@octokit/rest';

const privateKey = readFileSync(githubPrivateKey,"utf-8");

const auth = createAppAuth({
  appId: githubAppId,
  privateKey,
});

export async function getInstallationOctoKit(installationId: number): Promise<Octokit>{
    const { token } = await auth({
        type: "installation",
        installationId
    });
    return new Octokit({auth: token});
}