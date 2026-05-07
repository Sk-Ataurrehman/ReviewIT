export interface ReviewJob{
    action: string,
    prNumber: number,
    prHeadSha: string,
    repositoryName: string 
    prTitle:string,
    prBody: string
}

export interface ReviewComment {
    path: string,
    line: number,
    side: string,
    body: string,
    severity: "bug" | "security" | "performance" | "style" | "suggestion";
}