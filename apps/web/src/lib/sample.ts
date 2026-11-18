/** The sample sync diff shown on the landing page. */
export const SAMPLE_SYNC_DIFF = `diff --git a/AGENTS.md b/AGENTS.md
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -1,9 +1,10 @@
-<!-- contextops:begin policy="core-standards" version="2.2.0" hash="sha256:9f2c…" -->
+<!-- contextops:begin policy="core-standards" version="2.3.0" hash="sha256:41ab…" -->
 # Agent instructions
 
 ## Security
 
 Never read or write these paths:
 - \`.env*\`
 - \`**/*.pem\`
+- \`infra/secrets/**\`
 <!-- contextops:end -->
`;
