export interface ReviewJob{
    action: string,
    prNumber: number,
    prHeadSha: string,
    repositoryName: string 
    prTitle:string,
    prBody: string
}