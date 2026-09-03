const { execSync } = require('child_process');
const git = 'C:/Users/arghy/AppData/Local/GitHubDesktop/app-3.6.4/resources/app/git/cmd/git.exe';
console.log(execSync(`\"${git}\" add .`, {encoding: 'utf8'}));
try {
  console.log(execSync(`\"${git}\" commit -m \"Fix Vercel build issues and update Gold Membership branding\"`, {encoding: 'utf8'}));
} catch (e) {
  console.log(e.stdout || e.message);
}
console.log(execSync(`\"${git}\" push origin master`, {encoding: 'utf8'}));
